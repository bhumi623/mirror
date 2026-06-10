# backend/analysis/views.py

import httpx
from decouple import config
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Analysis
from .serializers import AnalysisSerializer, AnalysisListSerializer

ML_SERVICE_URL = config('ML_SERVICE_URL', default='http://localhost:8001')

def call_ml_service(text: str, mode: str = 'self') -> dict:
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{ML_SERVICE_URL}/analyze",
                json={"text": text, "mode": mode},
            )
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        raise Exception("ML service timed out. Please try again.")
    except httpx.ConnectError:
        raise Exception("ML service is unavailable. Please try again later.")
    except httpx.HTTPStatusError as e:
        raise Exception(f"ML service error: {e.response.text}")

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