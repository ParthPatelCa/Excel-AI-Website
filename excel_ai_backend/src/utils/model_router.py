from typing import List, Tuple, Dict


def get_model_chain(user, task: str) -> List[str]:
    """Return ordered model chain based on user preference and task type.

    Tasks: formula_generate | formula_explain | formula_debug | chat_query | insights
    """
    user_pref = getattr(user, 'preferred_model', 'balanced') if user else 'balanced'

    base_chains = {
        'speed':    ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4o'],
        'balanced': ['gpt-4o', 'gpt-4.1-mini', 'gpt-4o-mini'],
        'quality':  ['gpt-4o', 'gpt-4.1-mini'],
        'preview':  ['gpt-5-preview', 'gpt-4o'],
    }

    # Guard preview for non-pro users (caller should enforce, but be safe)
    if user_pref == 'preview' and getattr(user, 'subscription_tier', 'free') == 'free':
        user_pref = 'balanced'

    chain = base_chains.get(user_pref, base_chains['balanced']).copy()

    # Feature/task nudges
    if task in ('formula_generate', 'formula_explain', 'formula_debug'):
        chain = base_chains['speed'].copy()
    elif task in ('insights',):
        chain = base_chains['quality'].copy()
    elif task in ('chat_query',):
        # Keep as selected, but ensure a fast first model if user picked quality
        if chain and chain[0] == 'gpt-4o' and 'gpt-4.1-mini' in chain:
            chain.remove('gpt-4.1-mini')
            chain.insert(0, 'gpt-4.1-mini')

    # Ensure uniqueness and filter Nones
    seen = set()
    ordered = []
    for m in chain:
        if m and m not in seen:
            seen.add(m)
            ordered.append(m)
    return ordered


def get_time_budget_seconds(model: str) -> int:
    """Return per-request timeout budget per model."""
    if model in ('gpt-4.1-mini', 'gpt-4o-mini'):
        return 4
    if model in ('gpt-4o',):
        return 8
    if model in ('gpt-5-preview',):
        return 10
    return 8


def get_task_params(task: str) -> Dict[str, int | float]:
    """Return default temperature and max_tokens per task."""
    if task.startswith('formula_'):
        return {'temperature': 0.2, 'max_tokens': 384}
    if task == 'chat_query':
        return {'temperature': 0.4, 'max_tokens': 640}
    if task == 'insights':
        return {'temperature': 0.3, 'max_tokens': 1200}
    return {'temperature': 0.3, 'max_tokens': 800}


