# ml_service/analyzers/gemini.py
import json
import asyncio
from decouple import config
from groq import Groq

_client = Groq(api_key=config('GROQ_API_KEY'))
_MODEL  = 'llama-3.1-8b-instant'

MODE_DIMENSIONS = {
    'self': {
        'vibe':         'Your Vibe (dreamy vs grounded)',
        'mood':         'Your Mood (negative vs positive)',
        'inner_critic': 'Your Inner Critic (self-criticism level)',
        'mind':         'How Your Mind Works (feelings vs logic)',
        'word_power':   'Your Word Power (vocabulary richness)',
        'voice':        'Your Voice (gentle vs assertive)',
    },
    'story': {
        'vibe':         'Narrative Atmosphere (dark/heavy vs light/hopeful)',
        'mood':         'Emotional Tone of Story (sad vs joyful)',
        'inner_critic': 'Character Depth (flat characters vs complex, flawed ones)',
        'mind':         'Storytelling Style (action-driven vs emotion-driven)',
        'word_power':   'Descriptive Richness (plain vs vivid, sensory language)',
        'voice':        'Narrative Confidence (hesitant vs bold, assured storytelling)',
    },
    'opinion': {
        'vibe':         'Argument Stance (uncertain vs strongly held belief)',
        'mood':         'Emotional Charge (calm/neutral vs passionate/angry)',
        'inner_critic': 'Self-Awareness (one-sided vs acknowledges counterpoints)',
        'mind':         'Reasoning Style (emotion-based vs logic-based argument)',
        'word_power':   'Persuasive Language (plain vs powerful, precise vocabulary)',
        'voice':        'Conviction Level (hedging vs direct, confident claims)',
    }
}

MODE_INSTRUCTIONS = {
    'self': """The user is writing about themselves — a diary entry, personal reflection, or emotional expression.
Analyze as if you're a warm, insightful friend reading their journal.
Focus on their emotional state, self-perception, and how they express themselves.
Be empathetic, not clinical. Speak directly to them ("you feel...", "you tend to...").""",

    'story': """The user has written a story or piece of fiction.
DO NOT analyze the writer's personal emotions. Analyze the CRAFT.
Focus on: narrative voice, atmosphere, character complexity, descriptive language, storytelling confidence.
Speak about the writing itself ("your story carries...", "your characters feel...", "your descriptions...")
Be like a creative writing mentor — encouraging but honest.""",

    'opinion': """The user has written their opinion or argument on something.
Analyze the strength and nature of their reasoning.
Focus on: how strongly they hold their view, whether they acknowledge other perspectives,
whether they use logic or emotion to argue, how persuasive their language is.
Be like a debate coach — sharp, direct, but fair.
Speak about their argument ("your argument is...", "you make your case by...")."""
}

def _build_prompt(text: str, scores: dict, language: str, mode: str) -> str:
    dims = MODE_DIMENSIONS[mode]
    instructions = MODE_INSTRUCTIONS[mode]

    dim_lines = '\n'.join([
        f"- {dims[key]}: {scores[key]}"
        for key in ['vibe', 'mood', 'inner_critic', 'mind', 'word_power', 'voice']
    ])

    return f"""You are Mirror, a personality and writing analysis app loved by students and young people.

MODE: {mode.upper()}
{instructions}

The user submitted this text:
\"\"\"{text[:800]}\"\"\"

NLP analysis scores (0-100):
{dim_lines}

Score guide: 0-30 very low, 30-50 below average, 50-70 above average, 70-100 very high.

For each dimension write:
1. "label" — 3-6 words, fun and specific, ONE emoji. Like a personality quiz result. If language is hindi, write the label in simple hindi and not english. SIMPLE.
2. "description" — exactly 2 sentences. Match the mode tone. No jargon. If language is hindi, write the description in simple hindi and not english. SIMPLE.

{"If language is hi or hinglish, add Hindi/Hinglish warmth in descriptions." if language in ['hi', 'hinglish'] else ""}

Respond ONLY with valid JSON, no markdown, no extra text:
{{"vibe":{{"label":"...","description":"..."}},"mood":{{"label":"...","description":"..."}},"inner_critic":{{"label":"...","description":"..."}},"mind":{{"label":"...","description":"..."}},"word_power":{{"label":"...","description":"..."}},"voice":{{"label":"...","description":"..."}}}}"""

