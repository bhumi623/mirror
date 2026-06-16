# ml_service/main.py

from fastapi import FastAPI, HTTPException
from models import AnalyzeRequest, AnalyzeResponse, DebateAnalyzeRequest, DebateAnalyzeResponse
from analyzers.language import detect_language
from analyzers.mood import analyze_mood
from analyzers.word_power import analyze_word_power
from analyzers.patterns import analyze_patterns
from analyzers.gemini import generate_labels
from analyzers.debate import analyze_debate

app = FastAPI(title="Mirror ML Service", version="2.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "mirror-ml"}



@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    text = request.text.strip()

    if len(text.split()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Text too short. Minimum 20 words required."
        )

    language = detect_language(text)

    mood_score       = analyze_mood(text)
    word_power_score = analyze_word_power(text)
    pattern_scores   = analyze_patterns(text)

    raw_scores = {
        'mood':         mood_score,
        'word_power':   word_power_score,
        'vibe':         pattern_scores['vibe'],
        'inner_critic': pattern_scores['inner_critic'],
        'mind':         pattern_scores['mind'],
        'voice':        pattern_scores['voice'],
    }
    labeled = await generate_labels(text, raw_scores, language, request.mode)

    return AnalyzeResponse(
        language_detected=language,
        mode=request.mode,
        **labeled
    )

@app.post("/analyze-debate", response_model=DebateAnalyzeResponse)
async def analyze_debate_endpoint(request: DebateAnalyzeRequest):

    if len(request.messages) < 2:
        raise HTTPException(
            status_code=400,
            detail="Minimum 2 messages required to score a debate."
        )

    scores = await analyze_debate(request.topic, request.messages)
    return DebateAnalyzeResponse(**scores)