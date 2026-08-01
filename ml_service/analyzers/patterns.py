# ml_service/analyzers/patterns.py

import re
from typing import Dict

# Using root prefixes instead of exact words to catch all variations (e.g. 'dream' matches 'dreams', 'dreaming', 'dreamed')
IDEALISTIC_ROOTS = {
    'dream', 'hope', 'believ', 'imagin', 'vision', 'inspir',
    'beauti', 'perfect', 'amaz', 'wonder', 'someday', 'futur',
    'destin', 'soul', 'heart', 'passion', 'love', 'freedom',
    'peace', 'joy', 'magic', 'miracl', 'univers', 'journey',
    'potenti', 'possibl', 'wish', 'want', 'aspir', 'transform',
    'chang', 'grow', 'flourish', 'bloom'
}

GROUNDED_ROOTS = {
    'specif', 'actual', 'liter', 'exact', 'clear', 'simpl',
    'direct', 'practic', 'realist', 'honest', 'obviou',
    'alread', 'current', 'today', 'now', 'here', 'fact',
    'data', 'evid', 'prove', 'result', 'plan', 'step',
    'process', 'method', 'strateg', 'budget', 'cost', 'time',
    'deadlin', 'goal', 'task', 'done', 'finish', 'complet',
    'measur', 'track', 'decid', 'chose', 'choos', 'built'
}

ABSOLUTE_ROOTS = {
    'alway', 'never', 'everyon', 'nobodi', 'everyth', 'noth',
    'all', 'none', 'everi', 'no on', 'constant', 'forev', 'impossibl',
    'must', 'should', 'ought', 'have to', 'need to', 'terribl', 'horribl',
    'awful', 'worst', 'useless', 'worthless', 'pathet', 'stupid', 'idiot',
    'hate', 'disgust', 'fail', 'wrong', 'mistak', 'fault',
    'blame', 'ruin', 'destroy'
}

FEELING_ROOTS = {
    'feel', 'emot', 'sens', 'heart', 'gut', 'instinct', 'intuit',
    'love', 'fear', 'anger', 'angr', 'sad', 'happi', 'happy', 'excit', 'nervous',
    'anxiou', 'worri', 'hurt', 'pain', 'joy', 'grief', 'lone', 'confus',
    'overwhelm', 'grate', 'thank', 'proud', 'asham', 'guilt',
    'miss', 'care', 'connect', 'relat'
}

LOGIC_ROOTS = {
    'becaus', 'therefor', 'thus', 'henc', 'sinc', 'consequ',
    'howev', 'although', 'despit', 'wherea', 'unless', 'if', 'then',
    'analy', 'evalu', 'consid', 'conclud', 'evid', 'reason',
    'logic', 'argument', 'point', 'fact', 'data', 'research', 'studi', 'study',
    'prove', 'disprov', 'hypothes', 'theor', 'system', 'object',
    'ration', 'structur', 'framework'
}

ASSERTIVE_ROOTS = {
    'will', 'must', 'definit', 'certain', 'absolut', 'clear',
    'obviou', 'undoubted', 'know', 'believ', 'think', 'decid',
    'choos', 'chose', 'demand', 'insist', 'refus', 'reject', 'commit',
    'stand', 'firm', 'direct', 'straightforward', 'confid',
    'sure', 'declar', 'state', 'assert', 'bold', 'strong'
}

HEDGE_ROOTS = {
    'mayb', 'perhap', 'possibl', 'probabl', 'might', 'could', 'seem',
    'appear', 'guess', 'suppos', 'assum', 'think', 'feel like',
    'kind of', 'sort of', 'a bit', 'a littl', 'somewhat',
    'rather', 'fair', 'quit', 'just', 'simpl', 'only', 'mere',
    'i think', 'i feel', 'i believ', 'in my opinion', 'i guess',
    'not sure', "don't know", 'uncertain', 'unsur', 'wonder'
}

NEGATION_WORDS = {
    'not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither',
    'nowhere', 'hardly', 'scarcely', 'barely', "don't", "can't",
    "won't", "isn't", "aren't", "wasn't", "weren't", "hasn't",
    "haven't", "hadn't", "doesn't", "didn't", "shouldn't", "couldn't",
    "wouldn't", "ain't", "cannot"
}

