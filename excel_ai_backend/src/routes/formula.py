from flask import Blueprint, jsonify, request
import os
import json
import time
import random
from openai import OpenAI
from dotenv import load_dotenv
from src.models.auth import User, db, FormulaInteraction
from src.routes.auth import token_required
from src.utils.telemetry import estimate_tokens
from src.utils.model_router import get_model_chain, get_time_budget_seconds, get_task_params
from src.utils.cache import cache, cache_key

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

def call_openai_with_retry(messages, max_retries=3, model: str | None = None, max_tokens=800, temperature=0.2, time_budget_s=8):
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

def parse_json_safely(raw: str, fallback_key: str):
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {fallback_key: raw.strip()[:4000]}

def _validate_columns(referenced: list[str], available: list[str]):
    """Enhanced column validation with detailed feedback"""
    invalid = []
    suggestions = {}
    norm_available = {c.lower(): c for c in available}
    
    for r in referenced:
        key = r.lower()
        if key not in norm_available:
            invalid.append(r)
            # Find closest match for suggestions
            best_match = None
            min_distance = float('inf')
            for avail in available:
                # Simple similarity check
                distance = abs(len(r) - len(avail)) + sum(c1 != c2 for c1, c2 in zip(r.lower(), avail.lower()))
                if distance < min_distance and distance <= 3:  # Max 3 character differences
                    min_distance = distance
                    best_match = avail
            if best_match:
                suggestions[r] = best_match
    
    return invalid, suggestions

