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
from src.models.auth import db, User, Analysis, ChatConversation
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.excel_analysis import excel_bp
from src.routes.formula import formula_bp
from src.routes.google_sheets import google_sheets_bp

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

# Legacy support - redirect old API calls to v1
app.register_blueprint(user_bp, url_prefix='/api', name='user_legacy')
app.register_blueprint(excel_bp, url_prefix='/api/excel', name='excel_legacy')
app.register_blueprint(formula_bp, url_prefix='/api/formula', name='formula_legacy')
app.register_blueprint(google_sheets_bp, url_prefix='/api/google-sheets', name='google_sheets_legacy')

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
            'users': {
                'list': '/api/v1/users',
                'create': '/api/v1/users',
                'get': '/api/v1/users/{id}'
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
