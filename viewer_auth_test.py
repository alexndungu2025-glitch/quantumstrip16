#!/usr/bin/env python3
"""
QuantumStrip Viewer Authentication Flow Test Suite
Focused testing for viewer authentication and landing page API requirements
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}Testing: {test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

class ViewerAuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'total': 0
        }
        
    def assert_test(self, condition, success_msg, error_msg):
        """Assert a test condition and track results"""
        self.test_results['total'] += 1
        if condition:
            self.test_results['passed'] += 1
            print_success(success_msg)
            return True
        else:
            self.test_results['failed'] += 1
            print_error(error_msg)
            return False

    def test_viewer_registration(self):
        """Test viewer registration functionality"""
        print_test_header("Viewer Registration")
        
        # Generate unique email for this test run
        timestamp = str(int(time.time()))
        
        viewer_data = {
            "username": f"viewertest{timestamp}",
            "email": f"viewertest{timestamp}@example.com",
            "phone": "254712345679",
            "password": "securepass123",
            "role": "viewer",
            "age": 25,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=viewer_data)
            self.assert_test(
                response.status_code == 200,
                f"Viewer registration successful: {response.status_code}",
                f"Viewer registration failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "access_token" in data,
                    "Registration returns access token",
                    "Registration doesn't return access token"
                )
                self.assert_test(
                    data.get("user", {}).get("role") == "viewer",
                    "User role correctly set to viewer",
                    "User role not correctly set"
                )
                # Store token for later tests
                self.tokens['new_viewer'] = data.get("access_token")
                print_info(f"New viewer token: {data.get('access_token')[:20]}...")
                
        except Exception as e:
            self.assert_test(False, "", f"Viewer registration error: {str(e)}")

    def test_viewer_login(self):
        """Test viewer login functionality"""
        print_test_header("Viewer Login")
        
        # Test login with existing test user
        login_data = {
            "email": "viewer@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            self.assert_test(
                response.status_code == 200,
                f"Viewer login successful: {response.status_code}",
                f"Viewer login failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "access_token" in data,
                    "Login returns access token",
                    "Login doesn't return access token"
                )
                self.assert_test(
                    data.get("user", {}).get("email") == "viewer@test.com",
                    "Login returns correct user info",
                    "Login doesn't return correct user info"
                )
                self.assert_test(
                    data.get("user", {}).get("role") == "viewer",
                    "Login returns correct viewer role",
                    "Login doesn't return correct viewer role"
                )
                # Store token for later tests
                self.tokens['test_viewer'] = data.get("access_token")
                print_info(f"Test viewer token: {data.get('access_token')[:20]}...")
                
        except Exception as e:
            self.assert_test(False, "", f"Viewer login test error: {str(e)}")

    def test_viewer_dashboard_access(self):
        """Test viewer dashboard access"""
        print_test_header("Viewer Dashboard Access")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/viewer/dashboard", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Viewer dashboard accessible: {response.status_code}",
                    f"Viewer dashboard failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "profile" in data and "user" in data,
                        "Viewer dashboard returns expected data structure",
                        "Viewer dashboard doesn't return expected data structure"
                    )
                    
                    profile = data.get("profile", {})
                    self.assert_test(
                        "token_balance" in profile,
                        "Viewer profile includes token balance",
                        "Viewer profile missing token balance"
                    )
                    
                    print_info(f"Viewer token balance: {profile.get('token_balance', 0)}")
                    
            except Exception as e:
                self.assert_test(False, "", f"Viewer dashboard test error: {str(e)}")

    def test_token_balance_retrieval(self):
        """Test token balance retrieval for viewers"""
        print_test_header("Token Balance Retrieval")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/tokens/balance", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Token balance endpoint accessible: {response.status_code}",
                    f"Token balance endpoint failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "token_balance" in data,
                        "Token balance returns balance field",
                        "Token balance missing balance field"
                    )
                    self.assert_test(
                        "total_spent" in data,
                        "Token balance returns total spent field",
                        "Token balance missing total spent field"
                    )
                    self.assert_test(
                        isinstance(data.get("token_balance"), (int, float)),
                        "Token balance is numeric",
                        "Token balance is not numeric"
                    )
                    
                    print_info(f"Current token balance: {data.get('token_balance', 0)}")
                    print_info(f"Total spent: {data.get('total_spent', 0)}")
                    
            except Exception as e:
                self.assert_test(False, "", f"Token balance test error: {str(e)}")

    def test_live_models_without_auth(self):
        """Test live models retrieval without authentication"""
        print_test_header("Live Models - No Authentication Required")
        
        try:
            response = self.session.get(f"{API_BASE}/streaming/models/live")
            self.assert_test(
                response.status_code == 200,
                f"Live models accessible without auth: {response.status_code}",
                f"Live models failed without auth: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    isinstance(data, list),
                    "Live models returns list format",
                    "Live models doesn't return list format"
                )
                
                print_info(f"Found {len(data)} live models without authentication")
                
                # Check data structure if models exist
                if data:
                    model = data[0]
                    expected_fields = ["model_id", "is_live", "is_available", "current_viewers", "show_rate"]
                    self.assert_test(
                        all(field in model for field in expected_fields),
                        "Live model data includes all expected fields",
                        f"Live model data missing fields. Got: {list(model.keys())}"
                    )
                    
                    if "thumbnail" in model:
                        print_info(f"Model thumbnail data length: {len(model['thumbnail'])} characters")
                
        except Exception as e:
            self.assert_test(False, "", f"Live models without auth test error: {str(e)}")

    def test_live_models_with_auth(self):
        """Test live models retrieval with authentication"""
        print_test_header("Live Models - With Authentication")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/streaming/models/live", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Live models accessible with auth: {response.status_code}",
                    f"Live models failed with auth: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        isinstance(data, list),
                        "Live models returns list format with auth",
                        "Live models doesn't return list format with auth"
                    )
                    
                    print_info(f"Found {len(data)} live models with authentication")
                    
            except Exception as e:
                self.assert_test(False, "", f"Live models with auth test error: {str(e)}")

    def test_online_model_counts(self):
        """Test online model counts endpoint"""
        print_test_header("Online Model Counts")
        
        # Test without authentication
        try:
            response = self.session.get(f"{API_BASE}/streaming/models/online")
            self.assert_test(
                response.status_code == 200,
                f"Online models count accessible without auth: {response.status_code}",
                f"Online models count failed without auth: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "online_models" in data and "live_models" in data,
                    "Online models count returns both online and live counts",
                    "Online models count missing required fields"
                )
                self.assert_test(
                    isinstance(data.get("online_models"), int) and isinstance(data.get("live_models"), int),
                    "Model counts are integers",
                    "Model counts are not integers"
                )
                
                print_info(f"Online models: {data.get('online_models', 0)}")
                print_info(f"Live models: {data.get('live_models', 0)}")
                
        except Exception as e:
            self.assert_test(False, "", f"Online models count test error: {str(e)}")

        # Test with authentication
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/streaming/models/online", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Online models count accessible with auth: {response.status_code}",
                    f"Online models count failed with auth: {response.status_code} - {response.text}"
                )
                
            except Exception as e:
                self.assert_test(False, "", f"Online models count with auth test error: {str(e)}")

    def test_token_purchase_access(self):
        """Test token purchase endpoint accessibility for viewers"""
        print_test_header("Token Purchase Access")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            
            # Test token packages endpoint (should be accessible)
            try:
                response = self.session.get(f"{API_BASE}/tokens/packages")
                self.assert_test(
                    response.status_code == 200,
                    f"Token packages accessible: {response.status_code}",
                    f"Token packages failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "packages" in data and len(data["packages"]) > 0,
                        "Token packages returns valid package data",
                        "Token packages doesn't return valid package data"
                    )
                    print_info(f"Available token packages: {list(data['packages'].keys())}")
                    
            except Exception as e:
                self.assert_test(False, "", f"Token packages test error: {str(e)}")

            # Test token purchase endpoint structure (without actually purchasing)
            purchase_data = {
                "tokens": 50,
                "phone_number": "254712345678"
            }
            
            try:
                response = self.session.post(f"{API_BASE}/tokens/purchase", json=purchase_data, headers=headers)
                self.assert_test(
                    response.status_code in [200, 400, 500],  # Accept various responses
                    f"Token purchase endpoint responds: {response.status_code}",
                    f"Token purchase endpoint completely inaccessible: {response.status_code}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "success" in data or "message" in data,
                        "Token purchase returns expected response structure",
                        "Token purchase doesn't return expected response structure"
                    )
                elif response.status_code in [400, 500]:
                    print_info(f"Token purchase validation/processing response: {response.status_code}")
                    
            except Exception as e:
                self.assert_test(False, "", f"Token purchase test error: {str(e)}")

    def test_viewer_streaming_session_creation(self):
        """Test viewer ability to create streaming sessions"""
        print_test_header("Viewer Streaming Session Creation")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            
            # Test streaming session creation (will likely fail due to no live models, but tests endpoint access)
            session_data = {
                "model_id": "test-model-id",
                "session_type": "public"
            }
            
            try:
                response = self.session.post(f"{API_BASE}/streaming/session", json=session_data, headers=headers)
                self.assert_test(
                    response.status_code in [200, 400, 404],  # Accept various responses
                    f"Streaming session endpoint accessible: {response.status_code}",
                    f"Streaming session endpoint failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "session_id" in data and "webrtc_config" in data,
                        "Streaming session returns expected data structure",
                        "Streaming session doesn't return expected data structure"
                    )
                elif response.status_code in [400, 404]:
                    print_info(f"Streaming session validation working: {response.status_code}")
                    
            except Exception as e:
                self.assert_test(False, "", f"Streaming session test error: {str(e)}")

    def test_viewer_authentication_persistence(self):
        """Test viewer authentication token persistence"""
        print_test_header("Viewer Authentication Persistence")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            
            # Test multiple authenticated requests to ensure token persistence
            endpoints_to_test = [
                ("/auth/me", "User profile"),
                ("/auth/viewer/dashboard", "Viewer dashboard"),
                ("/tokens/balance", "Token balance"),
                ("/tokens/transactions", "Transaction history")
            ]
            
            for endpoint, description in endpoints_to_test:
                try:
                    response = self.session.get(f"{API_BASE}{endpoint}", headers=headers)
                    self.assert_test(
                        response.status_code == 200,
                        f"{description} accessible with persistent token: {response.status_code}",
                        f"{description} failed with persistent token: {response.status_code}"
                    )
                    
                except Exception as e:
                    self.assert_test(False, "", f"{description} persistence test error: {str(e)}")

    def test_viewer_role_restrictions(self):
        """Test that viewers are properly restricted from model-only endpoints"""
        print_test_header("Viewer Role Restrictions")
        
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            
            # Test model-only endpoints that viewers should not access
            restricted_endpoints = [
                ("/auth/model/dashboard", "Model dashboard"),
                ("/streaming/models/status", "Model status update"),
                ("/models/earnings", "Model earnings")
            ]
            
            for endpoint, description in restricted_endpoints:
                try:
                    if endpoint == "/streaming/models/status":
                        # PATCH request for status update
                        response = self.session.patch(f"{API_BASE}{endpoint}", 
                                                    params={"is_live": True}, headers=headers)
                    else:
                        # GET request for other endpoints
                        response = self.session.get(f"{API_BASE}{endpoint}", headers=headers)
                    
                    self.assert_test(
                        response.status_code in [403, 422],  # Forbidden or validation error
                        f"Viewer properly blocked from {description}: {response.status_code}",
                        f"Viewer should be blocked from {description} but got: {response.status_code}"
                    )
                    
                except Exception as e:
                    self.assert_test(False, "", f"{description} restriction test error: {str(e)}")

    def run_viewer_auth_tests(self):
        """Run all viewer authentication tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("QUANTUMSTRIP VIEWER AUTHENTICATION FLOW TEST SUITE")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        print_info(f"Testing backend at: {API_BASE}")
        print_info(f"Test started at: {datetime.now().isoformat()}")
        
        # Run all viewer authentication tests
        self.test_viewer_registration()
        self.test_viewer_login()
        self.test_viewer_dashboard_access()
        self.test_token_balance_retrieval()
        self.test_live_models_without_auth()
        self.test_live_models_with_auth()
        self.test_online_model_counts()
        self.test_token_purchase_access()
        self.test_viewer_streaming_session_creation()
        self.test_viewer_authentication_persistence()
        self.test_viewer_role_restrictions()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print final test results"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("VIEWER AUTHENTICATION FLOW TEST RESULTS")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        print(f"{Colors.BOLD}Total Tests: {self.test_results['total']}{Colors.ENDC}")
        print(f"{Colors.GREEN}Passed: {self.test_results['passed']}{Colors.ENDC}")
        print(f"{Colors.RED}Failed: {self.test_results['failed']}{Colors.ENDC}")
        
        if self.test_results['failed'] > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ {self.test_results['failed']} TEST(S) FAILED{Colors.ENDC}")
            print(f"{Colors.YELLOW}Please review the failed tests above.{Colors.ENDC}")
        else:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED!{Colors.ENDC}")
        
        success_rate = (self.test_results['passed'] / self.test_results['total']) * 100 if self.test_results['total'] > 0 else 0
        print(f"\n{Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.ENDC}")

if __name__ == "__main__":
    tester = ViewerAuthTester()
    tester.run_viewer_auth_tests()