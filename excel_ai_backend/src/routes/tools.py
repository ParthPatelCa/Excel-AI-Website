Rebuild frontend and copy to backend:
Bash

cd excel-ai-frontend
npm run build
cp -r dist/* ../excel_ai_backend/src/static/

Commit and push:
Bash

git add .
git commit -m "Fix deployment issues - ready for production"
git push origin mainfrom flask import Blueprint, request, jsonify
from models.user import db
from models.visualization import ToolGeneration
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
