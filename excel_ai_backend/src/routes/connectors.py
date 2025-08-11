"""
Data Connectors API Routes
Handles external data source connections and management
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import pandas as pd
import io
import time

from src.models.auth import db, User
from src.models.connectors import DataConnector, ConnectorDataset, DataAnalysis
from src.routes.user import token_required
from src.utils.openai_helper import call_openai_with_retry, estimate_tokens

connectors_bp = Blueprint('connectors', __name__)

# Connector type definitions
CONNECTOR_TYPES = {
    'excel': {
        'name': 'Microsoft Excel',
        'description': 'Upload and analyze Excel files',
        'auth_required': False,
        'supported_formats': ['.xlsx', '.xls', '.csv']
    },
    'google_sheets': {
        'name': 'Google Sheets',
        'description': 'Connect to Google Sheets documents',
        'auth_required': True,
        'oauth_provider': 'google'
    },
    'google_analytics': {
        'name': 'Google Analytics',
        'description': 'Analyze website traffic and user behavior',
        'auth_required': True,
        'oauth_provider': 'google'
    },
    'google_search_console': {
        'name': 'Google Search Console',
        'description': 'Monitor search performance and SEO data',
        'auth_required': True,
        'oauth_provider': 'google'
    },
    'google_trends': {
        'name': 'Google Trends',
        'description': 'Analyze search trends and popularity',
        'auth_required': False,
        'rate_limited': True
    }
}

@connectors_bp.route('/types', methods=['GET'])
def get_connector_types():
    """Get available connector types"""
    return jsonify({
        'success': True,
        'data': CONNECTOR_TYPES
    })

@connectors_bp.route('/', methods=['GET'])
@token_required
def list_connectors(current_user):
    """List user's data connectors"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 10, type=int), 50)
        connector_type = request.args.get('type')
        
        query = DataConnector.query.filter_by(user_id=current_user.id)
        
        if connector_type:
            query = query.filter_by(connector_type=connector_type)
        
        connectors = query.order_by(DataConnector.updated_at.desc()).paginate(
            page=page, per_page=page_size, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'items': [connector.to_dict() for connector in connectors.items],
                'page': page,
                'page_size': page_size,
                'total': connectors.total,
                'pages': connectors.pages
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/', methods=['POST'])
@token_required
def create_connector(current_user):
    """Create a new data connector"""
    try:
        data = request.json or {}
        name = data.get('name')
        connector_type = data.get('connector_type')
        config = data.get('config', {})
        
        if not name or not connector_type:
            return jsonify({'error': 'name and connector_type are required'}), 400
        
        if connector_type not in CONNECTOR_TYPES:
            return jsonify({'error': f'Invalid connector type. Must be one of: {list(CONNECTOR_TYPES.keys())}'}), 400
        
        # Usage enforcement
        if not current_user.can_query():
            return jsonify({'error': 'Connector limit reached for current plan', 'limit_reached': True}), 429
        
        connector = DataConnector(
            user_id=current_user.id,
            name=name,
            connector_type=connector_type,
            config=config
        )
        
        db.session.add(connector)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': connector.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/<int:connector_id>', methods=['GET'])
@token_required
def get_connector(current_user, connector_id):
    """Get connector details with datasets"""
    try:
        connector = DataConnector.query.filter_by(
            id=connector_id, 
            user_id=current_user.id
        ).first()
        
        if not connector:
            return jsonify({'error': 'Connector not found'}), 404
        
        connector_data = connector.to_dict()
        connector_data['datasets'] = [dataset.to_dict() for dataset in connector.datasets]
        
        return jsonify({
            'success': True,
            'data': connector_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/<int:connector_id>', methods=['PUT'])
@token_required
def update_connector(current_user, connector_id):
    """Update connector configuration"""
    try:
        connector = DataConnector.query.filter_by(
            id=connector_id, 
            user_id=current_user.id
        ).first()
        
        if not connector:
            return jsonify({'error': 'Connector not found'}), 404
        
        data = request.json or {}
        
        if 'name' in data:
            connector.name = data['name']
        if 'config' in data:
            connector.config = data['config']
        if 'status' in data:
            connector.status = data['status']
        
        connector.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': connector.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/<int:connector_id>', methods=['DELETE'])
@token_required
def delete_connector(current_user, connector_id):
    """Delete a connector and all its data"""
    try:
        connector = DataConnector.query.filter_by(
            id=connector_id, 
            user_id=current_user.id
        ).first()
        
        if not connector:
            return jsonify({'error': 'Connector not found'}), 404
        
        db.session.delete(connector)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Connector deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/<int:connector_id>/upload', methods=['POST'])
@token_required
def upload_data(current_user, connector_id):
    """Upload data to a connector (for Excel/CSV files)"""
    try:
        connector = DataConnector.query.filter_by(
            id=connector_id, 
            user_id=current_user.id
        ).first()
        
        if not connector:
            return jsonify({'error': 'Connector not found'}), 404
        
        if connector.connector_type != 'excel':
            return jsonify({'error': 'Upload only supported for Excel connectors'}), 400
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file data
        file_content = file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        # Parse file based on extension
        if file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(io.BytesIO(file_content))
        elif file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        # Create dataset
        dataset = ConnectorDataset(
            connector_id=connector.id,
            name=file.filename,
            dataset_id=f"upload_{int(time.time())}"
        )
        
        # Extract schema information
        dataset.columns = df.columns.tolist()
        dataset.data_types = {col: str(df[col].dtype) for col in df.columns}
        dataset.records_count = len(df)
        dataset.last_updated = datetime.utcnow()
        
        # Update connector stats
        connector.records_count = len(df)
        connector.columns_count = len(df.columns)
        connector.last_sync = datetime.utcnow()
        
        # Store data summary in config for quick access
        connector.config['data_preview'] = df.head(5).to_dict('records')
        connector.config['data_summary'] = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'null_counts': df.isnull().sum().to_dict()
        }
        
        db.session.add(dataset)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'connector': connector.to_dict(),
                'dataset': dataset.to_dict(),
                'preview': df.head(10).to_dict('records')
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@connectors_bp.route('/<int:connector_id>/sync', methods=['POST'])
@token_required
def sync_connector(current_user, connector_id):
    """Sync data from external source"""
    try:
        connector = DataConnector.query.filter_by(
            id=connector_id, 
            user_id=current_user.id
        ).first()
        
        if not connector:
            return jsonify({'error': 'Connector not found'}), 404
        
        # TODO: Implement sync logic for different connector types
        # For now, just update last_sync timestamp
        connector.last_sync = datetime.utcnow()
        connector.status = 'active'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Connector {connector.name} synced successfully',
            'data': connector.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
