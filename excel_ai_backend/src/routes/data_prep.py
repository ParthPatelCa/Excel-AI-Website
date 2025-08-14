from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.visualization import DataPrep
import pandas as pd
import numpy as np
from datetime import datetime
import re
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

data_prep_bp = Blueprint('data_prep', __name__)

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key) if api_key and api_key != 'sk-test-key-replace-with-real-key' else None

@data_prep_bp.route('/api/v1/data-prep/analyze', methods=['POST'])
def analyze_data():
    """Analyze data quality and suggest cleaning operations"""
    try:
        data = request.get_json()
        input_data = data.get('data', [])
        
        if not input_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(input_data)
        
        # Analyze data quality
        analysis = {
            'summary': {
                'rows': len(df),
                'columns': len(df.columns),
                'memory_usage': df.memory_usage(deep=True).sum(),
                'duplicate_rows': df.duplicated().sum()
            },
            'columns': {},
            'issues': [],
            'suggestions': []
        }
        
        # Analyze each column
        for col in df.columns:
            col_analysis = analyze_column(df[col])
            analysis['columns'][col] = col_analysis
            
            # Generate issues and suggestions
            if col_analysis['missing_count'] > 0:
                analysis['issues'].append({
                    'type': 'missing_values',
                    'column': col,
                    'count': col_analysis['missing_count'],
                    'severity': 'high' if col_analysis['missing_percentage'] > 20 else 'medium'
                })
                
                analysis['suggestions'].append({
                    'type': 'handle_missing',
                    'column': col,
                    'options': suggest_missing_value_strategy(df[col])
                })
        
        # Check for potential data type issues
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check if it could be numeric
                numeric_conversion = try_convert_to_numeric(df[col])
                if numeric_conversion['convertible']:
                    analysis['suggestions'].append({
                        'type': 'convert_data_type',
                        'column': col,
                        'from_type': 'text',
                        'to_type': 'numeric',
                        'confidence': numeric_conversion['confidence']
                    })
                
                # Check if it could be datetime
                datetime_conversion = try_convert_to_datetime(df[col])
                if datetime_conversion['convertible']:
                    analysis['suggestions'].append({
                        'type': 'convert_data_type',
                        'column': col,
                        'from_type': 'text',
                        'to_type': 'datetime',
                        'confidence': datetime_conversion['confidence']
                    })
        
        # Generate AI-powered suggestions
        if client:
            ai_suggestions = generate_ai_suggestions(df, analysis)
            analysis['ai_suggestions'] = ai_suggestions
        
        return jsonify({
            'success': True,
            'data': analysis
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze data: {str(e)}'}), 500

@data_prep_bp.route('/api/v1/data-prep/clean', methods=['POST'])
def clean_data():
    """Apply cleaning operations to data"""
    try:
        data = request.get_json()
        input_data = data.get('data', [])
        operations = data.get('operations', [])
        
        if not input_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(input_data)
        original_df = df.copy()
        
        # Apply each operation
        applied_operations = []
        for operation in operations:
            try:
                df = apply_cleaning_operation(df, operation)
                applied_operations.append({
                    'operation': operation,
                    'status': 'success'
                })
            except Exception as e:
                applied_operations.append({
                    'operation': operation,
                    'status': 'failed',
                    'error': str(e)
                })
        
        # Generate summary
        summary = {
            'original_rows': len(original_df),
            'cleaned_rows': len(df),
            'rows_removed': len(original_df) - len(df),
            'operations_applied': len([op for op in applied_operations if op['status'] == 'success']),
            'operations_failed': len([op for op in applied_operations if op['status'] == 'failed'])
        }
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        data_prep = DataPrep(
            user_id=user_id,
            title=data.get('title', f'Data Cleaning - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            prep_type='cleaning',
            input_data=input_data[:100],  # Store sample
            output_data=df.to_dict('records')[:100],  # Store sample
            operations=operations,
            status='completed'
        )
        
        db.session.add(data_prep)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': data_prep.id,
                'cleaned_data': df.to_dict('records'),
                'summary': summary,
                'operations': applied_operations
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to clean data: {str(e)}'}), 500

@data_prep_bp.route('/api/v1/data-prep/blend', methods=['POST'])
def blend_data():
    """Blend/merge multiple datasets"""
    try:
        data = request.get_json()
        datasets = data.get('datasets', [])
        blend_config = data.get('config', {})
        
        if len(datasets) < 2:
            return jsonify({'error': 'At least 2 datasets required for blending'}), 400
        
        # Convert datasets to DataFrames
        dfs = []
        for i, dataset in enumerate(datasets):
            df = pd.DataFrame(dataset['data'])
            df.name = dataset.get('name', f'Dataset_{i+1}')
            dfs.append(df)
        
        # Perform blending based on config
        blend_type = blend_config.get('type', 'inner_join')
        join_keys = blend_config.get('join_keys', [])
        
        if blend_type == 'concat':
            # Concatenate datasets vertically
            result_df = pd.concat(dfs, ignore_index=True)
        elif blend_type in ['inner_join', 'left_join', 'right_join', 'outer_join']:
            # Join datasets
            how = blend_type.replace('_join', '')
            result_df = dfs[0]
            
            for df in dfs[1:]:
                if join_keys:
                    result_df = pd.merge(result_df, df, on=join_keys, how=how)
                else:
                    # Auto-detect common columns
                    common_cols = list(set(result_df.columns) & set(df.columns))
                    if common_cols:
                        result_df = pd.merge(result_df, df, on=common_cols, how=how)
                    else:
                        return jsonify({'error': 'No common columns found for joining'}), 400
        else:
            return jsonify({'error': f'Unsupported blend type: {blend_type}'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        data_prep = DataPrep(
            user_id=user_id,
            title=data.get('title', f'Data Blending - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            prep_type='blending',
            input_data={'datasets': [ds.get('name', f'Dataset_{i+1}') for i, ds in enumerate(datasets)]},
            output_data=result_df.to_dict('records')[:100],  # Store sample
            operations=[blend_config],
            status='completed'
        )
        
        db.session.add(data_prep)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': data_prep.id,
                'blended_data': result_df.to_dict('records'),
                'summary': {
                    'input_datasets': len(datasets),
                    'output_rows': len(result_df),
                    'output_columns': len(result_df.columns),
                    'blend_type': blend_type
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to blend data: {str(e)}'}), 500

@data_prep_bp.route('/api/v1/data-prep/transform', methods=['POST'])
def transform_data():
    """Apply transformations to data"""
    try:
        data = request.get_json()
        input_data = data.get('data', [])
        transformations = data.get('transformations', [])
        
        if not input_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(input_data)
        
        # Apply transformations
        applied_transformations = []
        for transform in transformations:
            try:
                df = apply_transformation(df, transform)
                applied_transformations.append({
                    'transformation': transform,
                    'status': 'success'
                })
            except Exception as e:
                applied_transformations.append({
                    'transformation': transform,
                    'status': 'failed',
                    'error': str(e)
                })
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        data_prep = DataPrep(
            user_id=user_id,
            title=data.get('title', f'Data Transformation - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            prep_type='transformation',
            input_data=input_data[:100],  # Store sample
            output_data=df.to_dict('records')[:100],  # Store sample
            operations=transformations,
            status='completed'
        )
        
        db.session.add(data_prep)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': data_prep.id,
                'transformed_data': df.to_dict('records'),
                'summary': {
                    'transformations_applied': len([t for t in applied_transformations if t['status'] == 'success']),
                    'transformations_failed': len([t for t in applied_transformations if t['status'] == 'failed']),
                    'final_rows': len(df),
                    'final_columns': len(df.columns)
                },
                'transformations': applied_transformations
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to transform data: {str(e)}'}), 500

def analyze_column(series):
    """Analyze a single column"""
    return {
        'data_type': str(series.dtype),
        'missing_count': series.isnull().sum(),
        'missing_percentage': (series.isnull().sum() / len(series)) * 100,
        'unique_count': series.nunique(),
        'unique_percentage': (series.nunique() / len(series)) * 100,
        'sample_values': series.dropna().head(5).tolist(),
        'is_numeric': pd.api.types.is_numeric_dtype(series),
        'is_datetime': pd.api.types.is_datetime64_any_dtype(series)
    }

def suggest_missing_value_strategy(series):
    """Suggest strategies for handling missing values"""
    strategies = []
    
    if pd.api.types.is_numeric_dtype(series):
        strategies.extend([
            {'method': 'mean', 'description': 'Fill with mean value'},
            {'method': 'median', 'description': 'Fill with median value'},
            {'method': 'mode', 'description': 'Fill with most common value'}
        ])
    else:
        strategies.extend([
            {'method': 'mode', 'description': 'Fill with most common value'},
            {'method': 'unknown', 'description': 'Fill with "Unknown"'}
        ])
    
    strategies.extend([
        {'method': 'drop', 'description': 'Remove rows with missing values'},
        {'method': 'interpolate', 'description': 'Interpolate based on neighboring values'}
    ])
    
    return strategies

def try_convert_to_numeric(series):
    """Check if a text column can be converted to numeric"""
    try:
        # Try to convert a sample
        sample = series.dropna().head(100)
        converted = pd.to_numeric(sample, errors='coerce')
        success_rate = (converted.notna().sum() / len(sample))
        
        return {
            'convertible': success_rate > 0.8,
            'confidence': success_rate,
            'sample_converted': converted.head(5).tolist()
        }
    except:
        return {'convertible': False, 'confidence': 0}

def try_convert_to_datetime(series):
    """Check if a text column can be converted to datetime"""
    try:
        # Try to convert a sample
        sample = series.dropna().head(100)
        converted = pd.to_datetime(sample, errors='coerce')
        success_rate = (converted.notna().sum() / len(sample))
        
        return {
            'convertible': success_rate > 0.8,
            'confidence': success_rate,
            'sample_converted': converted.head(5).astype(str).tolist()
        }
    except:
        return {'convertible': False, 'confidence': 0}

def apply_cleaning_operation(df, operation):
    """Apply a single cleaning operation"""
    op_type = operation.get('type')
    column = operation.get('column')
    
    if op_type == 'remove_duplicates':
        return df.drop_duplicates()
    
    elif op_type == 'fill_missing':
        method = operation.get('method', 'mean')
        if method == 'mean' and pd.api.types.is_numeric_dtype(df[column]):
            df[column] = df[column].fillna(df[column].mean())
        elif method == 'median' and pd.api.types.is_numeric_dtype(df[column]):
            df[column] = df[column].fillna(df[column].median())
        elif method == 'mode':
            df[column] = df[column].fillna(df[column].mode()[0])
        elif method == 'drop':
            df = df.dropna(subset=[column])
        else:
            fill_value = operation.get('fill_value', 'Unknown')
            df[column] = df[column].fillna(fill_value)
    
    elif op_type == 'convert_type':
        to_type = operation.get('to_type')
        if to_type == 'numeric':
            df[column] = pd.to_numeric(df[column], errors='coerce')
        elif to_type == 'datetime':
            df[column] = pd.to_datetime(df[column], errors='coerce')
        elif to_type == 'string':
            df[column] = df[column].astype(str)
    
    elif op_type == 'remove_outliers':
        if pd.api.types.is_numeric_dtype(df[column]):
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    
    return df

def apply_transformation(df, transform):
    """Apply a single transformation"""
    transform_type = transform.get('type')
    column = transform.get('column')
    
    if transform_type == 'normalize':
        if pd.api.types.is_numeric_dtype(df[column]):
            df[column] = (df[column] - df[column].min()) / (df[column].max() - df[column].min())
    
    elif transform_type == 'standardize':
        if pd.api.types.is_numeric_dtype(df[column]):
            df[column] = (df[column] - df[column].mean()) / df[column].std()
    
    elif transform_type == 'log_transform':
        if pd.api.types.is_numeric_dtype(df[column]):
            df[column] = np.log1p(df[column])
    
    elif transform_type == 'create_bins':
        if pd.api.types.is_numeric_dtype(df[column]):
            bins = transform.get('bins', 5)
            df[f"{column}_binned"] = pd.cut(df[column], bins=bins)
    
    elif transform_type == 'extract_date_parts':
        if pd.api.types.is_datetime64_any_dtype(df[column]):
            df[f"{column}_year"] = df[column].dt.year
            df[f"{column}_month"] = df[column].dt.month
            df[f"{column}_day"] = df[column].dt.day
    
    return df

@data_prep_bp.route('/api/v1/data-prep/smart-validate', methods=['POST'])
def smart_validate_data():
    """AI-powered data validation with anomaly detection and quality rules"""
    try:
        data = request.get_json()
        input_data = data.get('data', [])
        validation_context = data.get('context', {})  # Business context for validation
        
        if not input_data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(input_data)
        
        # Perform comprehensive validation
        validation_results = {
            'overall_score': 0,
            'quality_issues': [],
            'anomalies': [],
            'business_rules': [],
            'ai_insights': [],
            'suggestions': []
        }
        
        # 1. Statistical Anomaly Detection
        anomalies = detect_statistical_anomalies(df)
        validation_results['anomalies'] = anomalies
        
        # 2. Business Rule Validation
        business_rules = validate_business_rules(df, validation_context)
        validation_results['business_rules'] = business_rules
        
        # 3. Data Quality Issues
        quality_issues = detect_quality_issues(df)
        validation_results['quality_issues'] = quality_issues
        
        # 4. AI-Powered Insights
        if client:
            ai_insights = generate_ai_validation_insights(df, validation_context)
            validation_results['ai_insights'] = ai_insights
            
            # Generate smart suggestions
            smart_suggestions = generate_smart_suggestions(df, validation_results)
            validation_results['suggestions'] = smart_suggestions
        
        # 5. Calculate overall quality score
        total_issues = len(quality_issues) + len(anomalies) + len([r for r in business_rules if not r['passed']])
        max_possible_issues = len(df.columns) * 3  # Rough estimate
        validation_results['overall_score'] = max(0, min(100, 100 - (total_issues / max_possible_issues * 100)))
        
        return jsonify({
            'success': True,
            'data': validation_results
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to validate data: {str(e)}'}), 500

def detect_statistical_anomalies(df):
    """Detect statistical anomalies in numeric columns"""
    anomalies = []
    
    for col in df.select_dtypes(include=[np.number]).columns:
        try:
            # Z-score based outliers
            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
            outlier_indices = df[z_scores > 3].index.tolist()
            
            if len(outlier_indices) > 0:
                anomalies.append({
                    'type': 'statistical_outlier',
                    'column': col,
                    'method': 'z_score',
                    'threshold': 3,
                    'anomaly_count': len(outlier_indices),
                    'anomaly_percentage': round((len(outlier_indices) / len(df)) * 100, 2),
                    'sample_values': df.loc[outlier_indices[:3], col].tolist(),
                    'severity': 'high' if len(outlier_indices) > len(df) * 0.1 else 'medium'
                })
            
            # IQR based outliers
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outlier_mask = (df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))
            iqr_outliers = df[outlier_mask].index.tolist()
            
            if len(iqr_outliers) > 0 and len(iqr_outliers) != len(outlier_indices):
                anomalies.append({
                    'type': 'iqr_outlier',
                    'column': col,
                    'method': 'iqr',
                    'threshold': '1.5*IQR',
                    'anomaly_count': len(iqr_outliers),
                    'anomaly_percentage': round((len(iqr_outliers) / len(df)) * 100, 2),
                    'sample_values': df.loc[iqr_outliers[:3], col].tolist(),
                    'severity': 'medium'
                })
                
        except Exception:
            continue
    
    return anomalies

def validate_business_rules(df, context):
    """Validate business-specific rules"""
    rules = []
    business_type = context.get('business_type', 'general')
    
    # Common business rules
    for col in df.columns:
        col_lower = col.lower()
        
        # Email validation
        if 'email' in col_lower:
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            invalid_emails = df[~df[col].astype(str).str.match(email_pattern, na=False)]
            rules.append({
                'rule': 'email_format',
                'column': col,
                'passed': len(invalid_emails) == 0,
                'violations': len(invalid_emails),
                'description': f'Email addresses should follow standard format',
                'severity': 'high' if len(invalid_emails) > 0 else 'none'
            })
        
        # Date validation
        if any(keyword in col_lower for keyword in ['date', 'time', 'created', 'updated']):
            try:
                date_col = pd.to_datetime(df[col], errors='coerce')
                invalid_dates = df[date_col.isna() & df[col].notna()]
                rules.append({
                    'rule': 'date_format',
                    'column': col,
                    'passed': len(invalid_dates) == 0,
                    'violations': len(invalid_dates),
                    'description': f'Date column should contain valid dates',
                    'severity': 'medium' if len(invalid_dates) > 0 else 'none'
                })
            except Exception:
                pass
        
        # Negative values in amount/price columns
        if any(keyword in col_lower for keyword in ['amount', 'price', 'cost', 'revenue', 'salary']):
            if pd.api.types.is_numeric_dtype(df[col]):
                negative_values = df[df[col] < 0]
                rules.append({
                    'rule': 'positive_amounts',
                    'column': col,
                    'passed': len(negative_values) == 0,
                    'violations': len(negative_values),
                    'description': f'Financial amounts should typically be positive',
                    'severity': 'medium' if len(negative_values) > 0 else 'none'
                })
    
    # Business-specific rules
    if business_type == 'sales':
        # Sales-specific validations
        pass
    elif business_type == 'hr':
        # HR-specific validations
        pass
    
    return rules

def detect_quality_issues(df):
    """Detect general data quality issues"""
    issues = []
    
    # High missing value percentage
    for col in df.columns:
        missing_pct = (df[col].isnull().sum() / len(df)) * 100
        if missing_pct > 50:
            issues.append({
                'type': 'high_missing_values',
                'column': col,
                'missing_percentage': round(missing_pct, 2),
                'description': f'Column has {missing_pct:.1f}% missing values',
                'severity': 'high'
            })
        elif missing_pct > 20:
            issues.append({
                'type': 'moderate_missing_values',
                'column': col,
                'missing_percentage': round(missing_pct, 2),
                'description': f'Column has {missing_pct:.1f}% missing values',
                'severity': 'medium'
            })
    
    # Low cardinality in text columns
    for col in df.select_dtypes(include=['object']).columns:
        if len(df) > 10:  # Only check if we have enough data
            unique_pct = (df[col].nunique() / len(df)) * 100
            if unique_pct < 5:
                issues.append({
                    'type': 'low_cardinality',
                    'column': col,
                    'unique_percentage': round(unique_pct, 2),
                    'unique_values': df[col].value_counts().head(5).to_dict(),
                    'description': f'Column has very low diversity ({unique_pct:.1f}% unique)',
                    'severity': 'medium'
                })
    
    # Inconsistent formatting
    for col in df.select_dtypes(include=['object']).columns:
        sample_values = df[col].dropna().head(20).tolist()
        if len(sample_values) > 5:
            # Check for inconsistent case
            case_variations = len(set([str(v).lower() for v in sample_values])) / len(set(sample_values))
            if case_variations < 0.8:
                issues.append({
                    'type': 'inconsistent_case',
                    'column': col,
                    'description': 'Column may have inconsistent capitalization',
                    'sample_values': sample_values[:5],
                    'severity': 'low'
                })
    
    return issues

def generate_ai_validation_insights(df, context):
    """Generate AI-powered validation insights"""
    try:
        # Create a summary of the data for AI analysis
        data_summary = {
            'shape': df.shape,
            'columns': list(df.columns),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'missing_summary': df.isnull().sum().to_dict(),
            'sample_data': df.head(3).to_dict('records')
        }
        
        prompt = f"""
        Analyze this dataset for data quality and validation insights:
        
        Dataset Summary: {data_summary}
        Business Context: {context}
        
        Provide insights about:
        1. Data quality concerns specific to this domain
        2. Potential relationships between columns that should be validated
        3. Business logic violations that might not be obvious
        4. Suggestions for improving data reliability
        
        Return as JSON with format:
        {{
            "insights": [
                {{
                    "type": "relationship_validation",
                    "description": "Start date should always be before end date",
                    "columns": ["start_date", "end_date"],
                    "priority": "high"
                }}
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        return result.get('insights', [])
        
    except Exception as e:
        return []

def generate_smart_suggestions(df, validation_results):
    """Generate smart suggestions based on validation results"""
    suggestions = []
    
    # Suggestions based on anomalies
    for anomaly in validation_results['anomalies']:
        if anomaly['severity'] == 'high':
            suggestions.append({
                'type': 'handle_outliers',
                'column': anomaly['column'],
                'action': 'investigate_and_clean',
                'description': f"Investigate {anomaly['anomaly_count']} outliers in {anomaly['column']}",
                'priority': 'high',
                'auto_applicable': False
            })
    
    # Suggestions based on quality issues
    for issue in validation_results['quality_issues']:
        if issue['type'] == 'high_missing_values':
            suggestions.append({
                'type': 'handle_missing',
                'column': issue['column'],
                'action': 'fill_or_drop',
                'description': f"Address {issue['missing_percentage']:.1f}% missing values in {issue['column']}",
                'priority': 'high',
                'auto_applicable': True,
                'options': ['drop_rows', 'fill_mean', 'fill_mode', 'fill_custom']
            })
        elif issue['type'] == 'inconsistent_case':
            suggestions.append({
                'type': 'standardize_format',
                'column': issue['column'],
                'action': 'normalize_case',
                'description': f"Standardize text formatting in {issue['column']}",
                'priority': 'medium',
                'auto_applicable': True,
                'options': ['lowercase', 'uppercase', 'title_case']
            })
    
    # Suggestions based on business rules
    for rule in validation_results['business_rules']:
        if not rule['passed'] and rule['severity'] == 'high':
            suggestions.append({
                'type': 'fix_business_rule',
                'column': rule['column'],
                'action': 'validate_and_fix',
                'description': f"Fix {rule['violations']} {rule['rule']} violations in {rule['column']}",
                'priority': 'high',
                'auto_applicable': False
            })
    
    return suggestions

def generate_ai_suggestions(df, analysis):
    """Generate AI-powered cleaning suggestions"""
    if not client:
        return []
    
    try:
        prompt = f"""
        Analyze this dataset and provide data cleaning suggestions:
        
        Dataset Summary:
        - Rows: {len(df)}
        - Columns: {len(df.columns)}
        - Column types: {dict(df.dtypes)}
        - Missing values: {df.isnull().sum().to_dict()}
        
        Based on this data structure, suggest 3-5 specific data cleaning operations that would improve data quality.
        
        Return as JSON array with format:
        [
            {{
                "operation": "remove_duplicates",
                "reason": "Found duplicate rows that could skew analysis",
                "priority": "high"
            }}
        ]
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        import json
        suggestions = json.loads(response.choices[0].message.content)
        return suggestions
        
    except Exception as e:
        return []
