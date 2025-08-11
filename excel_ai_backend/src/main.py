import os
import sys
import time
from dotenv import load_dotenv
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load environment variables
load_dotenv()

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db as old_db
from src.models.auth import db, User, Analysis, ChatConversation, FormulaInteraction, ChatMessage, TelemetryMetric
# from src.models.connectors import DataConnector, ConnectorDataset, DataAnalysis
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.excel_analysis import excel_bp
from src.routes.formula import formula_bp
from src.routes.google_sheets import google_sheets_bp
from src.routes.telemetry import telemetry_bp
# from src.routes.chat import chat_bp
# from src.routes.features import features_bp
# from src.routes.connectors import connectors_bp
# from src.routes.analysis import analysis_bp
# from src.routes.visualize import visualize_bp
# from src.routes.data_prep import data_prep_bp
# from src.routes.enrich import enrich_bp
# from src.routes.tools import tools_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'fallback-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Enable CORS for all routes
CORS(app)

# API versioning
app.register_blueprint(auth_bp, url_prefix='/api/v1/auth', name='auth_v1')
app.register_blueprint(user_bp, url_prefix='/api/v1', name='user_v1')
app.register_blueprint(excel_bp, url_prefix='/api/v1/excel', name='excel_v1')
app.register_blueprint(formula_bp, url_prefix='/api/v1/formula', name='formula_v1')
app.register_blueprint(google_sheets_bp, url_prefix='/api/v1/google-sheets', name='google_sheets_v1')
app.register_blueprint(telemetry_bp, url_prefix='/api/v1/telemetry', name='telemetry_v1')
# app.register_blueprint(chat_bp, url_prefix='/api/v1/chat', name='chat_v1')
# app.register_blueprint(features_bp, url_prefix='/api/v1/features', name='features_v1')
# app.register_blueprint(connectors_bp, url_prefix='/api/v1/connectors', name='connectors_v1')
# app.register_blueprint(analysis_bp, url_prefix='/api/v1/analysis', name='analysis_v1')
# app.register_blueprint(visualize_bp, url_prefix='/api/v1/visualize', name='visualize_v1')
# app.register_blueprint(data_prep_bp, url_prefix='/api/v1/data-prep', name='data_prep_v1')
# app.register_blueprint(enrich_bp, url_prefix='/api/v1/enrich', name='enrich_v1')
# app.register_blueprint(tools_bp, url_prefix='/api/v1/tools', name='tools_v1')

# Legacy support - redirect old API calls to v1
app.register_blueprint(user_bp, url_prefix='/api', name='user_legacy')
app.register_blueprint(excel_bp, url_prefix='/api/excel', name='excel_legacy')
app.register_blueprint(formula_bp, url_prefix='/api/formula', name='formula_legacy')
app.register_blueprint(google_sheets_bp, url_prefix='/api/google-sheets', name='google_sheets_legacy')
# app.register_blueprint(connectors_bp, url_prefix='/api/connectors', name='connectors_legacy')
# app.register_blueprint(analysis_bp, url_prefix='/api/analysis', name='analysis_legacy')
# app.register_blueprint(visualize_bp, url_prefix='/api/visualize', name='visualize_legacy')
# app.register_blueprint(data_prep_bp, url_prefix='/api/data-prep', name='data_prep_legacy')
# app.register_blueprint(enrich_bp, url_prefix='/api/enrich', name='enrich_legacy')
# app.register_blueprint(tools_bp, url_prefix='/api/tools', name='tools_legacy')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': time.time(),
        'environment': os.getenv('FLASK_ENV', 'production')
    })

# API info endpoint
@app.route('/api/v1')
def api_info():
    return jsonify({
        'version': '1.0.0',
        'endpoints': {
            'excel': {
                'upload': '/api/v1/excel/upload',
                'analyze': '/api/v1/excel/analyze',
                'query': '/api/v1/excel/query',
                'formulas': '/api/v1/excel/formulas'
            },
            'formula': {
                'generate': '/api/v1/formula/generate',
                'explain': '/api/v1/formula/explain',
                'debug': '/api/v1/formula/debug',
                'history': '/api/v1/formula/history',
                'history_item': '/api/v1/formula/history/{id}'
            },
            'google_sheets': {
                'analyze_url': '/api/v1/google-sheets/analyze_url',
                'query_url': '/api/v1/google-sheets/query_url'
            },
            'chat': {
                'list_conversations': '/api/v1/chat/conversations',
                'create_conversation': '/api/v1/chat/conversations',
                'get_conversation': '/api/v1/chat/conversations/{id}',
                'add_message': '/api/v1/chat/conversations/{id}/messages',
                'export': '/api/v1/chat/conversations/{id}/export'
            },
            'telemetry': {
                'user_metrics': '/api/v1/telemetry/metrics',
                'health': '/api/v1/telemetry/health',
                'admin_metrics': '/api/v1/telemetry/admin/metrics'
            },
            'connectors': {
                'list': '/api/v1/connectors',
                'create': '/api/v1/connectors',
                'get': '/api/v1/connectors/{id}',
                'update': '/api/v1/connectors/{id}',
                'delete': '/api/v1/connectors/{id}',
                'upload': '/api/v1/connectors/{id}/upload',
                'sync': '/api/v1/connectors/{id}/sync',
                'types': '/api/v1/connectors/types'
            },
            'analysis': {
                'list': '/api/v1/analysis',
                'create': '/api/v1/analysis',
                'get': '/api/v1/analysis/{id}',
                'delete': '/api/v1/analysis/{id}',
                'types': '/api/v1/analysis/types'
            },
            'visualize': {
                'create': '/api/v1/visualize/create',
                'types': '/api/v1/visualize/types',
                'suggest': '/api/v1/visualize/suggest',
                'list': '/api/v1/visualize/list'
            },
            'data_prep': {
                'analyze': '/api/v1/data-prep/analyze',
                'clean': '/api/v1/data-prep/clean',
                'blend': '/api/v1/data-prep/blend',
                'transform': '/api/v1/data-prep/transform'
            },
            'enrich': {
                'sentiment': '/api/v1/enrich/sentiment',
                'keywords': '/api/v1/enrich/keywords',
                'classify': '/api/v1/enrich/classify',
                'summarize': '/api/v1/enrich/summarize',
                'custom': '/api/v1/enrich/custom'
            },
            'tools': {
                'excel_formula': '/api/v1/tools/excel-formula',
                'sql_query': '/api/v1/tools/sql-query',
                'vba_script': '/api/v1/tools/vba-script',
                'pdf_convert': '/api/v1/tools/pdf-to-excel',
                'text_convert': '/api/v1/tools/text-to-excel',
                'regex_generator': '/api/v1/tools/regex-generator',
                'list': '/api/v1/tools/list',
                'history': '/api/v1/tools/history'
            },
            'users': {
                'list': '/api/v1/users',
                'create': '/api/v1/users',
                'get': '/api/v1/users/{id}'
            },
            'features': {
                'data_cleaning': '/api/v1/features/data-cleaning',
                'chart_builder': '/api/v1/features/chart-builder',
                'templates': '/api/v1/features/templates',
                'macro_generation': '/api/v1/features/macro-generation',
                'predictive_analytics': '/api/v1/features/predictive-analytics',
                'collaboration': '/api/v1/features/collaboration',
                'developer_api': '/api/v1/features/developer-api',
                'add_in': '/api/v1/features/add-in',
                'multilingual': '/api/v1/features/multilingual',
                'usage_analytics': '/api/v1/features/usage-analytics'
            }
        }
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5001))
    app.run(host=host, port=port, debug=debug_mode)
