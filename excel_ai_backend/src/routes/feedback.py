from flask import Blueprint, jsonify, request
from datetime import datetime
from src.models.auth import db
from src.routes.auth import token_required
import json

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/submit', methods=['POST'])
@token_required
def submit_feedback(current_user):
    """Submit user feedback for MVP validation"""
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'feedback_type' not in data or 'message' not in data:
            return jsonify({'error': 'Missing required feedback data'}), 400
        
        feedback_entry = {
            'user_id': current_user.id,
            'user_email': current_user.email,
            'feedback_type': data['feedback_type'],  # 'feature_request', 'bug_report', 'general', 'rating'
            'message': data['message'],
            'rating': data.get('rating'),  # 1-5 stars for rating feedback
            'feature_used': data.get('feature_used'),  # 'upload', 'analyze', 'visualize'
            'page_url': data.get('page_url'),
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': data.get('metadata', {})  # Additional context
        }
        
        # For MVP, we'll store feedback in a simple file-based system
        # In production, this would go to a proper database
        feedback_file = 'src/database/mvp_feedback.jsonl'
        
        import os
        os.makedirs(os.path.dirname(feedback_file), exist_ok=True)
        
        with open(feedback_file, 'a') as f:
            f.write(json.dumps(feedback_entry) + '\n')
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback! It helps us improve DataSense AI.'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error submitting feedback: {str(e)}'}), 500

@feedback_bp.route('/quick-rating', methods=['POST'])
@token_required
def submit_quick_rating(current_user):
    """Submit a quick star rating"""
    try:
        data = request.json
        
        if not data or 'rating' not in data:
            return jsonify({'error': 'Rating is required'}), 400
        
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        feedback_entry = {
            'user_id': current_user.id,
            'user_email': current_user.email,
            'feedback_type': 'quick_rating',
            'rating': rating,
            'feature_used': data.get('feature_used'),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        feedback_file = 'src/database/mvp_feedback.jsonl'
        os.makedirs(os.path.dirname(feedback_file), exist_ok=True)
        
        with open(feedback_file, 'a') as f:
            f.write(json.dumps(feedback_entry) + '\n')
        
        return jsonify({
            'success': True,
            'message': 'Thanks for rating your experience!'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error submitting rating: {str(e)}'}), 500

@feedback_bp.route('/analytics', methods=['POST'])
@token_required
def submit_analytics(current_user):
    """Submit anonymous usage analytics for MVP insights"""
    try:
        data = request.json
        
        analytics_entry = {
            'user_id': current_user.id[:8] + '***',  # Partially anonymized
            'event_type': data.get('event_type'),  # 'page_view', 'feature_use', 'upload', 'analyze'
            'feature_name': data.get('feature_name'),
            'duration_seconds': data.get('duration_seconds'),
            'success': data.get('success', True),
            'error_message': data.get('error_message'),
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': data.get('metadata', {})
        }
        
        analytics_file = 'src/database/mvp_analytics.jsonl'
        os.makedirs(os.path.dirname(analytics_file), exist_ok=True)
        
        with open(analytics_file, 'a') as f:
            f.write(json.dumps(analytics_entry) + '\n')
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': f'Error logging analytics: {str(e)}'}), 500

# MVP: Admin endpoint to view feedback (simple implementation)
@feedback_bp.route('/admin/summary', methods=['GET'])
@token_required
def get_feedback_summary(current_user):
    """Get feedback summary for MVP analysis"""
    try:
        # Simple admin check (in production, use proper role-based auth)
        if current_user.email not in ['admin@datasense.ai', 'parthpatel2207@gmail.com']:
            return jsonify({'error': 'Admin access required'}), 403
        
        feedback_file = 'src/database/mvp_feedback.jsonl'
        analytics_file = 'src/database/mvp_analytics.jsonl'
        
        feedback_data = []
        analytics_data = []
        
        # Read feedback
        if os.path.exists(feedback_file):
            with open(feedback_file, 'r') as f:
                for line in f:
                    feedback_data.append(json.loads(line.strip()))
        
        # Read analytics
        if os.path.exists(analytics_file):
            with open(analytics_file, 'r') as f:
                for line in f:
                    analytics_data.append(json.loads(line.strip()))
        
        # Generate summary
        summary = {
            'total_feedback': len(feedback_data),
            'total_analytics_events': len(analytics_data),
            'feedback_by_type': {},
            'average_rating': 0,
            'recent_feedback': feedback_data[-10:] if feedback_data else [],
            'feature_usage': {},
            'generated_at': datetime.utcnow().isoformat()
        }
        
        # Process feedback
        ratings = []
        for fb in feedback_data:
            fb_type = fb.get('feedback_type', 'unknown')
            summary['feedback_by_type'][fb_type] = summary['feedback_by_type'].get(fb_type, 0) + 1
            
            if fb.get('rating'):
                ratings.append(fb['rating'])
        
        if ratings:
            summary['average_rating'] = round(sum(ratings) / len(ratings), 2)
        
        # Process analytics
        for event in analytics_data:
            feature = event.get('feature_name', 'unknown')
            summary['feature_usage'][feature] = summary['feature_usage'].get(feature, 0) + 1
        
        return jsonify({
            'success': True,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generating summary: {str(e)}'}), 500
