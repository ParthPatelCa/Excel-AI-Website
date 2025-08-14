"""
OpenAI Helper Utilities
Common functions for OpenAI API interactions across different routes
"""

import os
import time
import random
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# OpenAI client (defensive init)
api_key = os.getenv('OPENAI_API_KEY')
if api_key and api_key != 'sk-test-key-replace-with-real-key':
    client = OpenAI(api_key=api_key)
else:
    client = None

PREFERRED_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
FALLBACK_MODELS = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
]

def resolve_model(explicit: str | None = None):
    """Resolve which model to use, with fallback logic"""
    if explicit:
        return explicit
    ordered = [PREFERRED_MODEL] + [m for m in FALLBACK_MODELS if m != PREFERRED_MODEL]
    return ordered[0]

def call_openai_with_retry(messages, max_retries=3, model: str | None = None, max_tokens=800, temperature=0.2, time_budget_s=8):
    """Call OpenAI API with retry logic and fallback models"""
    if not client:
        return {
            'success': False,
            'error': 'OpenAI API not configured',
            'fatal': True
        }

    last_error = None
    resolved_model = resolve_model(model)
    attempted = []
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=resolved_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=time_budget_s
            )
            return {
                'success': True,
                'content': response.choices[0].message.content,
                'model_used': resolved_model,
                'usage': response.usage.total_tokens if response.usage else None,
                'models_tried': [resolved_model]
            }
        except Exception as e:
            err = str(e).lower()
            last_error = e
            attempted.append(resolved_model)
            
            if any(k in err for k in ['invalid model', 'does not exist']) and attempt < max_retries - 1:
                for cand in FALLBACK_MODELS:
                    if cand not in attempted:
                        resolved_model = cand
                        break
                continue
            if 'rate limit' in err and attempt < max_retries - 1:
                time.sleep((2 ** attempt) + random.uniform(0, 1))
                continue
            if ('timeout' in err or 'connection' in err) and attempt < max_retries - 1:
                time.sleep(1)
                continue
                
    return {
        'success': False,
        'error': f'Failed after {max_retries} attempts: {last_error}',
        'models_tried': attempted
    }

def estimate_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    """Estimate token count for a given text and model"""
    if not text:
        return 0
    
    # Rough estimation: 1 token ≈ 4 characters for English text
    # This is a conservative estimate
    char_count = len(text)
    estimated_tokens = char_count // 4
    
    # Add some buffer for safety
    return int(estimated_tokens * 1.1)