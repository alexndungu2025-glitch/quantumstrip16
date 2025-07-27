#!/usr/bin/env python3
"""
QuantumStrip Comprehensive Streaming API Test Suite
Focus on identifying 404 errors and testing all streaming endpoints thoroughly
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

class ComprehensiveStreamingTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.model_id = None
        self.viewer_id = None
        self.session_id = None
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

    def setup_test_users(self):
        """Setup test users and get their tokens"""
        print_test_header("Setting Up Test Users")
        
        # Create and login model user
        model_data = {
            "username": f"streammodel{int(time.time())}",
            "email": f"streammodel{int(time.time())}@test.com",
            "phone": "254787654321",
            "password": "password123",
            "role": "model",
            "age": 22,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=model_data)
            if response.status_code == 200:
                data = response.json()
                self.tokens['model'] = data.get("access_token")
                print_success("Model user created and authenticated")
                
                # Get model profile to extract model_id
                headers = {"Authorization": f"Bearer {self.tokens['model']}"}
                profile_response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.model_id = profile_data.get('profile', {}).get('id')
                    print_info(f"Model ID: {self.model_id}")
        except Exception as e:
            print_error(f"Error setting up model user: {e}")

        # Create and login viewer user
        viewer_data = {
            "username": f"streamviewer{int(time.time())}",
            "email": f"streamviewer{int(time.time())}@test.com",
            "phone": "254712345678",
            "password": "password123",
            "role": "viewer",
            "age": 25,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=viewer_data)
            if response.status_code == 200:
                data = response.json()
                self.tokens['viewer'] = data.get("access_token")
                self.viewer_id = data.get('user', {}).get('id')
                print_success("Viewer user created and authenticated")
                print_info(f"Viewer ID: {self.viewer_id}")
        except Exception as e:
            print_error(f"Error setting up viewer user: {e}")

    def test_all_streaming_endpoints(self):
        """Test all streaming endpoints systematically"""
        print_test_header("Testing All Streaming Endpoints")
        
        endpoints_to_test = [
            ("GET", "/streaming/models/live", None, None),
            ("PATCH", "/streaming/models/status", {"is_live": True, "is_available": True}, "model"),
            ("POST", "/streaming/session", {"model_id": self.model_id, "session_type": "public"}, "viewer"),
            ("POST", "/streaming/private-show", {"model_id": self.model_id, "duration_minutes": 5}, "viewer"),
            ("POST", "/streaming/webrtc/signal", {
                "session_id": "test-session",
                "signal_type": "offer",
                "signal_data": {"type": "offer", "sdp": "test"},
                "target_user_id": "test-target"
            }, "viewer"),
            ("GET", "/streaming/webrtc/signals/test-session", None, "viewer"),
        ]
        
        for method, endpoint, data, auth_role in endpoints_to_test:
            print_info(f"Testing {method} {endpoint}")
            
            headers = {}
            if auth_role and auth_role in self.tokens:
                headers["Authorization"] = f"Bearer {self.tokens[auth_role]}"
            
            try:
                if method == "GET":
                    response = self.session.get(f"{API_BASE}{endpoint}", headers=headers)
                elif method == "POST":
                    response = self.session.post(f"{API_BASE}{endpoint}", json=data, headers=headers)
                elif method == "PATCH":
                    response = self.session.patch(f"{API_BASE}{endpoint}", params=data, headers=headers)
                else:
                    continue
                
                # Check for 404 errors specifically
                if response.status_code == 404:
                    print_error(f"404 ERROR: {endpoint} - {response.text}")
                elif response.status_code in [200, 400, 401, 403, 422]:
                    print_success(f"{endpoint} responds with {response.status_code}")
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            print_info(f"Response data keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}")
                        except:
                            pass
                else:
                    print_warning(f"{endpoint} unexpected status: {response.status_code}")
                    
            except Exception as e:
                print_error(f"Error testing {endpoint}: {e}")

    def test_model_authentication_flow(self):
        """Test the complete model authentication and streaming flow"""
        print_test_header("Model Authentication and Streaming Flow")
        
        if 'model' not in self.tokens:
            print_error("No model token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['model']}"}
        
        # 1. Test model login verification
        try:
            response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
            self.assert_test(
                response.status_code == 200 and response.json().get('role') == 'model',
                "Model authentication verified successfully",
                f"Model authentication failed: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Model auth verification error: {e}")

        # 2. Test model dashboard access
        try:
            response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
            self.assert_test(
                response.status_code == 200,
                "Model dashboard accessible",
                f"Model dashboard access failed: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Model dashboard error: {e}")

        # 3. Test streaming status update
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", 
                                        params={"is_live": True, "is_available": True}, 
                                        headers=headers)
            self.assert_test(
                response.status_code == 200,
                "Model can update streaming status",
                f"Model status update failed: {response.status_code} - {response.text}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Model status update error: {e}")

    def test_viewer_streaming_flow(self):
        """Test the complete viewer streaming flow"""
        print_test_header("Viewer Streaming Flow")
        
        if 'viewer' not in self.tokens or not self.model_id:
            print_error("Missing viewer token or model ID")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # 1. Test viewer authentication
        try:
            response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
            self.assert_test(
                response.status_code == 200 and response.json().get('role') == 'viewer',
                "Viewer authentication verified successfully",
                f"Viewer authentication failed: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Viewer auth verification error: {e}")

        # 2. Test live models listing
        try:
            response = self.session.get(f"{API_BASE}/streaming/models/live")
            self.assert_test(
                response.status_code == 200,
                "Live models endpoint accessible to viewer",
                f"Live models access failed: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                print_info(f"Found {len(data)} live models")
        except Exception as e:
            self.assert_test(False, "", f"Live models error: {e}")

        # 3. Test streaming session creation
        try:
            session_data = {
                "model_id": self.model_id,
                "session_type": "public"
            }
            response = self.session.post(f"{API_BASE}/streaming/session", 
                                       json=session_data, headers=headers)
            self.assert_test(
                response.status_code in [200, 400],
                f"Streaming session endpoint responds: {response.status_code}",
                f"Streaming session completely failed: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_id = data.get('session_id')
                print_info(f"Session created: {self.session_id}")
        except Exception as e:
            self.assert_test(False, "", f"Session creation error: {e}")

    def test_webrtc_signaling_detailed(self):
        """Test WebRTC signaling endpoints in detail"""
        print_test_header("WebRTC Signaling Detailed Testing")
        
        if 'viewer' not in self.tokens:
            print_error("No viewer token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # Test with valid session (if we have one)
        if self.session_id:
            signal_data = {
                "session_id": self.session_id,
                "signal_type": "offer",
                "signal_data": {"type": "offer", "sdp": "test-sdp-data"},
                "target_user_id": self.model_id or "test-target"
            }
            
            try:
                response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", 
                                           json=signal_data, headers=headers)
                self.assert_test(
                    response.status_code in [200, 400, 403],
                    f"WebRTC signaling with valid session: {response.status_code}",
                    f"WebRTC signaling failed unexpectedly: {response.status_code}"
                )
            except Exception as e:
                self.assert_test(False, "", f"WebRTC signaling error: {e}")

        # Test with invalid session (should get 404)
        invalid_signal_data = {
            "session_id": "invalid-session-id",
            "signal_type": "offer",
            "signal_data": {"type": "offer", "sdp": "test-sdp"},
            "target_user_id": "test-target"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", 
                                       json=invalid_signal_data, headers=headers)
            self.assert_test(
                response.status_code == 404,
                "WebRTC signaling properly returns 404 for invalid session",
                f"WebRTC signaling should return 404 but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"WebRTC invalid session test error: {e}")

    def test_role_based_access_detailed(self):
        """Test role-based access control in detail"""
        print_test_header("Role-Based Access Control Detailed Testing")
        
        # Test viewer trying to update model status
        if 'viewer' in self.tokens:
            viewer_headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
            
            try:
                response = self.session.patch(f"{API_BASE}/streaming/models/status", 
                                            params={"is_live": True}, headers=viewer_headers)
                print_info(f"Viewer status update attempt: {response.status_code} - {response.text}")
                
                self.assert_test(
                    response.status_code in [403, 422],
                    f"Viewer properly blocked from model status update: {response.status_code}",
                    f"Viewer should be blocked but got: {response.status_code}"
                )
                
                # If it's 422, check the error details
                if response.status_code == 422:
                    try:
                        error_data = response.json()
                        print_info(f"422 Error details: {error_data}")
                    except:
                        pass
                        
            except Exception as e:
                self.assert_test(False, "", f"Role-based access test error: {e}")

        # Test model trying to create session (should work)
        if 'model' in self.tokens and self.model_id:
            model_headers = {"Authorization": f"Bearer {self.tokens['model']}"}
            
            try:
                session_data = {
                    "model_id": self.model_id,
                    "session_type": "public"
                }
                response = self.session.post(f"{API_BASE}/streaming/session", 
                                           json=session_data, headers=model_headers)
                print_info(f"Model session creation: {response.status_code}")
                
                self.assert_test(
                    response.status_code in [200, 400],
                    f"Model can create streaming session: {response.status_code}",
                    f"Model session creation failed: {response.status_code}"
                )
            except Exception as e:
                self.assert_test(False, "", f"Model session creation error: {e}")

    def test_404_error_scenarios(self):
        """Specifically test scenarios that should return 404 errors"""
        print_test_header("404 Error Scenarios Testing")
        
        if 'viewer' not in self.tokens:
            print_error("No viewer token available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # Test non-existent model in session creation
        try:
            session_data = {
                "model_id": "non-existent-model-id",
                "session_type": "public"
            }
            response = self.session.post(f"{API_BASE}/streaming/session", 
                                       json=session_data, headers=headers)
            self.assert_test(
                response.status_code == 404,
                "Non-existent model properly returns 404",
                f"Non-existent model should return 404 but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Non-existent model test error: {e}")

        # Test non-existent session in WebRTC signaling
        try:
            signal_data = {
                "session_id": "non-existent-session-id",
                "signal_type": "offer",
                "signal_data": {"type": "offer", "sdp": "test"},
                "target_user_id": "test-target"
            }
            response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", 
                                       json=signal_data, headers=headers)
            self.assert_test(
                response.status_code == 404,
                "Non-existent session properly returns 404 in WebRTC signaling",
                f"Non-existent session should return 404 but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Non-existent session test error: {e}")

        # Test non-existent private show
        try:
            response = self.session.patch(f"{API_BASE}/streaming/private-show/non-existent-show/accept", 
                                        headers=headers)
            self.assert_test(
                response.status_code in [404, 403],
                f"Non-existent private show properly handled: {response.status_code}",
                f"Non-existent private show handling failed: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Non-existent private show test error: {e}")

    def run_comprehensive_tests(self):
        """Run all comprehensive streaming tests"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("QUANTUMSTRIP COMPREHENSIVE STREAMING API TEST SUITE")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        print_info(f"Testing backend at: {API_BASE}")
        print_info(f"Test started at: {datetime.now().isoformat()}")
        
        # Setup
        self.setup_test_users()
        
        # Run all test suites
        self.test_all_streaming_endpoints()
        self.test_model_authentication_flow()
        self.test_viewer_streaming_flow()
        self.test_webrtc_signaling_detailed()
        self.test_role_based_access_detailed()
        self.test_404_error_scenarios()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print final test results"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("COMPREHENSIVE STREAMING TEST RESULTS")
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
    tester = ComprehensiveStreamingTester()
    tester.run_comprehensive_tests()