SELF_CRITICAL = {
    "i can't", "i couldn't", "i failed", "i always", "i never",
    "i should", "i shouldn't", "my fault", "my mistake", "i regret",
    "i hate myself", "i'm stupid", "i'm terrible", "i'm the worst",
    "i don't deserve", "i'm not good enough", "i messed up",
    "i'm fat", "i'm ugly", "i'm thin", "i look bad", "i don't look",
    "i'm not beautiful", "i'm not pretty", "i'm not smart",
    "i'm not enough", "i'm so bad", "i'm a mess", "i'm broken",
    "hate myself", "hate my", "ashamed of myself", "disappointed in myself",
    "i'm worthless", "i'm useless", "i'm nothing", "i give up",
    "nobody likes me", "nobody loves me", "i'm alone", "i'm lonely",
}

def normalize(text: str) -> str:
    replacements = {
        r'\bidont\b':   "i don't", r'\bicant\b':   "i can't", r'\bim\b':      "i'm",
        r'\bwont\b':    "won't",   r'\bdont\b':    "don't",   r'\bcant\b':    "can't",
        r'\bisnt\b':    "isn't",   r'\barent\b':   "aren't",  r'\bwasnt\b':   "wasn't",
        r'\bwouldnt\b': "wouldn't",r'\bshouldnt\b':"shouldn't",r'\bcouldnt\b': "couldn't",
        r'\bhavent\b':  "haven't", r'\bhasnt\b':   "hasn't",  r'\bhadnt\b':   "hadn't",
        r'\bdidnt\b':   "didn't",  r'\bthats\b':   "that's",  r'\bits\b':     "it's",
    }
    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result

def tokenize(text: str) -> list:
    return re.findall(r"\b[a-zA-Z']+\b", text.lower())

def process_tokens_with_negation(words: list) -> list:
    processed = []
    negation_window = 0
    for w in words:
        if w in NEGATION_WORDS:
            negation_window = 3  # Next 3 words are negated
            continue
            
        if negation_window > 0:
            processed.append("NOT_" + w)
            negation_window -= 1
        else:
            processed.append(w)
    return processed

def count_root_hits(words: list, roots: set) -> int:
    hits = 0
    for w in words:
        if w.startswith("NOT_"):
            continue # Skip negated words for standard root matching to avoid false positives
        if any(w.startswith(root) for root in roots):
            hits += 1
    return hits

def phrase_hits(text: str, phrases: set) -> int:
    text_lower = text.lower()
    return sum(1 for phrase in phrases if phrase in text_lower)

def ratio_to_score(hits: int, total: int, scale: float = 15.0) -> float:
    if total == 0: return 50.0
    ratio = hits / total
    score = min(ratio / (scale / 100), 1.0) * 100
    return round(score, 1)

def score_vibe(words: list, total: int) -> float:
    idealistic = count_root_hits(words, IDEALISTIC_ROOTS)
    grounded   = count_root_hits(words, GROUNDED_ROOTS)
    net = idealistic - (grounded * 0.5)
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def score_inner_critic(words: list, text: str, total: int) -> float:
    absolute_hits  = count_root_hits(words, ABSOLUTE_ROOTS)
    self_crit_hits = phrase_hits(text, SELF_CRITICAL)
    total_hits = absolute_hits + (self_crit_hits * 3)  
    return ratio_to_score(total_hits, total, scale=12.0)

def score_mind(words: list, total: int) -> float:
    feeling = count_root_hits(words, FEELING_ROOTS)
    logic   = count_root_hits(words, LOGIC_ROOTS)
    net = feeling - logic
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def score_voice(words: list, text: str, total: int) -> float:
    assertive = count_root_hits(words, ASSERTIVE_ROOTS)
    hedging   = count_root_hits(words, HEDGE_ROOTS)
    question_marks = text.count('?')
    net = assertive - hedging - (question_marks * 0.5)
    base = 50.0 + (net / max(total, 1)) * 300
    return round(max(0.0, min(100.0, base)), 1)

def analyze_patterns(text: str) -> Dict[str, float]:
    try:
        normalized = normalize(text)
        words = tokenize(normalized)
        processed_words = process_tokens_with_negation(words)
        total = len(words)

        return {
            'vibe':         score_vibe(processed_words, total),
            'inner_critic': score_inner_critic(processed_words, normalized, total),
            'mind':         score_mind(processed_words, total),
            'voice':        score_voice(processed_words, normalized, total),
        }
    except Exception:
        return {
            'vibe': 50.0, 'inner_critic': 50.0,
            'mind': 50.0, 'voice': 50.0
        }