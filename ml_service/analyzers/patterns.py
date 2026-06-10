# ml_service/analyzers/patterns.py

import re
from typing import Dict

IDEALISTIC_WORDS = {
    'dream', 'dreams', 'dreaming', 'hope', 'hopes', 'hoping', 'believe',
    'believes', 'belief', 'imagine', 'imagined', 'vision', 'inspire',
    'inspired', 'inspiration', 'beautiful', 'perfect', 'amazing', 'wonderful',
    'someday', 'future', 'destiny', 'soul', 'heart', 'passion', 'love',
    'freedom', 'peace', 'joy', 'magic', 'miracle', 'universe', 'journey',
    'potential', 'possibility', 'could', 'would', 'might', 'wish', 'want',
    'aspire', 'transform', 'change', 'grow', 'flourish', 'bloom'
}
GROUNDED_WORDS = {
    'specifically', 'actually', 'literally', 'exactly', 'clearly', 'simply',
    'directly', 'practically', 'realistically', 'honestly', 'obviously',
    'already', 'currently', 'today', 'now', 'here', 'fact', 'facts',
    'data', 'evidence', 'prove', 'result', 'results', 'plan', 'step',
    'steps', 'process', 'method', 'strategy', 'budget', 'cost', 'time',
    'deadline', 'goal', 'goals', 'task', 'tasks', 'done', 'finished',
    'completed', 'measured', 'tracked', 'decided', 'chose', 'built'
}
ABSOLUTE_WORDS = {
    'always', 'never', 'everyone', 'nobody', 'everything', 'nothing',
    'all', 'none', 'every', 'no one', 'constantly', 'forever', 'impossible',
    'must', 'should', 'ought', 'have to', 'need to', 'terrible', 'horrible',
    'awful', 'worst', 'useless', 'worthless', 'pathetic', 'stupid', 'idiot',
    'hate', 'disgusting', 'failed', 'failure', 'wrong', 'mistake', 'fault',
    'blame', 'blamed', 'blaming', 'ruin', 'ruined', 'destroy', 'destroyed'
}

SELF_CRITICAL = {
    "i can't", "i couldn't", "i failed", "i always", "i never",
    "i should", "i shouldn't", "my fault", "my mistake", "i regret",
    "i hate myself", "i'm stupid", "i'm terrible", "i'm the worst",
    "i don't deserve", "i'm not good enough", "i messed up",
    # body image and appearance
    "i'm fat", "i'm ugly", "i'm thin", "i look bad", "i don't look",
    "i'm not beautiful", "i'm not pretty", "i'm not smart",
    "i'm not enough", "i'm so bad", "i'm a mess", "i'm broken",
    # general negativity about self
    "hate myself", "hate my", "ashamed of myself", "disappointed in myself",
    "i'm worthless", "i'm useless", "i'm nothing", "i give up",
    "nobody likes me", "nobody loves me", "i'm alone", "i'm lonely",
}

FEELING_WORDS = {
    'feel', 'feels', 'feeling', 'felt', 'emotion', 'emotions', 'emotional',
    'sense', 'senses', 'sense', 'heart', 'gut', 'instinct', 'intuition',
    'love', 'fear', 'anger', 'sad', 'happy', 'excited', 'nervous', 'anxious',
    'worried', 'hurt', 'pain', 'joy', 'grief', 'lonely', 'confused',
    'overwhelmed', 'grateful', 'thankful', 'proud', 'ashamed', 'guilty',
    'miss', 'care', 'cares', 'caring', 'connect', 'connection', 'relate'
}
 
LOGIC_WORDS = {
    'because', 'therefore', 'thus', 'hence', 'since', 'consequently',
    'however', 'although', 'despite', 'whereas', 'unless', 'if', 'then',
    'analyze', 'analysis', 'evaluate', 'consider', 'conclude', 'conclude',
    'evidence', 'reason', 'reasons', 'logic', 'logical', 'argument',
    'point', 'points', 'fact', 'facts', 'data', 'research', 'study',
    'studies', 'prove', 'proven', 'disprove', 'hypothesis', 'theory',
    'systematic', 'objective', 'rational', 'structure', 'framework'
}