def _detect_referenced_columns(text: str):
    """Enhanced column detection with better heuristics"""
    import re
    
    # Pattern 1: Excel-style cell references (A1, B2, etc.) - convert to likely column names
    cell_refs = re.findall(r'\b[A-Z]+[0-9]+\b', text or '')
    column_letters = [re.sub(r'[0-9]+', '', ref) for ref in cell_refs]
    
    # Pattern 2: Named ranges and column references in formulas
    formula_refs = re.findall(r'[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?', text or '')
    
    # Pattern 3: Quoted column names
    quoted_refs = re.findall(r'["\']([^"\']+)["\']', text or '')
    
    # Pattern 4: Bracketed column names (Excel table style)
    bracketed_refs = re.findall(r'\[([^\]]+)\]', text or '')
    
    # Combine all candidates
    all_candidates = column_letters + formula_refs + quoted_refs + bracketed_refs
    
    # Filter and clean
    cleaned = []
    for candidate in all_candidates:
        candidate = candidate.strip()
        # Skip common Excel functions and operators
        if (len(candidate) > 1 and 
            not candidate.upper() in ['SUM', 'SUMIF', 'SUMIFS', 'VLOOKUP', 'XLOOKUP', 'INDEX', 'MATCH', 'IF', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE'] and
            not candidate.isdigit() and
            not re.match(r'^[A-Z]+$', candidate)):  # Skip pure letter sequences like column letters
            cleaned.append(candidate)
    
    # Remove duplicates while preserving order
    return list(dict.fromkeys(cleaned)[:50])

def _platform_guidance(platform: str):
    """Enhanced platform-specific guidance with detailed function recommendations"""
    if platform == 'google_sheets':
        return """
When generating formulas for Google Sheets:
- Prefer ARRAYFORMULA for operations across ranges: ARRAYFORMULA(A2:A*B2:B)
- Use INDEX/MATCH instead of VLOOKUP for better performance: INDEX(C:C,MATCH(lookup_value,A:A,0))
- Leverage QUERY function for complex data filtering: QUERY(A:C,"SELECT A,B WHERE C > 1000")
- Use FILTER for dynamic arrays: FILTER(A:A,B:B>criteria)
- Prefer IMPORTRANGE for cross-sheet references
- Use UNIQUE, SORT functions available in Sheets
- Avoid Excel-only functions like XLOOKUP, LET, LAMBDA
- For dates, use DATE functions compatible with Sheets format
- Remember Sheets uses different regex patterns in functions like REGEXMATCH
"""
    elif platform == 'excel':
        return """
When generating formulas for Excel:
- Utilize modern dynamic array functions: FILTER, SORT, UNIQUE, XLOOKUP
- Use XLOOKUP instead of VLOOKUP for better flexibility: XLOOKUP(lookup_value,lookup_array,return_array)
- Leverage LET function for complex calculations: LET(name1,value1,name2,value2,calculation)
- Use LAMBDA for custom functions: LAMBDA(parameter,calculation)
- Prefer structured table references: Table1[Column1]
- Use SPILL functions like SEQUENCE, RANDARRAY when appropriate
- Leverage MAP, BYROW, BYCOL for array processing
- Use TEXTJOIN for concatenation: TEXTJOIN(delimiter,ignore_empty,range)
- Prefer SWITCH over nested IFs: SWITCH(expression,value1,result1,value2,result2,default)
"""
    return "Generate formulas compatible with both Excel and Google Sheets when possible, avoiding platform-specific functions."

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

    # Router + caching
    task = 'formula_generate'
    model_chain = get_model_chain(current_user, task)
    params = get_task_params(task)
    ttl_seconds = 60 * 60 * 24
    ckey = cache_key(task, {
        'description': description,
        'columns': columns,
        'platform': platform,
        'examples': examples
    }, model_chain)

    cached = cache.get(ckey)
    if cached:
        return jsonify({
            'success': True,
            'data': cached['data'],
            'model_used': cached['model_used'],
            'fallback_used': cached.get('fallback_used', False)
        })

    # Track timing for telemetry
    start_time = time.time()
    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=params['max_tokens'], temperature=params['temperature'], time_budget_s=get_time_budget_seconds(model_chain[0]) )
    latency_ms = int((time.time() - start_time) * 1000)

    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    else:
        tried = result.get('models_tried', [])
        if tried and tried[0] != result['model_used']:
            fallback_used = True

    # Calculate tokens for telemetry
    tokens_used = result.get('usage') or estimate_tokens(result['content'])

    parsed = parse_json_safely(result['content'], 'raw')
    parsed_columns = _detect_referenced_columns(parsed.get('primary_formula','') or '')
    
    # Enhanced column validation
    validation_info = {'invalid_columns': [], 'suggestions': {}, 'warnings': []}
    if columns:
        invalid_cols, suggestions = _validate_columns(parsed_columns, columns)
        validation_info['invalid_columns'] = invalid_cols
        validation_info['suggestions'] = suggestions
        
        if invalid_cols:
            # Create detailed warning messages
            warnings = []
            for col in invalid_cols:
                if col in suggestions:
                    warnings.append(f"Column '{col}' not found. Did you mean '{suggestions[col]}'?")
                else:
                    warnings.append(f"Column '{col}' not found in available columns.")
            
            validation_info['warnings'] = warnings
            
            # Add to tips with enhanced guidance
            tips_list = parsed.get('tips', [])
            tips_list.append(f"⚠️ Column Validation Issues: {len(invalid_cols)} referenced column(s) not found in your dataset.")
            for warning in warnings:
                tips_list.append(f"  • {warning}")
            tips_list.append("💡 Please verify column names match your data exactly (case-sensitive).")
            parsed['tips'] = tips_list

    # Add validation info to response for frontend highlighting
    response_payload = {
        'success': True,
        'data': {
            'primary_formula': parsed.get('primary_formula'),
            'variants': parsed.get('variants', []),
            'explanation': parsed.get('explanation'),
            'tips': parsed.get('tips', []),
            'raw': parsed if 'primary_formula' not in parsed else None,
            'validation': validation_info  # New field for frontend processing
        },
        'model_used': result.get('model_used'),
        'fallback_used': fallback_used
    }
    # cache result
    cache.set(ckey, {
        'data': response_payload['data'],
        'model_used': response_payload['model_used'],
        'fallback_used': response_payload['fallback_used']
    }, ttl_seconds)
    # persist with telemetry
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='generate',
        input_payload=payload,
        output_payload=response_payload['data'],
        model_used=response_payload['model_used'],
        fallback_used=fallback_used,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        success=True
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

    task = 'formula_explain'
    model_chain = get_model_chain(current_user, task)
    params = get_task_params(task)
    ckey = cache_key(task, {
        'formula': formula,
        'columns': context_cols,
        'platform': platform
    }, model_chain)
    cached = cache.get(ckey)
    if cached:
        return jsonify({'success': True, 'data': cached['data'], 'model_used': cached['model_used'], 'fallback_used': cached.get('fallback_used', False)})

    # Track timing for telemetry
    start_time = time.time()
    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=params['max_tokens'], temperature=params['temperature'], time_budget_s=get_time_budget_seconds(model_chain[0]))
    latency_ms = int((time.time() - start_time) * 1000)

    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500

    # Calculate tokens for telemetry
    tokens_used = result.get('usage') or estimate_tokens(result['content'])

    parsed = parse_json_safely(result['content'], 'raw')
    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    tried = result.get('models_tried', [])
    if tried and tried[0] != result['model_used']:
        fallback_used = True

    # Enhanced validation for explain endpoint
    parsed_columns = _detect_referenced_columns(formula)
    validation_info = {'invalid_columns': [], 'suggestions': {}, 'warnings': []}
    if context_cols:
        invalid_cols, suggestions = _validate_columns(parsed_columns, context_cols)
        validation_info['invalid_columns'] = invalid_cols
        validation_info['suggestions'] = suggestions
        
        if invalid_cols:
            warnings = []
            for col in invalid_cols:
                if col in suggestions:
                    warnings.append(f"Referenced column '{col}' not found. Did you mean '{suggestions[col]}'?")
                else:
                    warnings.append(f"Referenced column '{col}' not available in your dataset.")
            validation_info['warnings'] = warnings

    data = {
        'steps': parsed.get('steps', []),
        'purpose': parsed.get('purpose'),
        'optimization_suggestions': parsed.get('optimization_suggestions', []),
        'edge_cases': parsed.get('edge_cases', []),
        'simplified_alternative': parsed.get('simplified_alternative'),
        'validation': validation_info  # Add validation info
    }
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='explain',
        input_payload=payload,
        output_payload=data,
        model_used=result.get('model_used'),
        fallback_used=fallback_used,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        success=True
    )
    db.session.add(interaction)
    current_user.increment_usage('query')
    db.session.commit()
    cache.set(ckey, {'data': data, 'model_used': result.get('model_used'), 'fallback_used': fallback_used}, 86400)
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

    task = 'formula_debug'
    model_chain = get_model_chain(current_user, task)
    params = get_task_params(task)
    ckey = cache_key(task, {
        'formula': formula,
        'error_message': error_message,
        'columns': sample_context
    }, model_chain)
    cached = cache.get(ckey)
    if cached:
        return jsonify({'success': True, 'data': cached['data'], 'model_used': cached['model_used'], 'fallback_used': cached.get('fallback_used', False)})

    # Track timing for telemetry
    start_time = time.time()
    result = call_openai_with_retry([
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_prompt}
    ], max_tokens=params['max_tokens'], temperature=params['temperature'], time_budget_s=get_time_budget_seconds(model_chain[0]))
    latency_ms = int((time.time() - start_time) * 1000)

    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500

    # Calculate tokens for telemetry
    tokens_used = result.get('usage') or estimate_tokens(result['content'])

    parsed = parse_json_safely(result['content'], 'raw')
    fallback_used = False
    if not result['success']:
        return jsonify({'success': False, 'error': result.get('error', 'Unknown error')}), 500
    tried = result.get('models_tried', [])
    if tried and tried[0] != result['model_used']:
        fallback_used = True

    # Enhanced validation for debug endpoint
    parsed_columns = _detect_referenced_columns(formula)
    validation_info = {'invalid_columns': [], 'suggestions': {}, 'warnings': []}
    if sample_context:
        invalid_cols, suggestions = _validate_columns(parsed_columns, sample_context)
        validation_info['invalid_columns'] = invalid_cols
        validation_info['suggestions'] = suggestions
        
        if invalid_cols:
            warnings = []
            for col in invalid_cols:
                if col in suggestions:
                    warnings.append(f"Referenced column '{col}' not found. Did you mean '{suggestions[col]}'?")
                else:
                    warnings.append(f"Referenced column '{col}' not available in your dataset.")
            validation_info['warnings'] = warnings

    data = {
        'likely_issues': parsed.get('likely_issues', []),
        'fixes': parsed.get('fixes', []),
        'diagnostic_steps': parsed.get('diagnostic_steps', []),
        'optimized_formula': parsed.get('optimized_formula'),
        'notes': parsed.get('notes', []),
        'validation': validation_info  # Add validation info
    }
    interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='debug',
        input_payload=payload,
        output_payload=data,
        model_used=result.get('model_used'),
        fallback_used=fallback_used,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        success=True
    )
    db.session.add(interaction)
    current_user.increment_usage('query')
    db.session.commit()
    cache.set(ckey, {'data': data, 'model_used': result.get('model_used'), 'fallback_used': fallback_used}, 86400)
    return jsonify({'success': True, 'data': data, 'model_used': result.get('model_used'), 'fallback_used': fallback_used})


