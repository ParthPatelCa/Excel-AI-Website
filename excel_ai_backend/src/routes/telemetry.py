"""Telemetry and metrics endpoints."""

from flask import Blueprint, jsonify, request
from routes.auth import token_required
from models.auth import db, TelemetryMetric, User, FormulaInteraction, ChatMessage, ChatConversation
from utils.telemetry import get_telemetry_summary
from datetime import datetime, timedelta
from sqlalchemy import func

telemetry_bp = Blueprint('telemetry', __name__)

@telemetry_bp.route('/metrics', methods=['GET'])
@token_required
def get_user_metrics(current_user):
    """Get comprehensive metrics for the current user."""
    try:
        days = request.args.get('days', 30, type=int)
        days = min(days, 365)  # Cap at 1 year
        
        # Get telemetry summary
        summary = get_telemetry_summary(current_user.id, days)
        
        # Get formula interaction stats
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        formula_stats = db.session.query(
            FormulaInteraction.interaction_type,
            func.count(FormulaInteraction.id).label('count'),
            func.avg(FormulaInteraction.latency_ms).label('avg_latency'),
            func.sum(FormulaInteraction.tokens_used).label('total_tokens')
        ).filter(
            FormulaInteraction.user_id == current_user.id,
            FormulaInteraction.created_at >= cutoff_date
        ).group_by(FormulaInteraction.interaction_type).all()
        
        formula_breakdown = {}
        for stat in formula_stats:
            formula_breakdown[stat.interaction_type] = {
                'count': stat.count,
                'avg_latency_ms': round(stat.avg_latency) if stat.avg_latency else 0,
                'total_tokens': stat.total_tokens or 0
            }
        
        # Get chat message stats
        chat_stats = db.session.query(
            func.count(ChatMessage.id).label('total_messages'),
            func.avg(ChatMessage.latency_ms).label('avg_latency'),
            func.sum(ChatMessage.tokens_used).label('total_tokens')
        ).filter(
            ChatMessage.conversation_id.in_(
                db.session.query(ChatConversation.id).filter(
                    ChatConversation.user_id == current_user.id
                )
            ),
            ChatMessage.created_at >= cutoff_date,
            ChatMessage.role == 'assistant'  # Only count AI responses
        ).first()
        
        return jsonify({
            'success': True,
            'data': {
                'period_days': days,
                'overall': summary,
                'formula_interactions': formula_breakdown,
                'chat_stats': {
                    'total_messages': chat_stats.total_messages or 0,
                    'avg_latency_ms': round(chat_stats.avg_latency) if chat_stats.avg_latency else 0,
                    'total_tokens': chat_stats.total_tokens or 0
                },
                'usage_limits': {
                    'monthly_queries': current_user.monthly_queries,
                    'monthly_uploads': current_user.monthly_uploads,
                    'limits': current_user.get_limits(),
                    'last_reset': current_user.last_reset_date.isoformat()
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get metrics: {str(e)}'}), 500

@telemetry_bp.route('/health', methods=['GET'])
def health_check():
    """Enhanced health check with system metrics."""
    try:
        # Basic database connectivity
        user_count = User.query.count()
        
        # Recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_metrics = TelemetryMetric.query.filter(
            TelemetryMetric.created_at >= yesterday
        ).count()
        
        recent_formulas = FormulaInteraction.query.filter(
            FormulaInteraction.created_at >= yesterday
        ).count()
        
        # System health indicators
        last_hour = datetime.utcnow() - timedelta(hours=1)
        recent_errors = TelemetryMetric.query.filter(
            TelemetryMetric.created_at >= last_hour,
            TelemetryMetric.success == False
        ).count()
        
        # Success rate calculation
        total_recent = TelemetryMetric.query.filter(
            TelemetryMetric.created_at >= last_hour
        ).count()
        
        success_rate = 100
        if total_recent > 0:
            success_rate = round(((total_recent - recent_errors) / total_recent) * 100, 2)
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'metrics': {
                'total_users': user_count,
                'recent_api_calls_24h': recent_metrics,
                'recent_formula_interactions_24h': recent_formulas,
                'recent_errors_1h': recent_errors,
                'success_rate_1h': success_rate
            },
            'version': '1.0.0'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 500

@telemetry_bp.route('/admin/metrics', methods=['GET'])
@token_required
def get_admin_metrics(current_user):
    """Admin-only system-wide metrics (future: add admin role check)."""
    # Note: In production, add admin role verification
    # if not current_user.is_admin:
    #     return jsonify({'error': 'Admin access required'}), 403
    
    try:
        days = request.args.get('days', 7, type=int)
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # System-wide stats
        total_users = User.query.count()
        active_users = User.query.filter(User.last_login >= cutoff_date).count()
        
        # API usage stats
        api_stats = db.session.query(
            TelemetryMetric.metric_type,
            func.count(TelemetryMetric.id).label('count'),
            func.avg(TelemetryMetric.latency_ms).label('avg_latency'),
            func.sum(TelemetryMetric.tokens_used).label('total_tokens')
        ).filter(
            TelemetryMetric.created_at >= cutoff_date
        ).group_by(TelemetryMetric.metric_type).all()
        
        api_breakdown = {}
        for stat in api_stats:
            api_breakdown[stat.metric_type] = {
                'calls': stat.count,
                'avg_latency_ms': round(stat.avg_latency) if stat.avg_latency else 0,
                'total_tokens': stat.total_tokens or 0
            }
        
        # Model usage distribution
        model_stats = db.session.query(
            TelemetryMetric.model_used,
            func.count(TelemetryMetric.id).label('count')
        ).filter(
            TelemetryMetric.created_at >= cutoff_date,
            TelemetryMetric.model_used.isnot(None)
        ).group_by(TelemetryMetric.model_used).all()
        
        model_distribution = {stat.model_used: stat.count for stat in model_stats}
        
        # Error analysis
        error_stats = db.session.query(
            TelemetryMetric.error_type,
            func.count(TelemetryMetric.id).label('count')
        ).filter(
            TelemetryMetric.created_at >= cutoff_date,
            TelemetryMetric.success == False
        ).group_by(TelemetryMetric.error_type).all()
        
        error_breakdown = {stat.error_type or 'Unknown': stat.count for stat in error_stats}
        
        return jsonify({
            'success': True,
            'data': {
                'period_days': days,
                'users': {
                    'total': total_users,
                    'active': active_users
                },
                'api_usage': api_breakdown,
                'model_distribution': model_distribution,
                'errors': error_breakdown
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get admin metrics: {str(e)}'}), 500
