# ml_service/analyzers/word_power.py

import re
COMMON_WORDS = {
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
    'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
    'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
    'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
    'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come',
    'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
    'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
    'any', 'these', 'give', 'day', 'most', 'us', 'was', 'were', 'been',
    'has', 'had', 'did', 'said', 'each', 'those', 'am', 'very', 'through',
    'much', 'before', 'right', 'too', 'mean', 'old', 'same', 'tell'
}
def count_syllables(word: str) -> int:
    word = word.lower().strip(".,!?;:")
    if len(word) <= 3:
        return 1
    vowels = 'aeiouy'
    count = 0
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    # Silent e at end
    if word.endswith('e') and count > 1:
        count -= 1
    return max(1, count)

def flesch_kincaid_grade(text: str) -> float:
    sentences = max(1, len(re.findall(r'[.!?]+', text)))
    words = re.findall(r'\b[a-zA-Z]+\b', text)
    if not words:
        return 8.0
    syllables = sum(count_syllables(w) for w in words)
    grade = 0.39 * (len(words) / sentences) + 11.8 * (syllables / len(words)) - 15.59
    return max(0.0, grade)

def lexical_diversity(words: list) -> float:
    if len(words) < 5:
        return 50.0
    if len(words) <= 100:
        ttr = len(set(words)) / len(words)
    else:
        ttrs = []
        for i in range(0, len(words) - 50, 25):
            window = words[i:i+50]
            ttrs.append(len(set(window)) / len(window))
        ttr = sum(ttrs) / len(ttrs)
    return round(ttr * 100, 1)

def vocabulary_richness(words: list) -> float:
    if not words:
        return 50.0
    rare = [w for w in words if w.lower() not in COMMON_WORDS]
    ratio = len(rare) / len(words)
    score = (ratio - 0.2) / 0.6 * 100
    return round(max(0.0, min(100.0, score)), 1)

def readability_score(text: str) -> float:
    grade = flesch_kincaid_grade(text)
    score = (grade - 2) / 14 * 100
    return round(max(0.0, min(100.0, score)), 1)

def analyze_word_power(text: str) -> float:
    try:
        words = re.findall(r'\b[a-zA-Z]+\b', text)
        if len(words) < 15:
            return 20.0
        if len(words) < 30:
            base_penalty = 0.6  
        else:
            base_penalty = 1.0

        diversity   = lexical_diversity(words)
        richness    = vocabulary_richness(words)
        readability = readability_score(text)
        score = ((diversity * 0.4) + (richness * 0.35) + (readability * 0.25)) * base_penalty
        return round(score, 1)
    except Exception:
        return 50.0