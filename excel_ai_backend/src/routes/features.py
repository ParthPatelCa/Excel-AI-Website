from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
from datetime import datetime
import re
from typing import Dict, List, Any, Optional

features_bp = Blueprint('features', __name__)

def _placeholder(name: str):
    """Return a standard placeholder response for in-progress features."""
    return jsonify({"feature": name, "status": "in-progress"})

@features_bp.route('/data-cleaning', methods=['POST'])
def data_cleaning():
    """
    Automated Data Cleaning Feature
    Analyzes uploaded data and suggests/applies cleaning operations
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read the file
        if file.filename.endswith('.csv'):
            df_original = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df_original = pd.read_excel(file)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        # Perform data quality analysis
        quality_issues = analyze_data_quality(df_original)
        
        # Generate cleaning suggestions
        cleaning_suggestions = generate_cleaning_suggestions(df_original, quality_issues)
        
        # Apply automatic cleaning (safe operations only)
        df_cleaned, applied_operations = apply_safe_cleaning(df_original, cleaning_suggestions)
        
        # Prepare response with before/after comparison
        response = {
            'success': True,
            'original_data': {
                'rows': len(df_original),
                'columns': len(df_original.columns),
                'column_names': df_original.columns.tolist(),
                'preview': df_original.head(5).fillna('').to_dict('records')
            },
            'cleaned_data': {
                'rows': len(df_cleaned),
                'columns': len(df_cleaned.columns),
                'column_names': df_cleaned.columns.tolist(),
                'preview': df_cleaned.head(5).fillna('').to_dict('records')
            },
            'quality_issues': quality_issues,
            'cleaning_suggestions': cleaning_suggestions,
            'applied_operations': applied_operations,
            'improvement_summary': generate_improvement_summary(df_original, df_cleaned, applied_operations)
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Data cleaning failed: {str(e)}'}), 500

def analyze_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze data quality issues in the DataFrame"""
    issues = {
        'missing_values': {},
        'duplicates': {},
        'data_types': {},
        'outliers': {},
        'inconsistencies': {},
        'summary': {}
    }
    
    # Missing values analysis
    missing_counts = df.isnull().sum()
    issues['missing_values'] = {
        'total_missing': int(missing_counts.sum()),
        'by_column': missing_counts[missing_counts > 0].to_dict(),
        'percentage_by_column': ((missing_counts / len(df)) * 100)[missing_counts > 0].round(2).to_dict()
    }
    
    # Duplicate rows
    duplicate_count = df.duplicated().sum()
    issues['duplicates'] = {
        'count': int(duplicate_count),
        'percentage': round((duplicate_count / len(df)) * 100, 2)
    }
    
    # Data type issues
    issues['data_types'] = analyze_data_types(df)
    
    # Outliers (for numeric columns)
    issues['outliers'] = detect_outliers(df)
    
    # Text inconsistencies
    issues['inconsistencies'] = detect_text_inconsistencies(df)
    
    # Summary
    total_issues = (
        issues['missing_values']['total_missing'] +
        issues['duplicates']['count'] +
        len(issues['data_types']['suggested_conversions']) +
        sum(len(outliers) for outliers in issues['outliers'].values()) +
        len(issues['inconsistencies']['columns_with_issues'])
    )
    
    issues['summary'] = {
        'total_issues_detected': total_issues,
        'data_quality_score': max(0, 100 - (total_issues / len(df)) * 10)  # Simple scoring
    }
    
    return issues

