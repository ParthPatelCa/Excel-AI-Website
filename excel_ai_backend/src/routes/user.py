from flask import Blueprint, jsonify, request
from src.models.user import User, db
from routes.auth import token_required

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
    current_user.preferred_model = model
    db.session.commit()
    return jsonify({'success': True, 'preferred_model': current_user.preferred_model})
from flask import Blueprint, jsonify, request
from src.models.user import User, db

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    
    data = request.json
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
