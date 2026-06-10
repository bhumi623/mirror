# backend/debate/models.py
import uuid
from django.db import models
from django.conf import settings
class Debate(models.Model):
    STATUS_WAITING    = 'waiting'    
    STATUS_THINKING   = 'thinking'   
    STATUS_ACTIVE     = 'active'     
    STATUS_ENDED      = 'ended'      
    STATUS_ABANDONED  = 'abandoned'   
    STATUS_CHOICES = [
        (STATUS_WAITING,   'Waiting for opponent'),
        (STATUS_THINKING,  'Thinking time'),
        (STATUS_ACTIVE,    'Active'),
        (STATUS_ENDED,     'Ended'),
        (STATUS_ABANDONED, 'Abandoned'),
    ]
    challenger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='debates_as_challenger'
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='debates_as_opponent'
    )
    topic        = models.CharField(max_length=500)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_WAITING)
    thinking_seconds  = models.IntegerField(default=60)   
    thinking_started_at = models.DateTimeField(null=True, blank=True)
    time_per_player_seconds = models.IntegerField(default=180)  
    challenger_time_remaining = models.FloatField(null=True, blank=True)
    opponent_time_remaining   = models.FloatField(null=True, blank=True)
    turn_started_at  = models.DateTimeField(null=True, blank=True)
    current_turn_user_id = models.IntegerField(null=True, blank=True)
    debate_started_at = models.DateTimeField(null=True, blank=True)
    ended_at          = models.DateTimeField(null=True, blank=True)
    messages = models.JSONField(default=list)
    challenger_argument_strength  = models.FloatField(null=True, blank=True)
    challenger_logical_coherence  = models.FloatField(null=True, blank=True)
    challenger_rebuttal_quality   = models.FloatField(null=True, blank=True)
    challenger_clarity            = models.FloatField(null=True, blank=True)
    challenger_composure          = models.FloatField(null=True, blank=True)
    challenger_feedback           = models.TextField(blank=True)

    opponent_argument_strength    = models.FloatField(null=True, blank=True)
    opponent_logical_coherence    = models.FloatField(null=True, blank=True)
    opponent_rebuttal_quality     = models.FloatField(null=True, blank=True)
    opponent_clarity              = models.FloatField(null=True, blank=True)
    opponent_composure            = models.FloatField(null=True, blank=True)
    opponent_feedback             = models.TextField(blank=True)

    share_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Debate: {self.challenger.username} vs {self.opponent.username if self.opponent else '?'} — {self.topic[:40]}"

    def get_opponent_of(self, user):
        if self.challenger == user:
            return self.opponent
        return self.challenger

    def get_time_remaining_for(self, user):
        if self.challenger == user:
            return self.challenger_time_remaining
        return self.opponent_time_remaining

    def is_participant(self, user):
        return user == self.challenger or user == self.opponent