from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.visualization import Visualization
import json
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import io
import base64

visualize_bp = Blueprint('visualize', __name__)

@visualize_bp.route('/create', methods=['POST'])
def create_visualization():
    """Create a new visualization"""
    try:
        data = request.get_json()
        
        # Extract parameters
        title = data.get('title', 'Untitled Chart')
        chart_type = data.get('chart_type', 'bar')
        chart_data = data.get('data', [])
        config = data.get('config', {})
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        
        # Validate chart type
        valid_types = ['bar', 'line', 'pie', 'scatter', 'heatmap', 'histogram', 'box']
        if chart_type not in valid_types:
            return jsonify({'error': f'Invalid chart type. Must be one of: {valid_types}'}), 400
        
        # Create the chart based on type
        chart_json = create_chart(chart_data, chart_type, config)
        
        # Save to database
        visualization = Visualization(
            user_id=user_id,
            title=title,
            chart_type=chart_type,
            chart_config=config,
            data_preview=chart_data[:10] if len(chart_data) > 10 else chart_data
        )
        
        db.session.add(visualization)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': visualization.id,
                'chart': chart_json,
                'title': title,
                'chart_type': chart_type
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to create visualization: {str(e)}'}), 500

@visualize_bp.route('/types', methods=['GET'])
def get_chart_types():
    """Get available chart types with descriptions"""
    chart_types = {
        'bar': {
            'name': 'Bar Chart',
            'description': 'Compare values across categories',
            'best_for': 'Categorical data, comparisons',
            'icon': 'bar-chart'
        },
        'line': {
            'name': 'Line Chart', 
            'description': 'Show trends over time',
            'best_for': 'Time series, trends',
            'icon': 'line-chart'
        },
        'pie': {
            'name': 'Pie Chart',
            'description': 'Show parts of a whole',
            'best_for': 'Proportions, percentages',
            'icon': 'pie-chart'
        },
        'scatter': {
            'name': 'Scatter Plot',
            'description': 'Show relationships between variables',
            'best_for': 'Correlations, distributions',
            'icon': 'scatter-chart'
        },
        'heatmap': {
            'name': 'Heatmap',
            'description': 'Show patterns in matrix data',
            'best_for': 'Correlation matrices, dense data',
            'icon': 'activity'
        },
        'histogram': {
            'name': 'Histogram',
            'description': 'Show distribution of values',
            'best_for': 'Data distribution, frequency',
            'icon': 'bar-chart-2'
        },
        'box': {
            'name': 'Box Plot',
            'description': 'Show statistical distribution',
            'best_for': 'Outliers, quartiles, statistical analysis',
            'icon': 'box'
        }
    }
    
    return jsonify({
        'success': True,
        'data': chart_types
    })

