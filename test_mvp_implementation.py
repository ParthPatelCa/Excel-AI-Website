#!/usr/bin/env python3
"""
MVP Implementation Validation Script
Tests the complete MVP functionality including backend and frontend
"""
import requests
import json
import os
import time
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_status(message, status="info"):
    if status == "success":
        print(f"{Colors.GREEN}✅ {message}{Colors.END}")
    elif status == "error":
        print(f"{Colors.RED}❌ {message}{Colors.END}")
    elif status == "warning":
        print(f"{Colors.YELLOW}⚠️ {message}{Colors.END}")
    elif status == "info":
        print(f"{Colors.BLUE}ℹ️ {message}{Colors.END}")
    else:
        print(f"{Colors.CYAN}🔍 {message}{Colors.END}")

def test_backend_availability():
    """Test if backend is accessible"""
    print_status("Testing backend availability...")
    try:
        response = requests.get("http://localhost:5001/", timeout=5)
        if response.status_code == 200:
            print_status("Backend is running and accessible", "success")
            return True
        else:
            print_status(f"Backend responded with status {response.status_code}", "warning")
            return False
    except requests.exceptions.ConnectionError:
        print_status("Backend is not accessible on port 5001", "error")
        return False
    except Exception as e:
        print_status(f"Error checking backend: {e}", "error")
        return False

def test_frontend_availability():
    """Test if frontend is accessible"""
    print_status("Testing frontend availability...")
    try:
        response = requests.get("http://localhost:5173/", timeout=5)
        if response.status_code == 200:
            print_status("Frontend is running and accessible", "success")
            return True
        else:
            print_status(f"Frontend responded with status {response.status_code}", "warning")
            return False
    except requests.exceptions.ConnectionError:
        print_status("Frontend is not accessible on port 5173", "error")
        return False
    except Exception as e:
        print_status(f"Error checking frontend: {e}", "error")
        return False