ASSERTIVE_WORDS = {
    'will', 'must', 'definitely', 'certainly', 'absolutely', 'clearly',
    'obviously', 'undoubtedly', 'know', 'believe', 'think', 'decided',
    'choose', 'chose', 'demand', 'insist', 'refuse', 'reject', 'commit',
    'committed', 'stand', 'firm', 'direct', 'straightforward', 'confident',
    'sure', 'certain', 'declare', 'state', 'assert', 'bold', 'strong'
}

HEDGE_WORDS = {
    'maybe', 'perhaps', 'possibly', 'probably', 'might', 'could', 'seem',
    'seems', 'appeared', 'appears', 'guess', 'suppose', 'assume', 'think',
    'feel like', 'kind of', 'sort of', 'a bit', 'a little', 'somewhat',
    'rather', 'fairly', 'quite', 'just', 'simply', 'only', 'merely',
    'i think', 'i feel', 'i believe', 'in my opinion', 'i guess',
    'not sure', "don't know", 'uncertain', 'unsure', 'wonder', 'wondering'
}
def normalize(text: str) -> str:
    replacements = {
        r'\bidont\b':   "i don't",
        r'\bicant\b':   "i can't",
        r'\bim\b':      "i'm",
        r'\bwont\b':    "won't",
        r'\bdont\b':    "don't",
        r'\bcant\b':    "can't",
        r'\bisnt\b':    "isn't",
        r'\barent\b':   "aren't",
        r'\bwasnt\b':   "wasn't",
        r'\bwouldnt\b': "wouldn't",
        r'\bshouldnt\b':"shouldn't",
        r'\bcouldnt\b': "couldn't",
        r'\bhavent\b':  "haven't",
        r'\bhasnt\b':   "hasn't",
        r'\bhadnt\b':   "hadn't",
        r'\bdidnt\b':   "didn't",
        r'\bthats\b':   "that's",
        r'\bits\b':     "it's",
    }
    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result
def tokenize(text: str) -> list:
    return re.findall(r'\b[a-zA-Z]+\b', text.lower())

def count_hits(words: list, category: set) -> int:
    return sum(1 for w in words if w in category)

def phrase_hits(text: str, phrases: set) -> int:
    text_lower = text.lower()
    return sum(1 for phrase in phrases if phrase in text_lower)

def ratio_to_score(hits: int, total: int, scale: float = 15.0) -> float:
    if total == 0:
        return 50.0
    ratio = hits / total
    score = min(ratio / (scale / 100), 1.0) * 100
    return round(score, 1)

def score_vibe(words: list, total: int) -> float:
    idealistic = count_hits(words, IDEALISTIC_WORDS)
    grounded   = count_hits(words, GROUNDED_WORDS)
    net = idealistic - (grounded * 0.5)
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def score_inner_critic(words: list, text: str, total: int) -> float:
    absolute_hits  = count_hits(words, ABSOLUTE_WORDS)
    self_crit_hits = phrase_hits(text, SELF_CRITICAL)
    total_hits = absolute_hits + (self_crit_hits * 3)  
    return ratio_to_score(total_hits, total, scale=12.0)

def score_mind(words: list, total: int) -> float:
    feeling = count_hits(words, FEELING_WORDS)
    logic   = count_hits(words, LOGIC_WORDS)
    net = feeling - logic
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def score_voice(words: list, text: str, total: int) -> float:
    assertive = count_hits(words, ASSERTIVE_WORDS)
    hedging   = count_hits(words, HEDGE_WORDS)
    question_marks = text.count('?')
    net = assertive - hedging - (question_marks * 0.5)
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def analyze_patterns(text: str) -> Dict[str, float]:
    try:
        normalized = normalize(text)
        words = tokenize(normalized)
        total = len(words)

        return {
            'vibe':         score_vibe(words, total),
            'inner_critic': score_inner_critic(words, normalized, total),
            'mind':         score_mind(words, total),
            'voice':        score_voice(words, normalized, total),
        }
    except Exception:
        return {
            'vibe': 50.0, 'inner_critic': 50.0,
            'mind': 50.0, 'voice': 50.0
        }