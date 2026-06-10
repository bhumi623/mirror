# ml_service/analyzers/mood.py

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
_analyzer = SentimentIntensityAnalyzer()

def analyze_mood(text: str) -> float:
    """
    Returns a mood score from 0 to 100.
    
    Score interpretation:
    0  - 20  : Very negative (anger, grief, despair)
    20 - 40  : Negative (frustration, sadness, worry)
    40 - 60  : Neutral / mixed
    60 - 80  : Positive (hopeful, content, pleased)
    80 - 100 : Very positive (excited, joyful, proud)
    """
    try:
        
        normalized = re.sub(r'\bdont\b', "don't", text, flags=re.IGNORECASE)
        normalized = re.sub(r'\bcant\b', "can't", normalized, flags=re.IGNORECASE)
        normalized = re.sub(r'\bwont\b', "won't", normalized, flags=re.IGNORECASE)
        normalized = re.sub(r'\bisnt\b', "isn't", normalized, flags=re.IGNORECASE)

        scores = _analyzer.polarity_scores(normalized)
        compound = scores['compound']
        score = (compound + 1) / 2 * 100
        return round(max(0.0, min(100.0, score)), 1)

    except Exception:
        return 50.0