# backend/debate/views.py

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Debate
from .serializers import DebateCreateSerializer, DebateDetailSerializer, DebateListSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    serializer = DebateCreateSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    opponent = serializer.validated_data['opponent_username']
    debate = Debate.objects.create(
        challenger=request.user,
        opponent=opponent,
        topic=serializer.validated_data['topic'],
        thinking_seconds=serializer.validated_data['thinking_seconds'],
        time_per_player_seconds=serializer.validated_data['time_per_player'],
        challenger_time_remaining=serializer.validated_data['time_per_player'],
        opponent_time_remaining=serializer.validated_data['time_per_player'],
        status=Debate.STATUS_WAITING,
    )
    return Response(DebateDetailSerializer(debate).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debate_list(request):
    debates = Debate.objects.filter(
        challenger=request.user
    ) | Debate.objects.filter(
        opponent=request.user
    )
    debates = debates.order_by('-created_at')
    return Response(DebateListSerializer(debates, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debate_detail(request, pk):
    try:
        debate = Debate.objects.get(pk=pk)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not debate.is_participant(request.user):
        return Response({'error': 'Not a participant.'}, status=status.HTTP_403_FORBIDDEN)

    return Response(DebateDetailSerializer(debate).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_debate(request, pk):
    try:
        debate = Debate.objects.get(pk=pk)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not debate.is_participant(request.user):
        return Response({'error': 'Not a participant.'}, status=status.HTTP_403_FORBIDDEN)

    if debate.status == Debate.STATUS_ENDED:
        return Response({'error': 'Debate already ended.'}, status=status.HTTP_400_BAD_REQUEST)

    challenger_messages = [m for m in debate.messages if m['sender_id'] == debate.challenger_id]
    opponent_messages   = [m for m in debate.messages if m['sender_id'] == debate.opponent_id]

    if len(challenger_messages) < 3 or len(opponent_messages) < 3:
        return Response(
            {'error': 'Minimum 3 messages per player required before ending.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    debate.status = Debate.STATUS_ENDED
    debate.ended_at = timezone.now()
    debate.current_turn_user_id = None
    debate.save()

    from .scoring import score_debate
    score_debate(debate)

    debate.refresh_from_db()
    _broadcast_debate_ended(debate)

    return Response(DebateDetailSerializer(debate).data)


def _broadcast_debate_ended(debate):
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    from .consumers import DebateConsumer

    channel_layer = get_channel_layer()
    room_group = f'debate_{debate.id}'
    serialized = {
        'id':                        debate.id,
        'topic':                     debate.topic,
        'status':                    debate.status,
        'thinking_seconds':          debate.thinking_seconds,
        'thinking_started_at':       debate.thinking_started_at.isoformat() if debate.thinking_started_at else None,
        'time_per_player_seconds':   debate.time_per_player_seconds,
        'challenger_time_remaining': debate.challenger_time_remaining,
        'opponent_time_remaining':   debate.opponent_time_remaining,
        'current_turn_user_id':      debate.current_turn_user_id,
        'final_turn_user_id':        debate.final_turn_user_id,
        'turn_started_at':           debate.turn_started_at.isoformat() if debate.turn_started_at else None,
        'debate_started_at':         debate.debate_started_at.isoformat() if debate.debate_started_at else None,
        'messages':                  debate.messages,
        'challenger': {
            'id': debate.challenger_id,
            'username': debate.challenger.username,
            'name': debate.challenger.name,
        },
        'opponent': {
            'id': debate.opponent_id,
            'username': debate.opponent.username,
            'name': debate.opponent.name,
        } if debate.opponent else None,
        'challenger_argument_strength': debate.challenger_argument_strength,
        'challenger_logical_coherence': debate.challenger_logical_coherence,
        'challenger_rebuttal_quality':  debate.challenger_rebuttal_quality,
        'challenger_clarity':           debate.challenger_clarity,
        'challenger_composure':         debate.challenger_composure,
        'challenger_feedback':          debate.challenger_feedback,
        'opponent_argument_strength':   debate.opponent_argument_strength,
        'opponent_logical_coherence':   debate.opponent_logical_coherence,
        'opponent_rebuttal_quality':    debate.opponent_rebuttal_quality,
        'opponent_clarity':             debate.opponent_clarity,
        'opponent_composure':           debate.opponent_composure,
        'opponent_feedback':            debate.opponent_feedback,
    }

    async_to_sync(channel_layer.group_send)(room_group, {
        'type':   'debate_ended',
        'reason': 'manual',
        'debate': serialized,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_share(request, share_uuid):
    try:
        debate = Debate.objects.get(share_uuid=share_uuid, status=Debate.STATUS_ENDED)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(DebateDetailSerializer(debate).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debate_state(request, pk):
    try:
        debate = Debate.objects.get(pk=pk)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not debate.is_participant(request.user):
        return Response({'error': 'Not a participant.'}, status=status.HTTP_403_FORBIDDEN)

    if (debate.status == Debate.STATUS_WAITING
            and request.user == debate.opponent):
        debate.status = Debate.STATUS_THINKING
        debate.thinking_started_at = timezone.now()
        debate.save()

    return Response(_serialize_debate(debate))
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def debate_message(request, pk):

    try:
        debate = Debate.objects.get(pk=pk)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not debate.is_participant(request.user):
        return Response({'error': 'Not a participant.'}, status=status.HTTP_403_FORBIDDEN)

    if debate.status != Debate.STATUS_ACTIVE:
        return Response({'error': 'Debate is not active.'}, status=status.HTTP_400_BAD_REQUEST)

    if debate.current_turn_user_id != request.user.id:
        return Response({'error': 'Not your turn.'}, status=status.HTTP_400_BAD_REQUEST)

    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(text) > 2000:
        return Response({'error': 'Message too long (max 2000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

    from django.db import transaction
    with transaction.atomic():
        debate = Debate.objects.select_for_update().get(pk=pk)

        now = timezone.now()
        elapsed = (now - debate.turn_started_at).total_seconds() if debate.turn_started_at else 0

        sender_id     = request.user.id
        is_challenger = (sender_id == debate.challenger_id)
        other_id      = debate.opponent_id if is_challenger else debate.challenger_id

        if is_challenger:
            new_remaining = max(0.0, (debate.challenger_time_remaining or 0) - elapsed)
            debate.challenger_time_remaining = new_remaining
        else:
            new_remaining = max(0.0, (debate.opponent_time_remaining or 0) - elapsed)
            debate.opponent_time_remaining = new_remaining
        debate.messages = debate.messages + [{
            'sender_id':   sender_id,
            'sender_name': request.user.name or request.user.username,
            'text':        text,
            'sent_at':     now.isoformat(),
            'time_remaining_after_send': round(new_remaining, 1),
        }]

        debate_ended_now = False

        if debate.final_turn_user_id == sender_id:
            debate.status = Debate.STATUS_ENDED
            debate.ended_at = now
            debate.current_turn_user_id = None
            debate_ended_now = True

        elif new_remaining <= 0:
            if debate.final_turn_user_id is None:
                debate.final_turn_user_id = other_id
                debate.current_turn_user_id = other_id
                debate.turn_started_at = now
            else:
                debate.status = Debate.STATUS_ENDED
                debate.ended_at = now
                debate.current_turn_user_id = None
                debate_ended_now = True

        else:
            debate.current_turn_user_id = other_id
            debate.turn_started_at = now

        debate.save()

    if debate_ended_now:
        from .scoring import score_debate
        score_debate(debate)
        debate.refresh_from_db()

    return Response(_serialize_debate(debate))
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def debate_action(request, pk):
    try:
        debate = Debate.objects.get(pk=pk)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not debate.is_participant(request.user):
        return Response({'error': 'Not a participant.'}, status=status.HTTP_403_FORBIDDEN)

    action = request.data.get('action')
    if action == 'accept':
        if debate.status != Debate.STATUS_WAITING:
            return Response({'error': 'Debate is not waiting.'}, status=status.HTTP_400_BAD_REQUEST)
        if request.user != debate.opponent:
            return Response({'error': 'Only the opponent can accept.'}, status=status.HTTP_403_FORBIDDEN)

        debate.status = Debate.STATUS_THINKING
        debate.thinking_started_at = timezone.now()
        debate.save()
        return Response(_serialize_debate(debate))

    if action == 'thinking_done':
        if debate.status != Debate.STATUS_THINKING:
            return Response(_serialize_debate(debate))  # already past thinking, just return state

        debate.status = Debate.STATUS_ACTIVE
        debate.debate_started_at = timezone.now()
        debate.current_turn_user_id = debate.challenger_id
        debate.turn_started_at = timezone.now()
        debate.save()
        return Response(_serialize_debate(debate))

    return Response({'error': f'Unknown action: {action}'}, status=status.HTTP_400_BAD_REQUEST)
def _serialize_debate(debate):
    """Shared serializer for polling endpoints."""
    return {
        'id':                        debate.id,
        'topic':                     debate.topic,
        'status':                    debate.status,
        'thinking_seconds':          debate.thinking_seconds,
        'thinking_started_at':       debate.thinking_started_at.isoformat() if debate.thinking_started_at else None,
        'time_per_player_seconds':   debate.time_per_player_seconds,
        'challenger_time_remaining': debate.challenger_time_remaining,
        'opponent_time_remaining':   debate.opponent_time_remaining,
        'current_turn_user_id':      debate.current_turn_user_id,
        'turn_started_at':           debate.turn_started_at.isoformat() if debate.turn_started_at else None,
        'debate_started_at':         debate.debate_started_at.isoformat() if debate.debate_started_at else None,
        'messages':                  debate.messages,
        'challenger': {
            'id':       debate.challenger_id,
            'username': debate.challenger.username,
            'name':     debate.challenger.name,
        },
        'opponent': {
            'id':       debate.opponent_id,
            'username': debate.opponent.username,
            'name':     debate.opponent.name,
        } if debate.opponent else None,
        'challenger_argument_strength': debate.challenger_argument_strength,
        'challenger_logical_coherence': debate.challenger_logical_coherence,
        'challenger_rebuttal_quality':  debate.challenger_rebuttal_quality,
        'challenger_clarity':           debate.challenger_clarity,
        'challenger_composure':         debate.challenger_composure,
        'challenger_feedback':          debate.challenger_feedback,
        'opponent_argument_strength':   debate.opponent_argument_strength,
        'opponent_logical_coherence':   debate.opponent_logical_coherence,
        'opponent_rebuttal_quality':    debate.opponent_rebuttal_quality,
        'opponent_clarity':             debate.opponent_clarity,
        'opponent_composure':           debate.opponent_composure,
        'opponent_feedback':            debate.opponent_feedback,
    }