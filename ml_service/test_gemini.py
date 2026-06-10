# test_gemini.py
from groq import Groq
from decouple import config

client = Groq(api_key=config('GROQ_API_KEY'))
response = client.chat.completions.create(
    model='llama-3.1-8b-instant',
    messages=[{"role": "user", "content": "Say hello in one word."}],
    max_tokens=10
)
print("SUCCESS:", response.choices[0].message.content)