from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    subscription_tier = db.Column(db.String(50), default='free')  # free, pro, enterprise
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Usage tracking
    monthly_queries = db.Column(db.Integer, default=0)
    monthly_uploads = db.Column(db.Integer, default=0)
    last_reset_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Model preference
    preferred_model = db.Column(db.String(50), default='balanced')  # speed|balanced|quality|preview
    
    # Relationships
    analyses = db.relationship('Analysis', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_conversations = db.relationship('ChatConversation', backref='user', lazy=True, cascade='all, delete-orphan')
    data_connectors = db.relationship('DataConnector', backref='user', lazy=True, cascade='all, delete-orphan')
    data_analyses = db.relationship('DataAnalysis', backref='user', lazy=True, cascade='all, delete-orphan')

    def __init__(self, email, password, first_name, last_name):
        self.email = email.lower().strip()
        self.password_hash = generate_password_hash(password)
        self.first_name = first_name.strip()
        self.last_name = last_name.strip()

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_token(self, expires_in=3600):
        """Generate JWT token for authentication"""
        payload = {
            'user_id': self.id,
            'email': self.email,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow()
        }
        secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
        return jwt.encode(payload, secret_key, algorithm='HS256')

    @staticmethod
    def verify_token(token):
        """Verify JWT token and return user"""
        try:
            secret_key = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            return user if user and user.is_active else None
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def can_upload(self):
        """Check if user can upload files based on subscription"""
        limits = {
            'free': 5,      # 5 uploads per month
            'pro': 100,     # 100 uploads per month
            'enterprise': float('inf')  # unlimited
        }
        return self.monthly_uploads < limits.get(self.subscription_tier, 5)

    def can_query(self):
        """Check if user can make AI queries based on subscription"""
        limits = {
            'free': 20,     # 20 queries per month
            'pro': 500,     # 500 queries per month
            'enterprise': float('inf')  # unlimited
        }
        return self.monthly_queries < limits.get(self.subscription_tier, 20)

    def increment_usage(self, usage_type):
        """Increment usage counters"""
        # Reset monthly counters if it's a new month
        now = datetime.utcnow()
        if self.last_reset_date.month != now.month or self.last_reset_date.year != now.year:
            self.monthly_queries = 0
            self.monthly_uploads = 0
            self.last_reset_date = now

        if usage_type == 'query':
            self.monthly_queries += 1
        elif usage_type == 'upload':
            self.monthly_uploads += 1
        
        db.session.commit()

    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'subscription_tier': self.subscription_tier,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat(),
            'usage': {
                'monthly_queries': self.monthly_queries,
                'monthly_uploads': self.monthly_uploads,
                'can_upload': self.can_upload(),
                'can_query': self.can_query()
            },
            'preferred_model': self.preferred_model
        }


class Analysis(db.Model):
    __tablename__ = 'analyses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer)
    analysis_results = db.Column(db.JSON)  # Store the analysis results as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'file_size': self.file_size,
            'created_at': self.created_at.isoformat(),
            'analysis_results': self.analysis_results
        }


class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255))
    data_context = db.Column(db.JSON)  # Store current dataset context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    messages = db.relationship('ChatMessage', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_messages=True):
        result = {
            'id': self.id,
            'title': self.title,
            'data_context': self.data_context,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_messages:
            result['messages'] = [msg.to_dict() for msg in self.messages]
        return result


class FormulaInteraction(db.Model):
    __tablename__ = 'formula_interactions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    interaction_type = db.Column(db.String(20), nullable=False)  # generate|explain|debug
    input_payload = db.Column(db.JSON, nullable=False)
    output_payload = db.Column(db.JSON)
    model_used = db.Column(db.String(100))
    fallback_used = db.Column(db.Boolean, default=False)
    # Telemetry fields
    latency_ms = db.Column(db.Integer)  # response time
    tokens_used = db.Column(db.Integer)  # estimated tokens
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'interaction_type': self.interaction_type,
            'input_payload': self.input_payload,
            'output_payload': self.output_payload,
            'model_used': self.model_used,
            'fallback_used': self.fallback_used,
            'latency_ms': self.latency_ms,
            'tokens_used': self.tokens_used,
            'success': self.success,
            'created_at': self.created_at.isoformat()
        }


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chat_conversations.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # user|assistant
    content = db.Column(db.Text, nullable=False)
    model_used = db.Column(db.String(100))
    fallback_used = db.Column(db.Boolean, default=False)
    latency_ms = db.Column(db.Integer)
    tokens_used = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'model_used': self.model_used,
            'fallback_used': self.fallback_used,
            'latency_ms': self.latency_ms,
            'tokens_used': self.tokens_used,
            'created_at': self.created_at.isoformat()
        }


class TelemetryMetric(db.Model):
    __tablename__ = 'telemetry_metrics'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    metric_type = db.Column(db.String(50), nullable=False)  # api_call|formula|query|analysis
    endpoint = db.Column(db.String(100), nullable=False)
    model_used = db.Column(db.String(100))
    fallback_used = db.Column(db.Boolean, default=False)
    latency_ms = db.Column(db.Integer)
    tokens_used = db.Column(db.Integer)
    success = db.Column(db.Boolean, default=True)
    error_type = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'metric_type': self.metric_type,
            'endpoint': self.endpoint,
            'model_used': self.model_used,
            'fallback_used': self.fallback_used,
            'latency_ms': self.latency_ms,
            'tokens_used': self.tokens_used,
            'success': self.success,
            'error_type': self.error_type,
            'created_at': self.created_at.isoformat()
        }
