"""
Enhanced Data Analysis API Routes
Supports multiple analysis types: root cause, statistical, gap, correlation, ML, scenario, optimization
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import pandas as pd
import numpy as np
import time

from src.models.auth import db, User
from src.models.connectors import DataConnector, ConnectorDataset, DataAnalysis
from src.routes.user import token_required
from src.utils.openai_helper import call_openai_with_retry, estimate_tokens

analysis_bp = Blueprint('analysis', __name__)

# Analysis type definitions
ANALYSIS_TYPES = {
    'root_cause': {
        'name': 'Root Cause Analysis',
        'description': 'Identify the underlying causes of problems or trends',
        'parameters': ['target_metric', 'time_period', 'factors'],
        'output': ['causes', 'impact_analysis', 'recommendations']
    },
    'statistical': {
        'name': 'Statistical Analysis',
        'description': 'Comprehensive statistical analysis with descriptive and inferential statistics',
        'parameters': ['variables', 'confidence_level', 'test_type'],
        'output': ['descriptive_stats', 'hypothesis_tests', 'distributions']
    },
    'gap': {
        'name': 'Gap Analysis',
        'description': 'Compare current state with desired state to identify gaps',
        'parameters': ['current_metrics', 'target_metrics', 'dimensions'],
        'output': ['gaps_identified', 'priority_ranking', 'action_plan']
    },
    'correlation': {
        'name': 'Correlation Analysis',
        'description': 'Discover relationships and correlations between variables',
        'parameters': ['variables', 'correlation_method', 'significance_level'],
        'output': ['correlation_matrix', 'significant_relationships', 'insights']
    },
    'machine_learning': {
        'name': 'Machine Learning Analysis',
        'description': 'Predictive modeling and pattern recognition',
        'parameters': ['target_variable', 'features', 'model_type'],
        'output': ['model_performance', 'feature_importance', 'predictions']
    },
    'scenario': {
        'name': 'Scenario Analysis',
        'description': 'Analyze different scenarios and their potential outcomes',
        'parameters': ['scenarios', 'variables', 'assumptions'],
        'output': ['scenario_results', 'sensitivity_analysis', 'risk_assessment']
    },
    'optimization': {
        'name': 'Optimization Analysis',
        'description': 'Find optimal solutions and resource allocation',
        'parameters': ['objective', 'constraints', 'variables'],
        'output': ['optimal_solution', 'tradeoffs', 'sensitivity']
    }
}

@analysis_bp.route('/types', methods=['GET'])
def get_analysis_types():
    """Get available analysis types"""
    return jsonify({
        'success': True,
        'data': ANALYSIS_TYPES
    })

@analysis_bp.route('/', methods=['GET'])
@token_required
def list_analyses(current_user):
    """List user's data analyses"""
    try:
        page = request.args.get('page', 1, type=int)
        page_size = min(request.args.get('page_size', 10, type=int), 50)
        analysis_type = request.args.get('type')
        status = request.args.get('status')
        connector_id = request.args.get('connector_id', type=int)
        
        query = DataAnalysis.query.filter_by(user_id=current_user.id)
        
        if analysis_type:
            query = query.filter_by(analysis_type=analysis_type)
        if status:
            query = query.filter_by(status=status)
        if connector_id:
            query = query.filter_by(connector_id=connector_id)
        
        analyses = query.order_by(DataAnalysis.created_at.desc()).paginate(
            page=page, per_page=page_size, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'items': [analysis.to_dict() for analysis in analyses.items],
                'page': page,
                'page_size': page_size,
                'total': analyses.total,
                'pages': analyses.pages
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analysis_bp.route('/', methods=['POST'])
@token_required
def create_analysis(current_user):
    """Create and run a new data analysis"""
    try:
        data = request.json or {}
        name = data.get('name')
        analysis_type = data.get('analysis_type')
        parameters = data.get('parameters', {})
        connector_id = data.get('connector_id')
        dataset_id = data.get('dataset_id')
        
        if not name or not analysis_type:
            return jsonify({'error': 'name and analysis_type are required'}), 400
        
        if analysis_type not in ANALYSIS_TYPES:
            return jsonify({'error': f'Invalid analysis type. Must be one of: {list(ANALYSIS_TYPES.keys())}'}), 400
        
        # Usage enforcement
        if not current_user.can_query():
            return jsonify({'error': 'Analysis limit reached for current plan', 'limit_reached': True}), 429
        
        # Validate connector and dataset if provided
        if connector_id:
            connector = DataConnector.query.filter_by(
                id=connector_id, 
                user_id=current_user.id
            ).first()
            if not connector:
                return jsonify({'error': 'Connector not found'}), 404
        
        # Create analysis record
        analysis = DataAnalysis(
            user_id=current_user.id,
            name=name,
            analysis_type=analysis_type,
            parameters=parameters
        )
        analysis.connector_id = connector_id
        analysis.dataset_id = dataset_id
        analysis.status = 'running'
        analysis.started_at = datetime.utcnow()
        
        db.session.add(analysis)
        db.session.commit()
        
        # Run analysis
        try:
            analysis_result = _run_analysis(analysis, current_user)
            analysis.status = 'completed'
            analysis.completed_at = datetime.utcnow()
            analysis.execution_time_ms = int((analysis.completed_at - analysis.started_at).total_seconds() * 1000)
            analysis.results = analysis_result.get('results')
            analysis.insights = analysis_result.get('insights')
            analysis.visualizations = analysis_result.get('visualizations')
            analysis.model_used = analysis_result.get('model_used')
            analysis.tokens_used = analysis_result.get('tokens_used')
            
        except Exception as e:
            analysis.status = 'failed'
            analysis.completed_at = datetime.utcnow()
            analysis.results = {'error': str(e)}
        
        db.session.commit()
        current_user.increment_usage('query')
        
        return jsonify({
            'success': True,
            'data': analysis.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@analysis_bp.route('/<int:analysis_id>', methods=['GET'])
@token_required
def get_analysis(current_user, analysis_id):
    """Get analysis details and results"""
    try:
        analysis = DataAnalysis.query.filter_by(
            id=analysis_id, 
            user_id=current_user.id
        ).first()
        
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        return jsonify({
            'success': True,
            'data': analysis.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analysis_bp.route('/<int:analysis_id>', methods=['DELETE'])
@token_required
def delete_analysis(current_user, analysis_id):
    """Delete an analysis"""
    try:
        analysis = DataAnalysis.query.filter_by(
            id=analysis_id, 
            user_id=current_user.id
        ).first()
        
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404
        
        db.session.delete(analysis)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Analysis deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

def _run_analysis(analysis, user):
    """Execute the actual analysis based on type"""
    analysis_type = analysis.analysis_type
    parameters = analysis.parameters
    
    # Get data if connector is specified
    data_context = {}
    if analysis.connector_id:
        connector = DataConnector.query.get(analysis.connector_id)
        if connector and connector.config.get('data_summary'):
            data_context = connector.config['data_summary']
    
    # Generate AI-powered analysis based on type
    system_prompt = f"""You are an expert data analyst performing {ANALYSIS_TYPES[analysis_type]['name']}. 
    Provide comprehensive analysis results in JSON format."""
    
    user_prompt = f"""
    Perform {analysis_type.replace('_', ' ')} analysis with the following parameters:
    
    Analysis Name: {analysis.name}
    Parameters: {json.dumps(parameters, indent=2)}
    Data Context: {json.dumps(data_context, indent=2) if data_context else 'No data context provided'}
    
    Provide results in JSON format with these sections:
    - summary: Brief overview of the analysis
    - findings: Key findings and insights
    - {', '.join(ANALYSIS_TYPES[analysis_type]['output'])}
    - recommendations: Actionable recommendations
    - visualizations: Suggested chart types and configurations
    """
    
    # Track timing for telemetry
    start_time = time.time()
    result = call_openai_with_retry([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ], max_tokens=1500)
    
    if not result['success']:
        raise Exception(f"AI analysis failed: {result.get('error', 'Unknown error')}")
    
    # Parse AI response
    try:
        ai_results = json.loads(result['content'])
    except json.JSONDecodeError:
        ai_results = {
            'summary': result['content'][:500],
            'findings': [result['content']]
        }
    
    # Calculate tokens for telemetry
    tokens_used = result.get('usage') or estimate_tokens(result['content'])
    
    return {
        'results': ai_results,
        'insights': ai_results.get('summary', ''),
        'visualizations': ai_results.get('visualizations', []),
        'model_used': result.get('model_used'),
        'tokens_used': tokens_used
    }
