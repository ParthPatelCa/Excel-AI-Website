from flask import Blueprint, jsonify, request
import pandas as pd
import requests
import re
from urllib.parse import urlparse, parse_qs
import io

google_sheets_bp = Blueprint('google_sheets', __name__)

@google_sheets_bp.route('/analyze_url', methods=['POST'])
def analyze_google_sheets_url():
    """Analyze data from a Google Sheets URL"""
    try:
        data = request.json
        if 'url' not in data:
            return jsonify({'error': 'Google Sheets URL is required'}), 400
        
        sheets_url = data['url']
        
        # Extract sheet ID and convert to CSV export URL
        csv_url = convert_to_csv_url(sheets_url)
        if not csv_url:
            return jsonify({'error': 'Invalid Google Sheets URL. Please ensure the sheet is publicly accessible.'}), 400
        
        # Download and parse the CSV data
        df = download_and_parse_csv(csv_url)
        if df is None:
            return jsonify({'error': 'Failed to download or parse the Google Sheets data. Please check if the sheet is publicly accessible.'}), 400
        
        # Import analysis functions from excel_analysis
        from .excel_analysis import generate_insights, generate_ai_insights
        
        # Generate insights using existing analysis pipeline
        insights = generate_insights(df)
        ai_insights = generate_ai_insights(df, insights)
        
        # Basic file information
        file_info = {
            'source': 'Google Sheets',
            'url': sheets_url,
            'rows': len(df),
            'columns': len(df.columns),
            'column_names': df.columns.tolist(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'preview': df.head(5).to_dict('records')
        }
        
        return jsonify({
            'success': True,
            'file_info': file_info,
            'data': df.to_dict('records'),
            'insights': insights,
            'ai_insights': ai_insights
        })
        
    except Exception as e:
        return jsonify({'error': f'Error analyzing Google Sheets: {str(e)}'}), 500

@google_sheets_bp.route('/query_url', methods=['POST'])
def query_google_sheets():
    """Handle natural language queries about Google Sheets data"""
    try:
        data = request.json
        if 'url' not in data or 'query' not in data:
            return jsonify({'error': 'Google Sheets URL and query are required'}), 400
        
        sheets_url = data['url']
        query = data['query']
        
        # Convert to CSV URL and download data
        csv_url = convert_to_csv_url(sheets_url)
        if not csv_url:
            return jsonify({'error': 'Invalid Google Sheets URL'}), 400
        
        df = download_and_parse_csv(csv_url)
        if df is None:
            return jsonify({'error': 'Failed to access Google Sheets data'}), 400
        
        # Import query processing function
        from .excel_analysis import process_natural_language_query
        
        # Process the query
        response = process_natural_language_query(df, query)
        
        return jsonify({
            'success': True,
            'response': response
        })
        
    except Exception as e:
        return jsonify({'error': f'Error processing query: {str(e)}'}), 500

def convert_to_csv_url(sheets_url):
    """Convert Google Sheets URL to CSV export URL"""
    try:
        # Extract sheet ID from various Google Sheets URL formats
        sheet_id = extract_sheet_id(sheets_url)
        if not sheet_id:
            return None
        
        # Extract gid (sheet tab ID) if present
        gid = extract_gid(sheets_url)
        
        # Construct CSV export URL
        if gid:
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
        else:
            csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
        
        return csv_url
        
    except Exception as e:
        print(f"Error converting URL: {e}")
        return None

def extract_sheet_id(url):
    """Extract sheet ID from Google Sheets URL"""
    # Pattern for Google Sheets URLs
    patterns = [
        r'/spreadsheets/d/([a-zA-Z0-9-_]+)',
        r'key=([a-zA-Z0-9-_]+)',
        r'/d/e/([a-zA-Z0-9-_]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def extract_gid(url):
    """Extract gid (sheet tab ID) from Google Sheets URL"""
    # Look for gid parameter in URL
    gid_match = re.search(r'[#&]gid=([0-9]+)', url)
    if gid_match:
        return gid_match.group(1)
    
    # Parse URL parameters
    parsed_url = urlparse(url)
    if parsed_url.fragment:
        # Check fragment for gid
        if 'gid=' in parsed_url.fragment:
            gid_match = re.search(r'gid=([0-9]+)', parsed_url.fragment)
            if gid_match:
                return gid_match.group(1)
    
    return None

def download_and_parse_csv(csv_url):
    """Download CSV data from URL and parse into DataFrame"""
    try:
        # Set headers to mimic browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Download the CSV data
        response = requests.get(csv_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Check if response contains CSV data
        if response.headers.get('content-type', '').startswith('text/csv') or 'text/plain' in response.headers.get('content-type', ''):
            # Parse CSV data
            csv_data = io.StringIO(response.text)
            df = pd.read_csv(csv_data)
            
            # Basic validation
            if df.empty:
                return None
            
            return df
        else:
            print(f"Unexpected content type: {response.headers.get('content-type')}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None
    except pd.errors.EmptyDataError:
        print("Empty CSV data")
        return None
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return None

@google_sheets_bp.route('/validate_url', methods=['POST'])
def validate_google_sheets_url():
    """Validate if a Google Sheets URL is accessible"""
    try:
        data = request.json
        if 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        sheets_url = data['url']
        
        # Extract sheet ID
        sheet_id = extract_sheet_id(sheets_url)
        if not sheet_id:
            return jsonify({
                'valid': False,
                'error': 'Invalid Google Sheets URL format'
            })
        
        # Try to convert to CSV URL
        csv_url = convert_to_csv_url(sheets_url)
        if not csv_url:
            return jsonify({
                'valid': False,
                'error': 'Could not generate CSV export URL'
            })
        
        # Test if the URL is accessible
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.head(csv_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return jsonify({
                'valid': True,
                'csv_url': csv_url,
                'sheet_id': sheet_id
            })
        else:
            return jsonify({
                'valid': False,
                'error': f'Sheet not accessible (HTTP {response.status_code}). Please ensure the sheet is publicly viewable.'
            })
            
    except requests.exceptions.RequestException as e:
        return jsonify({
            'valid': False,
            'error': f'Network error: {str(e)}'
        })
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': f'Validation error: {str(e)}'
        })