def analyze_data_types(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze and suggest data type improvements"""
    suggestions = {
        'current_types': df.dtypes.astype(str).to_dict(),
        'suggested_conversions': {}
    }
    
    for column in df.columns:
        col_data = df[column].dropna()
        if len(col_data) == 0:
            continue
        
        current_type = str(df[column].dtype)
        suggested_type = None
        confidence = 0
        
        # Check if object column could be numeric
        if current_type == 'object':
            try:
                # Try to convert to numeric
                pd.to_numeric(col_data, errors='raise')
                suggested_type = 'numeric'
                confidence = 95
            except:
                # Check if it could be datetime
                try:
                    pd.to_datetime(col_data, errors='raise')
                    suggested_type = 'datetime'
                    confidence = 90
                except:
                    # Check if it's categorical (limited unique values)
                    unique_ratio = len(col_data.unique()) / len(col_data)
                    if unique_ratio < 0.1 and len(col_data.unique()) < 50:
                        suggested_type = 'category'
                        confidence = 80
        
        if suggested_type and confidence > 70:
            suggestions['suggested_conversions'][column] = {
                'from': current_type,
                'to': suggested_type,
                'confidence': confidence
            }
    
    return suggestions

def detect_outliers(df: pd.DataFrame) -> Dict[str, List]:
    """Detect outliers in numeric columns using IQR method"""
    outliers = {}
    
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    
    for column in numeric_columns:
        col_data = df[column].dropna()
        if len(col_data) < 4:  # Need at least 4 values for quartiles
            continue
        
        Q1 = col_data.quantile(0.25)
        Q3 = col_data.quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outlier_indices = df[(df[column] < lower_bound) | (df[column] > upper_bound)].index.tolist()
        
        if outlier_indices:
            outliers[column] = {
                'count': len(outlier_indices),
                'indices': outlier_indices[:10],  # Limit to first 10 for response size
                'bounds': {'lower': float(lower_bound), 'upper': float(upper_bound)},
                'values': df.loc[outlier_indices[:10], column].tolist()
            }
    
    return outliers

def detect_text_inconsistencies(df: pd.DataFrame) -> Dict[str, Any]:
    """Detect text formatting inconsistencies"""
    inconsistencies = {
        'columns_with_issues': [],
        'details': {}
    }
    
    text_columns = df.select_dtypes(include=['object']).columns
    
    for column in text_columns:
        col_data = df[column].dropna().astype(str)
        if len(col_data) == 0:
            continue
        
        issues = []
        
        # Check for mixed case
        has_upper = any(val.isupper() for val in col_data if val.isalpha())
        has_lower = any(val.islower() for val in col_data if val.isalpha())
        has_title = any(val.istitle() for val in col_data if val.isalpha())
        
        if sum([has_upper, has_lower, has_title]) > 1:
            issues.append('mixed_case')
        
        # Check for leading/trailing whitespace
        if any(val != val.strip() for val in col_data):
            issues.append('whitespace')
        
        # Check for inconsistent formatting (e.g., phone numbers, emails)
        if column.lower() in ['phone', 'email', 'date']:
            formats = set()
            for val in col_data[:50]:  # Check first 50 values
                if '@' in val:  # Email pattern
                    formats.add('email')
                elif re.match(r'\d{3}-\d{3}-\d{4}', val):  # Phone pattern
                    formats.add('phone_dash')
                elif re.match(r'\(\d{3}\)\s\d{3}-\d{4}', val):  # Phone pattern
                    formats.add('phone_paren')
            
            if len(formats) > 1:
                issues.append('inconsistent_format')
        
        if issues:
            inconsistencies['columns_with_issues'].append(column)
            inconsistencies['details'][column] = issues
    
    return inconsistencies

def generate_cleaning_suggestions(df: pd.DataFrame, quality_issues: Dict) -> List[Dict]:
    """Generate specific cleaning suggestions based on quality issues"""
    suggestions = []
    
    # Missing values suggestions
    if quality_issues['missing_values']['total_missing'] > 0:
        for column, count in quality_issues['missing_values']['by_column'].items():
            percentage = quality_issues['missing_values']['percentage_by_column'][column]
            
            if percentage > 50:
                suggestions.append({
                    'type': 'remove_column',
                    'target': column,
                    'reason': f'Column has {percentage:.1f}% missing values',
                    'risk': 'low'
                })
            elif percentage > 10:
                suggestions.append({
                    'type': 'handle_missing',
                    'target': column,
                    'options': ['fill_mean', 'fill_median', 'fill_mode', 'forward_fill'],
                    'reason': f'Column has {percentage:.1f}% missing values',
                    'risk': 'medium'
                })
    
    # Duplicate removal
    if quality_issues['duplicates']['count'] > 0:
        suggestions.append({
            'type': 'remove_duplicates',
            'target': 'all_columns',
            'reason': f'Found {quality_issues["duplicates"]["count"]} duplicate rows',
            'risk': 'low'
        })
    
    # Data type conversions
    for column, conversion in quality_issues['data_types']['suggested_conversions'].items():
        suggestions.append({
            'type': 'convert_type',
            'target': column,
            'from_type': conversion['from'],
            'to_type': conversion['to'],
            'confidence': conversion['confidence'],
            'reason': f'Column appears to be {conversion["to"]} but stored as {conversion["from"]}',
            'risk': 'medium'
        })
    
    # Text cleaning
    for column in quality_issues['inconsistencies']['columns_with_issues']:
        issues = quality_issues['inconsistencies']['details'][column]
        
        if 'whitespace' in issues:
            suggestions.append({
                'type': 'trim_whitespace',
                'target': column,
                'reason': 'Remove leading/trailing whitespace',
                'risk': 'low'
            })
        
        if 'mixed_case' in issues:
            suggestions.append({
                'type': 'standardize_case',
                'target': column,
                'options': ['lower', 'upper', 'title'],
                'reason': 'Standardize text case',
                'risk': 'low'
            })
    
    return suggestions

def apply_safe_cleaning(df: pd.DataFrame, suggestions: List[Dict]) -> tuple:
    """Apply only safe cleaning operations automatically"""
    df_cleaned = df.copy()
    applied_operations = []
    
    for suggestion in suggestions:
        if suggestion['risk'] == 'low':
            try:
                if suggestion['type'] == 'remove_duplicates':
                    initial_rows = len(df_cleaned)
                    df_cleaned = df_cleaned.drop_duplicates()
                    removed_rows = initial_rows - len(df_cleaned)
                    applied_operations.append({
                        'operation': 'Removed duplicate rows',
                        'details': f'Removed {removed_rows} duplicate rows',
                        'column': None
                    })
                
                elif suggestion['type'] == 'trim_whitespace':
                    column = suggestion['target']
                    if column in df_cleaned.columns:
                        df_cleaned[column] = df_cleaned[column].astype(str).str.strip()
                        applied_operations.append({
                            'operation': 'Trimmed whitespace',
                            'details': 'Removed leading and trailing spaces',
                            'column': column
                        })
                
                elif suggestion['type'] == 'remove_column' and suggestion.get('target'):
                    column = suggestion['target']
                    missing_pct = (df_cleaned[column].isnull().sum() / len(df_cleaned)) * 100
                    if missing_pct > 75:  # Only remove if >75% missing
                        df_cleaned = df_cleaned.drop(columns=[column])
                        applied_operations.append({
                            'operation': 'Removed column',
                            'details': f'Removed column with {missing_pct:.1f}% missing values',
                            'column': column
                        })
                
            except Exception as e:
                # Skip operations that fail
                continue
    
    return df_cleaned, applied_operations

def generate_improvement_summary(df_original: pd.DataFrame, df_cleaned: pd.DataFrame, operations: List[Dict]) -> Dict:
    """Generate a summary of improvements made"""
    return {
        'rows_before': len(df_original),
        'rows_after': len(df_cleaned),
        'columns_before': len(df_original.columns),
        'columns_after': len(df_cleaned.columns),
        'operations_applied': len(operations),
        'missing_values_before': int(df_original.isnull().sum().sum()),
        'missing_values_after': int(df_cleaned.isnull().sum().sum()),
        'data_quality_improvement': 'Improved' if len(operations) > 0 else 'No changes applied'
    }

@features_bp.route('/chart-builder', methods=['POST'])
def chart_builder():
    """
    Interactive Chart & Dashboard Builder
    Generate custom charts based on data and user specifications
    """
    try:
        data = request.get_json()
        
        if not data or 'dataset' not in data:
            return jsonify({'error': 'Dataset is required'}), 400
        
        dataset = data['dataset']
        chart_type = data.get('chart_type', 'auto')
        columns = data.get('columns', [])
        options = data.get('options', {})
        
        # Generate chart configurations
        chart_configs = generate_chart_configurations(dataset, chart_type, columns, options)
        
        # Generate chart data
        chart_data = prepare_chart_data(dataset, chart_configs)
        
        response = {
            'success': True,
            'chart_configs': chart_configs,
            'chart_data': chart_data,
            'recommendations': generate_chart_recommendations(dataset, columns),
            'export_options': ['png', 'pdf', 'svg', 'excel']
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Chart builder failed: {str(e)}'}), 500

def generate_chart_configurations(dataset: List[Dict], chart_type: str, columns: List[str], options: Dict) -> Dict:
    """Generate chart configurations based on data and preferences"""
    df = pd.DataFrame(dataset)
    
    if chart_type == 'auto':
        # Auto-detect best chart type
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        if len(numeric_cols) >= 2:
            chart_type = 'scatter'
        elif len(numeric_cols) == 1 and len(categorical_cols) >= 1:
            chart_type = 'bar'
        elif len(categorical_cols) >= 1:
            chart_type = 'pie'
        else:
            chart_type = 'line'
    
    config = {
        'type': chart_type,
        'title': options.get('title', f'{chart_type.title()} Chart'),
        'width': options.get('width', 800),
        'height': options.get('height', 400),
        'theme': options.get('theme', 'default'),
        'animation': options.get('animation', True),
        'responsive': True
    }
    
    # Add type-specific configurations
    if chart_type in ['bar', 'column']:
        config.update({
            'x_axis': columns[0] if columns else df.columns[0],
            'y_axis': columns[1] if len(columns) > 1 else df.select_dtypes(include=[np.number]).columns[0],
            'orientation': 'vertical' if chart_type == 'column' else 'horizontal'
        })
    elif chart_type == 'line':
        config.update({
            'x_axis': columns[0] if columns else df.columns[0],
            'y_axis': columns[1] if len(columns) > 1 else df.select_dtypes(include=[np.number]).columns[0],
            'smooth': options.get('smooth', False),
            'markers': options.get('markers', True)
        })
    elif chart_type == 'scatter':
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        config.update({
            'x_axis': columns[0] if columns else numeric_cols[0],
            'y_axis': columns[1] if len(columns) > 1 else numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0],
            'size_by': columns[2] if len(columns) > 2 else None,
            'color_by': columns[3] if len(columns) > 3 else None
        })
    elif chart_type == 'pie':
        config.update({
            'label_column': columns[0] if columns else df.columns[0],
            'value_column': columns[1] if len(columns) > 1 else df.select_dtypes(include=[np.number]).columns[0],
            'show_percentages': options.get('show_percentages', True)
        })
    
    return config

def prepare_chart_data(dataset: List[Dict], config: Dict) -> Dict:
    """Prepare data in the format required for chart rendering"""
    df = pd.DataFrame(dataset)
    chart_type = config['type']
    
    if chart_type in ['bar', 'column', 'line']:
        x_col = config['x_axis']
        y_col = config['y_axis']
        
        # Group and aggregate if necessary
        if df[x_col].dtype == 'object':
            grouped = df.groupby(x_col)[y_col].mean().reset_index()
            data = [{'x': row[x_col], 'y': row[y_col]} for _, row in grouped.iterrows()]
        else:
            data = [{'x': row[x_col], 'y': row[y_col]} for _, row in df.iterrows()]
    
    elif chart_type == 'scatter':
        x_col = config['x_axis']
        y_col = config['y_axis']
        data = []
        
        for _, row in df.iterrows():
            point = {'x': row[x_col], 'y': row[y_col]}
            if config.get('size_by'):
                point['size'] = row[config['size_by']]
            if config.get('color_by'):
                point['category'] = row[config['color_by']]
            data.append(point)
    
    elif chart_type == 'pie':
        label_col = config['label_column']
        value_col = config['value_column']
        
        # Group and sum values
        grouped = df.groupby(label_col)[value_col].sum().reset_index()
        data = [{'label': row[label_col], 'value': row[value_col]} for _, row in grouped.iterrows()]
    
    else:
        # Default format
        data = df.to_dict('records')
    
    return {
        'data': data,
        'metadata': {
            'total_points': len(data),
            'x_range': [float(df[config.get('x_axis', df.columns[0])].min()), 
                       float(df[config.get('x_axis', df.columns[0])].max())] if config.get('x_axis') else None,
            'y_range': [float(df[config.get('y_axis', df.columns[1])].min()), 
                       float(df[config.get('y_axis', df.columns[1])].max())] if config.get('y_axis') else None
        }
    }

def generate_chart_recommendations(dataset: List[Dict], columns: List[str]) -> List[Dict]:
    """Generate chart type recommendations based on data characteristics"""
    df = pd.DataFrame(dataset)
    recommendations = []
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
    
    # Time series recommendation
    if datetime_cols and numeric_cols:
        recommendations.append({
            'type': 'line',
            'reason': 'Time series data detected - line chart shows trends over time',
            'confidence': 95,
            'suggested_columns': [datetime_cols[0], numeric_cols[0]]
        })
    
    # Correlation analysis
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr()
        high_corr_pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr = abs(corr_matrix.iloc[i, j])
                if corr > 0.5:
                    high_corr_pairs.append((numeric_cols[i], numeric_cols[j], corr))
        
        if high_corr_pairs:
            best_pair = max(high_corr_pairs, key=lambda x: x[2])
            recommendations.append({
                'type': 'scatter',
                'reason': f'Strong correlation ({best_pair[2]:.2f}) between {best_pair[0]} and {best_pair[1]}',
                'confidence': 85,
                'suggested_columns': [best_pair[0], best_pair[1]]
            })
    
    # Categorical distribution
    if categorical_cols:
        for col in categorical_cols:
            unique_values = df[col].nunique()
            if unique_values <= 10:
                recommendations.append({
                    'type': 'pie',
                    'reason': f'Good categorical distribution in {col} ({unique_values} categories)',
                    'confidence': 80,
                    'suggested_columns': [col, numeric_cols[0] if numeric_cols else None]
                })
    
    # Comparison recommendation
    if categorical_cols and numeric_cols:
        recommendations.append({
            'type': 'bar',
            'reason': 'Compare numeric values across categories',
            'confidence': 75,
            'suggested_columns': [categorical_cols[0], numeric_cols[0]]
        })
    
    return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)[:5]

@features_bp.route('/templates', methods=['GET', 'POST'])
def templates():
    """
    Template & Snippet Library
    Manage analysis templates and reusable components
    """
    if request.method == 'GET':
        # Return available templates
        template_library = get_template_library()
        return jsonify({
            'success': True,
            'templates': template_library,
            'categories': get_template_categories()
        })
    
    elif request.method == 'POST':
        # Create or apply a template
        try:
            data = request.get_json()
            action = data.get('action', 'apply')
            
            if action == 'apply':
                template_id = data.get('template_id')
                user_data = data.get('data', [])
                
                if not template_id:
                    return jsonify({'error': 'Template ID is required'}), 400
                
                result = apply_template(template_id, user_data)
                return jsonify(result)
            
            elif action == 'create':
                # Create a new custom template
                template_data = data.get('template')
                if not template_data:
                    return jsonify({'error': 'Template data is required'}), 400
                
                result = create_custom_template(template_data)
                return jsonify(result)
            
            else:
                return jsonify({'error': 'Invalid action'}), 400
                
        except Exception as e:
            return jsonify({'error': f'Template operation failed: {str(e)}'}), 500

def get_template_library() -> List[Dict]:
    """Return predefined analysis templates"""
    return [
        {
            'id': 'sales_analysis',
            'name': 'Sales Performance Analysis',
            'description': 'Comprehensive sales data analysis with trends, forecasting, and KPIs',
            'category': 'Business',
            'required_columns': ['date', 'sales', 'product'],
            'optional_columns': ['region', 'salesperson', 'customer'],
            'outputs': ['trend_analysis', 'forecasting', 'top_products', 'regional_performance'],
            'chart_types': ['line', 'bar', 'pie'],
            'preview_url': '/templates/sales_analysis/preview'
        },
        {
            'id': 'financial_dashboard',
            'name': 'Financial Dashboard',
            'description': 'Financial metrics, ratios, and performance indicators',
            'category': 'Finance',
            'required_columns': ['date', 'revenue', 'expenses'],
            'optional_columns': ['profit', 'assets', 'liabilities'],
            'outputs': ['profit_margin', 'growth_rate', 'financial_ratios', 'cash_flow'],
            'chart_types': ['line', 'waterfall', 'gauge'],
            'preview_url': '/templates/financial_dashboard/preview'
        },
        {
            'id': 'customer_analysis',
            'name': 'Customer Analysis',
            'description': 'Customer segmentation, lifetime value, and behavior analysis',
            'category': 'Marketing',
            'required_columns': ['customer_id', 'purchase_date', 'amount'],
            'optional_columns': ['product', 'channel', 'demographics'],
            'outputs': ['customer_segments', 'clv', 'churn_prediction', 'purchase_patterns'],
            'chart_types': ['scatter', 'heatmap', 'cohort'],
            'preview_url': '/templates/customer_analysis/preview'
        },
        {
            'id': 'inventory_optimization',
            'name': 'Inventory Optimization',
            'description': 'Inventory levels, turnover rates, and reorder point analysis',
            'category': 'Operations',
            'required_columns': ['product', 'quantity', 'date'],
            'optional_columns': ['cost', 'supplier', 'warehouse'],
            'outputs': ['turnover_rate', 'abc_analysis', 'reorder_points', 'demand_forecast'],
            'chart_types': ['bar', 'line', 'bubble'],
            'preview_url': '/templates/inventory_optimization/preview'
        },
        {
            'id': 'hr_analytics',
            'name': 'HR Analytics',
            'description': 'Employee performance, retention, and workforce analytics',
            'category': 'Human Resources',
            'required_columns': ['employee_id', 'hire_date', 'performance_score'],
            'optional_columns': ['department', 'salary', 'manager'],
            'outputs': ['retention_rate', 'performance_trends', 'compensation_analysis', 'diversity_metrics'],
            'chart_types': ['bar', 'line', 'donut'],
            'preview_url': '/templates/hr_analytics/preview'
        },
        {
            'id': 'web_analytics',
            'name': 'Web Analytics Dashboard',
            'description': 'Website traffic, conversion rates, and user behavior analysis',
            'category': 'Digital Marketing',
            'required_columns': ['date', 'sessions', 'pageviews'],
            'optional_columns': ['source', 'conversions', 'bounce_rate'],
            'outputs': ['traffic_trends', 'conversion_funnel', 'source_analysis', 'user_journey'],
            'chart_types': ['line', 'funnel', 'sankey'],
            'preview_url': '/templates/web_analytics/preview'
        }
    ]

def get_template_categories() -> List[Dict]:
    """Return template categories with counts"""
    templates = get_template_library()
    categories = {}
    
    for template in templates:
        category = template['category']
        if category not in categories:
            categories[category] = {
                'name': category,
                'count': 0,
                'description': get_category_description(category)
            }
        categories[category]['count'] += 1
    
    return list(categories.values())

def get_category_description(category: str) -> str:
    """Get description for template categories"""
    descriptions = {
        'Business': 'General business analysis and KPI tracking templates',
        'Finance': 'Financial analysis, budgeting, and accounting templates',
        'Marketing': 'Marketing analytics, customer analysis, and campaign tracking',
        'Operations': 'Operational efficiency, supply chain, and process optimization',
        'Human Resources': 'Employee analytics, performance tracking, and workforce planning',
        'Digital Marketing': 'Web analytics, SEO, and digital campaign analysis'
    }
    return descriptions.get(category, 'Custom analysis templates')

def apply_template(template_id: str, user_data: List[Dict]) -> Dict:
    """Apply a template to user data"""
    templates = {t['id']: t for t in get_template_library()}
    
    if template_id not in templates:
        return {'error': 'Template not found', 'success': False}
    
    template = templates[template_id]
    df = pd.DataFrame(user_data)
    
    # Validate required columns
    missing_columns = []
    for col in template['required_columns']:
        if col not in df.columns:
            # Try to find similar column names
            similar_cols = [c for c in df.columns if col.lower() in c.lower() or c.lower() in col.lower()]
            if not similar_cols:
                missing_columns.append(col)
    
    if missing_columns:
        return {
            'error': f'Missing required columns: {", ".join(missing_columns)}',
            'success': False,
            'suggestions': suggest_column_mappings(df.columns.tolist(), template['required_columns'])
        }
    
    # Generate analysis based on template
    analysis_results = generate_template_analysis(template, df)
    
    return {
        'success': True,
        'template_applied': template['name'],
        'analysis_results': analysis_results,
        'generated_charts': generate_template_charts(template, df),
        'recommendations': generate_template_recommendations(template, df)
    }

def suggest_column_mappings(user_columns: List[str], required_columns: List[str]) -> Dict:
    """Suggest column mappings for missing required columns"""
    suggestions = {}
    
    for req_col in required_columns:
        best_matches = []
        for user_col in user_columns:
            # Simple similarity scoring
            similarity = calculate_column_similarity(req_col, user_col)
            if similarity > 0.5:
                best_matches.append({'column': user_col, 'similarity': similarity})
        
        if best_matches:
            suggestions[req_col] = sorted(best_matches, key=lambda x: x['similarity'], reverse=True)[:3]
    
    return suggestions

def calculate_column_similarity(col1: str, col2: str) -> float:
    """Calculate similarity between column names"""
    col1_lower = col1.lower()
    col2_lower = col2.lower()
    
    # Exact match
    if col1_lower == col2_lower:
        return 1.0
    
    # Contains match
    if col1_lower in col2_lower or col2_lower in col1_lower:
        return 0.8
    
    # Common keywords
    keywords_map = {
        'date': ['date', 'time', 'created', 'updated', 'timestamp'],
        'sales': ['sales', 'revenue', 'amount', 'total', 'value'],
        'product': ['product', 'item', 'sku', 'goods'],
        'customer': ['customer', 'client', 'user', 'buyer'],
        'quantity': ['quantity', 'qty', 'amount', 'count', 'units']
    }
    
    for key, synonyms in keywords_map.items():
        if col1_lower == key or col1_lower in synonyms:
            if col2_lower in synonyms:
                return 0.7
    
    return 0.0

def generate_template_analysis(template: Dict, df: pd.DataFrame) -> Dict:
    """Generate analysis based on template specifications"""
    analysis = {}
    
    if template['id'] == 'sales_analysis':
        analysis = {
            'total_sales': float(df['sales'].sum() if 'sales' in df.columns else 0),
            'average_sale': float(df['sales'].mean() if 'sales' in df.columns else 0),
            'sales_trend': 'increasing' if len(df) > 1 and df['sales'].iloc[-1] > df['sales'].iloc[0] else 'stable',
            'top_products': df.groupby('product')['sales'].sum().nlargest(5).to_dict() if 'product' in df.columns else {},
            'sales_by_period': df.groupby(pd.to_datetime(df['date']).dt.to_period('M'))['sales'].sum().to_dict() if 'date' in df.columns else {}
        }
    
    elif template['id'] == 'customer_analysis':
        analysis = {
            'total_customers': int(df['customer_id'].nunique() if 'customer_id' in df.columns else 0),
            'total_transactions': len(df),
            'average_order_value': float(df['amount'].mean() if 'amount' in df.columns else 0),
            'customer_lifetime_value': calculate_clv(df) if 'customer_id' in df.columns and 'amount' in df.columns else 0,
            'repeat_customer_rate': calculate_repeat_rate(df) if 'customer_id' in df.columns else 0
        }
    
    # Add more template-specific analyses...
    
    return analysis

def calculate_clv(df: pd.DataFrame) -> float:
    """Calculate Customer Lifetime Value"""
    if 'customer_id' not in df.columns or 'amount' not in df.columns:
        return 0.0
    
    customer_totals = df.groupby('customer_id')['amount'].sum()
    return float(customer_totals.mean())

def calculate_repeat_rate(df: pd.DataFrame) -> float:
    """Calculate repeat customer rate"""
    if 'customer_id' not in df.columns:
        return 0.0
    
    customer_counts = df['customer_id'].value_counts()
    repeat_customers = (customer_counts > 1).sum()
    total_customers = len(customer_counts)
    
    return (repeat_customers / total_customers * 100) if total_customers > 0 else 0.0

def generate_template_charts(template: Dict, df: pd.DataFrame) -> List[Dict]:
    """Generate chart configurations for template"""
    charts = []
    
    for chart_type in template['chart_types']:
        if chart_type == 'line' and 'date' in df.columns:
            charts.append({
                'type': 'line',
                'title': f'{template["name"]} - Trend Over Time',
                'x_axis': 'date',
                'y_axis': template['required_columns'][1] if len(template['required_columns']) > 1 else df.select_dtypes(include=[np.number]).columns[0]
            })
        
        elif chart_type == 'bar' and len(template['required_columns']) >= 2:
            charts.append({
                'type': 'bar',
                'title': f'{template["name"]} - Category Breakdown',
                'x_axis': template['required_columns'][2] if len(template['required_columns']) > 2 else df.select_dtypes(include=['object']).columns[0],
                'y_axis': template['required_columns'][1]
            })
    
    return charts

def generate_template_recommendations(template: Dict, df: pd.DataFrame) -> List[str]:
    """Generate recommendations based on template analysis"""
    recommendations = []
    
    if template['id'] == 'sales_analysis':
        if 'sales' in df.columns:
            if df['sales'].std() > df['sales'].mean():
                recommendations.append("High sales volatility detected - consider analyzing seasonal patterns")
            
            if len(df) > 30:
                recommendations.append("Sufficient data available for trend forecasting")
    
    elif template['id'] == 'customer_analysis':
        if 'customer_id' in df.columns:
            repeat_rate = calculate_repeat_rate(df)
            if repeat_rate < 20:
                recommendations.append("Low repeat customer rate - focus on customer retention strategies")
            elif repeat_rate > 50:
                recommendations.append("Strong customer loyalty - consider expanding customer lifetime value")
    
    return recommendations

@features_bp.route('/chart-recommendations', methods=['POST'])
def get_chart_recommendations():
    """Get AI-powered chart recommendations for dataset"""
    try:
        data = request.get_json()
        dataset = data.get('dataset', [])
        columns = data.get('columns', [])
        
        if not dataset:
            return jsonify({'error': 'Dataset is required'}), 400
        
        recommendations = generate_ai_chart_recommendations(dataset, columns)
        insights = generate_data_insights(dataset)
        alternatives = generate_alternative_charts(dataset, columns)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'insights': insights,
            'alternatives': alternatives
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get recommendations: {str(e)}'}), 500

def generate_ai_chart_recommendations(dataset: List[Dict], columns: List[str]) -> List[Dict]:
    """Generate AI-powered chart recommendations with detailed analysis"""
    df = pd.DataFrame(dataset)
    recommendations = []
    
    # Analyze data characteristics
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    date_cols = []
    
    # Detect date columns
    for col in df.columns:
        try:
            pd.to_datetime(df[col].dropna().head(), errors='raise')
            date_cols.append(col)
        except:
            pass
    
    data_patterns = {
        'row_count': len(df),
        'numeric_cols': len(numeric_cols),
        'categorical_cols': len(categorical_cols),
        'date_cols': len(date_cols),
        'has_time_series': len(date_cols) > 0,
        'has_correlation_potential': len(numeric_cols) >= 2,
        'has_categories': len(categorical_cols) > 0
    }
    
    # Time series recommendations
    if data_patterns['has_time_series'] and len(numeric_cols) >= 1:
        recommendations.append({
            'chart_type': 'line',
            'title': 'Time Series Analysis',
            'reasoning': 'Your data contains date/time information perfect for trend analysis',
            'confidence': 95,
            'columns': {'x': date_cols[0], 'y': numeric_cols[0]},
            'use_cases': ['Trend analysis', 'Temporal patterns', 'Forecasting'],
            'subtitle': f'Track {numeric_cols[0]} over time'
        })
        
        if len(numeric_cols) >= 2:
            recommendations.append({
                'chart_type': 'area',
                'title': 'Cumulative Time Series',
                'reasoning': 'Area charts emphasize volume and cumulative changes over time',
                'confidence': 85,
                'columns': {'x': date_cols[0], 'y': numeric_cols[0], 'series': numeric_cols[1] if len(numeric_cols) > 1 else ''},
                'use_cases': ['Volume tracking', 'Cumulative metrics', 'Multiple series comparison'],
                'subtitle': f'Cumulative view of {numeric_cols[0]} and {numeric_cols[1] if len(numeric_cols) > 1 else ""}'
            })
    
    # Correlation analysis recommendations
    if data_patterns['has_correlation_potential']:
        # Calculate correlation strength
        corr_matrix = df[numeric_cols].corr()
        max_corr = 0
        best_pair = (numeric_cols[0], numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0])
        
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr_val = abs(corr_matrix.iloc[i, j])
                if corr_val > max_corr:
                    max_corr = corr_val
                    best_pair = (numeric_cols[i], numeric_cols[j])
        
        confidence = min(95, 60 + (max_corr * 35))  # Scale correlation to confidence
        
        recommendations.append({
            'chart_type': 'scatter',
            'title': 'Correlation Exploration',
            'reasoning': f'Scatter plot reveals relationships between {best_pair[0]} and {best_pair[1]} (correlation: {max_corr:.2f})',
            'confidence': int(confidence),
            'columns': {'x': best_pair[0], 'y': best_pair[1], 'size': numeric_cols[2] if len(numeric_cols) > 2 else ''},
            'use_cases': ['Relationship analysis', 'Outlier detection', 'Pattern discovery'],
            'subtitle': f'Explore relationship between {best_pair[0]} and {best_pair[1]}'
        })
    
    # Category comparison recommendations
    if data_patterns['has_categories'] and len(numeric_cols) >= 1:
        # Check cardinality of categorical columns
        best_cat_col = categorical_cols[0]
        min_cardinality = df[categorical_cols[0]].nunique()
        
        for col in categorical_cols:
            cardinality = df[col].nunique()
            if 2 <= cardinality <= 12 and cardinality < min_cardinality:  # Ideal range for visualization
                best_cat_col = col
                min_cardinality = cardinality
        
        if min_cardinality <= 12:  # Suitable for bar chart
            recommendations.append({
                'chart_type': 'bar',
                'title': 'Category Comparison',
                'reasoning': f'Bar chart effectively compares {numeric_cols[0]} across {min_cardinality} categories in {best_cat_col}',
                'confidence': 90,
                'columns': {'x': best_cat_col, 'y': numeric_cols[0]},
                'use_cases': ['Performance comparison', 'Rankings', 'Category analysis'],
                'subtitle': f'{numeric_cols[0]} by {best_cat_col}'
            })
        
        if min_cardinality <= 8:  # Suitable for pie chart
            recommendations.append({
                'chart_type': 'pie',
                'title': 'Proportion Analysis',
                'reasoning': f'Pie chart shows how {numeric_cols[0]} is distributed across {best_cat_col} categories',
                'confidence': 80,
                'columns': {'label': best_cat_col, 'value': numeric_cols[0]},
                'use_cases': ['Market share', 'Budget breakdown', 'Part-to-whole relationships'],
                'subtitle': f'Distribution of {numeric_cols[0]} by {best_cat_col}'
            })
    
    # Multi-dimensional analysis
    if len(numeric_cols) >= 3:
        recommendations.append({
            'chart_type': 'scatter',
            'title': 'Multi-Dimensional Analysis',
            'reasoning': 'Use size and color encoding to explore relationships between 3+ variables simultaneously',
            'confidence': 75,
            'columns': {
                'x': numeric_cols[0], 
                'y': numeric_cols[1], 
                'size': numeric_cols[2],
                'color': categorical_cols[0] if categorical_cols else numeric_cols[2]
            },
            'use_cases': ['Complex pattern analysis', 'Segmentation', 'Multi-variate exploration'],
            'subtitle': f'Explore {numeric_cols[0]}, {numeric_cols[1]}, and {numeric_cols[2]}'
        })
    
    # Sort by confidence and return top recommendations
    recommendations.sort(key=lambda x: x['confidence'], reverse=True)
    return recommendations[:6]  # Return top 6 recommendations

def generate_data_insights(dataset: List[Dict]) -> str:
    """Generate AI insights about the dataset"""
    df = pd.DataFrame(dataset)
    
    insights = []
    
    # Data size insights
    if len(df) > 10000:
        insights.append(f"Large dataset with {len(df):,} rows - consider aggregation for better performance")
    elif len(df) < 50:
        insights.append(f"Small dataset with {len(df)} rows - statistical patterns may be limited")
    
    # Data quality insights
    missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
    if missing_pct > 10:
        insights.append(f"Dataset has {missing_pct:.1f}% missing values - consider data cleaning")
    
    # Column insights
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) >= 3:
        insights.append("Multiple numeric variables detected - excellent for correlation and multi-dimensional analysis")
    
    # Cardinality insights
    high_cardinality_cols = [col for col in df.columns if df[col].nunique() > len(df) * 0.8]
    if high_cardinality_cols:
        insights.append(f"High cardinality columns detected ({', '.join(high_cardinality_cols[:2])}) - may need grouping for visualization")
    
    return " | ".join(insights) if insights else "Clean, well-structured dataset perfect for visualization"

def generate_alternative_charts(dataset: List[Dict], columns: List[str]) -> List[Dict]:
    """Generate alternative chart suggestions"""
    alternatives = [
        {
            'name': 'Interactive Dashboard',
            'description': 'Combine multiple chart types in a single dashboard',
            'complexity': 'Advanced',
            'time_estimate': '15-20 minutes'
        },
        {
            'name': 'Animated Charts',
            'description': 'Show data changes over time with animations',
            'complexity': 'Intermediate',
            'time_estimate': '10-15 minutes'
        },
        {
            'name': 'Statistical Overlays',
            'description': 'Add trend lines, confidence intervals, and statistical markers',
            'complexity': 'Advanced',
            'time_estimate': '8-12 minutes'
        }
    ]
    return alternatives

def create_custom_template(template_data: Dict) -> Dict:
    """Create a new custom template"""
    # Validate template data
    required_fields = ['name', 'description', 'required_columns']
    missing_fields = [field for field in required_fields if field not in template_data]
    
    if missing_fields:
        return {
            'error': f'Missing required fields: {", ".join(missing_fields)}',
            'success': False
        }
    
    # Generate template ID
    template_id = template_data['name'].lower().replace(' ', '_').replace('-', '_')
    
    # Add default values
    template = {
        'id': template_id,
        'name': template_data['name'],
        'description': template_data['description'],
        'category': template_data.get('category', 'Custom'),
        'required_columns': template_data['required_columns'],
        'optional_columns': template_data.get('optional_columns', []),
        'outputs': template_data.get('outputs', []),
        'chart_types': template_data.get('chart_types', ['bar', 'line']),
        'custom': True,
        'created_at': datetime.now().isoformat()
    }
    
    # In a real application, this would be saved to a database
    # For now, return success with the template structure
    
    return {
        'success': True,
        'template': template,
        'message': 'Custom template created successfully'
    }

@features_bp.route('/macro-generation', methods=['POST'])
def macro_generation():
    """
    Macro / Script Generation
    Generate VBA macros, Python scripts, and Google Apps Script code
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        task_description = data.get('description', '')
        script_type = data.get('type', 'vba')  # vba, python, gas (Google Apps Script)
        data_structure = data.get('data_structure', {})
        complexity = data.get('complexity', 'simple')
        
        if not task_description:
            return jsonify({'error': 'Task description is required'}), 400
        
        # Generate script based on type
        if script_type == 'vba':
            result = generate_vba_macro(task_description, data_structure, complexity)
        elif script_type == 'python':
            result = generate_python_script(task_description, data_structure, complexity)
        elif script_type == 'gas':
            result = generate_gas_script(task_description, data_structure, complexity)
        else:
            return jsonify({'error': 'Invalid script type. Use: vba, python, or gas'}), 400
        
        return jsonify({
            'success': True,
            'script_type': script_type,
            'generated_code': result['code'],
            'explanation': result['explanation'],
            'installation_instructions': result['instructions'],
            'complexity_level': complexity,
            'estimated_execution_time': result.get('execution_time', 'varies')
        })
        
    except Exception as e:
        return jsonify({'error': f'Macro generation failed: {str(e)}'}), 500

def generate_vba_macro(description: str, data_structure: Dict, complexity: str) -> Dict:
    """Generate VBA macro code"""
    
    # Analyze the task description to determine the type of macro needed
    task_type = classify_task_type(description)
    
    if task_type == 'data_processing':
        code = generate_vba_data_processing(description, data_structure)
    elif task_type == 'formatting':
        code = generate_vba_formatting(description)
    elif task_type == 'calculation':
        code = generate_vba_calculation(description, data_structure)
    elif task_type == 'automation':
        code = generate_vba_automation(description)
    else:
        code = generate_vba_generic(description)
    
    return {
        'code': code,
        'explanation': get_vba_explanation(task_type, description),
        'instructions': get_vba_instructions(),
        'execution_time': 'seconds'
    }

def generate_vba_data_processing(description: str, data_structure: Dict) -> str:
    """Generate VBA code for data processing tasks"""
    return '''Sub ProcessData()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    
    ' Set the worksheet
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Start processing from row 2 (assuming headers in row 1)
    For i = 2 To lastRow
        ' Example data processing logic
        If ws.Cells(i, 1).Value <> "" Then
            ' Process each row based on your requirements
            ws.Cells(i, 3).Value = ws.Cells(i, 1).Value * ws.Cells(i, 2).Value
        End If
    Next i
    
    MsgBox "Data processing completed for " & (lastRow - 1) & " rows!"
End Sub'''

def generate_vba_formatting(description: str) -> str:
    """Generate VBA code for formatting tasks"""
    return '''Sub FormatData()
    Dim ws As Worksheet
    Dim dataRange As Range
    
    Set ws = ActiveSheet
    Set dataRange = ws.UsedRange
    
    ' Apply formatting
    With dataRange
        .Font.Name = "Arial"
        .Font.Size = 10
        .Borders.LineStyle = xlContinuous
        .Interior.ColorIndex = xlNone
    End With
    
    ' Format headers
    With ws.Rows(1)
        .Font.Bold = True
        .Interior.ColorIndex = 15
        .Font.ColorIndex = 1
    End With
    
    ' Auto-fit columns
    dataRange.Columns.AutoFit
    
    MsgBox "Formatting applied successfully!"
End Sub'''

def generate_vba_calculation(description: str, data_structure: Dict) -> str:
    """Generate VBA code for calculation tasks"""
    return '''Sub PerformCalculations()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim total As Double
    Dim average As Double
    Dim i As Long
    
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Calculate totals and averages
    total = 0
    For i = 2 To lastRow
        If IsNumeric(ws.Cells(i, 2).Value) Then
            total = total + ws.Cells(i, 2).Value
        End If
    Next i
    
    average = total / (lastRow - 1)
    
    ' Output results
    ws.Cells(lastRow + 2, 1).Value = "Total:"
    ws.Cells(lastRow + 2, 2).Value = total
    ws.Cells(lastRow + 3, 1).Value = "Average:"
    ws.Cells(lastRow + 3, 2).Value = average
    
    MsgBox "Calculations completed! Total: " & total & ", Average: " & Round(average, 2)
End Sub'''

def generate_vba_automation(description: str) -> str:
    """Generate VBA code for automation tasks"""
    return '''Sub AutomateTask()
    Dim ws As Worksheet
    Dim wb As Workbook
    
    Set wb = ThisWorkbook
    
    ' Loop through all worksheets
    For Each ws In wb.Worksheets
        ' Perform automation task on each sheet
        ws.Activate
        
        ' Example: Auto-save with timestamp
        If ws.Name <> "Summary" Then
            Call ProcessWorksheet(ws)
        End If
    Next ws
    
    ' Return to first sheet
    wb.Worksheets(1).Activate
    
    MsgBox "Automation completed for all worksheets!"
End Sub

Sub ProcessWorksheet(ws As Worksheet)
    ' Add your specific processing logic here
    ws.Cells(1, 1).Value = "Processed on: " & Now()
End Sub'''

def generate_vba_generic(description: str) -> str:
    """Generate generic VBA code template"""
    return '''Sub CustomMacro()
    ' Generated macro based on: ''' + description + '''
    
    Dim ws As Worksheet
    Dim lastRow As Long
    
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Add your custom logic here
    ' This is a template - modify according to your needs
    
    MsgBox "Custom macro executed successfully!"
End Sub'''

def generate_python_script(description: str, data_structure: Dict, complexity: str) -> Dict:
    """Generate Python script for data processing"""
    
    task_type = classify_task_type(description)
    
    if task_type == 'data_processing':
        code = generate_python_data_processing(description, data_structure)
    elif task_type == 'analysis':
        code = generate_python_analysis(description, data_structure)
    elif task_type == 'visualization':
        code = generate_python_visualization(description)
    else:
        code = generate_python_generic(description)
    
    return {
        'code': code,
        'explanation': get_python_explanation(task_type, description),
        'instructions': get_python_instructions(),
        'execution_time': 'seconds to minutes'
    }

def generate_python_data_processing(description: str, data_structure: Dict) -> str:
    """Generate Python code for data processing"""
    return '''import pandas as pd
import numpy as np
from datetime import datetime

def process_data(file_path):
    """
    Process data based on: ''' + description + '''
    """
    # Load data
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format")
    
    print(f"Loaded {len(df)} rows and {len(df.columns)} columns")
    
    # Data processing logic
    df_processed = df.copy()
    
    # Remove duplicates
    df_processed = df_processed.drop_duplicates()
    
    # Handle missing values
    numeric_columns = df_processed.select_dtypes(include=[np.number]).columns
    df_processed[numeric_columns] = df_processed[numeric_columns].fillna(df_processed[numeric_columns].mean())
    
    # Add processed timestamp
    df_processed['processed_at'] = datetime.now()
    
    # Save processed data
    output_file = file_path.replace('.', '_processed.')
    df_processed.to_csv(output_file, index=False)
    
    print(f"Processing completed. Output saved to: {output_file}")
    return df_processed

# Example usage
if __name__ == "__main__":
    # Replace with your file path
    file_path = "your_data_file.xlsx"
    processed_data = process_data(file_path)
    print(processed_data.head())'''

def generate_python_analysis(description: str, data_structure: Dict) -> str:
    """Generate Python code for data analysis"""
    return '''import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

def analyze_data(file_path):
    """
    Analyze data based on: ''' + description + '''
    """
    # Load data
    df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
    
    print("Data Analysis Report")
    print("=" * 50)
    
    # Basic statistics
    print("\\nBasic Statistics:")
    print(df.describe())
    
    # Missing values
    print("\\nMissing Values:")
    print(df.isnull().sum())
    
    # Correlation analysis
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 1:
        print("\\nCorrelation Matrix:")
        correlation_matrix = df[numeric_cols].corr()
        print(correlation_matrix)
        
        # Plot correlation heatmap
        plt.figure(figsize=(10, 8))
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0)
        plt.title('Correlation Heatmap')
        plt.show()
    
    # Distribution plots
    for col in numeric_cols[:4]:  # Plot first 4 numeric columns
        plt.figure(figsize=(10, 6))
        plt.subplot(1, 2, 1)
        plt.hist(df[col].dropna(), bins=30, alpha=0.7)
        plt.title(f'Distribution of {col}')
        plt.xlabel(col)
        plt.ylabel('Frequency')
        
        plt.subplot(1, 2, 2)
        plt.boxplot(df[col].dropna())
        plt.title(f'Boxplot of {col}')
        plt.ylabel(col)
        
        plt.tight_layout()
        plt.show()
    
    return df

# Example usage
if __name__ == "__main__":
    file_path = "your_data_file.xlsx"
    data = analyze_data(file_path)'''

def generate_python_visualization(description: str) -> str:
    """Generate Python code for data visualization"""
    return '''import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go

def create_visualizations(file_path):
    """
    Create visualizations based on: ''' + description + '''
    """
    # Load data
    df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_excel(file_path)
    
    # Set style
    plt.style.use('seaborn-v0_8')
    sns.set_palette("husl")
    
    # Get numeric and categorical columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    
    # Create multiple visualizations
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # Plot 1: Line chart (if we have time-like data)
    if len(numeric_cols) >= 2:
        axes[0, 0].plot(df[numeric_cols[0]], df[numeric_cols[1]], marker='o')
        axes[0, 0].set_title(f'{numeric_cols[1]} vs {numeric_cols[0]}')
        axes[0, 0].set_xlabel(numeric_cols[0])
        axes[0, 0].set_ylabel(numeric_cols[1])
    
    # Plot 2: Bar chart
    if categorical_cols and numeric_cols:
        category_means = df.groupby(categorical_cols[0])[numeric_cols[0]].mean()
        axes[0, 1].bar(category_means.index, category_means.values)
        axes[0, 1].set_title(f'Average {numeric_cols[0]} by {categorical_cols[0]}')
        axes[0, 1].tick_params(axis='x', rotation=45)
    
    # Plot 3: Scatter plot
    if len(numeric_cols) >= 2:
        axes[1, 0].scatter(df[numeric_cols[0]], df[numeric_cols[1]], alpha=0.6)
        axes[1, 0].set_title(f'Scatter: {numeric_cols[0]} vs {numeric_cols[1]}')
        axes[1, 0].set_xlabel(numeric_cols[0])
        axes[1, 0].set_ylabel(numeric_cols[1])
    
    # Plot 4: Distribution
    if numeric_cols:
        axes[1, 1].hist(df[numeric_cols[0]].dropna(), bins=30, alpha=0.7)
        axes[1, 1].set_title(f'Distribution of {numeric_cols[0]}')
        axes[1, 1].set_xlabel(numeric_cols[0])
        axes[1, 1].set_ylabel('Frequency')
    
    plt.tight_layout()
    plt.show()
    
    # Interactive plot with Plotly
    if len(numeric_cols) >= 2:
        fig_interactive = px.scatter(df, x=numeric_cols[0], y=numeric_cols[1], 
                                   title=f'Interactive Scatter: {numeric_cols[0]} vs {numeric_cols[1]}')
        fig_interactive.show()

# Example usage
if __name__ == "__main__":
    file_path = "your_data_file.xlsx"
    create_visualizations(file_path)'''

def generate_python_generic(description: str) -> str:
    """Generate generic Python script template"""
    return '''import pandas as pd
import numpy as np

def main():
    """
    Custom script based on: ''' + description + '''
    """
    print("Starting custom data processing...")
    
    # Add your custom logic here
    # This is a template - modify according to your needs
    
    print("Script execution completed!")

if __name__ == "__main__":
    main()'''

def generate_gas_script(description: str, data_structure: Dict, complexity: str) -> Dict:
    """Generate Google Apps Script code"""
    
    task_type = classify_task_type(description)
    
    if task_type == 'data_processing':
        code = generate_gas_data_processing(description)
    elif task_type == 'automation':
        code = generate_gas_automation(description)
    else:
        code = generate_gas_generic(description)
    
    return {
        'code': code,
        'explanation': get_gas_explanation(task_type, description),
        'instructions': get_gas_instructions(),
        'execution_time': 'seconds'
    }

def generate_gas_data_processing(description: str) -> str:
    """Generate Google Apps Script for data processing"""
    return '''function processSpreadsheetData() {
  // Generated script based on: ''' + description + '''
  
  var sheet = SpreadsheetApp.getActiveSheet();
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // Process headers (first row)
  var headers = values[0];
  console.log("Processing " + (values.length - 1) + " rows of data");
  
  // Process each data row
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    
    // Example processing logic - modify as needed
    if (row[0] !== "") {
      // Process data in column A
      var processedValue = row[0].toString().toUpperCase();
      sheet.getRange(i + 1, 4).setValue(processedValue); // Output to column D
    }
    
    // Add timestamp
    sheet.getRange(i + 1, 5).setValue(new Date());
  }
  
  // Show completion message
  SpreadsheetApp.getUi().alert("Data processing completed for " + (values.length - 1) + " rows!");
}

function onOpen() {
  // Create custom menu
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
    .addItem('Process Data', 'processSpreadsheetData')
    .addToUi();
}'''

def generate_gas_automation(description: str) -> str:
    """Generate Google Apps Script for automation"""
    return '''function automateSpreadsheetTasks() {
  // Generated automation script based on: ''' + description + '''
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = spreadsheet.getSheets();
  
  console.log("Starting automation for " + sheets.length + " sheets");
  
  // Process each sheet
  sheets.forEach(function(sheet, index) {
    console.log("Processing sheet: " + sheet.getName());
    
    // Example automation tasks
    autoFormatSheet(sheet);
    addSummaryRow(sheet);
  });
  
  // Send email notification (optional)
  var email = Session.getActiveUser().getEmail();
  MailApp.sendEmail(email, "Automation Complete", "Spreadsheet automation has been completed successfully.");
  
  SpreadsheetApp.getUi().alert("Automation completed for all sheets!");
}

function autoFormatSheet(sheet) {
  var dataRange = sheet.getDataRange();
  
  if (dataRange.getNumRows() > 0) {
    // Format headers
    var headerRange = sheet.getRange(1, 1, 1, dataRange.getNumColumns());
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");
    
    // Add borders
    dataRange.setBorder(true, true, true, true, true, true);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, dataRange.getNumColumns());
  }
}

function addSummaryRow(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow > 1) {
    // Add a summary row
    sheet.getRange(lastRow + 2, 1).setValue("Summary:");
    sheet.getRange(lastRow + 2, 1).setFontWeight("bold");
    
    // Add current timestamp
    sheet.getRange(lastRow + 3, 1).setValue("Generated:");
    sheet.getRange(lastRow + 3, 2).setValue(new Date());
  }
}'''

def generate_gas_generic(description: str) -> str:
    """Generate generic Google Apps Script template"""
    return '''function customGoogleSheetsScript() {
  // Generated script based on: ''' + description + '''
  
  var sheet = SpreadsheetApp.getActiveSheet();
  var ui = SpreadsheetApp.getUi();
  
  // Add your custom logic here
  // This is a template - modify according to your needs
  
  console.log("Custom script executed successfully");
  ui.alert("Custom script completed!");
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Tools')
    .addItem('Run Custom Script', 'customGoogleSheetsScript')
    .addToUi();
}'''

def classify_task_type(description: str) -> str:
    """Classify the task type based on description"""
    description_lower = description.lower()
    
    if any(word in description_lower for word in ['process', 'clean', 'transform', 'merge', 'split']):
        return 'data_processing'
    elif any(word in description_lower for word in ['format', 'style', 'color', 'border', 'font']):
        return 'formatting'
    elif any(word in description_lower for word in ['calculate', 'sum', 'average', 'count', 'total']):
        return 'calculation'
    elif any(word in description_lower for word in ['automate', 'schedule', 'trigger', 'email', 'notification']):
        return 'automation'
    elif any(word in description_lower for word in ['analyze', 'correlation', 'statistics', 'insights']):
        return 'analysis'
    elif any(word in description_lower for word in ['chart', 'graph', 'plot', 'visualize', 'dashboard']):
        return 'visualization'
    else:
        return 'generic'

def get_vba_explanation(task_type: str, description: str) -> str:
    """Get explanation for VBA macro"""
    explanations = {
        'data_processing': 'This VBA macro processes data row by row, applying transformations and calculations as specified.',
        'formatting': 'This VBA macro applies consistent formatting to your spreadsheet data, including fonts, borders, and colors.',
        'calculation': 'This VBA macro performs mathematical calculations and summaries on your data.',
        'automation': 'This VBA macro automates repetitive tasks across multiple worksheets or workbooks.',
        'generic': f'This VBA macro is designed to: {description}'
    }
    return explanations.get(task_type, explanations['generic'])

def get_python_explanation(task_type: str, description: str) -> str:
    """Get explanation for Python script"""
    explanations = {
        'data_processing': 'This Python script uses pandas for efficient data processing, cleaning, and transformation.',
        'analysis': 'This Python script performs statistical analysis and generates insights from your data.',
        'visualization': 'This Python script creates interactive visualizations using matplotlib, seaborn, and plotly.',
        'generic': f'This Python script is designed to: {description}'
    }
    return explanations.get(task_type, explanations['generic'])

def get_gas_explanation(task_type: str, description: str) -> str:
    """Get explanation for Google Apps Script"""
    explanations = {
        'data_processing': 'This Google Apps Script processes data directly in Google Sheets with built-in functions.',
        'automation': 'This Google Apps Script automates tasks and can integrate with other Google Workspace apps.',
        'generic': f'This Google Apps Script is designed to: {description}'
    }
    return explanations.get(task_type, explanations['generic'])

def get_vba_instructions() -> str:
    """Get installation instructions for VBA"""
    return """To use this VBA macro:
1. Open Excel and press Alt+F11 to open VBA editor
2. Click Insert > Module to create a new module
3. Paste the generated code into the module
4. Close the VBA editor and return to Excel
5. Press Alt+F8 to run the macro
6. Select the macro name and click Run"""

def get_python_instructions() -> str:
    """Get installation instructions for Python"""
    return """To use this Python script:
1. Install required packages: pip install pandas numpy matplotlib seaborn plotly
2. Save the code as a .py file (e.g., data_processor.py)
3. Update the file_path variable with your data file location
4. Run the script: python data_processor.py
5. Check the output for results and any generated files"""

def get_gas_instructions() -> str:
    """Get installation instructions for Google Apps Script"""
    return """To use this Google Apps Script:
1. Open your Google Sheets document
2. Click Extensions > Apps Script
3. Delete any existing code and paste the generated code
4. Save the project (Ctrl+S)
5. Return to your spreadsheet - you should see a new "Custom Tools" menu
6. Use the menu to run the script functions"""

@features_bp.route('/predictive-analytics', methods=['POST'])
def predictive_analytics():
    """
    Predictive & Prescriptive Analytics
    Generate forecasts, predictions, and what-if scenarios
    """
    try:
        data = request.get_json()
        
        if not data or 'dataset' not in data:
            return jsonify({'error': 'Dataset is required'}), 400
        
        dataset = data['dataset']
        analysis_type = data.get('type', 'forecast')
        target_column = data.get('target_column')
        time_column = data.get('time_column')
        horizon = data.get('horizon', 12)  # Default 12 periods ahead
        
        df = pd.DataFrame(dataset)
        
        if analysis_type == 'forecast':
            result = generate_forecast(df, target_column, time_column, horizon)
        elif analysis_type == 'correlation':
            result = analyze_correlations(df)
        elif analysis_type == 'trends':
            result = analyze_trends(df, target_column, time_column)
        elif analysis_type == 'anomaly':
            result = detect_anomalies(df, target_column)
        elif analysis_type == 'what_if':
            scenarios = data.get('scenarios', {})
            result = what_if_analysis(df, target_column, scenarios)
        else:
            return jsonify({'error': 'Invalid analysis type'}), 400
        
        return jsonify({
            'success': True,
            'analysis_type': analysis_type,
            'results': result,
            'methodology': get_methodology_explanation(analysis_type),
            'confidence_level': result.get('confidence', 'medium')
        })
        
    except Exception as e:
        return jsonify({'error': f'Predictive analytics failed: {str(e)}'}), 500

def generate_forecast(df: pd.DataFrame, target_col: str, time_col: str, horizon: int) -> Dict:
    """Generate time series forecast"""
    if not target_col or target_col not in df.columns:
        target_col = df.select_dtypes(include=[np.number]).columns[0]
    
    if not time_col or time_col not in df.columns:
        # Try to find a date column
        date_cols = df.select_dtypes(include=['datetime64']).columns
        if len(date_cols) > 0:
            time_col = date_cols[0]
        else:
            # Create a simple index-based time series
            df['index'] = range(len(df))
            time_col = 'index'
    
    # Simple moving average forecast (in production, use more sophisticated methods)
    window_size = min(5, len(df) // 2)
    if window_size < 2:
        window_size = 2
    
    recent_values = df[target_col].tail(window_size).values
    trend = (recent_values[-1] - recent_values[0]) / len(recent_values)
    
    # Generate forecast
    last_value = float(df[target_col].iloc[-1])
    forecast_values = []
    
    for i in range(1, horizon + 1):
        # Simple trend projection with some randomness
        predicted_value = last_value + (trend * i)
        forecast_values.append({
            'period': i,
            'predicted_value': round(predicted_value, 2),
            'lower_bound': round(predicted_value * 0.9, 2),
            'upper_bound': round(predicted_value * 1.1, 2)
        })
    
    # Calculate accuracy metrics on historical data
    historical_accuracy = calculate_forecast_accuracy(df[target_col].values, window_size)
    
    return {
        'forecast': forecast_values,
        'historical_trend': trend,
        'seasonal_pattern': detect_seasonality(df[target_col].values),
        'accuracy_metrics': historical_accuracy,
        'confidence': 'high' if historical_accuracy['mape'] < 10 else 'medium' if historical_accuracy['mape'] < 25 else 'low',
        'methodology': 'Moving Average with Trend Projection'
    }

def analyze_correlations(df: pd.DataFrame) -> Dict:
    """Analyze correlations between variables"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if len(numeric_cols) < 2:
        return {'error': 'Need at least 2 numeric columns for correlation analysis'}
    
    correlation_matrix = df[numeric_cols].corr()
    
    # Find strongest correlations
    correlations = []
    for i in range(len(numeric_cols)):
        for j in range(i+1, len(numeric_cols)):
            corr_value = correlation_matrix.iloc[i, j]
            if not pd.isna(corr_value):
                correlations.append({
                    'variable1': numeric_cols[i],
                    'variable2': numeric_cols[j],
                    'correlation': round(float(corr_value), 3),
                    'strength': get_correlation_strength(abs(corr_value)),
                    'direction': 'positive' if corr_value > 0 else 'negative'
                })
    
    # Sort by absolute correlation strength
    correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    return {
        'correlation_matrix': correlation_matrix.round(3).to_dict(),
        'strong_correlations': [c for c in correlations if abs(c['correlation']) > 0.5],
        'all_correlations': correlations,
        'insights': generate_correlation_insights(correlations)
    }

def get_correlation_strength(corr_value: float) -> str:
    """Classify correlation strength"""
    if corr_value >= 0.8:
        return 'very strong'
    elif corr_value >= 0.6:
        return 'strong'
    elif corr_value >= 0.4:
        return 'moderate'
    elif corr_value >= 0.2:
        return 'weak'
    else:
        return 'very weak'

def analyze_trends(df: pd.DataFrame, target_col: str, time_col: str) -> Dict:
    """Analyze trends in time series data"""
    if not target_col or target_col not in df.columns:
        target_col = df.select_dtypes(include=[np.number]).columns[0]
    
    values = df[target_col].values
    
    # Calculate trend components
    if len(values) < 4:
        return {'error': 'Need at least 4 data points for trend analysis'}
    
    # Simple trend calculation
    x = np.arange(len(values))
    trend_line = np.polyfit(x, values, 1)
    trend_slope = trend_line[0]
    
    # Moving averages
    ma_3 = df[target_col].rolling(window=3).mean().dropna().tolist()
    ma_5 = df[target_col].rolling(window=min(5, len(values))).mean().dropna().tolist()
    
    # Rate of change
    rate_of_change = []
    for i in range(1, len(values)):
        roc = ((values[i] - values[i-1]) / values[i-1]) * 100 if values[i-1] != 0 else 0
        rate_of_change.append(round(roc, 2))
    
    return {
        'trend_direction': 'upward' if trend_slope > 0 else 'downward' if trend_slope < 0 else 'stable',
        'trend_strength': abs(trend_slope),
        'moving_averages': {
            '3_period': ma_3,
            '5_period': ma_5
        },
        'rate_of_change': rate_of_change,
        'volatility': round(float(np.std(values)), 2),
        'trend_equation': f'y = {trend_slope:.4f}x + {trend_line[1]:.4f}'
    }

def detect_anomalies(df: pd.DataFrame, target_col: str) -> Dict:
    """Detect anomalies using statistical methods"""
    if not target_col or target_col not in df.columns:
        target_col = df.select_dtypes(include=[np.number]).columns[0]
    
    values = df[target_col].values
    
    # Z-score method
    z_scores = np.abs((values - np.mean(values)) / np.std(values))
    z_anomalies = np.where(z_scores > 2)[0].tolist()
    
    # IQR method
    Q1 = np.percentile(values, 25)
    Q3 = np.percentile(values, 75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    iqr_anomalies = np.where((values < lower_bound) | (values > upper_bound))[0].tolist()
    
    # Combine anomalies
    all_anomalies = list(set(z_anomalies + iqr_anomalies))
    
    anomaly_details = []
    for idx in all_anomalies:
        anomaly_details.append({
            'index': int(idx),
            'value': float(values[idx]),
            'z_score': float(z_scores[idx]),
            'severity': 'high' if z_scores[idx] > 3 else 'medium' if z_scores[idx] > 2 else 'low'
        })
    
    return {
        'anomalies_detected': len(all_anomalies),
        'anomaly_rate': round((len(all_anomalies) / len(values)) * 100, 2),
        'anomaly_details': sorted(anomaly_details, key=lambda x: x['z_score'], reverse=True),
        'thresholds': {
            'iqr_lower': float(lower_bound),
            'iqr_upper': float(upper_bound),
            'z_score_threshold': 2.0
        }
    }

def what_if_analysis(df: pd.DataFrame, target_col: str, scenarios: Dict) -> Dict:
    """Perform what-if scenario analysis"""
    if not target_col or target_col not in df.columns:
        target_col = df.select_dtypes(include=[np.number]).columns[0]
    
    base_value = float(df[target_col].mean())
    results = {'base_scenario': {'value': base_value, 'description': 'Current average'}}
    
    for scenario_name, changes in scenarios.items():
        scenario_value = base_value
        change_description = []
        
        for variable, change_percent in changes.items():
            if variable in df.columns:
                # Simple impact calculation (in reality, this would use regression models)
                correlation = df[variable].corr(df[target_col]) if variable in df.select_dtypes(include=[np.number]).columns else 0
                impact = (change_percent / 100) * correlation * base_value
                scenario_value += impact
                change_description.append(f"{variable}: {change_percent:+.1f}%")
        
        results[scenario_name] = {
            'value': round(scenario_value, 2),
            'change_from_base': round(scenario_value - base_value, 2),
            'percent_change': round(((scenario_value - base_value) / base_value) * 100, 2),
            'description': ', '.join(change_description)
        }
    
    return results

def calculate_forecast_accuracy(values: np.ndarray, window_size: int) -> Dict:
    """Calculate forecast accuracy metrics"""
    if len(values) < window_size + 2:
        return {'mape': 50, 'mae': 0, 'rmse': 0}
    
    # Simple backtest
    actual = values[window_size:]
    predicted = []
    
    for i in range(len(actual)):
        start_idx = i
        end_idx = i + window_size
        if end_idx < len(values):
            window_values = values[start_idx:end_idx]
            pred = np.mean(window_values)
            predicted.append(pred)
    
    if len(predicted) == 0:
        return {'mape': 50, 'mae': 0, 'rmse': 0}
    
    actual = actual[:len(predicted)]
    predicted = np.array(predicted)
    
    # Calculate metrics
    mae = np.mean(np.abs(actual - predicted))
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    mape = np.mean(np.abs((actual - predicted) / actual)) * 100
    
    return {
        'mae': round(float(mae), 2),
        'rmse': round(float(rmse), 2),
        'mape': round(float(mape), 2)
    }

def detect_seasonality(values: np.ndarray) -> Dict:
    """Detect seasonal patterns in time series"""
    if len(values) < 12:
        return {'seasonal': False, 'pattern': 'insufficient_data'}
    
    # Simple seasonality detection using autocorrelation
    # Check for common seasonal periods (4, 12, 52 for quarterly, monthly, weekly)
    seasonal_periods = [4, 12, 52] if len(values) >= 52 else [4, 12] if len(values) >= 12 else [4]
    
    max_correlation = 0
    best_period = None
    
    for period in seasonal_periods:
        if len(values) >= period * 2:
            # Calculate autocorrelation at this lag
            correlation = np.corrcoef(values[:-period], values[period:])[0, 1]
            if not np.isnan(correlation) and abs(correlation) > max_correlation:
                max_correlation = abs(correlation)
                best_period = period
    
    is_seasonal = max_correlation > 0.3
    
    return {
        'seasonal': is_seasonal,
        'pattern': f'{best_period}_period' if is_seasonal else 'no_clear_pattern',
        'strength': round(max_correlation, 3) if best_period else 0
    }

def generate_correlation_insights(correlations: List[Dict]) -> List[str]:
    """Generate insights from correlation analysis"""
    insights = []
    
    strong_positive = [c for c in correlations if c['correlation'] > 0.7]
    strong_negative = [c for c in correlations if c['correlation'] < -0.7]
    
    if strong_positive:
        insights.append(f"Found {len(strong_positive)} strong positive correlation(s)")
        for corr in strong_positive[:3]:  # Top 3
            insights.append(f"{corr['variable1']} and {corr['variable2']} are strongly related (r={corr['correlation']})")
    
    if strong_negative:
        insights.append(f"Found {len(strong_negative)} strong negative correlation(s)")
        for corr in strong_negative[:3]:  # Top 3
            insights.append(f"{corr['variable1']} and {corr['variable2']} are inversely related (r={corr['correlation']})")
    
    if not strong_positive and not strong_negative:
        insights.append("No strong correlations detected - variables appear to be relatively independent")
    
    return insights

def get_methodology_explanation(analysis_type: str) -> str:
    """Get explanation of the methodology used"""
    explanations = {
        'forecast': 'Moving average with linear trend projection. Confidence intervals based on historical volatility.',
        'correlation': 'Pearson correlation coefficient calculation between all numeric variables.',
        'trends': 'Linear regression trend analysis with moving averages and rate of change calculations.',
        'anomaly': 'Statistical outlier detection using Z-score and Interquartile Range (IQR) methods.',
        'what_if': 'Scenario modeling based on correlation relationships and percentage change impacts.'
    }
    return explanations.get(analysis_type, 'Custom statistical analysis methodology')

@features_bp.route('/collaboration', methods=['GET'])
def collaboration():
    return _placeholder('Real-time Collaboration')

@features_bp.route('/developer-api', methods=['GET'])
def developer_api():
    return _placeholder('Developer API & Integrations')

@features_bp.route('/add-in', methods=['GET'])
def add_in():
    return _placeholder('Excel/Sheets Add-in')

@features_bp.route('/multilingual', methods=['GET'])
def multilingual():
    return _placeholder('Multilingual & Accessibility Support')

@features_bp.route('/usage-analytics', methods=['GET'])
def usage_analytics():
    return _placeholder('Usage Analytics & Admin Dashboard')
