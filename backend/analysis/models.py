from django.db import models
import uuid
from django.conf import settings
# Create your models here.
class Analysis(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='analyses'
    )
    text_input= models.TextField()
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi','Hindi'),
        ('hinglish','Hinglish'),
    ]
    language_detected=models.CharField(
        max_length=10,
        choices=LANGUAGE_CHOICES,
        default='en'
    )
    # Dimension 1 — Personality Traits
    personality_score = models.FloatField(default=0)
    personality_label = models.CharField(max_length=100, blank=True)
    personality_description = models.TextField(blank=True)  # ← add this

    # Dimension 2 — Emotional Tone
    tone_score = models.FloatField(default=0)
    tone_label = models.CharField(max_length=100, blank=True)
    tone_description = models.TextField(blank=True)  # ← add this

    # Dimension 3 — Cognitive Biases
    bias_score = models.FloatField(default=0)
    bias_label = models.CharField(max_length=100, blank=True)
    bias_description = models.TextField(blank=True)  # ← add this

    # Dimension 4 — Thinking Style
    thinking_score = models.FloatField(default=0)
    thinking_label = models.CharField(max_length=100, blank=True)
    thinking_description = models.TextField(blank=True)  # ← add this

    # Dimension 5 — Language Profile
    language_score = models.FloatField(default=0)
    language_label = models.CharField(max_length=100, blank=True)
    language_description = models.TextField(blank=True)  # ← add this

    # Dimension 6 — Communication Style
    communication_score = models.FloatField(default=0)
    communication_label = models.CharField(max_length=100, blank=True)
    communication_description = models.TextField(blank=True)  # ← add this
    share_uuid = models.UUIDField(default=uuid.uuid4,editable = False,unique=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
    def __str__(self):
        return f"Analysis by {self.user.username} on {self.created_at.strftime('%d %b %Y')}"