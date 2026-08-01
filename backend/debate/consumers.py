# backend/debate/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import Debate

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str):
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token['user_id'])
    except (TokenError, User.DoesNotExist):
        return None


@database_sync_to_async
def get_debate(debate_id):
    try:
        return Debate.objects.select_related('challenger', 'opponent').get(pk=debate_id)
    except Debate.DoesNotExist:
        return None


@database_sync_to_async
def append_message_and_flip_timer(debate_id, sender_id, sender_name, text):
    from django.db import transaction
    try:
        with transaction.atomic():
            debate = Debate.objects.select_for_update().get(pk=debate_id)

            if debate.status != Debate.STATUS_ACTIVE:
                return None, 'Debate is not active.', False

            if debate.current_turn_user_id != sender_id:
                return None, 'It is not your turn.', False

            now = timezone.now()
            elapsed = (now - debate.turn_started_at).total_seconds() if debate.turn_started_at else 0

            is_challenger = (sender_id == debate.challenger_id)
            other_id = debate.opponent_id if is_challenger else debate.challenger_id

            if is_challenger:
                new_remaining = max(0.0, (debate.challenger_time_remaining or 0) - elapsed)
            else:
                new_remaining = max(0.0, (debate.opponent_time_remaining or 0) - elapsed)

            debate.messages.append({
                'sender_id':   sender_id,
                'sender_name': sender_name,
                'text':        text,
                'sent_at':     now.isoformat(),
                'time_remaining_after_send': round(new_remaining, 1),
            })

            if is_challenger:
                debate.challenger_time_remaining = new_remaining
            else:
                debate.opponent_time_remaining = new_remaining

            debate_ended_now = False
            if debate.final_turn_user_id == sender_id:
                debate.status = Debate.STATUS_ENDED
                debate.ended_at = now
                debate_ended_now = True
                debate.current_turn_user_id = None

            elif new_remaining <= 0:
                if debate.final_turn_user_id is None:
                    debate.final_turn_user_id = other_id
                    debate.current_turn_user_id = other_id
                    debate.turn_started_at = now
                else:
                    debate.status = Debate.STATUS_ENDED
                    debate.ended_at = now
                    debate_ended_now = True
                    debate.current_turn_user_id = None
            else:
                debate.current_turn_user_id = other_id
                debate.turn_started_at = now

            debate.save()
            return debate, None, debate_ended_now

    except Debate.DoesNotExist:
        return None, 'Debate not found.', False


@database_sync_to_async
def transition_to_active(debate_id):
    try:
        debate = Debate.objects.get(pk=debate_id)
    except Debate.DoesNotExist:
        return None
    if debate.status != Debate.STATUS_THINKING:
        return debate
    now = timezone.now()
    debate.status = Debate.STATUS_ACTIVE
    debate.debate_started_at = now
    debate.turn_started_at = now
    debate.current_turn_user_id = debate.challenger_id
    debate.save()
    return debate


@database_sync_to_async
def transition_to_thinking(debate_id):
    try:
        debate = Debate.objects.get(pk=debate_id)
    except Debate.DoesNotExist:
        return None
    if debate.status != Debate.STATUS_WAITING:
        return debate
    now = timezone.now()
    debate.status = Debate.STATUS_THINKING
    debate.thinking_started_at = now
    debate.save()
    return debate


@database_sync_to_async
def run_scoring(debate_id):
    from .scoring import score_debate
    debate = Debate.objects.get(pk=debate_id)
    score_debate(debate)


class DebateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.debate_id  = self.scope['url_route']['kwargs']['debate_id']
        self.room_group = f'debate_{self.debate_id}'
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
        token_str = params.get('token', '')

        self.user = await get_user_from_token(token_str)
        if not self.user:
            await self.close(code=4001)
            return

        debate = await get_debate(self.debate_id)
        if not debate or not debate.is_participant(self.user):
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group, {
            'type':     'user_joined',
            'user_id':  self.user.id,
            'username': self.user.username,
        })

        if debate.status == Debate.STATUS_WAITING:
            if self.user != debate.challenger:
                updated = await transition_to_thinking(self.debate_id)
                if updated:
                    await self.channel_layer.group_send(self.room_group, {
                        'type':                'thinking_started',
                        'thinking_seconds':    updated.thinking_seconds,
                        'thinking_started_at': updated.thinking_started_at.isoformat(),
                    })

        debate = await get_debate(self.debate_id)
        await self.send(text_data=json.dumps({
            'type':   'state_sync',
            'debate': await self._serialize_debate(debate),
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'send_message':
            await self._handle_send_message(data)
        elif msg_type == 'thinking_done':
            await self._handle_thinking_done()
        elif msg_type == 'request_state':
            debate = await get_debate(self.debate_id)
            await self.send(text_data=json.dumps({
                'type':   'state_sync',
                'debate': await self._serialize_debate(debate),
            }))

    async def _handle_send_message(self, data):
        text = (data.get('text') or '').strip()
        if not text:
            return
        if len(text) > 2000:
            await self.send(text_data=json.dumps({
                'type': 'error', 'message': 'Message too long (max 2000 characters).'
            }))
            return

        debate, error, debate_ended_now = await append_message_and_flip_timer(
            self.debate_id, self.user.id, self.user.username, text
        )

        if error:
            await self.send(text_data=json.dumps({'type': 'error', 'message': error}))
            return

        last_msg = debate.messages[-1]
        await self.channel_layer.group_send(self.room_group, {
            'type':                       'new_message',
            'message':                    last_msg,
            'current_turn_user_id':       debate.current_turn_user_id,
            'final_turn_user_id':         debate.final_turn_user_id,
            'challenger_time_remaining':  debate.challenger_time_remaining,
            'opponent_time_remaining':    debate.opponent_time_remaining,
        })

        if debate_ended_now:
            await run_scoring(self.debate_id)
            debate = await get_debate(self.debate_id)
            await self.channel_layer.group_send(self.room_group, {
                'type':   'debate_ended',
                'reason': 'timeout',
                'debate': await self._serialize_debate(debate),
            })

    async def _handle_thinking_done(self):
        debate = await transition_to_active(self.debate_id)
        if debate:
            await self.channel_layer.group_send(self.room_group, {
                'type':                       'debate_active',
                'current_turn_user_id':       debate.current_turn_user_id,
                'challenger_time_remaining':  debate.challenger_time_remaining,
                'opponent_time_remaining':    debate.opponent_time_remaining,
            })

    async def user_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def thinking_started(self, event):
        await self.send(text_data=json.dumps(event))

    async def debate_active(self, event):
        await self.send(text_data=json.dumps(event))

    async def new_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def debate_ended(self, event):
        await self.send(text_data=json.dumps(event))

    async def state_sync(self, event):
        await self.send(text_data=json.dumps(event))

    async def _serialize_debate(self, debate):
        if not debate:
            return {}
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