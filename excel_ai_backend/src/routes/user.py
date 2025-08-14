from flask import Blueprint, jsonify, request
from src.routes.auth import token_required
from src.models.auth import db, User

user_bp = Blueprint('user', __name__)

@user_bp.route('/users/me/model-preference', methods=['GET'])
@token_required
def get_model_preference(current_user):
    return jsonify({'success': True, 'preferred_model': current_user.preferred_model})

@user_bp.route('/users/me/model-preference', methods=['POST'])
@token_required
def set_model_preference(current_user):
    data = request.json or {}
    model = data.get('preferred_model')
    allowed = ['speed', 'balanced', 'quality', 'preview']
    if model not in allowed:
        return jsonify({'success': False, 'error': 'Invalid model preference'}), 400

    if model == 'preview' and current_user.subscription_tier == 'free':
        return jsonify({'success': False, 'error': 'Preview model requires Pro plan'}), 403

    current_user.preferred_model = model
    db.session.commit()
    return jsonify({'success': True, 'preferred_model': current_user.preferred_model})
