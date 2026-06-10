# backend/debate/scoring.py
import httpx
from decouple import config
ML_SERVICE_URL = config('ML_SERVICE_URL', default='http://localhost:8001')
def score_debate(debate) -> None:
    messages = []
    for msg in debate.messages:
        role = 'challenger' if msg['sender_id'] == debate.challenger_id else 'opponent'
        messages.append({'role': role, 'text': msg['text']})
    if len(messages) < 2:
        return 
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{ML_SERVICE_URL}/analyze-debate",
                json={
                    'topic':    debate.topic,
                    'messages': messages,
                },
            )
            response.raise_for_status()
            scores = response.json()

    except httpx.TimeoutException:
        print(f"[scoring.py] ML service timed out for debate {debate.id}")
        return
    except httpx.ConnectError:
        print(f"[scoring.py] ML service unreachable for debate {debate.id}")
        return
    except httpx.HTTPStatusError as e:
        print(f"[scoring.py] ML service error for debate {debate.id}: {e.response.text}")
        return
    except Exception as e:
        print(f"[scoring.py] Unexpected error for debate {debate.id}: {e}")
        return

    c = scores['challenger']
    debate.challenger_argument_strength = c['argument_strength']
    debate.challenger_logical_coherence = c['logical_coherence']
    debate.challenger_rebuttal_quality  = c['rebuttal_quality']
    debate.challenger_clarity           = c['clarity']
    debate.challenger_composure         = c['composure']
    debate.challenger_feedback          = c['feedback']

    o = scores['opponent']
    debate.opponent_argument_strength   = o['argument_strength']
    debate.opponent_logical_coherence   = o['logical_coherence']
    debate.opponent_rebuttal_quality    = o['rebuttal_quality']
    debate.opponent_clarity             = o['clarity']
    debate.opponent_composure           = o['composure']
    debate.opponent_feedback            = o['feedback']
    debate.save()