def test_mvp_upload_endpoint():
    """Test the enhanced MVP upload endpoint"""
    print_status("Testing MVP upload endpoint...")
    
    # Test file path
    test_file = "/workspaces/Excel-AI-Website/test_data/sample_sales_data.csv"
    if not os.path.exists(test_file):
        print_status(f"Test file not found: {test_file}", "error")
        return False
    
    url = "http://localhost:5001/api/v1/excel/upload"
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('sample_sales_data.csv', f, 'text/csv')}
            response = requests.post(url, files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print_status("Upload endpoint working correctly", "success")
            
            # Test MVP enhancements
            if 'file_info' in data:
                file_info = data['file_info']
                print_status(f"  📊 Rows: {file_info.get('rows', 'N/A')}, Columns: {file_info.get('columns', 'N/A')}")
                
                # Test MVP specific features
                if 'column_analysis' in file_info:
                    print_status("  🔍 Enhanced column analysis present", "success")
                
                if 'data_summary' in file_info:
                    data_summary = file_info['data_summary']
                    print_status(f"  📈 Data Quality Score: {data_summary.get('data_quality_score', 'N/A')}%", "success")
                
            if 'quick_insights' in data:
                insights = data['quick_insights']
                print_status(f"  💡 Quick insights generated: {len(insights)} insights", "success")
                for insight in insights[:3]:  # Show first 3
                    print_status(f"    - {insight}")
                    
            return True
        else:
            print_status(f"Upload failed: {response.text}", "error")
            return False
            
    except Exception as e:
        print_status(f"Error testing upload: {e}", "error")
        return False

def test_file_structure():
    """Test MVP file structure"""
    print_status("Validating MVP file structure...")
    
    files_to_check = [
        ("/workspaces/Excel-AI-Website/excel-ai-frontend/src/App.jsx", "MVP App component"),
        ("/workspaces/Excel-AI-Website/excel-ai-frontend/src/components/DashboardMVP.jsx", "MVP Dashboard"),
        ("/workspaces/Excel-AI-Website/excel_ai_backend/src/main.py", "Backend main file"),
        ("/workspaces/Excel-AI-Website/MVP_IMPLEMENTATION_STATUS.md", "Implementation status"),
    ]
    
    all_present = True
    for file_path, description in files_to_check:
        if os.path.exists(file_path):
            print_status(f"  {description} present", "success")
        else:
            print_status(f"  {description} missing", "error")
            all_present = False
    
    return all_present

def test_mvp_components():
    """Test MVP component structure"""
    print_status("Testing MVP component implementation...")
    
    # Check App.jsx for MVP changes
    app_path = "/workspaces/Excel-AI-Website/excel-ai-frontend/src/App.jsx"
    if os.path.exists(app_path):
        with open(app_path, 'r') as f:
            content = f.read()
            
        # Check for MVP markers
        mvp_markers = [
            "// MVP:",
            "DashboardMVP",
            "// import { EnrichPage }",
            "// import { ToolsPage }",
            "// import { DataPrepPage }"
        ]
        
        for marker in mvp_markers:
            if marker in content:
                print_status(f"  MVP marker '{marker}' found", "success")
            else:
                print_status(f"  MVP marker '{marker}' missing", "warning")
    
    # Check backend main.py for MVP changes
    main_path = "/workspaces/Excel-AI-Website/excel_ai_backend/src/main.py"
    if os.path.exists(main_path):
        with open(main_path, 'r') as f:
            content = f.read()
            
        # Check for commented out routes
        commented_routes = [
            "# app.register_blueprint(formula_bp",
            "# app.register_blueprint(google_sheets_bp",
            "# app.register_blueprint(data_prep_bp",
            "# app.register_blueprint(enrich_bp",
            "# app.register_blueprint(tools_bp"
        ]
        
        for route in commented_routes:
            if route in content:
                print_status(f"  Non-MVP route commented out: {route.split('(')[1].split(',')[0]}", "success")
            else:
                print_status(f"  Route not properly commented: {route}", "warning")

def generate_status_report():
    """Generate a comprehensive status report"""
    print(f"\n{Colors.BOLD}{Colors.PURPLE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.PURPLE}MVP Implementation Status Report{Colors.END}")
    print(f"{Colors.BOLD}{Colors.PURPLE}{'='*60}{Colors.END}\n")
    
    tests = [
        ("File Structure", test_file_structure),
        ("MVP Components", test_mvp_components),
        ("Backend Availability", test_backend_availability),
        ("Frontend Availability", test_frontend_availability),
        ("Upload Endpoint", test_mvp_upload_endpoint),
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n{Colors.BOLD}Testing {test_name}...{Colors.END}")
        results[test_name] = test_func()
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}Summary{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.END}")
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        color = Colors.GREEN if passed else Colors.RED
        print(f"{color}{test_name:20} {status}{Colors.END}")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 MVP implementation is ready for testing!{Colors.END}")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️ Some issues need attention before deployment{Colors.END}")
    
    # Next steps
    print(f"\n{Colors.BOLD}{Colors.BLUE}Next Steps:{Colors.END}")
    if not results.get("Backend Availability", False):
        print(f"{Colors.YELLOW}1. Start backend: cd excel_ai_backend && python src/main.py{Colors.END}")
    if not results.get("Frontend Availability", False):
        print(f"{Colors.YELLOW}2. Start frontend: cd excel-ai-frontend && npm run dev{Colors.END}")
    if results.get("Backend Availability", False) and results.get("Frontend Availability", False):
        print(f"{Colors.GREEN}3. Test full user flow at http://localhost:5173{Colors.END}")
        print(f"{Colors.GREEN}4. Upload a file and test AI insights{Colors.END}")
        print(f"{Colors.GREEN}5. Test visualization creation{Colors.END}")

if __name__ == "__main__":
    generate_status_report()
