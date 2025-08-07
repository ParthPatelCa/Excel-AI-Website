from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import io
import os
import time
from openai import OpenAI
import json
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

excel_bp = Blueprint('excel', __name__)

# Initialize OpenAI client with API key from environment
# Only initialize if API key is properly set
api_key = os.getenv('OPENAI_API_KEY')
if api_key and api_key != 'sk-test-key-replace-with-real-key':
    client = OpenAI(api_key=api_key)
else:
    client = None

def call_openai_with_retry(messages, max_retries=3, model="gpt-3.5-turbo"):
    """Enhanced OpenAI API call with retry logic and better error handling"""
    if not client:
        return {
            'success': False,
            'error': 'OpenAI API not configured. Please set OPENAI_API_KEY environment variable.',
            'fallback': True
        }
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                temperature=0.1,
                timeout=30  # 30 second timeout
            )
            
            return {
                'success': True,
                'content': response.choices[0].message.content,
                'usage': response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # Handle specific error types
            if 'rate limit' in error_str or 'quota' in error_str:
                if attempt < max_retries - 1:
                    # Exponential backoff with jitter for rate limits
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                    continue
                else:
                    return {
                        'success': False,
                        'error': 'OpenAI API rate limit exceeded. Please try again in a few minutes.',
                        'retry_after': 60
                    }
            
            elif 'timeout' in error_str or 'connection' in error_str:
                if attempt < max_retries - 1:
                    time.sleep(1)  # Short delay for connection issues
                    continue
                else:
                    return {
                        'success': False,
                        'error': 'OpenAI API connection timeout. Please check your internet connection and try again.',
                        'retry_after': 10
                    }
            
            elif 'invalid' in error_str or 'authentication' in error_str:
                return {
                    'success': False,
                    'error': 'OpenAI API authentication failed. Please check your API key configuration.',
                    'fatal': True
                }
            
            else:
                # Generic error - retry with exponential backoff
                if attempt < max_retries - 1:
                    delay = (2 ** attempt)
                    time.sleep(delay)
                    continue
    
    # All retries failed
    return {
        'success': False,
        'error': f'OpenAI API request failed after {max_retries} attempts: {str(last_error)}',
        'retry_after': 30
    }

def validate_file_structure(df, filename):
    """Enhanced file validation with detailed error messages"""
    errors = []
    warnings = []
    
    # Check if DataFrame is empty
    if df.empty:
        errors.append(f"File '{filename}' appears to be empty or contains no readable data.")
        return {'valid': False, 'errors': errors, 'warnings': warnings}
    
    # Check for reasonable size limits
    if len(df) > 100000:  # 100k rows
        warnings.append(f"Large dataset detected ({len(df):,} rows). Processing may take longer.")
    
    if len(df.columns) > 50:  # 50 columns
        warnings.append(f"Many columns detected ({len(df.columns)}). Consider focusing on specific columns for better analysis.")
    
    # Check for completely empty columns
    empty_columns = df.columns[df.isnull().all()].tolist()
    if empty_columns:
        warnings.append(f"Found {len(empty_columns)} completely empty columns: {', '.join(empty_columns[:5])}")
    
    # Check for columns with mostly missing data
    mostly_empty_cols = []
    for col in df.columns:
        missing_pct = (df[col].isnull().sum() / len(df)) * 100
        if missing_pct > 80:
            mostly_empty_cols.append(f"{col} ({missing_pct:.1f}% missing)")
    
    if mostly_empty_cols:
        warnings.append(f"Columns with >80% missing data: {', '.join(mostly_empty_cols[:3])}")
    
    # Check for duplicate column names
    duplicate_cols = df.columns[df.columns.duplicated()].tolist()
    if duplicate_cols:
        errors.append(f"Duplicate column names found: {', '.join(set(duplicate_cols))}")
    
    # Check for very long column names
    long_cols = [col for col in df.columns if len(str(col)) > 100]
    if long_cols:
        warnings.append(f"Very long column names detected ({len(long_cols)} columns). This may affect readability.")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'stats': {
            'rows': len(df),
            'columns': len(df.columns),
            'memory_usage': df.memory_usage(deep=True).sum(),
            'missing_data_pct': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        }
    }

