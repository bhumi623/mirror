# backend/debate/consumers.py
import json
from datetime import timedelta
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
def save_debate(debate):
    debate.save()

@database_sync_to_async
def append_message_and_flip_timer(debate_id, sender_id, sender_name, text):
    try:
        debate = Debate.objects.select_for_update().get(pk=debate_id)
    except Debate.DoesNotExist:
        return None, 'Debate not found.'
    if debate.status != Debate.STATUS_ACTIVE:
        return None, 'Debate is not active.'
    if debate.current_turn_user_id != sender_id:
        return None, 'It is not your turn.'
    now = timezone.now()
    if debate.turn_started_at:
        elapsed = (now - debate.turn_started_at).total_seconds()
    else:
        elapsed = 0

    is_challenger = (sender_id == debate.challenger_id)

    if is_challenger:
        new_remaining = (debate.challenger_time_remaining or 0) - elapsed
    else:
        new_remaining = (debate.opponent_time_remaining or 0) - elapsed
    new_remaining = max(0.0, new_remaining)
    debate.messages.append({
        'sender_id':   sender_id,
        'sender_name': sender_name,
        'text':        text,
        'sent_at':     now.isoformat(),
        'time_remaining_after_send': round(new_remaining, 1),
    })
    if is_challenger:
        debate.challenger_time_remaining = new_remaining
        debate.current_turn_user_id = debate.opponent_id
    else:
        debate.opponent_time_remaining = new_remaining
        debate.current_turn_user_id = debate.challenger_id

    debate.turn_started_at = now
    timed_out = new_remaining <= 0
    debate.save()
    return debate, None, timed_out

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
class DebateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.debate_id   = self.scope['url_route']['kwargs']['debate_id']
        self.room_group  = f'debate_{self.debate_id}'
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
            'type':    'user_joined',
            'user_id': self.user.id,
            'username': self.user.username,
        })
        if debate.status == Debate.STATUS_WAITING:
            if self.user != debate.challenger:
                updated = await transition_to_thinking(self.debate_id)
                if updated:
                    await self.channel_layer.group_send(self.room_group, {
                        'type':              'thinking_started',
                        'thinking_seconds':  updated.thinking_seconds,
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

        result = await append_message_and_flip_timer(
            self.debate_id, self.user.id, self.user.username, text
        )
        debate, error, timed_out = result if len(result) == 3 else (*result, False)

        if error:
            await self.send(text_data=json.dumps({'type': 'error', 'message': error}))
            return
        last_msg = debate.messages[-1]
        await self.channel_layer.group_send(self.room_group, {
            'type':                    'new_message',
            'message':                 last_msg,
            'current_turn_user_id':    debate.current_turn_user_id,
            'challenger_time_remaining': debate.challenger_time_remaining,
            'opponent_time_remaining':   debate.opponent_time_remaining,
        })

        if timed_out:
            await self.channel_layer.group_send(self.room_group, {
                'type':   'debate_ended',
                'reason': 'timeout',
                'debate': await self._serialize_debate(debate),
            })

    async def _handle_thinking_done(self):
        debate = await transition_to_active(self.debate_id)
        if debate:
            await self.channel_layer.group_send(self.room_group, {
                'type':               'debate_active',
                'current_turn_user_id': debate.current_turn_user_id,
                'challenger_time_remaining': debate.challenger_time_remaining,
                'opponent_time_remaining':   debate.opponent_time_remaining,
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
            'id':            debate.id,
            'topic':         debate.topic,
            'status':        debate.status,
            'thinking_seconds': debate.thinking_seconds,
            'thinking_started_at': debate.thinking_started_at.isoformat() if debate.thinking_started_at else None,
            'time_per_player_seconds': debate.time_per_player_seconds,
            'challenger_time_remaining': debate.challenger_time_remaining,
            'opponent_time_remaining':   debate.opponent_time_remaining,
            'current_turn_user_id':      debate.current_turn_user_id,
            'debate_started_at':  debate.debate_started_at.isoformat() if debate.debate_started_at else None,
            'messages':      debate.messages,
            'challenger': {'id': debate.challenger_id, 'username': debate.challenger.username},
            'opponent':   {'id': debate.opponent_id, 'username': debate.opponent.username} if debate.opponent else None,
        }