async def generate_labels(text: str, scores: dict, language: str, mode: str = 'self') -> dict:
    try:
        prompt = _build_prompt(text, scores, language, mode)

        response = await asyncio.to_thread(
            _client.chat.completions.create,
            model=_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are Mirror, a warm writing analysis app. Always respond with valid JSON only. No markdown. No explanation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=600,
        )

        raw = response.choices[0].message.content.strip()

        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        raw = raw.strip()

        labeled = json.loads(raw)

        result = {}
        for dim in ['vibe', 'mood', 'inner_critic', 'mind', 'word_power', 'voice']:
            result[dim] = {
                'score':       scores[dim],
                'label':       labeled[dim]['label'],
                'description': labeled[dim]['description'],
            }
        return result

    except Exception as e:
        print(f"Groq error: {e}")
        return _fallback_labels(scores, mode)

def _fallback_labels(scores: dict, mode: str = 'self') -> dict:
    """Score-aware fallback labels per mode."""

    if mode == 'story':
        fallbacks = {
            'vibe':         [('Dark and Atmospheric 🌑', 'Your story carries a heavy, brooding atmosphere. The weight is intentional and felt.'),
                             ('Balanced Narrative 🌗',   'Your story balances light and shadow well. Neither too dark nor too bright.'),
                             ('Warm and Hopeful 🌅',     'Your story radiates warmth. There\'s light even in the difficult moments.')],
            'mood':         [('Emotionally Heavy 💧',    'Your story sits in difficult emotions. That takes courage to write.'),
                             ('Emotionally Layered 🌊',  'Your story holds multiple emotional currents at once. Complex and real.'),
                             ('Joyful Energy ☀️',        'Your story carries genuine warmth and joy. It\'s a pleasure to be in.')],
            'inner_critic': [('Characters Feel Real 👥', 'Your characters have flaws, contradictions, and depth. They feel alive.'),
                             ('Developing Depth 🌱',     'Your characters are taking shape. Give them more contradictions to breathe.'),
                             ('Still Finding Them 🔍',   'Your characters need more complexity. What do they want? What are they afraid of?')],
            'mind':         [('Emotion-Driven Story 💛', 'Your story moves through feelings and relationships. The heart leads.'),
                             ('Balanced Narrative 🎭',   'You blend action and emotion well. The story moves and feels.'),
                             ('Plot-Driven Story ⚡',    'Your story moves fast on action and events. Strong momentum.')],
            'word_power':   [('Vivid and Sensory ✨',    'Your descriptions are rich and immersive. Readers can see and feel everything.'),
                             ('Clear and Purposeful ✍️', 'Your language is clean and gets the job done. Every word earns its place.'),
                             ('Room to Paint More 🎨',   'Your story could use more sensory detail. Show us what it smells, sounds, feels like.')],
            'voice':        [('Confident Narrator 📣',   'Your storytelling voice is assured and strong. You know this world.'),
                             ('Finding the Rhythm 🎵',   'Your narrative voice is developing its own personality. Keep going.'),
                             ('Still Settling In 🌱',    'Your narrative voice is a little uncertain. Trust yourself and it will come.')],
        }
    elif mode == 'opinion':
        fallbacks = {
            'vibe':         [('Strongly Convinced 🔥',   'You\'ve made up your mind and it shows. This argument comes from a firm place.'),
                             ('Thoughtfully Uncertain 🤔','You hold your opinion with some openness. That\'s intellectual honesty.'),
                             ('Still Forming Views 💭',   'Your argument is still taking shape. That\'s okay — good thinking takes time.')],
            'mood':         [('Passionately Charged ⚡',  'Your argument has real heat behind it. You care deeply about this.'),
                             ('Measured and Calm 🧘',     'You make your case without unnecessary emotion. Controlled and effective.'),
                             ('Cool and Analytical 🧊',   'Your argument is detached and analytical. Strong but perhaps missing heart.')],
            'inner_critic': [('Sees Both Sides 👁️',      'You acknowledge other perspectives. That makes your argument harder to dismiss.'),
                             ('Mostly One-Sided 📐',      'Your argument focuses on your view. Addressing counterpoints would strengthen it.'),
                             ('All In On One View 🎯',    'You\'re fully committed to your side. Powerful, but watch for blind spots.')],
            'mind':         [('Logic-Led Argument 🧠',    'You build your case with reasoning and evidence. Structured and persuasive.'),
                             ('Balanced Reasoning 🎭',    'You use both logic and emotion to argue. A well-rounded approach.'),
                             ('Emotion-Powered Point 💛', 'Your argument runs on feeling and conviction. Powerful but needs more evidence.')],
            'word_power':   [('Precise and Sharp ⚔️',    'You choose words that cut right to the point. Your language serves your argument well.'),
                             ('Clear Communicator 📢',    'You express your argument clearly. Easy to follow and understand.'),
                             ('Getting to the Point 🎯',  'Your language is functional. Stronger vocabulary could make your argument land harder.')],
            'voice':        [('Unapologetically Direct 📣','You say exactly what you mean with no softening. Bold and confident.'),
                             ('Firmly But Fairly 🤝',     'You make your case with confidence while staying reasonable. Well-balanced.'),
                             ('Careful and Considered 🌿','You hedge more than you need to. Trust your argument — say it louder.')],
        }
    else:
        fallbacks = {
            'vibe':         [('Head in the Clouds ☁️',   'You dream big and think in possibilities. The world is full of magic in your eyes.'),
                             ('Balanced Explorer 🌿',     'You blend idealism with practicality. You dream, but you also do.'),
                             ('Grounded Realist 🪨',      'You keep it real and focus on what\'s in front of you. Facts over feelings.')],
            'mood':         [('Sunshine Energy ☀️',       'Your writing radiates warmth and positivity. People probably love being around you.'),
                             ('Carrying A Lot 🌧️',        'Your writing holds some heaviness right now. That\'s okay — it\'s real.'),
                             ('In the Storm 🌪️',           'Your words carry real pain or frustration. Whatever you\'re going through, it shows.')],
            'inner_critic': [('Hardest on Yourself 💭',   'You set the bar impossibly high — mostly for yourself. Give yourself a break.'),
                             ('Self-Aware Overthinker 🔍','You notice your own flaws quickly. Healthy as long as it doesn\'t spiral.'),
                             ('Easy on Yourself 😌',       'You don\'t waste energy on self-blame. You move forward without much guilt.')],
            'mind':         [('Pure Heart Energy 💛',     'You feel first, think second. Emotions are your compass and your superpower.'),
                             ('Heart with a Brain 💜',    'You blend logic and feeling naturally. You make decisions that actually make sense.'),
                             ('Pure Logic Mode 💻',        'You process the world through data and reason. Emotions acknowledged but filed away.')],
            'word_power':   [('Word Wizard 📚',           'Your vocabulary is rich and varied. You paint pictures with language effortlessly.'),
                             ('Confident Communicator ✍️','You express yourself clearly and with good range. People understand you easily.'),
                             ('Getting There 🌱',           'Your writing is functional and honest. Vocabulary grows with practice.')],
            'voice':        [('Loud and Clear 📣',        'You say what you mean and mean what you say. No second-guessing.'),
                             ('Quietly Confident 🎯',     'You don\'t shout but you\'re heard. Your words land with intention.'),
                             ('Still Finding Your Voice 🎙️','You hedge a lot and that\'s okay. Confidence in expression comes with practice.')],
        }

    def pick(options, score):
        if score >= 60: return options[0]
        if score >= 35: return options[1]
        return options[2]

    return {
        dim: {
            'score':       scores[dim],
            'label':       pick(fallbacks[dim], scores[dim])[0],
            'description': pick(fallbacks[dim], scores[dim])[1],
        }
        for dim in ['vibe', 'mood', 'inner_critic', 'mind', 'word_power', 'voice']
    }