@excel_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return basic file information with enhanced validation"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided. Please select an Excel (.xlsx, .xls) or CSV file.'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected. Please choose a file to upload.'}), 400
        
        # Validate file extension
        filename = file.filename.lower()
        allowed_extensions = ['.xlsx', '.xls', '.csv']
        if not any(filename.endswith(ext) for ext in allowed_extensions):
            return jsonify({
                'error': f'Unsupported file type. Please upload files with extensions: {", ".join(allowed_extensions)}'
            }), 400
        
        # Validate file size (16MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        max_size = 16 * 1024 * 1024  # 16MB
        if file_size > max_size:
            return jsonify({
                'error': f'File size ({file_size / 1024 / 1024:.1f}MB) exceeds the 16MB limit. Please use a smaller file or split your data.'
            }), 400
        
        if file_size < 100:  # Less than 100 bytes
            return jsonify({
                'error': 'File appears to be too small or empty. Please check your file and try again.'
            }), 400
        
        # Read the file based on its extension with enhanced error handling
        try:
            if filename.endswith('.xlsx') or filename.endswith('.xls'):
                try:
                    df = pd.read_excel(file, engine='openpyxl' if filename.endswith('.xlsx') else 'xlrd')
                except Exception as e:
                    return jsonify({
                        'error': f'Failed to read Excel file: {str(e)}. Please ensure the file is not corrupted and try again.'
                    }), 400
            elif filename.endswith('.csv'):
                try:
                    # Try different encodings for CSV files
                    df = pd.read_csv(file, encoding='utf-8')
                except UnicodeDecodeError:
                    file.seek(0)
                    try:
                        df = pd.read_csv(file, encoding='latin1')
                    except Exception as e:
                        return jsonify({
                            'error': f'Failed to read CSV file with encoding issues: {str(e)}. Please save your CSV with UTF-8 encoding.'
                        }), 400
                except Exception as e:
                    return jsonify({
                        'error': f'Failed to read CSV file: {str(e)}. Please check the file format and try again.'
                    }), 400
            else:
                return jsonify({
                    'error': 'Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV files.'
                }), 400
                
        except Exception as e:
            return jsonify({
                'error': f'Failed to process file: {str(e)}. Please check that your file is valid and not corrupted.'
            }), 400
        
        # Enhanced file validation
        validation_result = validate_file_structure(df, file.filename)
        if not validation_result['valid']:
            return jsonify({
                'error': 'File validation failed',
                'details': validation_result['errors']
            }), 400
        except Exception as e:
            return jsonify({'error': f'Error reading file: {str(e)}. Please ensure the file is not corrupted and is in a supported format.'}), 400
        
        # Validate DataFrame
        if df.empty:
            return jsonify({'error': 'The uploaded file appears to be empty'}), 400
        
        if len(df.columns) == 0:
            return jsonify({'error': 'The uploaded file has no columns'}), 400
        
        # Basic file information
        file_info = {
            'filename': file.filename,
            'file_size': file_size,
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': df.columns.tolist(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'preview': df.head(5).to_dict('records')
        }
        
        # Store the dataframe in session or temporary storage
        # For now, we'll return the data directly
        return jsonify({
            'success': True,
            'file_info': file_info,
            'data': df.to_dict('records')
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@excel_bp.route('/analyze', methods=['POST'])
def analyze_data():
    """Perform AI-powered analysis on the uploaded data"""
    try:
        data = request.json
        if 'data' not in data:
            return jsonify({'error': 'No data provided for analysis'}), 400
        
        # Convert data back to DataFrame
        df = pd.DataFrame(data['data'])
        
        # Generate basic statistics
        insights = generate_insights(df)
        
        # Generate AI-powered insights
        ai_insights = generate_ai_insights(df, insights)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'ai_insights': ai_insights
        })
        
    except Exception as e:
        return jsonify({'error': f'Error analyzing data: {str(e)}'}), 500

