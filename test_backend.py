#!/usr/bin/env python3
"""
Simple test script for the MVP backend functionality
"""
import requests
import json
import os

def test_upload_endpoint():
    """Test the upload endpoint with sample data"""
    print("Testing MVP Upload Endpoint...")
    
    # Test file path
    test_file = "/workspaces/Excel-AI-Website/test_data/sample_sales_data.csv"
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return False
    
    # Prepare the upload
    url = "http://localhost:5001/api/v1/excel/upload"
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('sample_sales_data.csv', f, 'text/csv')}
            response = requests.post(url, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Upload successful!")
            
            # Check MVP enhancements
            if 'file_info' in data:
                file_info = data['file_info']
                print(f"📊 Data Summary:")
                print(f"  - Rows: {file_info.get('rows', 'N/A')}")
                print(f"  - Columns: {file_info.get('columns', 'N/A')}")
                print(f"  - Data Quality Score: {file_info.get('data_summary', {}).get('data_quality_score', 'N/A')}%")
                
            if 'quick_insights' in data:
                print(f"🔍 Quick Insights:")
                for insight in data['quick_insights']:
                    print(f"  - {insight}")
                    
            return True
        else:
            print(f"❌ Upload failed: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Is it running on port 5001?")
        return False
    except Exception as e:
        print(f"❌ Error testing upload: {e}")
        return False

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get("http://localhost:5001/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print(f"⚠️ Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not accessible on port 5001")
        return False
    except Exception as e:
        print(f"❌ Error checking backend health: {e}")
        return False

if __name__ == "__main__":
    print("=== MVP Backend Test Suite ===\n")
    
    # Test backend health
    if not test_backend_health():
        print("\n🚨 Backend is not running. Please start it with:")
        print("cd excel_ai_backend && python src/main.py")
        exit(1)
    
    print()
    
    # Test upload functionality
    if test_upload_endpoint():
        print("\n🎉 MVP backend tests passed!")
    else:
        print("\n🚨 MVP backend tests failed!")
        exit(1)
