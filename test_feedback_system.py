#!/usr/bin/env python3
"""
Test script for the MVP Feedback System
This script tests the feedback endpoints to ensure they're working correctly.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5001"
FEEDBACK_ENDPOINTS = {
    "submit": f"{BASE_URL}/api/feedback/submit",
    "quick_rating": f"{BASE_URL}/api/feedback/quick-rating",
    "analytics": f"{BASE_URL}/api/feedback/analytics",
    "admin_summary": f"{BASE_URL}/api/feedback/admin/summary"
}

def test_feedback_submission():
    """Test submitting structured feedback"""
    print("🧪 Testing feedback submission...")
    
    feedback_data = {
        "type": "feature_request",
        "content": "Please add a dark mode toggle to the interface",
        "rating": 4,
        "context": "dashboard",
        "user_info": {
            "user_agent": "Test Browser",
            "page_url": "http://localhost:5173/dashboard"
        }
    }
    
    try:
        response = requests.post(FEEDBACK_ENDPOINTS["submit"], json=feedback_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_quick_rating():
    """Test submitting quick rating"""
    print("🧪 Testing quick rating...")
    
    rating_data = {
        "rating": 5,
        "context": "analysis"
    }
    
    try:
        response = requests.post(FEEDBACK_ENDPOINTS["quick_rating"], json=rating_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_analytics_tracking():
    """Test analytics event tracking"""
    print("🧪 Testing analytics tracking...")
    
    analytics_data = {
        "event": "page_view",
        "data": {
            "page": "dashboard",
            "timestamp": datetime.now().isoformat()
        }
    }
    
    try:
        response = requests.post(FEEDBACK_ENDPOINTS["analytics"], json=analytics_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_admin_summary():
    """Test admin feedback summary"""
    print("🧪 Testing admin feedback summary...")
    
    try:
        response = requests.get(FEEDBACK_ENDPOINTS["admin_summary"])
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            summary = response.json()
            print(f"   📊 Total feedback: {summary.get('total_feedback', 0)}")
            print(f"   📊 Analytics events: {summary.get('total_analytics', 0)}")
            print(f"   📊 Average rating: {summary.get('average_rating', 'N/A')}")
        else:
            print(f"   Response: {response.json()}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_backend_health():
    """Test if the backend is running"""
    print("🧪 Testing backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting MVP Feedback System Tests")
    print("=" * 50)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Feedback Submission", test_feedback_submission),
        ("Quick Rating", test_quick_rating),
        ("Analytics Tracking", test_analytics_tracking),
        ("Admin Summary", test_admin_summary)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        try:
            result = test_func()
            results.append((test_name, result))
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status}")
        except Exception as e:
            print(f"   ❌ FAIL: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The feedback system is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the backend server and logs.")

if __name__ == "__main__":
    main()
