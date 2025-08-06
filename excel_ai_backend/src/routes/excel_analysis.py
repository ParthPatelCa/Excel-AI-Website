from flask import Blueprint, jsonify, request
import pandas as pd
import numpy as np
import io
import os
from openai import OpenAI
import json

excel_bp = Blueprint('excel', __name__)

# Initialize OpenAI client
client = OpenAI()

@excel_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return basic file information"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read the file based on its extension
        filename = file.filename.lower()
        
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file)
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV files.'}), 400
        
        # Basic file information
        file_info = {
            'filename': file.filename,
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
    """Generate basic statistical insights from the dataframe"""
    insights = {
        'summary_stats': {},
        'data_quality': {},
        'patterns': []
    }
    
    # Summary statistics for numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        insights['summary_stats'][col] = {
            'mean': float(df[col].mean()) if not df[col].isna().all() else None,
            'median': float(df[col].median()) if not df[col].isna().all() else None,
            'std': float(df[col].std()) if not df[col].isna().all() else None,
            'min': float(df[col].min()) if not df[col].isna().all() else None,
            'max': float(df[col].max()) if not df[col].isna().all() else None,
            'missing_count': int(df[col].isna().sum())
        }
    
    # Data quality assessment
    insights['data_quality'] = {
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'missing_values': int(df.isna().sum().sum()),
        'duplicate_rows': int(df.duplicated().sum()),
        'numeric_columns': len(numeric_cols),
        'text_columns': len(df.select_dtypes(include=['object']).columns)
    }
    
    # Identify patterns
    if len(numeric_cols) > 0:
        # Find columns with high correlation
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
    
    return insights

def generate_ai_insights(df, basic_insights):
    """Generate AI-powered insights using OpenAI"""
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
            temperature=0.3
        )
        
        # Parse the AI response
        ai_response = response.choices[0].message.content
        
        # Try to parse as JSON, fallback to structured text
        try:
            ai_insights = json.loads(ai_response)
        except:
            ai_insights = {
                'key_findings': [ai_response],
                'data_quality_issues': [],
                'recommendations': [],
                'business_insights': []
            }
        
        return ai_insights
        
    except Exception as e:
        return {
            'key_findings': [f"AI analysis unavailable: {str(e)}"],
            'data_quality_issues': [],
            'recommendations': [],
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

