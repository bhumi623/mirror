# ml_service/analyzers/language.py

from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException

DetectorFactory.seed = 42
HINGLISH_MARKERS = {
    'hai', 'hain', 'tha', 'thi', 'nahi', 'nahin', 'kya', 'kyun',
    'kyunki', 'aur', 'lekin', 'magar', 'toh', 'bhi', 'sirf', 'bas',
    'abhi', 'kal', 'aaj', 'yaar', 'bhai', 'didi', 'matlab', 'accha',
    'theek', 'bilkul', 'zaroor', 'bahut', 'bohot', 'thoda', 'wala',
    'wali', 'wale', 'mera', 'tera', 'humara', 'tumhara', 'unka',
    'kuch', 'sab', 'log', 'hum', 'tum', 'aap', 'main', 'mujhe'
}

def detect_language(text: str) -> str:
    try:
        lang = detect(text)
        if lang == 'hi':
            return 'hi'
        if lang == 'en':
            words = set(text.lower().split())
            hinglish_hits = words.intersection(HINGLISH_MARKERS)
            if len(hinglish_hits) >= 2:
                return 'hinglish'
            return 'en'
        return 'en'
    except LangDetectException:
        return 'en'