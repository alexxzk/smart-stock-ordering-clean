#!/usr/bin/env python3
"""
Firebase Connection Testing Script
Run this to test Firebase connectivity and debug configuration issues.
"""

import requests
import json
import os

# Optional dotenv import
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def test_backend_health(backend_url):
    """Test if the backend is running and healthy"""
    try:
        print(f"🔍 Testing backend health: {backend_url}")
        response = requests.get(f"{backend_url}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   Dev Mode: {data.get('dev_mode')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_firebase_connection(backend_url):
    """Test Firebase/Firestore connection"""
    try:
        print(f"🔥 Testing Firebase connection: {backend_url}")
        response = requests.get(f"{backend_url}/test-firestore", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "error" in data:
                print(f"❌ Firebase connection failed: {data['error']}")
                return False
            else:
                print(f"✅ Firebase connection successful!")
                print(f"   Status: {data.get('status')}")
                print(f"   Project ID: {data.get('project_id')}")
                return True
        else:
            print(f"❌ Firebase test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Firebase test connection failed: {e}")
        return False

def test_cors_policy(backend_url, frontend_url):
    """Test CORS policy by making a cross-origin request"""
    try:
        print(f"🌐 Testing CORS policy...")
        headers = {
            'Origin': frontend_url,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options(f"{backend_url}/health", headers=headers, timeout=10)
        
        if response.status_code in [200, 204]:
            cors_headers = response.headers.get('Access-Control-Allow-Origin', '')
            if cors_headers == '*' or frontend_url in cors_headers:
                print(f"✅ CORS policy allows frontend domain")
                return True
            else:
                print(f"❌ CORS policy blocks frontend domain")
                print(f"   Allowed origins: {cors_headers}")
                return False
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ CORS test failed: {e}")
        return False

def main():
    """Main testing function"""
    print("🧪 Firebase Connection Testing Script")
    print("=" * 50)
    
    # Get URLs from environment or prompt
    backend_url = os.getenv('BACKEND_URL') or input("Enter your backend URL (e.g., https://your-app.onrender.com): ").strip()
    frontend_url = os.getenv('FRONTEND_URL') or input("Enter your frontend URL (e.g., https://your-frontend.onrender.com): ").strip()
    
    # Remove trailing slashes
    backend_url = backend_url.rstrip('/')
    frontend_url = frontend_url.rstrip('/')
    
    print(f"\n📍 Testing URLs:")
    print(f"   Backend: {backend_url}")
    print(f"   Frontend: {frontend_url}")
    print()
    
    # Run tests
    results = []
    
    results.append(("Backend Health", test_backend_health(backend_url)))
    results.append(("Firebase Connection", test_firebase_connection(backend_url)))
    results.append(("CORS Policy", test_cors_policy(backend_url, frontend_url)))
    
    # Summary
    print("\n📊 Test Results Summary:")
    print("=" * 30)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 All tests passed! Your backend should be working.")
    else:
        print("⚠️  Some tests failed. Check the Firebase Debug Guide for fixes.")
        print("   See: FIREBASE_DEBUG_GUIDE.md")
    
    print()
    print("🔍 Next steps:")
    print("1. Deploy your frontend with the debug logging")
    print("2. Check browser console for Firebase config logs")
    print("3. Apply fixes based on console output")

if __name__ == "__main__":
    main()