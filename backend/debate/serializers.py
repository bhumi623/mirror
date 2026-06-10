# backend/debate/serializers.py

from rest_framework import serializers
from .models import Debate
from django.contrib.auth import get_user_model
User = get_user_model()
class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'username', 'name']
class DebateCreateSerializer(serializers.Serializer):
    opponent_username    = serializers.CharField()
    topic                = serializers.CharField(max_length=500)
    thinking_seconds     = serializers.IntegerField(default=60, min_value=30, max_value=90)
    time_per_player      = serializers.IntegerField(default=180, min_value=60, max_value=600)
    def validate_opponent_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User '{value}' not found.")
    def validate(self, data):
        request_user = self.context['request'].user
        if data['opponent_username'] == request_user:
            raise serializers.ValidationError("You cannot debate yourself.")
        return data
class DebateListSerializer(serializers.ModelSerializer):
    challenger = UserMinimalSerializer(read_only=True)
    opponent   = UserMinimalSerializer(read_only=True)

    class Meta:
        model  = Debate
        fields = [
            'id', 'share_uuid', 'topic', 'status',
            'challenger', 'opponent', 'created_at', 'ended_at',
        ]
class DebateDetailSerializer(serializers.ModelSerializer):
    challenger = UserMinimalSerializer(read_only=True)
    opponent   = UserMinimalSerializer(read_only=True)

    class Meta:
        model  = Debate
        fields = [
            'id', 'share_uuid', 'topic', 'status',
            'challenger', 'opponent',
            'thinking_seconds', 'thinking_started_at',
            'time_per_player_seconds',
            'challenger_time_remaining', 'opponent_time_remaining',
            'current_turn_user_id',
            'debate_started_at', 'ended_at',
            'messages',
            # Scores
            'challenger_argument_strength', 'challenger_logical_coherence',
            'challenger_rebuttal_quality',  'challenger_clarity',
            'challenger_composure',         'challenger_feedback',
            'opponent_argument_strength',   'opponent_logical_coherence',
            'opponent_rebuttal_quality',    'opponent_clarity',
            'opponent_composure',           'opponent_feedback',
            'created_at',
        ]