@excel_bp.route('/query', methods=['POST'])
def query_data():
    """Handle natural language queries about the data"""
    try:
        data = request.json
        if 'query' not in data or 'data' not in data:
            return jsonify({'error': 'Query and data are required'}), 400
        
        query = data['query']
        df = pd.DataFrame(data['data'])
        
        # Generate response using AI
        response = process_natural_language_query(df, query)
        
        return jsonify({
            'success': True,
            'response': response
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing query: {str(e)}'}), 500

@excel_bp.route('/formulas', methods=['POST'])
def suggest_formulas():
    """Suggest Excel formulas based on data structure and user intent"""
    try:
        data = request.json
        if 'data' not in data:
            return jsonify({'error': 'No data provided'}), 400
        
        df = pd.DataFrame(data['data'])
        intent = data.get('intent', 'general analysis')
        
        # Generate formula suggestions
        formulas = generate_formula_suggestions(df, intent)
        
        return jsonify({
            'success': True,
            'formulas': formulas
        })
        
    except Exception as e:
        return jsonify({'error': f'Error generating formulas: {str(e)}'}), 500

def generate_insights(df):
    """Generate comprehensive statistical insights from the dataframe"""
    insights = {
        'summary_stats': {},
        'data_quality': {},
        'patterns': [],
        'correlations': {},
        'distributions': {}
    }
    
    # Summary statistics for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 0:
            insights['summary_stats'][col] = {
                'count': len(col_data),
                'mean': float(col_data.mean()),
                'median': float(col_data.median()),
                'std': float(col_data.std()),
                'min': float(col_data.min()),
                'max': float(col_data.max()),
                'q25': float(col_data.quantile(0.25)),
                'q75': float(col_data.quantile(0.75)),
                'missing_count': int(df[col].isna().sum()),
                'skewness': float(col_data.skew()) if len(col_data) > 2 else 0,
                'kurtosis': float(col_data.kurtosis()) if len(col_data) > 3 else 0
            }

    # Data quality assessment
    insights['data_quality'] = {
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'missing_values': int(df.isna().sum().sum()),
        'duplicate_rows': int(df.duplicated().sum()),
        'numeric_columns': len(numeric_cols),
        'text_columns': len(df.select_dtypes(include=['object']).columns),
        'memory_usage_mb': round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
        'column_types': df.dtypes.astype(str).to_dict()
    }

    # Distribution analysis for categorical columns
    categorical_columns = df.select_dtypes(include=['object', 'category']).columns
    for col in categorical_columns:
        if len(df[col].dropna()) > 0:
            value_counts = df[col].value_counts().head(10)
            insights['distributions'][col] = {
                'unique_values': int(df[col].nunique()),
                'most_common': value_counts.to_dict(),
                'missing_count': int(df[col].isnull().sum())
            }

    # Correlation analysis
    if len(numeric_cols) > 1:
        try:
            correlation_matrix = df[numeric_cols].corr()
            insights['correlations'] = correlation_matrix.round(3).to_dict()
        except:
            insights['correlations'] = {}

    # Identify patterns
    if len(numeric_cols) > 0:
        # Find columns with high correlation
        try:
            corr_matrix = df[numeric_cols].corr()
            high_corr_pairs = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.7 and not pd.isna(corr_val):
                        high_corr_pairs.append({
                            'column1': corr_matrix.columns[i],
                            'column2': corr_matrix.columns[j],
                            'correlation': float(corr_val)
                        })
            
            if high_corr_pairs:
                insights['patterns'].append({
                    'type': 'high_correlation',
                    'description': 'Found columns with high correlation',
                    'details': high_corr_pairs
                })
        except:
            pass

    # Detect potential data quality issues
    quality_issues = []
    
    # High missing value columns
    missing_percentage = (df.isnull().sum() / len(df)) * 100
    high_missing_cols = missing_percentage[missing_percentage > 20].index.tolist()
    if high_missing_cols:
        quality_issues.append(f"High missing values (>20%) in: {', '.join(high_missing_cols)}")
    
    # Duplicate rows
    if insights['data_quality']['duplicate_rows'] > 0:
        duplicate_percentage = (insights['data_quality']['duplicate_rows'] / len(df)) * 100
        quality_issues.append(f"Found {insights['data_quality']['duplicate_rows']} duplicate rows ({duplicate_percentage:.1f}%)")
    
    # Constant columns
    constant_cols = [col for col in df.columns if df[col].nunique() <= 1]
    if constant_cols:
        quality_issues.append(f"Constant value columns: {', '.join(constant_cols)}")
    
    # Outliers detection (simple IQR method)
    for col in numeric_cols:
        if col in insights['summary_stats']:
            Q1 = insights['summary_stats'][col]['q25']
            Q3 = insights['summary_stats'][col]['q75']
            IQR = Q3 - Q1
            if IQR > 0:
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
                if len(outliers) > 0:
                    outlier_percentage = (len(outliers) / len(df)) * 100
                    if outlier_percentage > 5:  # Only report if >5% outliers
                        quality_issues.append(f"Potential outliers in {col}: {len(outliers)} values ({outlier_percentage:.1f}%)")
    
    insights['data_quality']['issues'] = quality_issues

    return insights

def generate_ai_insights(df, basic_insights):
    """Generate AI-powered insights using OpenAI with retry mechanism"""
    max_retries = 3
    retry_delay = 1
    
    # Check if OpenAI client is available
    if not client:
        return {
            'key_findings': ['AI analysis requires a valid OpenAI API key. Please configure your API key in the .env file.'],
            'data_quality_issues': ['API key not configured'],
            'recommendations': ['Add your OpenAI API key to the .env file to enable AI-powered insights'],
            'business_insights': []
        }
    
    for attempt in range(max_retries):
        try:
            # Prepare data summary for AI
            data_summary = {
                'columns': df.columns.tolist(),
                'data_types': df.dtypes.astype(str).to_dict(),
                'shape': df.shape,
                'sample_data': df.head(3).to_dict('records'),
                'basic_insights': basic_insights
            }
            
            prompt = f"""
            Analyze this dataset and provide actionable insights:
            
            Dataset Summary:
            {json.dumps(data_summary, indent=2)}
            
            Please provide:
            1. Key findings and trends
            2. Potential data quality issues
            3. Recommendations for further analysis
            4. Business insights (if applicable)
            
            Format your response as a JSON object with these keys:
            - key_findings: array of strings
            - data_quality_issues: array of strings
            - recommendations: array of strings
            - business_insights: array of strings
            """
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a data analyst expert. Provide clear, actionable insights about datasets."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3,
                timeout=30
            )
            
            # Parse the AI response
            ai_response = response.choices[0].message.content
            
            # Try to parse as JSON, fallback to structured text
            try:
                ai_insights = json.loads(ai_response)
                
                # Validate the response structure
                required_keys = ['key_findings', 'data_quality_issues', 'recommendations', 'business_insights']
                for key in required_keys:
                    if key not in ai_insights:
                        ai_insights[key] = []
                        
                return ai_insights
                
            except json.JSONDecodeError:
                return {
                    'key_findings': [ai_response[:500] + "..." if len(ai_response) > 500 else ai_response],
                    'data_quality_issues': [],
                    'recommendations': [],
                    'business_insights': []
                }
                
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                continue
            else:
                error_msg = str(e)
                if "API key" in error_msg:
                    return {
                        'key_findings': ['AI analysis requires a valid OpenAI API key'],
                        'data_quality_issues': ['API key configuration issue'],
                        'recommendations': ['Please check your OpenAI API key configuration'],
                        'business_insights': []
                    }
                else:
                    return {
                        'key_findings': [f"AI analysis temporarily unavailable: {error_msg}"],
                        'data_quality_issues': [],
                        'recommendations': ['Try again later or contact support if the issue persists'],
                        'business_insights': []
                    }

def process_natural_language_query(df, query):
    """Process natural language queries about the data"""
    try:
        # Prepare context about the data
        data_context = {
            'columns': df.columns.tolist(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'shape': df.shape,
            'sample_data': df.head(3).to_dict('records')
        }
        
        prompt = f"""
        You have access to a dataset with the following structure:
        {json.dumps(data_context, indent=2)}
        
        User query: "{query}"
        
        Please provide a helpful response that:
        1. Answers the user's question based on the available data
        2. Suggests specific analysis steps if needed
        3. Mentions any limitations based on the data structure
        
        If the query requires calculations, provide the approach but note that actual calculations would need to be performed on the full dataset.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful data analyst assistant. Provide clear, practical responses about data analysis."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Sorry, I couldn't process your query: {str(e)}"

def generate_formula_suggestions(df, intent):
    """Generate Excel formula suggestions based on data structure"""
    formulas = []
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    if len(numeric_cols) > 0:
        # Basic aggregation formulas
        for col in numeric_cols[:3]:  # Limit to first 3 numeric columns
            formulas.append({
                'description': f'Sum of {col}',
                'formula': f'=SUM({col}:{col})',
                'category': 'Aggregation'
            })
            
            formulas.append({
                'description': f'Average of {col}',
                'formula': f'=AVERAGE({col}:{col})',
                'category': 'Aggregation'
            })
            
            formulas.append({
                'description': f'Count of non-empty {col}',
                'formula': f'=COUNTA({col}:{col})',
                'category': 'Counting'
            })
    
    # Conditional formulas
    if len(df.columns) > 1:
        col1, col2 = df.columns[0], df.columns[1]
        formulas.append({
            'description': f'Conditional sum based on {col1}',
            'formula': f'=SUMIF({col1}:{col1},"criteria",{col2}:{col2})',
            'category': 'Conditional'
        })
    
    # Data validation
    formulas.append({
        'description': 'Check for duplicates',
        'formula': '=COUNTIF(A:A,A1)>1',
        'category': 'Data Quality'
    })
    
    return formulas

