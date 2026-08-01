# ml_service/models.py

from pydantic import BaseModel
from typing import Literal, List

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

class DebateMessage(BaseModel):

    role: Literal['challenger', 'opponent']
    text: str


class DebatePlayerScore(BaseModel):
    argument_strength: float
    logical_coherence: float
    rebuttal_quality:  float
    clarity:           float
    composure:         float
    feedback:          str


class DebateAnalyzeRequest(BaseModel):
    topic:    str
    messages: List[DebateMessage]


class DebateAnalyzeResponse(BaseModel):
    challenger: DebatePlayerScore
    opponent:   DebatePlayerScore