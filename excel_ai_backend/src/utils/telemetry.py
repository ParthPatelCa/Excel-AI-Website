"""Telemetry utilities for tracking API performance and usage."""

import time
from datetime import datetime
from functools import wraps
from models.auth import db, TelemetryMetric
import logging

logger = logging.getLogger(__name__)

class TelemetryTracker:
    """Context manager for tracking API call metrics."""
    
    def __init__(self, user_id, metric_type, endpoint):
        self.user_id = user_id
        self.metric_type = metric_type
        self.endpoint = endpoint
        self.start_time = None
        self.model_used = None
        self.fallback_used = False
        self.tokens_used = None
        self.success = True
        self.error_type = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.success = False
            self.error_type = exc_type.__name__
        
        latency_ms = int((time.time() - self.start_time) * 1000) if self.start_time else None
        
        try:
            metric = TelemetryMetric(
                user_id=self.user_id,
                metric_type=self.metric_type,
                endpoint=self.endpoint,
                model_used=self.model_used,
                fallback_used=self.fallback_used,
                latency_ms=latency_ms,
                tokens_used=self.tokens_used,
                success=self.success,
                error_type=self.error_type
            )
            db.session.add(metric)
            db.session.commit()
        except Exception as e:
            logger.error(f"Failed to save telemetry metric: {e}")
            db.session.rollback()
    
    def set_ai_metadata(self, model_used=None, fallback_used=False, tokens_used=None):
        """Set AI-specific metadata for the metric."""
        self.model_used = model_used
        self.fallback_used = fallback_used
        self.tokens_used = tokens_used

def track_api_call(metric_type, endpoint):
    """Decorator to automatically track API call metrics."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user from kwargs or args (assumes token_required decorator)
            current_user = kwargs.get('current_user') or (args[0] if args else None)
            user_id = current_user.id if hasattr(current_user, 'id') else None
            
            if not user_id:
                # If no user context, call function without tracking
                return func(*args, **kwargs)
            
            with TelemetryTracker(user_id, metric_type, endpoint) as tracker:
                try:
                    result = func(*args, **kwargs)
                    
                    # Extract AI metadata from result if present
                    if isinstance(result, tuple) and len(result) == 2:
                        response, status_code = result
                        if hasattr(response, 'get_json'):
                            json_data = response.get_json()
                            if json_data:
                                tracker.set_ai_metadata(
                                    model_used=json_data.get('model_used'),
                                    fallback_used=json_data.get('fallback_used', False),
                                    tokens_used=json_data.get('tokens_used')
                                )
                    
                    return result
                except Exception as e:
                    raise e
        return wrapper
    return decorator

def estimate_tokens(text):
    """Rough token estimation (4 chars = ~1 token for GPT models)."""
    if not text:
        return 0
    return len(str(text)) // 4

def get_telemetry_summary(user_id, days=30):
    """Get aggregated telemetry data for a user."""
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    metrics = TelemetryMetric.query.filter(
        TelemetryMetric.user_id == user_id,
        TelemetryMetric.created_at >= cutoff_date
    ).all()
    
    if not metrics:
        return {
            'total_calls': 0,
            'success_rate': 0,
            'avg_latency_ms': 0,
            'total_tokens': 0,
            'fallback_rate': 0,
            'calls_by_type': {},
            'models_used': {}
        }
    
    total_calls = len(metrics)
    successful_calls = sum(1 for m in metrics if m.success)
    total_latency = sum(m.latency_ms for m in metrics if m.latency_ms)
    total_tokens = sum(m.tokens_used for m in metrics if m.tokens_used)
    fallback_calls = sum(1 for m in metrics if m.fallback_used)
    
    # Group by metric type
    calls_by_type = {}
    for metric in metrics:
        calls_by_type[metric.metric_type] = calls_by_type.get(metric.metric_type, 0) + 1
    
    # Group by model
    models_used = {}
    for metric in metrics:
        if metric.model_used:
            models_used[metric.model_used] = models_used.get(metric.model_used, 0) + 1
    
    return {
        'total_calls': total_calls,
        'success_rate': round((successful_calls / total_calls) * 100, 2) if total_calls > 0 else 0,
        'avg_latency_ms': round(total_latency / total_calls) if total_calls > 0 else 0,
        'total_tokens': total_tokens,
        'fallback_rate': round((fallback_calls / total_calls) * 100, 2) if total_calls > 0 else 0,
        'calls_by_type': calls_by_type,
        'models_used': models_used
    }
