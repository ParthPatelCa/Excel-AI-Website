"""Chat conversation management endpoints."""

from flask import Blueprint, jsonify, request
from src.routes.auth import token_required
from src.models.auth import db, ChatConversation, ChatMessage
from src.utils.telemetry import TelemetryTracker, estimate_tokens
import time

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
@token_required
def list_conversations(current_user):
    """List user's chat conversations with pagination."""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 10, type=int), 50)
        
        conversations = ChatConversation.query.filter_by(
            user_id=current_user.id
        ).order_by(
            ChatConversation.updated_at.desc()
        ).paginate(
            page=page,
            per_page=page_size,
            error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'conversations': [conv.to_dict(include_messages=False) for conv in conversations.items],
                'page': page,
                'page_size': page_size,
                'total': conversations.total,
                'pages': conversations.pages
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to list conversations: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """Get a specific conversation with all messages."""
    try:
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict(include_messages=True)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get conversation: {str(e)}'}), 500

@chat_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    """Create a new chat conversation."""
    try:
        data = request.json or {}
        
        conversation = ChatConversation(
            user_id=current_user.id,
            title=data.get('title', 'New Conversation'),
            data_context=data.get('data_context')
        )
        
        db.session.add(conversation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict(include_messages=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create conversation: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@token_required
def add_message(current_user, conversation_id):
    """Add a message to a conversation."""
    try:
        data = request.json
        if not data or 'content' not in data or 'role' not in data:
            return jsonify({'error': 'Content and role are required'}), 400
        
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        # Create message with telemetry
        message = ChatMessage(
            conversation_id=conversation_id,
            role=data['role'],
            content=data['content'],
            model_used=data.get('model_used'),
            fallback_used=data.get('fallback_used', False),
            latency_ms=data.get('latency_ms'),
            tokens_used=data.get('tokens_used') or estimate_tokens(data['content'])
        )
        
        db.session.add(message)
        
        # Update conversation timestamp
        conversation.updated_at = message.created_at
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add message: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:conversation_id>', methods=['PUT'])
@token_required
def update_conversation(current_user, conversation_id):
    """Update conversation title or context."""
    try:
        data = request.json or {}
        
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        if 'title' in data:
            conversation.title = data['title']
        
        if 'data_context' in data:
            conversation.data_context = data['data_context']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': conversation.to_dict(include_messages=False)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update conversation: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(current_user, conversation_id):
    """Delete a conversation and all its messages."""
    try:
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        db.session.delete(conversation)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Conversation deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete conversation: {str(e)}'}), 500

@chat_bp.route('/conversations/<int:conversation_id>/export', methods=['GET'])
@token_required
def export_conversation(current_user, conversation_id):
    """Export conversation in various formats."""
    try:
        format_type = request.args.get('format', 'json')
        
        conversation = ChatConversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        if format_type == 'json':
            return jsonify({
                'success': True,
                'data': conversation.to_dict(include_messages=True)
            })
        
        elif format_type == 'text':
            # Simple text format
            text_content = f"Conversation: {conversation.title}\n"
            text_content += f"Created: {conversation.created_at.isoformat()}\n\n"
            
            for message in conversation.messages:
                text_content += f"[{message.role.upper()}] {message.content}\n"
                if message.model_used:
                    text_content += f"  (Model: {message.model_used}"
                    if message.fallback_used:
                        text_content += " - fallback"
                    text_content += ")\n"
                text_content += "\n"
            
            return jsonify({
                'success': True,
                'data': {
                    'format': 'text',
                    'content': text_content
                }
            })
        
        else:
            return jsonify({'error': 'Unsupported format. Use json or text.'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Failed to export conversation: {str(e)}'}), 500