@visualize_bp.route('/suggest', methods=['POST'])
def suggest_chart_type():
    """AI-powered chart type suggestion based on data"""
    try:
        data = request.get_json()
        chart_data = data.get('data', [])
        
        if not chart_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(chart_data)
        
        suggestions = []
        
        # Analyze data structure
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime']).columns.tolist()
        
        # Generate suggestions based on data structure
        if len(datetime_cols) > 0 and len(numeric_cols) > 0:
            suggestions.append({
                'type': 'line',
                'confidence': 0.9,
                'reason': 'Time series data detected - line chart shows trends over time',
                'config': {'x': datetime_cols[0], 'y': numeric_cols[0]}
            })
        
        if len(categorical_cols) > 0 and len(numeric_cols) > 0:
            suggestions.append({
                'type': 'bar',
                'confidence': 0.8,
                'reason': 'Categorical and numeric data - bar chart compares values across categories',
                'config': {'x': categorical_cols[0], 'y': numeric_cols[0]}
            })
        
        if len(numeric_cols) >= 2:
            suggestions.append({
                'type': 'scatter',
                'confidence': 0.7,
                'reason': 'Multiple numeric variables - scatter plot shows relationships',
                'config': {'x': numeric_cols[0], 'y': numeric_cols[1]}
            })
        
        # If one categorical column with counts
        if len(categorical_cols) == 1 and len(df) < 10:
            suggestions.append({
                'type': 'pie',
                'confidence': 0.6,
                'reason': 'Small categorical dataset - pie chart shows proportions',
                'config': {'labels': categorical_cols[0], 'values': numeric_cols[0] if numeric_cols else None}
            })
        
        # Sort by confidence
        suggestions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'suggestions': suggestions[:3],  # Top 3 suggestions
                'data_summary': {
                    'rows': len(df),
                    'numeric_columns': numeric_cols,
                    'categorical_columns': categorical_cols,
                    'datetime_columns': datetime_cols
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze data: {str(e)}'}), 500

@visualize_bp.route('/list', methods=['GET'])
def list_visualizations():
    """Get user's visualizations"""
    try:
        user_id = request.args.get('user_id', 1)  # TODO: Get from auth
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        visualizations = Visualization.query.filter_by(user_id=user_id)\
            .order_by(Visualization.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        items = []
        for viz in visualizations.items:
            items.append({
                'id': viz.id,
                'title': viz.title,
                'chart_type': viz.chart_type,
                'created_at': viz.created_at.isoformat(),
                'is_public': viz.is_public
            })
        
        return jsonify({
            'success': True,
            'data': {
                'items': items,
                'page': page,
                'per_page': per_page,
                'total': visualizations.total,
                'pages': visualizations.pages
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to list visualizations: {str(e)}'}), 500

def create_chart(data, chart_type, config):
    """Create chart using Plotly"""
    try:
        df = pd.DataFrame(data)
        
        if chart_type == 'bar':
            x_col = config.get('x', df.columns[0])
            y_col = config.get('y', df.columns[1] if len(df.columns) > 1 else df.columns[0])
            fig = px.bar(df, x=x_col, y=y_col, title=config.get('title', ''))
            
        elif chart_type == 'line':
            x_col = config.get('x', df.columns[0])
            y_col = config.get('y', df.columns[1] if len(df.columns) > 1 else df.columns[0])
            fig = px.line(df, x=x_col, y=y_col, title=config.get('title', ''))
            
        elif chart_type == 'pie':
            labels_col = config.get('labels', df.columns[0])
            values_col = config.get('values', df.columns[1] if len(df.columns) > 1 else None)
            if values_col:
                fig = px.pie(df, names=labels_col, values=values_col, title=config.get('title', ''))
            else:
                # Count occurrences
                counts = df[labels_col].value_counts()
                fig = px.pie(values=counts.values, names=counts.index, title=config.get('title', ''))
                
        elif chart_type == 'scatter':
            x_col = config.get('x', df.columns[0])
            y_col = config.get('y', df.columns[1] if len(df.columns) > 1 else df.columns[0])
            fig = px.scatter(df, x=x_col, y=y_col, title=config.get('title', ''))
            
        elif chart_type == 'heatmap':
            # Use correlation matrix for numeric data
            numeric_df = df.select_dtypes(include=['number'])
            if len(numeric_df.columns) > 1:
                corr_matrix = numeric_df.corr()
                fig = px.imshow(corr_matrix, title=config.get('title', 'Correlation Heatmap'))
            else:
                return {'error': 'Heatmap requires at least 2 numeric columns'}
                
        elif chart_type == 'histogram':
            col = config.get('column', df.select_dtypes(include=['number']).columns[0])
            fig = px.histogram(df, x=col, title=config.get('title', ''))
            
        elif chart_type == 'box':
            col = config.get('column', df.select_dtypes(include=['number']).columns[0])
            fig = px.box(df, y=col, title=config.get('title', ''))
            
        else:
            return {'error': f'Unsupported chart type: {chart_type}'}
        
        # Apply styling
        fig.update_layout(
            template=config.get('theme', 'plotly_white'),
            width=config.get('width', 800),
            height=config.get('height', 600)
        )
        
        # Convert to JSON
        return json.loads(fig.to_json())
        
    except Exception as e:
        return {'error': f'Failed to create chart: {str(e)}'}
