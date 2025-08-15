"""
OpenAI API helper functions
"""
import os
import time
import openai
from typing import Optional, Dict, Any

def call_openai_with_retry(
    messages: list,
    model: str = "gpt-3.5-turbo",
    max_tokens: Optional[int] = None,
    temperature: float = 0.7,
    max_retries: int = 3
) -> str:
    """
    Call OpenAI API with retry logic
    """
    client = openai.OpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        base_url=os.getenv('OPENAI_API_BASE', 'https://api.openai.com/v1')
    )
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            time.sleep(2 ** attempt)  # Exponential backoff
    
    return ""

def estimate_tokens(text: str) -> int:
    """
    Rough estimation of token count
    """
    # Rough approximation: ~4 characters per token
    return len(text) // 4
