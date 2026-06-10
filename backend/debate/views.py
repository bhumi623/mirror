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
    opponent = serializer.validated_data['opponent_username']  # already a User object
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
    debate.status  = Debate.STATUS_ENDED
    debate.ended_at = timezone.now()
    debate.save()
    from .scoring import score_debate
    score_debate(debate)

    return Response(DebateDetailSerializer(debate).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_share(request, share_uuid):
    try:
        debate = Debate.objects.get(share_uuid=share_uuid, status=Debate.STATUS_ENDED)
    except Debate.DoesNotExist:
        return Response({'error': 'Debate not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(DebateDetailSerializer(debate).data)