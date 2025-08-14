"""
Vercel-compatible entry point for the Flask application
"""
import os
import sys
from pathlib import Path

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(current_dir))
sys.path.insert(0, str(src_dir))

# Set environment variables for Vercel
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('DATABASE_URL', 'sqlite:///vercel_app.db')

# Import and create the Flask app
from src.main import create_app

app = create_app()

# Vercel expects the app to be named 'app'
if __name__ == "__main__":
    app.run(debug=False)