@formula_bp.route('/batch-generate', methods=['POST'])
@token_required
def batch_generate_formulas(current_user):
    """Generate multiple formulas from a list of descriptions."""
    payload = request.json or {}
    descriptions = payload.get('descriptions', [])
    columns = payload.get('columns', [])
    platform = payload.get('platform', 'excel')
    
    if not descriptions or not isinstance(descriptions, list):
        return jsonify({'success': False, 'error': 'descriptions field is required and must be an array'}), 400
    
    if len(descriptions) > 50:  # Reasonable limit
        return jsonify({'success': False, 'error': 'Maximum 50 formulas can be generated in a batch'}), 400
    
    # Check usage limits - count as multiple queries
    if not current_user.can_query():
        return jsonify({'success': False, 'error': 'Query limit reached for your plan', 'limit_reached': True}), 429
    
    # Estimate if user has enough quota for the batch
    required_queries = len(descriptions)
    limits = current_user.get_limits()
    remaining = limits['queries'] - current_user.monthly_queries if limits['queries'] != float('inf') else float('inf')
    
    if remaining != float('inf') and required_queries > remaining:
        return jsonify({
            'success': False, 
            'error': f'Batch requires {required_queries} queries but you have {remaining} remaining',
            'limit_reached': True
        }), 429
    
    start_time = time.time()
    results = []
    successful_count = 0
    
    for i, description in enumerate(descriptions):
        if not description or not description.strip():
            results.append({
                'index': i,
                'description': description,
                'success': False,
                'error': 'Empty description',
                'status': 'failed'
            })
            continue
            
        try:
            # Use caching for repeated descriptions
            cache_k = cache_key('formula_generate', description, columns, platform, current_user.id)
            cached = cache.get(cache_k)
            
            if cached:
                formula_result = cached
                formula_result['cached'] = True
            else:
                # Generate formula using existing logic
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
                Return JSON with keys: primary_formula, variants, explanation, tips.
                IMPORTANT: Only reference available columns exactly as provided.
                """
                
                messages = [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_prompt}
                ]
                
                ai_resp = call_openai_with_retry(
                    messages=messages,
                    max_tokens=get_task_params('formula_generate')['max_tokens'],
                    temperature=get_task_params('formula_generate')['temperature'],
                    time_budget_s=6  # Shorter timeout for batch
                )
                
                if not ai_resp.get('success'):
                    results.append({
                        'index': i,
                        'description': description,
                        'success': False,
                        'error': ai_resp.get('error', 'Unknown error'),
                        'status': 'failed'
                    })
                    continue
                
                parsed = parse_json_safely(ai_resp['content'], 'raw')
                parsed_columns = _detect_referenced_columns(parsed.get('primary_formula','') or '')
                validation_info = _validate_columns(parsed_columns, columns)
                
                formula_result = {
                    'primary_formula': parsed.get('primary_formula'),
                    'variants': parsed.get('variants', []),
                    'explanation': parsed.get('explanation'),
                    'tips': parsed.get('tips', []),
                    'validation': validation_info,
                    'cached': False
                }
                
                # Cache the result
                cache.set(cache_k, formula_result, ttl_seconds=86400)
            
            results.append({
                'index': i,
                'description': description,
                'success': True,
                'data': formula_result,
                'status': 'success'
            })
            successful_count += 1
            
        except Exception as e:
            results.append({
                'index': i,
                'description': description,
                'success': False,
                'error': str(e),
                'status': 'failed'
            })
    
    # Increment usage by actual successful queries
    for _ in range(successful_count):
        current_user.increment_usage('query')
    
    total_time_ms = int((time.time() - start_time) * 1000)
    
    # Log batch interaction
    batch_interaction = FormulaInteraction(
        user_id=current_user.id,
        interaction_type='batch_generate',
        input_payload=payload,
        output_payload={
            'total_requests': len(descriptions),
            'successful_count': successful_count,
            'failed_count': len(descriptions) - successful_count,
            'results': results
        },
        model_used='batch',
        fallback_used=False,
        latency_ms=total_time_ms,
        tokens_used=0,  # TODO: Sum up individual token usage
        success=successful_count > 0
    )
    db.session.add(batch_interaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': {
            'results': results,
            'summary': {
                'total_requests': len(descriptions),
                'successful_count': successful_count,
                'failed_count': len(descriptions) - successful_count,
                'success_rate': round((successful_count / len(descriptions)) * 100, 1) if descriptions else 0,
                'total_time_ms': total_time_ms
            }
        }
    })


@formula_bp.route('/history', methods=['GET'])
@token_required
def list_history(current_user):
    """List formula interactions for the current user with pagination & filtering"""
    try:
        interaction_type = request.args.get('type')  # optional filter
        limit = min(int(request.args.get('limit', 20)), 100)
        offset = int(request.args.get('offset', 0))
        q = FormulaInteraction.query.filter_by(user_id=current_user.id)
        if interaction_type in ['generate', 'explain', 'debug']:
            q = q.filter_by(interaction_type=interaction_type)
        total = q.count()
        rows = (q.order_by(FormulaInteraction.created_at.desc())
                  .offset(offset)
                  .limit(limit)
                  .all())
        return jsonify({
            'success': True,
            'data': [r.to_dict() for r in rows],
            'pagination': {
                'total': total,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to fetch history: {e}'}), 500


@formula_bp.route('/history/<int:interaction_id>', methods=['GET'])
@token_required
def get_history_item(current_user, interaction_id):
    try:
        item = FormulaInteraction.query.filter_by(id=interaction_id, user_id=current_user.id).first()
        if not item:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'success': True, 'data': item.to_dict()})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
