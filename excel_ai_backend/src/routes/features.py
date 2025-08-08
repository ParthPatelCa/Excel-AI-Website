from flask import Blueprint, jsonify

features_bp = Blueprint('features', __name__)

def _placeholder(name: str):
    """Return a standard placeholder response for in-progress features."""
    return jsonify({"feature": name, "status": "in-progress"})

@features_bp.route('/data-cleaning', methods=['GET'])
def data_cleaning():
    return _placeholder('Automated Data Cleaning')

@features_bp.route('/chart-builder', methods=['GET'])
def chart_builder():
    return _placeholder('Interactive Chart & Dashboard Builder')

@features_bp.route('/templates', methods=['GET'])
def templates():
    return _placeholder('Template & Snippet Library')

@features_bp.route('/macro-generation', methods=['GET'])
def macro_generation():
    return _placeholder('Macro / Script Generation')

@features_bp.route('/predictive-analytics', methods=['GET'])
def predictive_analytics():
    return _placeholder('Predictive & Prescriptive Analytics')

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
