# ml_service/models.py

from pydantic import BaseModel
from typing import Literal

class AnalyzeRequest(BaseModel):
    text: str
    language: str = 'en'
    mode: Literal['self', 'story', 'opinion'] = 'self'

class DimensionResult(BaseModel):
    score: float
    label: str
    description: str

class AnalyzeResponse(BaseModel):
    language_detected: str
    mode: str
    vibe:         DimensionResult
    mood:         DimensionResult
    inner_critic: DimensionResult
    mind:         DimensionResult
    word_power:   DimensionResult
    voice:        DimensionResult