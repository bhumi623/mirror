# backend/debate/scoring.py
import httpx
from core.constants import ML_URL

# Requests debate scores from the ML service and updates the debate record.
def score_debate(debate) -> None:
    messages = []
    for msg in debate.messages:
        role = 'challenger' if msg['sender_id'] == debate.challenger_id else 'opponent'
        messages.append({'role': role, 'text': msg['text']})
    if len(messages) < 2:
        return 

    fallback = {
        'argument_strength': 50.0, 'logical_coherence': 50.0,
        'rebuttal_quality':  50.0, 'clarity': 50.0,
        'composure':         50.0, 'feedback': 'Scorecard delayed due to timeout.',
    }
    scores = {'challenger': fallback, 'opponent': fallback}

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{ML_URL}/analyze-debate",
                json={
                    'topic':    debate.topic,
                    'messages': messages,
                },
            )
            response.raise_for_status()
            scores = response.json()
            print(f"[scoring.py] Got scores: {scores}")

    except httpx.TimeoutException:
        print(f"[scoring.py] ML service timed out for debate {debate.id}")
    except httpx.ConnectError:
        print(f"[scoring.py] ML service unreachable for debate {debate.id}")
    except httpx.HTTPStatusError as e:
        print(f"[scoring.py] ML service error for debate {debate.id}: {e.response.text}")
    except Exception as e:
        print(f"[scoring.py] Unexpected error for debate {debate.id}: {e}")

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