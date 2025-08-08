from flask import Blueprint, jsonify, request
import os
import json
import time
import random
from openai import OpenAI
from dotenv import load_dotenv
from models.auth import User, db, FormulaInteraction
from routes.auth import token_required

load_dotenv()

formula_bp = Blueprint('formula', __name__)

# OpenAI client (defensive init)
api_key = os.getenv('OPENAI_API_KEY')
if api_key and api_key != 'sk-test-key-replace-with-real-key':
    client = OpenAI(api_key=api_key)
else:
    client = None

PREFERRED_MODEL = os.getenv('OPENAI_MODEL', 'gpt-5-preview')
FALLBACK_MODELS = [
    'gpt-5-preview',
    'gpt-4.1-mini',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-3.5-turbo'
]

def resolve_model(explicit: str | None = None):
    if explicit:
        return explicit
    ordered = [PREFERRED_MODEL] + [m for m in FALLBACK_MODELS if m != PREFERRED_MODEL]
    return ordered[0]

def call_openai_with_retry(messages, max_retries=3, model: str | None = None, max_tokens=800):
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
                temperature=0.2,
                timeout=30
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

def parse_json_safely(raw: str, fallback_key: str):
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {fallback_key: raw.strip()[:4000]}

def _validate_columns(referenced: list[str], available: list[str]):
    invalid = []
    norm_available = {c.lower(): c for c in available}
    for r in referenced:
        key = r.lower()
        if key not in norm_available:
            invalid.append(r)
    return invalid

def _detect_referenced_columns(text: str):
    # Simple heuristic: tokens with letters, numbers, underscores that appear capitalized or match provided columns could be columns.
    import re
    candidates = re.findall(r'[A-Za-z_][A-Za-z0-9_ ]{0,40}', text or '')
    cleaned = [c.strip() for c in candidates if len(c.strip()) > 1][:50]
    return list(dict.fromkeys(cleaned))

def _platform_guidance(platform: str):
    if platform == 'google_sheets':
        return "When generating formulas prefer ARRAYFORMULA where appropriate, use functions available in Google Sheets, and avoid Excel-only functions like XLOOKUP unless advising alternatives (e.g., INDEX/MATCH)."
    return "Use modern Excel dynamic array functions (e.g., FILTER, XLOOKUP, LET) when beneficial."

@formula_bp.route('/generate', methods=['POST'])
@token_required
def generate_formula(current_user):
    payload = request.json or {}
    description = payload.get('description')
    columns = payload.get('columns', [])
    platform = payload.get('platform', 'excel')  # excel | google_sheets
    examples = payload.get('examples', [])

    if not description:
        return jsonify({'error': 'description is required'}), 400

    # Usage enforcement
    if not current_user.can_query():
        return jsonify({'error': 'Query limit reached for current plan', 'limit_reached': True}), 429

    system_msg = (
        "You are an expert spreadsheet formula assistant. Output concise, correct formulas. "
        "Prefer modern dynamic array functions when available. Provide variants only if meaningfully different. "
        + _platform_guidance(platform)
    )

    user_prompt = f"""
Generate a spreadsheet formula based on the following request.

Target platform: {platform}
User description: {description}
Available columns (may be referenced): {columns}
Provided examples (optional context): {examples}

Return JSON with keys:
primary_formula (string) - best single formula
variants (array of objects) each: formula, description, tradeoffs
explanation (string) - short explanation of how primary formula works
tips (array of strings) - practical usage/edge case tips
IMPORTANT: Only reference available columns exactly as provided. If user description mentions columns not in list, warn in tips and DO NOT hallucinate.
"""

    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=900)

    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    else:
        tried = result.get('models_tried', [])
        if tried and tried[0] != result['model_used']:
            fallback_used = True

    parsed = parse_json_safely(result['content'], 'raw')
    parsed_columns = _detect_referenced_columns(parsed.get('primary_formula','') or '')
    invalid_cols = _validate_columns(parsed_columns, columns) if columns else []

    if invalid_cols:
        # annotate tips
        tips_list = parsed.get('tips', [])
        tips_list.append(f"Warning: Model referenced columns not in dataset: {invalid_cols}. Please adjust manually.")
        parsed['tips'] = tips_list

    response_payload = {
        'success': True,
        'data': {
            'primary_formula': parsed.get('primary_formula'),
            'variants': parsed.get('variants', []),
            'explanation': parsed.get('explanation'),
            'tips': parsed.get('tips', []),
            'raw': parsed if 'primary_formula' not in parsed else None
        },
        'model_used': result.get('model_used'),
        'fallback_used': fallback_used
    }
    # persist
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='generate',
        input_payload=payload,
        output_payload=response_payload['data'],
        model_used=response_payload['model_used'],
        fallback_used=fallback_used
    )
    db.session.add(interaction)
    current_user.increment_usage('query')
    db.session.commit()
    return jsonify(response_payload)

