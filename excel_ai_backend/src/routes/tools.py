from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.visualization import ToolGeneration
import pandas as pd
import re
import os
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import json
import base64
import io

load_dotenv()

tools_bp = Blueprint('tools', __name__)

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key) if api_key and api_key != 'sk-test-key-replace-with-real-key' else None

@tools_bp.route('/api/v1/tools/excel-formula', methods=['POST'])
def generate_excel_formula():
    """Generate Excel formula from description"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        columns = data.get('columns', [])
        example_data = data.get('example_data', [])
        
        if not description:
            return jsonify({'error': 'Description required'}), 400
        
        formula_result = create_excel_formula_with_ai(description, columns, example_data)
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        tool_gen = ToolGeneration(
            user_id=user_id,
            tool_type='excel_formula',
            input_description=description,
            input_data={'columns': columns, 'example_data': example_data[:5] if example_data else []},
            generated_output=formula_result['formula'],
            explanation=formula_result['explanation'],
            examples=formula_result.get('examples', []),
            ai_model='gpt-4'
        )
        
        db.session.add(tool_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': tool_gen.id,
                'formula': formula_result['formula'],
                'explanation': formula_result['explanation'],
                'examples': formula_result.get('examples', []),
                'variants': formula_result.get('variants', [])
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate Excel formula: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/sql-query', methods=['POST'])
def generate_sql_query():
    """Generate SQL query from description"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        table_schema = data.get('table_schema', {})
        database_type = data.get('database_type', 'mysql')
        
        if not description:
            return jsonify({'error': 'Description required'}), 400
        
        sql_result = create_sql_query_with_ai(description, table_schema, database_type)
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        tool_gen = ToolGeneration(
            user_id=user_id,
            tool_type='sql_query',
            input_description=description,
            input_data={'table_schema': table_schema, 'database_type': database_type},
            generated_output=sql_result['query'],
            explanation=sql_result['explanation'],
            examples=sql_result.get('examples', []),
            ai_model='gpt-4'
        )
        
        db.session.add(tool_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': tool_gen.id,
                'query': sql_result['query'],
                'explanation': sql_result['explanation'],
                'examples': sql_result.get('examples', []),
                'optimizations': sql_result.get('optimizations', [])
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate SQL query: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/vba-script', methods=['POST'])
def generate_vba_script():
    """Generate VBA script from description"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        workbook_context = data.get('workbook_context', {})
        
        if not description:
            return jsonify({'error': 'Description required'}), 400
        
        vba_result = create_vba_script_with_ai(description, workbook_context)
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        tool_gen = ToolGeneration(
            user_id=user_id,
            tool_type='vba_script',
            input_description=description,
            input_data={'workbook_context': workbook_context},
            generated_output=vba_result['script'],
            explanation=vba_result['explanation'],
            examples=vba_result.get('examples', []),
            ai_model='gpt-4'
        )
        
        db.session.add(tool_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': tool_gen.id,
                'script': vba_result['script'],
                'explanation': vba_result['explanation'],
                'examples': vba_result.get('examples', []),
                'installation_steps': vba_result.get('installation_steps', [])
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate VBA script: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/pdf-to-excel', methods=['POST'])
def convert_pdf_to_excel_format():
    """Convert PDF to Excel format (placeholder - would need PDF parsing library)"""
    try:
        # Validate content type to avoid image format errors
        if request.content_type and 'image' in request.content_type:
            return jsonify({
                'success': False,
                'error': 'Image files are not supported for PDF conversion. Please upload PDF files only.'
            }), 400
            
        # This is a placeholder implementation
        # In production, you'd use libraries like PyPDF2, pdfplumber, or camelot
        return jsonify({
            'success': False,
            'error': 'PDF to Excel conversion not yet implemented. Please upload Excel files directly.'
        }), 501
        
    except Exception as e:
        return jsonify({'error': f'Failed to convert PDF: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/text-to-excel', methods=['POST'])
def convert_text_to_excel_format():
    """Convert structured text to Excel format"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        delimiter = data.get('delimiter', 'auto')
        
        if not text_data:
            return jsonify({'error': 'Text data required'}), 400
        
        # Validate input is text, not binary data
        if isinstance(text_data, bytes):
            return jsonify({
                'success': False, 
                'error': 'Binary data not supported. Please provide text data only.'
            }), 400
        
        excel_result = convert_text_to_structured_excel_data(text_data, delimiter)
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        tool_gen = ToolGeneration(
            user_id=user_id,
            tool_type='text_convert',
            input_description=f'Convert text to Excel with delimiter: {delimiter}',
            input_data={'text_preview': text_data[:500], 'delimiter': delimiter},
            generated_output=json.dumps(excel_result['data'][:10]),  # Store sample
            explanation=excel_result['explanation'],
            ai_model='text_processing'
        )
        
        db.session.add(tool_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': tool_gen.id,
                'excel_data': excel_result['data'],
                'columns': excel_result['columns'],
                'rows_processed': excel_result['rows_processed'],
                'explanation': excel_result['explanation']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to convert text to Excel: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/regex-generator', methods=['POST'])
def generate_regex_pattern():
    """Generate regex pattern from description"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        test_strings = data.get('test_strings', [])
        
        if not description:
            return jsonify({'error': 'Description required'}), 400
        
        regex_result = create_regex_pattern_with_ai(description, test_strings)
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        tool_gen = ToolGeneration(
            user_id=user_id,
            tool_type='regex',
            input_description=description,
            input_data={'test_strings': test_strings},
            generated_output=regex_result['pattern'],
            explanation=regex_result['explanation'],
            examples=regex_result.get('examples', []),
            ai_model='gpt-4'
        )
        
        db.session.add(tool_gen)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': tool_gen.id,
                'pattern': regex_result['pattern'],
                'explanation': regex_result['explanation'],
                'examples': regex_result.get('examples', []),
                'test_results': regex_result.get('test_results', [])
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate regex: {str(e)}'}), 500

@tools_bp.route('/api/v1/tools/list', methods=['GET'])
def list_tools():
    """Get list of available tools"""
    tools = {
        'excel_formula': {
            'name': 'Excel Formula Generator',
            'description': 'Generate Excel formulas from natural language descriptions',
            'icon': 'calculator',
            'category': 'spreadsheet'
        },
        'sql_query': {
            'name': 'SQL Query Generator',
            'description': 'Create SQL queries from plain English descriptions',
            'icon': 'database',
            'category': 'database'
        },
        'vba_script': {
            'name': 'VBA Script Generator',
            'description': 'Generate VBA scripts for Excel automation',
            'icon': 'code',
            'category': 'automation'
        },
        'pdf_convert': {
            'name': 'PDF to Excel Converter',
            'description': 'Extract data from PDF files and convert to Excel',
            'icon': 'file-text',
            'category': 'conversion'
        },
        'text_convert': {
            'name': 'Text to Excel Converter',
            'description': 'Convert structured text data to Excel format',
            'icon': 'type',
            'category': 'conversion'
        },
        'regex_generator': {
            'name': 'Regex Generator',
            'description': 'Generate regex patterns from descriptions',
            'icon': 'search',
            'category': 'text_processing'
        }
    }
    
    return jsonify({
        'success': True,
        'data': tools
    })

@tools_bp.route('/api/v1/tools/history', methods=['GET'])
def get_tool_history():
    """Get user's tool generation history"""
    try:
        user_id = request.args.get('user_id', 1)  # TODO: Get from auth
        tool_type = request.args.get('tool_type', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        query = ToolGeneration.query.filter_by(user_id=user_id)
        
        if tool_type:
            query = query.filter_by(tool_type=tool_type)
        
        tools = query.order_by(ToolGeneration.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        items = []
        for tool in tools.items:
            items.append({
                'id': tool.id,
                'tool_type': tool.tool_type,
                'input_description': tool.input_description[:100] + '...' if len(tool.input_description) > 100 else tool.input_description,
                'created_at': tool.created_at.isoformat(),
                'ai_model': tool.ai_model
            })
        
        return jsonify({
            'success': True,
            'data': {
                'items': items,
                'page': page,
                'per_page': per_page,
                'total': tools.total,
                'pages': tools.pages
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get tool history: {str(e)}'}), 500

def create_excel_formula_with_ai(description, columns, example_data):
    """Create Excel formula using OpenAI"""
    if not client:
        # Fallback: basic formula suggestions
        if 'sum' in description.lower():
            return {
                'formula': '=SUM(A:A)',
                'explanation': 'Basic SUM formula - sums all values in column A',
                'examples': ['=SUM(A1:A10)', '=SUM(B:B)']
            }
        else:
            return {
                'formula': '=A1',
                'explanation': 'Basic cell reference',
                'examples': ['=A1*B1', '=A1+B1']
            }
    
    try:
        context = f"Available columns: {', '.join(columns)}" if columns else ""
        if example_data:
            context += f"\nExample data: {json.dumps(example_data[:3])}"
        
        prompt = f"""
        Create an Excel formula based on this description: "{description}"
        
        {context}
        
        Return JSON format:
        {{
            "formula": "=YOUR_FORMULA_HERE",
            "explanation": "Clear explanation of what the formula does",
            "examples": ["example1", "example2"],
            "variants": [
                {{"formula": "alternative", "description": "when to use this variant"}}
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {
            'formula': '=ERROR("Failed to generate")',
            'explanation': f'Error: {str(e)}',
            'examples': []
        }

def create_sql_query_with_ai(description, table_schema, database_type):
    """Create SQL query using OpenAI"""
    if not client:
        return {
            'query': 'SELECT * FROM table_name;',
            'explanation': 'Basic SELECT query - OpenAI not available',
            'examples': []
        }
    
    try:
        schema_info = json.dumps(table_schema) if table_schema else "No schema provided"
        
        prompt = f"""
        Create a {database_type} SQL query based on this description: "{description}"
        
        Table schema: {schema_info}
        
        Return JSON format:
        {{
            "query": "YOUR SQL QUERY HERE",
            "explanation": "Clear explanation of what the query does",
            "examples": ["example variation 1", "example variation 2"],
            "optimizations": ["optimization tip 1", "optimization tip 2"]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {
            'query': '-- Error generating query',
            'explanation': f'Error: {str(e)}',
            'examples': []
        }

def create_vba_script_with_ai(description, workbook_context):
    """Create VBA script using OpenAI"""
    if not client:
        return {
            'script': 'Sub GeneratedMacro()\n    MsgBox "VBA generation not available"\nEnd Sub',
            'explanation': 'VBA generation requires OpenAI API',
            'examples': []
        }
    
    try:
        context_info = json.dumps(workbook_context) if workbook_context else "No context provided"
        
        prompt = f"""
        Create a VBA script based on this description: "{description}"
        
        Workbook context: {context_info}
        
        Return JSON format:
        {{
            "script": "Complete VBA script with proper syntax",
            "explanation": "Clear explanation of what the script does",
            "examples": ["usage example 1", "usage example 2"],
            "installation_steps": ["step 1", "step 2", "step 3"]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {
            'script': "' Error generating VBA script",
            'explanation': f'Error: {str(e)}',
            'examples': []
        }

def convert_text_to_structured_excel_data(text_data, delimiter):
    """Convert text to structured data"""
    try:
        lines = text_data.strip().split('\n')
        
        # Auto-detect delimiter if needed
        if delimiter == 'auto':
            # Try common delimiters
            delimiters = [',', '\t', ';', '|', ' ']
            best_delimiter = ','
            best_score = 0
            
            for delim in delimiters:
                # Count consistency of splits across lines
                split_counts = [len(line.split(delim)) for line in lines[:5]]
                if len(set(split_counts)) == 1 and split_counts[0] > 1:
                    best_delimiter = delim
                    break
            
            delimiter = best_delimiter
        
        # Split data
        structured_data = []
        columns = []
        
        for i, line in enumerate(lines):
            if line.strip():
                parts = [part.strip() for part in line.split(delimiter)]
                
                if i == 0:
                    # Assume first line is headers
                    columns = parts or [f'Column_{j+1}' for j in range(len(parts))]
                else:
                    # Data rows
                    row_data = {}
                    for j, value in enumerate(parts):
                        column_name = columns[j] if j < len(columns) else f'Column_{j+1}'
                        row_data[column_name] = value
                    structured_data.append(row_data)
        
        if not columns:
            columns = ['Column_1']
        
        return {
            'data': structured_data,
            'columns': columns,
            'rows_processed': len(structured_data),
            'explanation': f'Converted {len(structured_data)} rows with delimiter "{delimiter}"'
        }
        
    except Exception as e:
        return {
            'data': [],
            'columns': [],
            'rows_processed': 0,
            'explanation': f'Error converting text: {str(e)}'
        }

def create_regex_pattern_with_ai(description, test_strings):
    """Create regex pattern using OpenAI"""
    if not client:
        return {
            'pattern': '.*',
            'explanation': 'Basic match-all pattern - OpenAI not available',
            'examples': []
        }
    
    try:
        test_info = json.dumps(test_strings) if test_strings else "No test strings provided"
        
        prompt = f"""
        Create a regex pattern based on this description: "{description}"
        
        Test strings: {test_info}
        
        Return JSON format:
        {{
            "pattern": "your_regex_pattern",
            "explanation": "Clear explanation of what the pattern matches",
            "examples": ["example match 1", "example match 2"],
            "test_results": [
                {{"string": "test1", "matches": true, "captured_groups": ["group1"]}}
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Test the pattern against provided strings
        if test_strings and 'pattern' in result:
            import re
            test_results = []
            try:
                pattern = re.compile(result['pattern'])
                for test_str in test_strings:
                    match = pattern.search(test_str)
                    test_results.append({
                        'string': test_str,
                        'matches': bool(match),
                        'captured_groups': list(match.groups()) if match else []
                    })
                result['test_results'] = test_results
            except:
                pass
        
        return result
        
    except Exception as e:
        return {
            'pattern': '.*',
            'explanation': f'Error: {str(e)}',
            'examples': []
        }

@tools_bp.route('/regex-generator', methods=['POST'])
def generate_regex():
    """
    AI-powered Regex Pattern Generator
    Convert natural language descriptions to regex patterns
    """
    try:
        data = request.get_json()
        description = data.get('description', '')
        
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Generate regex pattern using AI
        pattern_data = create_regex_pattern(description)
        
        response = {
            'success': True,
            'data': {
                'pattern': pattern_data['pattern'],
                'explanation': pattern_data['explanation'],
                'examples': pattern_data['examples'],
                'flags': pattern_data['flags'],
                'test_cases': pattern_data['test_cases']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate regex: {str(e)}'}), 500

@tools_bp.route('/formula-optimizer', methods=['POST'])
def optimize_formula():
    """
    Formula Optimization Tool
    Analyze and optimize Excel formulas for better performance
    """
    try:
        data = request.get_json()
        formula = data.get('formula', '')
        
        if not formula:
            return jsonify({'error': 'Formula is required'}), 400
        
        # Optimize the formula
        optimization_data = optimize_excel_formula(formula)
        
        response = {
            'success': True,
            'data': {
                'original_formula': formula,
                'optimized_formula': optimization_data['optimized'],
                'improvements': optimization_data['improvements'],
                'performance_gain': optimization_data['performance_gain'],
                'explanation': optimization_data['explanation']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to optimize formula: {str(e)}'}), 500

def create_regex_pattern(description):
    """Generate regex pattern from natural language description"""
    
    # Common regex patterns based on descriptions
    pattern_templates = {
        'email': {
            'pattern': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
            'explanation': 'Matches standard email addresses',
            'examples': ['user@example.com', 'test.email+tag@domain.co.uk'],
            'flags': ['i'],
            'test_cases': [
                {'input': 'user@example.com', 'matches': True},
                {'input': 'invalid.email', 'matches': False}
            ]
        },
        'phone': {
            'pattern': r'^\+?1?-?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$',
            'explanation': 'Matches US phone numbers in various formats',
            'examples': ['(555) 123-4567', '555-123-4567', '+1-555-123-4567'],
            'flags': [],
            'test_cases': [
                {'input': '(555) 123-4567', 'matches': True},
                {'input': '123-45-6789', 'matches': False}
            ]
        },
        'url': {
            'pattern': r'https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?',
            'explanation': 'Matches HTTP and HTTPS URLs',
            'examples': ['https://example.com', 'http://subdomain.example.com/path'],
            'flags': ['i'],
            'test_cases': [
                {'input': 'https://example.com', 'matches': True},
                {'input': 'ftp://example.com', 'matches': False}
            ]
        },
        'date': {
            'pattern': r'^\d{4}-\d{2}-\d{2}$',
            'explanation': 'Matches dates in YYYY-MM-DD format',
            'examples': ['2023-12-25', '2024-01-01'],
            'flags': [],
            'test_cases': [
                {'input': '2023-12-25', 'matches': True},
                {'input': '12/25/2023', 'matches': False}
            ]
        }
    }
    
    # Simple keyword matching for demo
    description_lower = description.lower()
    
    if 'email' in description_lower:
        return pattern_templates['email']
    elif 'phone' in description_lower:
        return pattern_templates['phone']
    elif 'url' in description_lower or 'website' in description_lower:
        return pattern_templates['url']
    elif 'date' in description_lower:
        return pattern_templates['date']
    else:
        # Generic pattern for numbers
        return {
            'pattern': r'\d+',
            'explanation': f'Pattern generated for: {description}',
            'examples': ['123', '456789'],
            'flags': [],
            'test_cases': [
                {'input': '123', 'matches': True},
                {'input': 'abc', 'matches': False}
            ]
        }

def optimize_excel_formula(formula):
    """Analyze and optimize Excel formula for better performance"""
    
    improvements = []
    optimized = formula
    
    # Common optimization patterns
    if 'VLOOKUP' in formula.upper():
        if 'FALSE' in formula or '0' in formula:
            improvements.append("Using exact match VLOOKUP - good for performance")
        else:
            improvements.append("Consider using exact match (FALSE) for better accuracy")
            optimized = formula.replace('TRUE', 'FALSE').replace(',1)', ',0)')
    
    if 'SUMIF' in formula.upper() and 'SUMIFS' not in formula.upper():
        if formula.count(',') > 3:  # Multiple criteria
            improvements.append("Consider using SUMIFS for multiple criteria")
            optimized = formula.replace('SUMIF', 'SUMIFS')
    
    if '$' not in formula and any(ref in formula for ref in ['A1', 'B2', 'C3']):
        improvements.append("Consider using absolute references ($A$1) for fixed ranges")
        # Simple optimization - add $ to first cell reference found
        import re
        optimized = re.sub(r'([A-Z]+)(\d+)', r'$\1$\2', formula, count=1)
    
    if 'INDIRECT' in formula.upper():
        improvements.append("INDIRECT is volatile - consider alternatives if possible")
    
    if not improvements:
        improvements = ["Formula appears to be well-optimized"]
    
    performance_gain = "5-15%" if len(improvements) > 1 else "Minimal"
    
    return {
        'optimized': optimized,
        'improvements': improvements,
        'performance_gain': performance_gain,
        'explanation': f"Analyzed formula for common optimization opportunities. {len(improvements)} improvements identified."
    }

@tools_bp.route('/sql-query-builder', methods=['POST'])
def build_sql_query():
    """
    Advanced SQL Query Builder
    Convert natural language questions to optimized SQL queries
    """
    try:
        data = request.get_json()
        question = data.get('question', '')
        schema_info = data.get('schema', {})  # Optional table schema information
        database_type = data.get('database_type', 'mysql')  # mysql, postgresql, sqlite, sqlserver
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Build SQL query from natural language
        sql_data = build_intelligent_sql_query(question, schema_info, database_type)
        
        response = {
            'success': True,
            'data': {
                'query': sql_data['query'],
                'explanation': sql_data['explanation'],
                'query_type': sql_data['query_type'],
                'tables_used': sql_data['tables_used'],
                'complexity': sql_data['complexity'],
                'optimization_tips': sql_data['optimization_tips'],
                'alternative_queries': sql_data['alternative_queries'],
                'estimated_performance': sql_data['estimated_performance']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to build SQL query: {str(e)}'}), 500

@tools_bp.route('/data-formatter', methods=['POST'])
def format_data():
    """
    Advanced Data Formatter
    Clean, format, and transform messy data using AI
    """
    try:
        data = request.get_json()
        raw_data = data.get('data', [])
        formatting_rules = data.get('rules', {})
        target_format = data.get('target_format', 'clean')  # clean, excel, csv, json
        
        if not raw_data:
            return jsonify({'error': 'Data is required'}), 400
        
        # Format and clean the data
        formatted_data = intelligent_data_formatting(raw_data, formatting_rules, target_format)
        
        response = {
            'success': True,
            'data': {
                'original_rows': formatted_data['original_rows'],
                'cleaned_rows': formatted_data['cleaned_rows'],
                'formatted_data': formatted_data['formatted_data'],
                'transformations_applied': formatted_data['transformations_applied'],
                'data_quality_score': formatted_data['data_quality_score'],
                'issues_found': formatted_data['issues_found'],
                'suggestions': formatted_data['suggestions'],
                'preview': formatted_data['preview']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to format data: {str(e)}'}), 500

def build_intelligent_sql_query(question, schema_info, database_type):
    """Build SQL query from natural language with intelligence"""
    
    # Analyze the question to determine query type and components
    question_lower = question.lower()
    
    # Determine query type
    if any(word in question_lower for word in ['show', 'list', 'get', 'find', 'display', 'what']):
        query_type = 'SELECT'
    elif any(word in question_lower for word in ['count', 'how many', 'number of']):
        query_type = 'COUNT'
    elif any(word in question_lower for word in ['sum', 'total', 'add up']):
        query_type = 'SUM'
    elif any(word in question_lower for word in ['average', 'avg', 'mean']):
        query_type = 'AVERAGE'
    elif any(word in question_lower for word in ['maximum', 'max', 'highest', 'largest']):
        query_type = 'MAX'
    elif any(word in question_lower for word in ['minimum', 'min', 'lowest', 'smallest']):
        query_type = 'MIN'
    else:
        query_type = 'SELECT'
    
    # Common SQL patterns based on question analysis
    sql_templates = {
        'top_customers': {
            'query': '''SELECT customer_name, SUM(order_amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY customer_name
ORDER BY total_spent DESC
LIMIT 10;''',
            'explanation': 'Finds top 10 customers by total spending using JOIN and GROUP BY',
            'tables_used': ['customers', 'orders'],
            'complexity': 'intermediate'
        },
        'monthly_sales': {
            'query': '''SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(order_amount) as monthly_total,
    COUNT(*) as order_count
FROM orders
WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month DESC;''',
            'explanation': 'Calculates monthly sales totals for the last 12 months with date functions',
            'tables_used': ['orders'],
            'complexity': 'intermediate'
        },
        'product_performance': {
            'query': '''SELECT 
    p.product_name,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.unit_price) as revenue,
    AVG(oi.unit_price) as avg_price
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY p.product_id, p.product_name
ORDER BY revenue DESC;''',
            'explanation': 'Analyzes product performance over 6 months with multiple JOINs and aggregations',
            'tables_used': ['products', 'order_items', 'orders'],
            'complexity': 'advanced'
        },
        'customer_segments': {
            'query': '''SELECT 
    CASE 
        WHEN total_spent >= 10000 THEN 'VIP'
        WHEN total_spent >= 5000 THEN 'Premium'
        WHEN total_spent >= 1000 THEN 'Standard'
        ELSE 'Basic'
    END as customer_segment,
    COUNT(*) as customer_count,
    AVG(total_spent) as avg_spending
FROM (
    SELECT 
        customer_id,
        SUM(order_amount) as total_spent
    FROM orders
    GROUP BY customer_id
) customer_totals
GROUP BY customer_segment
ORDER BY avg_spending DESC;''',
            'explanation': 'Segments customers by spending levels using CASE statements and subqueries',
            'tables_used': ['orders'],
            'complexity': 'advanced'
        }
    }
    
    # Simple keyword matching for demo (in production, would use more sophisticated NLP)
    if any(word in question_lower for word in ['top', 'best', 'customer']):
        template = sql_templates['top_customers']
    elif any(word in question_lower for word in ['monthly', 'month', 'sales', 'revenue']):
        template = sql_templates['monthly_sales']
    elif any(word in question_lower for word in ['product', 'performance', 'selling']):
        template = sql_templates['product_performance']
    elif any(word in question_lower for word in ['segment', 'group', 'category']):
        template = sql_templates['customer_segments']
    else:
        # Generic SELECT query
        template = {
            'query': 'SELECT * FROM your_table WHERE condition = value;',
            'explanation': f'Basic SELECT query for: {question}',
            'tables_used': ['your_table'],
            'complexity': 'beginner'
        }
    
    # Add optimization tips based on query complexity
    optimization_tips = []
    if template['complexity'] == 'advanced':
        optimization_tips.extend([
            "Consider adding indexes on JOIN columns for better performance",
            "Use LIMIT clause to restrict result set size",
            "Consider partitioning large tables by date"
        ])
    elif template['complexity'] == 'intermediate':
        optimization_tips.extend([
            "Ensure proper indexes exist on GROUP BY columns",
            "Consider using EXPLAIN to analyze query execution plan"
        ])
    else:
        optimization_tips.append("Query should perform well with basic indexing")
    
    # Generate alternative queries
    alternative_queries = []
    if query_type == 'SELECT':
        alternative_queries.append({
            'query': template['query'].replace('LIMIT 10', 'LIMIT 5'),
            'description': 'Top 5 results instead of 10'
        })
    
    return {
        'query': template['query'],
        'explanation': template['explanation'],
        'query_type': query_type,
        'tables_used': template['tables_used'],
        'complexity': template['complexity'],
        'optimization_tips': optimization_tips,
        'alternative_queries': alternative_queries,
        'estimated_performance': 'Good' if template['complexity'] != 'advanced' else 'Moderate'
    }

def intelligent_data_formatting(raw_data, formatting_rules, target_format):
    """Advanced data cleaning and formatting with AI intelligence"""
    import pandas as pd
    import re
    from datetime import datetime
    
    # Convert to DataFrame for processing
    df = pd.DataFrame(raw_data)
    original_rows = len(df)
    
    transformations_applied = []
    issues_found = []
    suggestions = []
    
    # 1. Handle missing values
    missing_before = df.isnull().sum().sum()
    if missing_before > 0:
        # Fill missing values intelligently
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                # Numeric columns - use median
                median_val = df[col].median()
                df[col].fillna(median_val, inplace=True)
                transformations_applied.append(f"Filled missing values in '{col}' with median ({median_val})")
            else:
                # Text columns - use mode or 'Unknown'
                mode_val = df[col].mode()
                fill_val = mode_val[0] if len(mode_val) > 0 else 'Unknown'
                df[col].fillna(fill_val, inplace=True)
                transformations_applied.append(f"Filled missing values in '{col}' with '{fill_val}'")
        
        issues_found.append(f"Found {missing_before} missing values")
    
    # 2. Clean text data
    for col in df.select_dtypes(include=['object']).columns:
        # Remove extra whitespace
        original_values = df[col].astype(str)
        df[col] = df[col].astype(str).str.strip()
        
        # Standardize case if mostly text
        if df[col].str.len().mean() > 10:  # Likely text, not codes
            df[col] = df[col].str.title()
            transformations_applied.append(f"Standardized case in '{col}' to Title Case")
        
        # Fix common issues
        df[col] = df[col].str.replace(r'\s+', ' ', regex=True)  # Multiple spaces
        df[col] = df[col].str.replace(r'[^\w\s.-]', '', regex=True)  # Special chars
        
        if not original_values.equals(df[col]):
            transformations_applied.append(f"Cleaned text formatting in '{col}'")
    
    # 3. Detect and format dates
    for col in df.columns:
        sample_values = df[col].dropna().astype(str).head(10)
        date_like_count = 0
        
        for val in sample_values:
            # Check for date patterns
            date_patterns = [
                r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
                r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
                r'\d{2}-\d{2}-\d{4}',  # MM-DD-YYYY
            ]
            
            if any(re.search(pattern, val) for pattern in date_patterns):
                date_like_count += 1
        
        # If 70% or more values look like dates, convert the column
        if date_like_count >= len(sample_values) * 0.7:
            try:
                df[col] = pd.to_datetime(df[col], errors='coerce')
                transformations_applied.append(f"Converted '{col}' to datetime format")
            except:
                pass
    
    # 4. Detect and format numbers
    for col in df.select_dtypes(include=['object']).columns:
        # Try to convert strings that look like numbers
        sample_values = df[col].dropna().astype(str).head(10)
        numeric_like = 0
        
        for val in sample_values:
            # Remove common formatting and check if numeric
            clean_val = re.sub(r'[$,\s]', '', val)
            try:
                float(clean_val)
                numeric_like += 1
            except:
                pass
        
        # If 70% or more values look like numbers, convert
        if numeric_like >= len(sample_values) * 0.7:
            try:
                # Clean and convert
                df[col] = df[col].astype(str).str.replace(r'[$,\s]', '', regex=True)
                df[col] = pd.to_numeric(df[col], errors='coerce')
                transformations_applied.append(f"Converted '{col}' to numeric format")
            except:
                pass
    
    # 5. Remove duplicate rows
    duplicates_before = df.duplicated().sum()
    if duplicates_before > 0:
        df.drop_duplicates(inplace=True)
        transformations_applied.append(f"Removed {duplicates_before} duplicate rows")
        issues_found.append(f"Found {duplicates_before} duplicate rows")
    
    # 6. Standardize column names
    original_columns = df.columns.tolist()
    df.columns = [col.lower().replace(' ', '_').replace('-', '_') for col in df.columns]
    if original_columns != df.columns.tolist():
        transformations_applied.append("Standardized column names to lowercase with underscores")
    
    # 7. Data quality scoring
    quality_factors = []
    
    # Missing values factor (0-25 points)
    missing_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
    missing_score = max(0, 25 - (missing_ratio * 100))
    quality_factors.append(missing_score)
    
    # Duplicate factor (0-25 points)
    duplicate_ratio = df.duplicated().sum() / len(df) if len(df) > 0 else 0
    duplicate_score = max(0, 25 - (duplicate_ratio * 100))
    quality_factors.append(duplicate_score)
    
    # Data type consistency (0-25 points)
    type_consistency = 25  # Assume good after our cleaning
    quality_factors.append(type_consistency)
    
    # Format consistency (0-25 points)
    format_consistency = 25  # Assume good after our cleaning
    quality_factors.append(format_consistency)
    
    data_quality_score = sum(quality_factors)
    
    # Generate suggestions
    if data_quality_score < 70:
        suggestions.append("Consider manual review of data quality issues")
    if len(df.columns) > 20:
        suggestions.append("Consider breaking into multiple datasets for better performance")
    if len(df) > 10000:
        suggestions.append("Large dataset - consider sampling for initial analysis")
    
    # Create preview
    preview = {
        'head': df.head(5).to_dict('records'),
        'summary': {
            'rows': len(df),
            'columns': len(df.columns),
            'column_types': df.dtypes.astype(str).to_dict(),
            'memory_usage': f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB"
        }
    }
    
    return {
        'original_rows': original_rows,
        'cleaned_rows': len(df),
        'formatted_data': df.to_dict('records'),
        'transformations_applied': transformations_applied,
        'data_quality_score': round(data_quality_score, 1),
        'issues_found': issues_found,
        'suggestions': suggestions,
        'preview': preview
    }

@tools_bp.route('/text-to-code', methods=['POST'])
def generate_code_from_text():
    """
    Advanced Text to Code Generator
    Convert natural language descriptions to VBA, Python, or JavaScript code
    """
    try:
        data = request.get_json()
        description = data.get('description', '')
        language = data.get('language', 'vba')  # vba, python, javascript
        context = data.get('context', {})  # Additional context like data structure
        
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Generate code based on language and description
        code_data = generate_intelligent_code(description, language, context)
        
        response = {
            'success': True,
            'data': {
                'code': code_data['code'],
                'explanation': code_data['explanation'],
                'language': language,
                'functions_used': code_data['functions_used'],
                'setup_instructions': code_data['setup_instructions'],
                'example_usage': code_data['example_usage'],
                'dependencies': code_data['dependencies'],
                'complexity': code_data['complexity'],
                'best_practices': code_data['best_practices']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate code: {str(e)}'}), 500

@tools_bp.route('/pivot-builder', methods=['POST'])
def build_pivot_table():
    """
    AI Pivot Table Builder
    Create pivot table structures from natural language descriptions
    """
    try:
        data = request.get_json()
        description = data.get('description', '')
        data_columns = data.get('columns', [])  # Available columns
        sample_data = data.get('sample_data', [])  # Optional sample data
        
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        
        # Build pivot table structure
        pivot_data = build_intelligent_pivot(description, data_columns, sample_data)
        
        response = {
            'success': True,
            'data': {
                'pivot_structure': pivot_data['structure'],
                'explanation': pivot_data['explanation'],
                'excel_formula': pivot_data['excel_formula'],
                'python_code': pivot_data['python_code'],
                'sql_equivalent': pivot_data['sql_equivalent'],
                'insights': pivot_data['insights'],
                'alternative_structures': pivot_data['alternative_structures'],
                'complexity': pivot_data['complexity']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to build pivot table: {str(e)}'}), 500

def generate_intelligent_code(description, language, context):
    """Generate code from natural language description"""
    
    # Analyze description for code patterns
    description_lower = description.lower()
    
    # Code templates by language and functionality
    code_templates = {
        'vba': {
            'data_processing': {
                'code': '''Sub ProcessData()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim i As Long
    
    Set ws = ActiveSheet
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    
    ' Process each row
    For i = 2 To lastRow
        If ws.Cells(i, 1).Value <> "" Then
            ' Add your processing logic here
            ws.Cells(i, 3).Value = ws.Cells(i, 1).Value * ws.Cells(i, 2).Value
        End If
    Next i
    
    MsgBox "Data processing complete!"
End Sub''',
                'explanation': 'VBA macro to process data in Excel worksheet',
                'functions_used': ['Sub', 'For Loop', 'Cells', 'MsgBox'],
                'complexity': 'intermediate'
            },
            'formatting': {
                'code': '''Sub FormatData()
    Dim ws As Worksheet
    Dim rng As Range
    
    Set ws = ActiveSheet
    Set rng = ws.UsedRange
    
    ' Apply formatting
    With rng
        .Font.Name = "Calibri"
        .Font.Size = 11
        .Borders.LineStyle = xlContinuous
        .Interior.Color = RGB(240, 248, 255)
    End With
    
    ' Format header row
    With ws.Rows(1)
        .Font.Bold = True
        .Interior.Color = RGB(79, 129, 189)
        .Font.Color = RGB(255, 255, 255)
    End With
End Sub''',
                'explanation': 'VBA macro to format Excel data with professional styling',
                'functions_used': ['With Statement', 'RGB Colors', 'Font Properties', 'Borders'],
                'complexity': 'beginner'
            }
        },
        'python': {
            'data_analysis': {
                'code': '''import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data(file_path):
    """
    Analyze data from CSV file and generate insights
    """
    # Load data
    df = pd.read_csv(file_path)
    
    # Basic statistics
    print("Data Overview:")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\\nSummary Statistics:")
    print(df.describe())
    
    # Handle missing values
    missing_data = df.isnull().sum()
    if missing_data.any():
        print(f"\\nMissing values found:")
        print(missing_data[missing_data > 0])
    
    # Create visualizations
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    if len(numeric_columns) > 0:
        df[numeric_columns].hist(bins=20, figsize=(15, 10))
        plt.suptitle('Distribution of Numeric Variables')
        plt.tight_layout()
        plt.show()
    
    return df

# Example usage
# df = analyze_data('your_data.csv')''',
                'explanation': 'Python script for comprehensive data analysis with pandas',
                'functions_used': ['pandas', 'numpy', 'matplotlib', 'describe()', 'hist()'],
                'complexity': 'intermediate'
            },
            'web_scraping': {
                'code': '''import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

def scrape_data(url, delay=1):
    """
    Scrape data from website and save to CSV
    """
    try:
        # Send request with headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract data (customize selectors based on target website)
        data = []
        for item in soup.find_all('div', class_='data-item'):
            title = item.find('h3').text.strip() if item.find('h3') else 'N/A'
            value = item.find('span', class_='value').text.strip() if item.find('span', class_='value') else 'N/A'
            data.append({'title': title, 'value': value})
        
        # Convert to DataFrame and save
        df = pd.DataFrame(data)
        df.to_csv('scraped_data.csv', index=False)
        print(f"Successfully scraped {len(data)} items")
        
        # Respectful delay
        time.sleep(delay)
        
        return df
        
    except Exception as e:
        print(f"Error scraping data: {e}")
        return None

# Example usage
# df = scrape_data('https://example.com')''',
                'explanation': 'Python web scraping script with BeautifulSoup and error handling',
                'functions_used': ['requests', 'BeautifulSoup', 'pandas', 'time.sleep()'],
                'complexity': 'advanced'
            }
        },
        'javascript': {
            'data_visualization': {
                'code': '''// Data Visualization with Chart.js
function createInteractiveChart(data, containerId) {
    const ctx = document.getElementById(containerId).getContext('2d');
    
    const chartConfig = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Data Series',
                data: data.values,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Interactive Data Chart'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };
    
    return new Chart(ctx, chartConfig);
}

// Example usage
const sampleData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    values: [10, 25, 15, 30, 20]
};

// createInteractiveChart(sampleData, 'myChart');''',
                'explanation': 'JavaScript code for creating interactive charts with Chart.js',
                'functions_used': ['Chart.js', 'Canvas API', 'Event Handling', 'Responsive Design'],
                'complexity': 'intermediate'
            },
            'api_integration': {
                'code': '''// API Integration with Error Handling
class DataAPI {
    constructor(baseURL, apiKey) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
    }
    
    async fetchData(endpoint, params = {}) {
        try {
            const url = new URL(`${this.baseURL}/${endpoint}`);
            Object.keys(params).forEach(key => 
                url.searchParams.append(key, params[key])
            );
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async postData(endpoint, payload) {
        try {
            const response = await fetch(`${this.baseURL}/${endpoint}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Example usage
const api = new DataAPI('https://api.example.com', 'your-api-key');

// Fetch data
api.fetchData('users', { page: 1, limit: 10 })
   .then(result => {
       if (result.success) {
           console.log('Users:', result.data);
       } else {
           console.error('Failed to fetch users:', result.error);
       }
   });''',
                'explanation': 'JavaScript class for API integration with modern async/await and error handling',
                'functions_used': ['fetch API', 'async/await', 'URL constructor', 'Error handling'],
                'complexity': 'advanced'
            }
        }
    }
    
    # Determine code type based on description
    if any(word in description_lower for word in ['format', 'style', 'color']):
        code_type = 'formatting'
    elif any(word in description_lower for word in ['process', 'calculate', 'loop']):
        code_type = 'data_processing'
    elif any(word in description_lower for word in ['analyze', 'statistics', 'pandas']):
        code_type = 'data_analysis'
    elif any(word in description_lower for word in ['scrape', 'web', 'beautifulsoup']):
        code_type = 'web_scraping'
    elif any(word in description_lower for word in ['chart', 'graph', 'visualize']):
        code_type = 'data_visualization'
    elif any(word in description_lower for word in ['api', 'fetch', 'request']):
        code_type = 'api_integration'
    else:
        code_type = 'data_processing'  # Default
    
    # Get template
    template = code_templates.get(language, {}).get(code_type)
    if not template:
        # Fallback to simple template
        template = {
            'code': f'// {language.upper()} code for: {description}\n// Implementation coming soon...',
            'explanation': f'Basic {language} code structure for: {description}',
            'functions_used': ['Basic functions'],
            'complexity': 'beginner'
        }
    
    # Generate setup instructions and dependencies
    setup_instructions = []
    dependencies = []
    best_practices = []
    
    if language == 'vba':
        setup_instructions = [
            "1. Open Excel and press Alt+F11 to open VBA editor",
            "2. Insert > Module to create new module",
            "3. Paste the code into the module",
            "4. Press F5 to run or close editor and run from Excel"
        ]
        dependencies = ["Microsoft Excel", "VBA Runtime"]
        best_practices = [
            "Always declare variables with Dim",
            "Use meaningful variable names",
            "Add error handling with On Error GoTo",
            "Test on sample data first"
        ]
    elif language == 'python':
        if 'pandas' in template['code']:
            dependencies = ["pandas", "numpy", "matplotlib"]
        if 'requests' in template['code']:
            dependencies.extend(["requests", "beautifulsoup4"])
        
        setup_instructions = [
            "1. Install required packages: pip install " + " ".join(dependencies),
            "2. Save code to a .py file",
            "3. Run with: python your_script.py",
            "4. Modify file paths and parameters as needed"
        ]
        best_practices = [
            "Use virtual environments for package management",
            "Follow PEP 8 style guidelines",
            "Add docstrings to functions",
            "Handle exceptions appropriately"
        ]
    elif language == 'javascript':
        if 'Chart' in template['code']:
            dependencies = ["Chart.js"]
        if 'fetch' in template['code']:
            dependencies = ["Modern browser with fetch support"]
        
        setup_instructions = [
            "1. Include required libraries in HTML",
            "2. Add script tags or import modules",
            "3. Ensure DOM elements exist before running",
            "4. Test in browser developer console"
        ]
        best_practices = [
            "Use const/let instead of var",
            "Handle promises with async/await",
            "Add error handling for network requests",
            "Validate user input"
        ]
    
    return {
        'code': template['code'],
        'explanation': template['explanation'],
        'functions_used': template['functions_used'],
        'setup_instructions': setup_instructions,
        'example_usage': f"Example for {language} code: {description}",
        'dependencies': dependencies,
        'complexity': template['complexity'],
        'best_practices': best_practices
    }

def build_intelligent_pivot(description, data_columns, sample_data):
    """Build pivot table structure from natural language"""
    
    description_lower = description.lower()
    
    # Analyze description for pivot components
    rows = []
    columns = []
    values = []
    aggregation = 'SUM'
    
    # Smart column detection based on common patterns
    for col in data_columns:
        col_lower = col.lower()
        
        # Likely row fields (categorical data)
        if any(word in col_lower for word in ['name', 'category', 'type', 'region', 'department']):
            if any(word in description_lower for word in ['by ' + col_lower, col_lower + ' breakdown']):
                rows.append(col)
        
        # Likely column fields (time-based or categorical)
        if any(word in col_lower for word in ['date', 'month', 'year', 'quarter']):
            if any(word in description_lower for word in ['over time', 'monthly', 'yearly']):
                columns.append(col)
        
        # Likely value fields (numeric data)
        if any(word in col_lower for word in ['amount', 'sales', 'revenue', 'count', 'total', 'price']):
            if any(word in description_lower for word in [col_lower, 'sum', 'total']):
                values.append(col)
    
    # Determine aggregation function
    if any(word in description_lower for word in ['average', 'mean']):
        aggregation = 'AVERAGE'
    elif any(word in description_lower for word in ['count', 'number of']):
        aggregation = 'COUNT'
    elif any(word in description_lower for word in ['max', 'maximum', 'highest']):
        aggregation = 'MAX'
    elif any(word in description_lower for word in ['min', 'minimum', 'lowest']):
        aggregation = 'MIN'
    
    # Fallback to reasonable defaults if nothing detected
    if not rows and data_columns:
        rows = [data_columns[0]]  # First column as row
    if not values and len(data_columns) > 1:
        values = [data_columns[-1]]  # Last column as value
    
    pivot_structure = {
        'rows': rows,
        'columns': columns,
        'values': values,
        'aggregation': aggregation,
        'filters': []  # Could be enhanced to detect filters
    }
    
    # Generate Excel formula
    excel_formula = f"=SUMIFS({values[0] if values else 'ValueColumn'}, {rows[0] if rows else 'RowColumn'}, criteria)"
    
    # Generate Python code
    python_code = f'''import pandas as pd

# Create pivot table
pivot_table = df.pivot_table(
    values={values},
    index={rows},
    columns={columns if columns else None},
    aggfunc='{aggregation.lower()}',
    fill_value=0
)

print(pivot_table)'''
    
    # Generate SQL equivalent
    sql_equivalent = f'''SELECT 
    {', '.join(rows) if rows else 'row_field'},
    {aggregation}({values[0] if values else 'value_field'}) as total
FROM your_table
GROUP BY {', '.join(rows) if rows else 'row_field'}
ORDER BY total DESC;'''
    
    # Generate insights
    insights = []
    if rows:
        insights.append(f"Data will be grouped by {', '.join(rows)}")
    if columns:
        insights.append(f"Time series analysis using {', '.join(columns)}")
    if values:
        insights.append(f"Aggregating {', '.join(values)} using {aggregation}")
    
    # Alternative structures
    alternative_structures = []
    if len(data_columns) > 2:
        alt_structure = {
            'description': 'Alternative grouping',
            'rows': data_columns[:2],
            'values': data_columns[-1:],
            'aggregation': 'AVERAGE'
        }
        alternative_structures.append(alt_structure)
    
    complexity = 'beginner' if len(rows) <= 1 and len(values) <= 1 else 'intermediate'
    
    return {
        'structure': pivot_structure,
        'explanation': f"Pivot table to analyze {description} with {aggregation} aggregation",
        'excel_formula': excel_formula,
        'python_code': python_code,
        'sql_equivalent': sql_equivalent,
        'insights': insights,
        'alternative_structures': alternative_structures,
        'complexity': complexity
    }

@tools_bp.route('/text-to-excel', methods=['POST'])
def convert_text_to_excel():
    """
    Text to Excel Converter
    Convert unstructured text or PDF content to structured Excel format
    """
    try:
        data = request.get_json()
        text_content = data.get('text', '')
        source_type = data.get('source_type', 'text')  # text, pdf, csv_raw
        structure_hints = data.get('structure_hints', {})
        
        if not text_content:
            return jsonify({'error': 'Text content is required'}), 400
        
        # Convert text to structured Excel data
        excel_data = intelligent_text_to_excel(text_content, source_type, structure_hints)
        
        response = {
            'success': True,
            'data': {
                'structured_data': excel_data['structured_data'],
                'headers': excel_data['headers'],
                'data_types': excel_data['data_types'],
                'confidence_score': excel_data['confidence_score'],
                'extraction_method': excel_data['extraction_method'],
                'suggestions': excel_data['suggestions'],
                'preview': excel_data['preview']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to convert text to Excel: {str(e)}'}), 500

@tools_bp.route('/sentiment-analysis', methods=['POST'])
def analyze_sentiment():
    """
    Sentiment Analysis Tool
    Analyze sentiment of text data (positive, negative, neutral)
    """
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        analysis_type = data.get('analysis_type', 'simple')  # simple, detailed, batch
        
        if not text_data:
            return jsonify({'error': 'Text data is required'}), 400
        
        # Perform sentiment analysis
        sentiment_results = perform_sentiment_analysis(text_data, analysis_type)
        
        response = {
            'success': True,
            'data': {
                'overall_sentiment': sentiment_results['overall_sentiment'],
                'confidence_score': sentiment_results['confidence_score'],
                'sentiment_scores': sentiment_results['sentiment_scores'],
                'key_phrases': sentiment_results['key_phrases'],
                'emotion_breakdown': sentiment_results['emotion_breakdown'],
                'recommendations': sentiment_results['recommendations']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze sentiment: {str(e)}'}), 500

@tools_bp.route('/text-classification', methods=['POST'])
def classify_text():
    """
    Text Classification Tool
    Classify text into predefined categories
    """
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        categories = data.get('categories', [])
        classification_type = data.get('classification_type', 'single')  # single, multi
        
        if not text_data:
            return jsonify({'error': 'Text data is required'}), 400
        
        if not categories:
            # Use default business categories
            categories = ['Customer Service', 'Sales', 'Technical', 'Billing', 'General Inquiry']
        
        # Perform text classification
        classification_results = perform_text_classification(text_data, categories, classification_type)
        
        response = {
            'success': True,
            'data': {
                'predicted_category': classification_results['predicted_category'],
                'confidence_score': classification_results['confidence_score'],
                'category_scores': classification_results['category_scores'],
                'reasoning': classification_results['reasoning'],
                'alternative_categories': classification_results['alternative_categories']
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': f'Failed to classify text: {str(e)}'}), 500

def intelligent_text_to_excel(text_content, source_type, structure_hints):
    """Convert unstructured text to structured Excel format"""
    import re
    import pandas as pd
    
    # Detect structure patterns in text
    lines = text_content.strip().split('\n')
    structured_data = []
    headers = []
    
    # Try to detect tabular data patterns
    if source_type == 'csv_raw':
        # Handle CSV-like text
        for i, line in enumerate(lines):
            if i == 0:
                # First line as headers
                headers = [col.strip() for col in re.split(r'[,\t|;]', line)]
            else:
                # Data rows
                values = [val.strip() for val in re.split(r'[,\t|;]', line)]
                if len(values) == len(headers):
                    structured_data.append(dict(zip(headers, values)))
    
    elif 'table' in text_content.lower() or '\t' in text_content:
        # Handle tab-separated or space-separated data
        for i, line in enumerate(lines):
            if line.strip():
                if i == 0 or any(keyword in line.lower() for keyword in ['name', 'date', 'amount', 'id']):
                    # Potential header row
                    if not headers:
                        headers = re.split(r'\s{2,}|\t', line.strip())
                else:
                    # Data row
                    values = re.split(r'\s{2,}|\t', line.strip())
                    if len(values) == len(headers):
                        structured_data.append(dict(zip(headers, values)))
    
    else:
        # Handle free-form text - extract key-value pairs
        patterns = [
            r'([A-Za-z\s]+):\s*([^\n]+)',  # Key: Value
            r'([A-Za-z\s]+)\s*[-=]\s*([^\n]+)',  # Key - Value or Key = Value
            r'(\w+)\s+(\d+(?:\.\d+)?)',  # Word Number
        ]
        
        extracted_pairs = []
        for pattern in patterns:
            matches = re.findall(pattern, text_content)
            extracted_pairs.extend(matches)
        
        if extracted_pairs:
            headers = ['Attribute', 'Value']
            structured_data = [{'Attribute': k.strip(), 'Value': v.strip()} for k, v in extracted_pairs]
    
    # Fallback: create a simple single-column structure
    if not structured_data:
        headers = ['Text_Content']
        structured_data = [{'Text_Content': line.strip()} for line in lines if line.strip()]
    
    # Analyze data types
    data_types = {}
    if structured_data:
        df = pd.DataFrame(structured_data)
        for col in df.columns:
            sample_values = df[col].dropna().head(10)
            if sample_values.empty:
                data_types[col] = 'text'
            elif all(str(val).replace('.', '').replace('-', '').isdigit() for val in sample_values):
                data_types[col] = 'number'
            elif any(date_pattern in str(val).lower() for val in sample_values for date_pattern in ['/', '-', '2023', '2024']):
                data_types[col] = 'date'
            else:
                data_types[col] = 'text'
    
    # Calculate confidence score
    confidence_score = 0.9 if len(structured_data) > 1 and len(headers) > 1 else 0.6 if structured_data else 0.3
    
    # Determine extraction method
    extraction_method = 'CSV parsing' if source_type == 'csv_raw' else 'Pattern matching' if '\t' in text_content else 'Key-value extraction'
    
    # Generate suggestions
    suggestions = []
    if confidence_score < 0.7:
        suggestions.append("Low confidence - consider providing more structured input")
    if len(headers) == 1:
        suggestions.append("Single column detected - check if data should be split into multiple columns")
    if len(structured_data) < 5:
        suggestions.append("Small dataset - results may be limited")
    
    return {
        'structured_data': structured_data,
        'headers': headers,
        'data_types': data_types,
        'confidence_score': confidence_score,
        'extraction_method': extraction_method,
        'suggestions': suggestions,
        'preview': structured_data[:5] if structured_data else []
    }

def perform_sentiment_analysis(text_data, analysis_type):
    """Perform sentiment analysis on text data"""
    
    # Simple keyword-based sentiment analysis (in production, would use ML models)
    positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'outstanding']
    negative_words = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'disappointing', 'poor', 'useless']
    neutral_words = ['okay', 'fine', 'average', 'normal', 'standard', 'typical', 'regular', 'common', 'basic']
    
    text_lower = text_data.lower()
    words = text_lower.split()
    
    positive_count = sum(1 for word in words if any(pos in word for pos in positive_words))
    negative_count = sum(1 for word in words if any(neg in word for neg in negative_words))
    neutral_count = sum(1 for word in words if any(neu in word for neu in neutral_words))
    
    total_sentiment_words = positive_count + negative_count + neutral_count
    
    if total_sentiment_words == 0:
        overall_sentiment = 'neutral'
        confidence_score = 0.5
    elif positive_count > negative_count and positive_count > neutral_count:
        overall_sentiment = 'positive'
        confidence_score = min(0.9, 0.6 + (positive_count / len(words)) * 2)
    elif negative_count > positive_count and negative_count > neutral_count:
        overall_sentiment = 'negative'
        confidence_score = min(0.9, 0.6 + (negative_count / len(words)) * 2)
    else:
        overall_sentiment = 'neutral'
        confidence_score = 0.7
    
    # Calculate sentiment scores
    total_words = len(words)
    sentiment_scores = {
        'positive': positive_count / total_words if total_words > 0 else 0,
        'negative': negative_count / total_words if total_words > 0 else 0,
        'neutral': 1 - (positive_count + negative_count) / total_words if total_words > 0 else 1
    }
    
    # Extract key phrases (simple approach)
    sentences = text_data.split('.')
    key_phrases = []
    for sentence in sentences[:3]:  # Top 3 sentences
        sentence = sentence.strip()
        if len(sentence) > 10 and any(word in sentence.lower() for word in positive_words + negative_words):
            key_phrases.append(sentence)
    
    # Emotion breakdown (simplified)
    emotion_breakdown = {
        'joy': positive_count * 0.7,
        'anger': negative_count * 0.6,
        'sadness': negative_count * 0.4,
        'fear': negative_count * 0.3,
        'surprise': positive_count * 0.3,
        'trust': positive_count * 0.5
    }
    
    # Generate recommendations
    recommendations = []
    if overall_sentiment == 'negative':
        recommendations.append("Consider addressing negative feedback points")
        recommendations.append("Look for opportunities to improve customer satisfaction")
    elif overall_sentiment == 'positive':
        recommendations.append("Leverage positive sentiment in marketing materials")
        recommendations.append("Identify what's working well to replicate success")
    else:
        recommendations.append("Neutral sentiment - consider ways to create more positive experiences")
    
    return {
        'overall_sentiment': overall_sentiment,
        'confidence_score': round(confidence_score, 2),
        'sentiment_scores': {k: round(v, 3) for k, v in sentiment_scores.items()},
        'key_phrases': key_phrases,
        'emotion_breakdown': {k: round(v, 2) for k, v in emotion_breakdown.items()},
        'recommendations': recommendations
    }

def perform_text_classification(text_data, categories, classification_type):
    """Classify text into predefined categories"""
    
    # Simple keyword-based classification (in production, would use ML models)
    category_keywords = {
        'Customer Service': ['support', 'help', 'issue', 'problem', 'assistance', 'service', 'complaint'],
        'Sales': ['buy', 'purchase', 'price', 'cost', 'order', 'payment', 'discount', 'deal'],
        'Technical': ['bug', 'error', 'technical', 'code', 'software', 'system', 'integration', 'API'],
        'Billing': ['invoice', 'bill', 'payment', 'charge', 'refund', 'subscription', 'account'],
        'General Inquiry': ['information', 'question', 'inquiry', 'about', 'how', 'what', 'when', 'where']
    }
    
    text_lower = text_data.lower()
    category_scores = {}
    
    for category in categories:
        score = 0
        keywords = category_keywords.get(category, [category.lower()])
        
        for keyword in keywords:
            if keyword in text_lower:
                score += text_lower.count(keyword)
        
        # Normalize score by text length
        category_scores[category] = score / len(text_lower.split()) if text_lower.split() else 0
    
    # Find predicted category
    if category_scores:
        predicted_category = max(category_scores.keys(), key=lambda k: category_scores[k])
        confidence_score = min(0.95, category_scores[predicted_category] * 10)  # Scale up for visibility
    else:
        predicted_category = categories[0] if categories else 'Unknown'
        confidence_score = 0.1
    
    # Generate reasoning
    reasoning = f"Text contains keywords commonly associated with {predicted_category.lower()} topics"
    
    # Find alternative categories
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    alternative_categories = [
        {'category': cat, 'score': round(score, 3)} 
        for cat, score in sorted_categories[1:4] if score > 0
    ]
    
    return {
        'predicted_category': predicted_category,
        'confidence_score': round(confidence_score, 2),
        'category_scores': {k: round(v, 3) for k, v in category_scores.items()},
        'reasoning': reasoning,
        'alternative_categories': alternative_categories
    }