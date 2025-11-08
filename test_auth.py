"""Quick test script for authentication endpoints."""

import requests
import json

BASE_URL = "http://127.0.0.1:9000/api/v1"

def test_login():
    """Test login endpoint."""
    print("Testing login...")
    
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Login successful!")
        print(f"Access Token: {data['access_token'][:50]}...")
        print(f"User: {data['user']['username']} ({data['user']['email']})")
        return data['access_token']
    else:
        print("❌ Login failed!")
        print(f"Error: {response.text}")
        return None

def test_register():
    """Test registration endpoint."""
    print("\nTesting registration...")
    
    payload = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "test123",
        "full_name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print("✅ Registration successful!")
        print(f"User: {data['username']} ({data['email']})")
    else:
        print("❌ Registration failed!")
        print(f"Error: {response.text}")

def test_me(token):
    """Test /me endpoint."""
    print("\nTesting /me endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Get user info successful!")
        print(f"User: {data['username']} (Admin: {data['is_admin']})")
    else:
        print("❌ Get user info failed!")
        print(f"Error: {response.text}")

if __name__ == "__main__":
    # Test login
    token = test_login()
    
    # Test /me endpoint if login successful
    if token:
        test_me(token)
    
    # Test registration (optional - will fail if user already exists)
    test_register()
