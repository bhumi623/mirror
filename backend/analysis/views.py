# backend/analysis/views.py

import httpx
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from core.constants import ML_URL
from .models import Analysis
from .serializers import AnalysisSerializer, AnalysisListSerializer

import time
import threading

# Sends analysis text to our ML service endpoint.
def call_ml_service(text: str, mode: str = 'self') -> dict:
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{ML_URL}/analyze",
                    json={"text": text, "mode": mode},
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code in [502, 503, 504] and attempt < max_retries - 1:
                time.sleep(1.5)
                continue
            raise Exception(f"ML service error: {e.response.text}")
        except (httpx.TimeoutException, httpx.ConnectError):
            if attempt < max_retries - 1:
                time.sleep(1.5)
                continue
            raise Exception("ML service is unavailable. Please try again later.")

def ml_response_to_fields(ml_data: dict) -> dict:
    return {
        'language_detected':       ml_data.get('language_detected', 'en'),

        'personality_score':       ml_data['vibe']['score'],
        'personality_label':       ml_data['vibe']['label'],
        'personality_description': ml_data['vibe']['description'],

        'tone_score':              ml_data['mood']['score'],
        'tone_label':              ml_data['mood']['label'],
        'tone_description':        ml_data['mood']['description'],

        'bias_score':              ml_data['inner_critic']['score'],
        'bias_label':              ml_data['inner_critic']['label'],
        'bias_description':        ml_data['inner_critic']['description'],

        'thinking_score':          ml_data['mind']['score'],
        'thinking_label':          ml_data['mind']['label'],
        'thinking_description':    ml_data['mind']['description'],

        'language_score':          ml_data['word_power']['score'],
        'language_label':          ml_data['word_power']['label'],
        'language_description':    ml_data['word_power']['description'],

        'communication_score':     ml_data['voice']['score'],
        'communication_label':     ml_data['voice']['label'],
        'communication_description': ml_data['voice']['description'],
    }

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_analysis(request):
    text = request.data.get('text', '').strip()
    mode = request.data.get('mode', 'self')
    if not text:
        return Response(
            {'error': 'Text is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if mode not in ['self', 'story', 'opinion']:
        mode = 'self'
    if not text:
        return Response(
            {'error': 'Text is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if len(text.split()) < 20:
        return Response(
            {'error': 'Please write at least 20 words for a meaningful analysis.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        ml_data = call_ml_service(text, mode)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    fields = ml_response_to_fields(ml_data)
    analysis = Analysis.objects.create(
        user=request.user,
        text_input=text,
        **fields
    )
    serializer = AnalysisSerializer(analysis)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_history(request):
    analyses = Analysis.objects.filter(user=request.user)
    serializer = AnalysisListSerializer(analyses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_detail(request, pk):
    try:
        analysis = Analysis.objects.get(pk=pk, user=request.user)
    except Analysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = AnalysisSerializer(analysis)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_share(request, share_uuid):
    try:
        analysis = Analysis.objects.get(share_uuid=share_uuid)
    except Analysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = AnalysisSerializer(analysis)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def wakeup_ml_service(request):
    """
    Fire-and-forget endpoint to ping the ML service /health 
    so it boots up from sleep in the background.
    """
    def ping_ml():
        try:
            with httpx.Client(timeout=10.0) as client:
                client.get(f"{ML_URL}/health")
        except Exception:
            pass

    threading.Thread(target=ping_ml, daemon=True).start()
    return Response({"status": "wakeup_initiated"}, status=status.HTTP_200_OK)