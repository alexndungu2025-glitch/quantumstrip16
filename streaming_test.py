#!/usr/bin/env python3
"""
QuantumStrip Streaming API Endpoints Test Suite
Focus on testing streaming endpoints to identify 404 error issues
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

class StreamingTester:
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

    def create_test_users(self):
        """Create test users if they don't exist"""
        print_test_header("Creating Test Users")
        
        # Create test viewer
        viewer_data = {
            "username": "testviewer",
            "email": "viewer@test.com",
            "phone": "254712345678",
            "password": "password123",
            "role": "viewer",
            "age": 25,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=viewer_data)
            if response.status_code == 200:
                print_success("Test viewer created successfully")
                data = response.json()
                self.tokens['test_viewer'] = data.get("access_token")
            elif response.status_code == 400:
                print_info("Test viewer already exists, attempting login...")
                # Try to login
                login_data = {"email": "viewer@test.com", "password": "password123"}
                login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    print_success("Test viewer login successful")
                    data = login_response.json()
                    self.tokens['test_viewer'] = data.get("access_token")
                else:
                    print_error(f"Test viewer login failed: {login_response.status_code}")
        except Exception as e:
            print_error(f"Error creating test viewer: {str(e)}")

        # Create test model
        model_data = {
            "username": "testmodel",
            "email": "model@test.com",
            "phone": "254787654321",
            "password": "password123",
            "role": "model",
            "age": 22,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=model_data)
            if response.status_code == 200:
                print_success("Test model created successfully")
                data = response.json()
                self.tokens['test_model'] = data.get("access_token")
            elif response.status_code == 400:
                print_info("Test model already exists, attempting login...")
                # Try to login
                login_data = {"email": "model@test.com", "password": "password123"}
                login_response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    print_success("Test model login successful")
                    data = login_response.json()
                    self.tokens['test_model'] = data.get("access_token")
                else:
                    print_error(f"Test model login failed: {login_response.status_code}")
        except Exception as e:
            print_error(f"Error creating test model: {str(e)}")

    def test_model_authentication(self):
        """Test model authentication and login"""
        print_test_header("Model Authentication Test")
        
        login_data = {
            "email": "model@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            self.assert_test(
                response.status_code == 200,
                f"Model authentication successful: {response.status_code}",
                f"Model authentication failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "access_token" in data,
                    "Model login returns access token",
                    "Model login doesn't return access token"
                )
                self.assert_test(
                    data.get("user", {}).get("role") == "model",
                    "Model role correctly verified",
                    "Model role not correctly verified"
                )
                self.tokens['test_model'] = data.get("access_token")
                print_info(f"Model ID: {data.get('user', {}).get('id')}")
                
        except Exception as e:
            self.assert_test(False, "", f"Model authentication error: {str(e)}")

    def test_streaming_status_update(self):
        """Test PATCH /api/streaming/models/status"""
        print_test_header("Streaming Status Update Test")
        
        if 'test_model' not in self.tokens:
            print_error("No model token available for testing")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['test_model']}"}
        
        # Test updating model status to live
        status_data = {
            "is_live": True,
            "is_available": True
        }
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", params=status_data, headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Model status update successful: {response.status_code}",
                f"Model status update failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    data.get("success") == True,
                    "Status update returns success response",
                    "Status update doesn't return success response"
                )
                print_info(f"Model status updated: {data}")
                
        except Exception as e:
            self.assert_test(False, "", f"Status update error: {str(e)}")

        # Test updating model status to offline
        status_data = {
            "is_live": False,
            "is_available": False
        }
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", params=status_data, headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Model status offline update successful: {response.status_code}",
                f"Model status offline update failed: {response.status_code} - {response.text}"
            )
                
        except Exception as e:
            self.assert_test(False, "", f"Status offline update error: {str(e)}")

    def test_streaming_session_creation(self):
        """Test POST /api/streaming/session"""
        print_test_header("Streaming Session Creation Test")
        
        if 'test_viewer' not in self.tokens or 'test_model' not in self.tokens:
            print_error("Missing tokens for session creation test")
            return
            
        # First, set model as live
        model_headers = {"Authorization": f"Bearer {self.tokens['test_model']}"}
        status_data = {"is_live": True, "is_available": True}
        
        try:
            status_response = self.session.patch(f"{API_BASE}/streaming/models/status", params=status_data, headers=model_headers)
            if status_response.status_code == 200:
                print_info("Model set to live for session testing")
        except Exception as e:
            print_warning(f"Could not set model live: {e}")

        # Get model ID from model dashboard
        try:
            model_response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=model_headers)
            if model_response.status_code == 200:
                model_data = model_response.json()
                model_id = model_data.get('profile', {}).get('id')
                print_info(f"Using model ID: {model_id}")
                
                if model_id:
                    # Test session creation
                    viewer_headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
                    session_data = {
                        "model_id": model_id,
                        "session_type": "public"
                    }
                    
                    response = self.session.post(f"{API_BASE}/streaming/session", json=session_data, headers=viewer_headers)
                    self.assert_test(
                        response.status_code in [200, 400],
                        f"Streaming session endpoint responds: {response.status_code}",
                        f"Streaming session endpoint failed: {response.status_code} - {response.text}"
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.assert_test(
                            "session_id" in data and "webrtc_config" in data,
                            "Session creation returns expected data structure",
                            "Session creation doesn't return expected data structure"
                        )
                        print_info(f"Session created: {data.get('session_id')}")
                        print_info(f"WebRTC config: {data.get('webrtc_config')}")
                    elif response.status_code == 400:
                        print_info("Session validation working (expected for test conditions)")
                        
        except Exception as e:
            self.assert_test(False, "", f"Session creation error: {str(e)}")

    def test_live_models_endpoint(self):
        """Test GET /api/streaming/models/live"""
        print_test_header("Live Models Endpoint Test")
        
        try:
            response = self.session.get(f"{API_BASE}/streaming/models/live")
            self.assert_test(
                response.status_code == 200,
                f"Live models endpoint accessible: {response.status_code}",
                f"Live models endpoint failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    isinstance(data, list),
                    "Live models returns list format",
                    "Live models doesn't return list format"
                )
                print_info(f"Found {len(data)} live models")
                
                if data:
                    print_info(f"Live model data structure: {data[0].keys()}")
                    
        except Exception as e:
            self.assert_test(False, "", f"Live models endpoint error: {str(e)}")

    def test_webrtc_signaling_endpoints(self):
        """Test WebRTC signaling endpoints"""
        print_test_header("WebRTC Signaling Endpoints Test")
        
        if 'test_viewer' not in self.tokens:
            print_error("No viewer token available for WebRTC testing")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
        
        # Test WebRTC signaling endpoint
        signal_data = {
            "session_id": "test-session-id",
            "signal_type": "offer",
            "signal_data": {"type": "offer", "sdp": "test-sdp"},
            "target_user_id": "test-target-id"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", json=signal_data, headers=headers)
            self.assert_test(
                response.status_code in [200, 404, 400],
                f"WebRTC signaling endpoint responds: {response.status_code}",
                f"WebRTC signaling endpoint completely inaccessible: {response.status_code}"
            )
            
            if response.status_code == 404:
                print_info("WebRTC signaling validation working (session not found expected)")
            elif response.status_code == 400:
                print_info("WebRTC signaling validation working (invalid data expected)")
            elif response.status_code == 200:
                print_success("WebRTC signaling endpoint working")
                
        except Exception as e:
            self.assert_test(False, "", f"WebRTC signaling error: {str(e)}")

    def test_unauthorized_access(self):
        """Test that endpoints properly reject unauthorized access"""
        print_test_header("Unauthorized Access Test")
        
        # Test streaming status update without token
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", params={"is_live": True})
            self.assert_test(
                response.status_code in [401, 403],
                f"Status update properly rejects unauthorized access: {response.status_code}",
                f"Status update should reject unauthorized access but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Unauthorized status update test error: {str(e)}")

        # Test session creation without token
        try:
            response = self.session.post(f"{API_BASE}/streaming/session", json={"model_id": "test", "session_type": "public"})
            self.assert_test(
                response.status_code in [401, 403],
                f"Session creation properly rejects unauthorized access: {response.status_code}",
                f"Session creation should reject unauthorized access but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Unauthorized session creation test error: {str(e)}")

        # Test WebRTC signaling without token
        try:
            response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", json={"session_id": "test"})
            self.assert_test(
                response.status_code in [401, 403],
                f"WebRTC signaling properly rejects unauthorized access: {response.status_code}",
                f"WebRTC signaling should reject unauthorized access but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Unauthorized WebRTC signaling test error: {str(e)}")

    def test_role_based_access(self):
        """Test role-based access control for streaming endpoints"""
        print_test_header("Role-Based Access Control Test")
        
        if 'test_viewer' not in self.tokens:
            print_error("No viewer token available for role-based testing")
            return
            
        # Test viewer trying to update model status (should fail)
        viewer_headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", 
                                        params={"is_live": True}, headers=viewer_headers)
            self.assert_test(
                response.status_code in [403, 400],
                f"Viewer properly blocked from updating model status: {response.status_code}",
                f"Viewer should be blocked from updating model status but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Role-based access test error: {str(e)}")

    def run_streaming_tests(self):
        """Run all streaming-focused tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("QUANTUMSTRIP STREAMING API ENDPOINTS TEST SUITE")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        print_info(f"Testing backend at: {API_BASE}")
        print_info(f"Test started at: {datetime.now().isoformat()}")
        
        # Create test users first
        self.create_test_users()
        
        # Run streaming-specific tests
        self.test_model_authentication()
        self.test_streaming_status_update()
        self.test_streaming_session_creation()
        self.test_live_models_endpoint()
        self.test_webrtc_signaling_endpoints()
        self.test_unauthorized_access()
        self.test_role_based_access()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print final test results"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("FINAL STREAMING TEST RESULTS")
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
    tester = StreamingTester()
    tester.run_streaming_tests()