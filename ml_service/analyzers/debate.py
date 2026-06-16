# ml_service/analyzers/debate.py

import json
import re
import asyncio
from groq import Groq
from decouple import config
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .word_power import analyze_word_power
 
_client   = Groq(api_key=config('GROQ_API_KEY'))
_MODEL    = 'llama-3.1-8b-instant'
_vader    = SentimentIntensityAnalyzer()

HOSTILE_PHRASES = {
    "you're wrong", "you are wrong", "that's stupid", "that's dumb",
    "you don't understand", "you clearly don't", "you obviously don't",
    "you're missing the point", "you're not listening", "ridiculous",
    "that's absurd", "nonsense", "you're delusional", "wake up",
    "are you serious", "come on", "you're naive", "embarrassing",
    "you have no idea", "do your research", "educate yourself",
    "that's a lie", "you're lying", "pathetic argument", "weak argument",
    "i can't believe you", "honestly", "seriously?",
}
 
_STOP = {
    'i', 'me', 'my', 'we', 'you', 'your', 'the', 'a', 'an', 'is', 'are',
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'this', 'that',
    'it', 'its', 'and', 'or', 'but', 'so', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'not', 'no', 'if', 'then', 'than', 'as',
}
 
async def _score_with_groq(topic: str, messages: list) -> dict:
    transcript_lines = []
    for msg in messages:
        role = 'Challenger' if msg.role == 'challenger' else 'Opponent'
        transcript_lines.append(f"{role}: {msg.text}")
    transcript = '\n'.join(transcript_lines)
 
    prompt = f"""You are a debate analysis engine. Read this debate transcript and score both participants.
 
TOPIC: {topic}
 
TRANSCRIPT:
{transcript[:3000]}
 
Score each participant (0-100) on THREE dimensions:
 
1. argument_strength — do their claims actually support their position? Concrete evidence and specific reasoning score higher than vague assertions.
 
2. logical_coherence — is their reasoning internally consistent across all their messages? Penalise contradictions and non-sequiturs.
 
3. rebuttal_quality — when responding to the opponent, do they engage with the opponent's actual point (even using different words), or do they ignore it, strawman it, or just repeat their own earlier point? Opening statements (first message, no prior opponent message to respond to) should not be penalised for this — score based on later exchanges only. If a player never gets a chance to rebut (e.g. only 1 message), score 50.
 
Also write ONE honest feedback sentence per person (max 20 words each). Be direct, not flattering.
 
Respond ONLY with valid JSON, no markdown, no extra text:
{{
  "challenger": {{
    "argument_strength": <0-100>,
    "logical_coherence": <0-100>,
    "rebuttal_quality": <0-100>,
    "feedback": "<one sentence>"
  }},
  "opponent": {{
    "argument_strength": <0-100>,
    "logical_coherence": <0-100>,
    "rebuttal_quality": <0-100>,
    "feedback": "<one sentence>"
  }}
}}"""
 
    try:
        response = await asyncio.to_thread(
            _client.chat.completions.create,
            model=_MODEL,
            messages=[
                {'role': 'system', 'content': 'You are a debate scorer. Respond only with valid JSON. No markdown.'},
                {'role': 'user',   'content': prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        return json.loads(raw.strip())
 
    except Exception as e:
        print(f"[debate.py] Groq error: {e}")
        fallback = {
            'argument_strength': 50.0, 'logical_coherence': 50.0,
            'rebuttal_quality': 50.0, 'feedback': 'Analysis unavailable.',
        }
        return {'challenger': dict(fallback), 'opponent': dict(fallback)}

def _score_clarity(messages: list, role: str) -> float:
    player_texts = [m.text for m in messages if m.role == role]
    if not player_texts:
        return 50.0
    combined = ' '.join(player_texts)
    return round(analyze_word_power(combined), 1)
 
 
def _hostility_score(messages: list, role: str) -> float:
    player_msgs = [m.text for m in messages if m.role == role]
    if not player_msgs:
        return 100.0

    hostile_count = 0
    for text in player_msgs:
        text_lower = text.lower()
        if any(phrase in text_lower for phrase in HOSTILE_PHRASES):
            hostile_count += 1
    ratio = hostile_count / len(player_msgs)
    return round(max(0.0, 100.0 - ratio * 100 * 3), 1)

def _volatility_score(messages: list, role: str) -> float:
    player_msgs = [m.text for m in messages if m.role == role]
    if len(player_msgs) < 2:
        return 100.0  
    compounds = [_vader.polarity_scores(text)['compound'] for text in player_msgs]
 
    mean = sum(compounds) / len(compounds)
    variance = sum((c - mean) ** 2 for c in compounds) / len(compounds)
    std_dev = variance ** 0.5
    score = 100.0 - min(std_dev / 0.6, 1.0) * 100.0
    return round(max(0.0, score), 1)
 
 
def _escalation_score(messages: list, role: str) -> float:
    player_msgs = [m.text for m in messages if m.role == role]
    if not player_msgs:
        return 100.0
    total_penalty = 0.0
    for text in player_msgs:
        words = text.split()
        if not words:
            continue 
        caps_words = [w for w in words if len(w) >= 3 and w.isupper()]
        caps_ratio = len(caps_words) / len(words) 
        stacked_punct = len(re.findall(r'[!?]{2,}', text))
        total_penalty += caps_ratio * 100  
        total_penalty += stacked_punct * 8  
    avg_penalty = total_penalty / len(player_msgs)
    return round(max(0.0, 100.0 - avg_penalty), 1)
 
 
def _score_composure(messages: list, role: str) -> float:
    hostility  = _hostility_score(messages, role)
    volatility = _volatility_score(messages, role)
    escalation = _escalation_score(messages, role)
 
    composite = (hostility + volatility + escalation) / 3
    return round(composite, 1)
 
async def analyze_debate(topic: str, messages: list) -> dict:
    if not messages:
        fallback = {
            'argument_strength': 50.0, 'logical_coherence': 50.0,
            'rebuttal_quality':  50.0, 'clarity': 50.0,
            'composure':         50.0, 'feedback': 'No messages to score.',
        }
        return {'challenger': fallback, 'opponent': fallback}
 
    groq_scores = await _score_with_groq(topic, messages)
 
    c_clarity   = _score_clarity(messages, 'challenger')
    o_clarity   = _score_clarity(messages, 'opponent')
    c_composure = _score_composure(messages, 'challenger')
    o_composure = _score_composure(messages, 'opponent')
 
    return {
        'challenger': {
            'argument_strength': groq_scores['challenger']['argument_strength'],
            'logical_coherence': groq_scores['challenger']['logical_coherence'],
            'rebuttal_quality':  groq_scores['challenger']['rebuttal_quality'],
            'clarity':           c_clarity,
            'composure':         c_composure,
            'feedback':          groq_scores['challenger']['feedback'],
        },
        'opponent': {
            'argument_strength': groq_scores['opponent']['argument_strength'],
            'logical_coherence': groq_scores['opponent']['logical_coherence'],
            'rebuttal_quality':  groq_scores['opponent']['rebuttal_quality'],
            'clarity':           o_clarity,
            'composure':         o_composure,
            'feedback':          groq_scores['opponent']['feedback'],
        },
    }