@formula_bp.route('/explain', methods=['POST'])
@token_required
def explain_formula(current_user):
    payload = request.json or {}
    formula = payload.get('formula')
    if not formula:
        return jsonify({'error': 'formula is required'}), 400
    platform = payload.get('platform', 'excel')
    context_cols = payload.get('columns', [])

    system_msg = "You are an expert spreadsheet tutor. Explain clearly and concisely."
    user_prompt = f"""
Explain the following {platform} formula.
Formula: {formula}
Columns context: {context_cols}

Return JSON with keys:
steps (array) - ordered breakdown
purpose (string) - what problem it solves
optimization_suggestions (array) - improvements / modern replacements
edge_cases (array) - pitfalls or edge conditions
simplified_alternative (string) - if shorter equivalent exists, else null
"""

    if not current_user.can_query():
        return jsonify({'error': 'Query limit reached for current plan', 'limit_reached': True}), 429

    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=700)

    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500

    parsed = parse_json_safely(result['content'], 'raw')
    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    tried = result.get('models_tried', [])
    if tried and tried[0] != result['model_used']:
        fallback_used = True

    data = {
        'steps': parsed.get('steps', []),
        'purpose': parsed.get('purpose'),
        'optimization_suggestions': parsed.get('optimization_suggestions', []),
        'edge_cases': parsed.get('edge_cases', []),
        'simplified_alternative': parsed.get('simplified_alternative')
    }
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='explain',
        input_payload=payload,
        output_payload=data,
        model_used=result.get('model_used'),
        fallback_used=fallback_used
    )
    db.session.add(interaction)
    current_user.increment_usage('query')
    db.session.commit()
    return jsonify({'success': True, 'data': data, 'model_used': result.get('model_used'), 'fallback_used': fallback_used})

@formula_bp.route('/debug', methods=['POST'])
@token_required
def debug_formula(current_user):
    payload = request.json or {}
    formula = payload.get('formula')
    if not formula:
        return jsonify({'error': 'formula is required'}), 400
    error_message = payload.get('error_message')
    sample_context = payload.get('columns', [])

    system_msg = "You are a spreadsheet formula debugger. Provide likely causes succinctly."
    user_prompt = f"""
Debug the following formula.
Formula: {formula}
Observed error (may be null): {error_message}
Columns context: {sample_context}

Return JSON with keys:
likely_issues (array) - ranked potential causes
fixes (array) - concrete corrections / rewrites
diagnostic_steps (array) - steps user can perform to isolate issue
optimized_formula (string) - improved version if possible else null
notes (array) - any additional helpful notes
"""

    if not current_user.can_query():
        return jsonify({'error': 'Query limit reached for current plan', 'limit_reached': True}), 429

    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=750)

    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500

    parsed = parse_json_safely(result['content'], 'raw')
    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    tried = result.get('models_tried', [])
    if tried and tried[0] != result['model_used']:
        fallback_used = True

    data = {
        'likely_issues': parsed.get('likely_issues', []),
        'fixes': parsed.get('fixes', []),
        'diagnostic_steps': parsed.get('diagnostic_steps', []),
        'optimized_formula': parsed.get('optimized_formula'),
        'notes': parsed.get('notes', [])
    }
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='debug',
        input_payload=payload,
        output_payload=data,
        model_used=result.get('model_used'),
        fallback_used=fallback_used
    )
    db.session.add(interaction)
    current_user.increment_usage('query')
    db.session.commit()
    return jsonify({'success': True, 'data': data, 'model_used': result.get('model_used'), 'fallback_used': fallback_used})
