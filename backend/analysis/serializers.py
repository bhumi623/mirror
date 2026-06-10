# backend/analysis/serializers.py

from rest_framework import serializers
from .models import Analysis
class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = [
            'id',
            'share_uuid',
            'language_detected',
            'text_input',
            'created_at',
            # Dimension 1
            'personality_score',
            'personality_label',
            'personality_description',
            # Dimension 2
            'tone_score',
            'tone_label',
            'tone_description',
            # Dimension 3
            'bias_score',
            'bias_label',
            'bias_description',
            # Dimension 4
            'thinking_score',
            'thinking_label',
            'thinking_description',
            # Dimension 5
            'language_score',
            'language_label',
            'language_description',
            # Dimension 6
            'communication_score',
            'communication_label',
            'communication_description',
        ]
        read_only_fields = ['id', 'share_uuid', 'created_at']


class AnalysisListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = [
            'id',
            'share_uuid',
            'language_detected',
            'created_at',
            'personality_score',
            'personality_label',
            'tone_score',
            'tone_label',
            'bias_score',
            'bias_label',
            'thinking_score',
            'thinking_label',
            'language_score',
            'language_label',
            'communication_score',
            'communication_label',
        ]
        read_only_fields = ['id', 'share_uuid', 'created_at']