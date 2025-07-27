#!/usr/bin/env python3
"""
QuantumStrip Streaming Focused Test Suite
Specifically tests the streaming functionality mentioned in the review request
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

class StreamingFocusedTester:
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

    def setup_test_users(self):
        """Setup test users for streaming tests"""
        print_test_header("Setting up Test Users")
        
        # Login as model
        model_login = {
            "email": "model@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=model_login)
            if response.status_code == 200:
                data = response.json()
                self.tokens['model'] = data.get("access_token")
                print_success(f"Model login successful: {data.get('user', {}).get('email')}")
            else:
                print_error(f"Model login failed: {response.status_code}")
        except Exception as e:
            print_error(f"Model login error: {str(e)}")

        # Login as viewer
        viewer_login = {
            "email": "viewer@test.com", 
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=viewer_login)
            if response.status_code == 200:
                data = response.json()
                self.tokens['viewer'] = data.get("access_token")
                print_success(f"Viewer login successful: {data.get('user', {}).get('email')}")
            else:
                print_error(f"Viewer login failed: {response.status_code}")
        except Exception as e:
            print_error(f"Viewer login error: {str(e)}")

    def test_model_authentication(self):
        """Test model authentication for streaming"""
        print_test_header("Model Authentication for Streaming")
        
        if 'model' not in self.tokens:
            self.assert_test(False, "", "Model token not available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['model']}"}
        
        try:
            # Test model dashboard access
            response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Model dashboard accessible: {response.status_code}",
                f"Model dashboard failed: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                model_id = data.get('profile', {}).get('id')
                if model_id:
                    self.model_id = model_id
                    print_success(f"Model profile ID retrieved: {model_id}")
                else:
                    print_error("Model profile ID not found")
                    
        except Exception as e:
            self.assert_test(False, "", f"Model authentication error: {str(e)}")

    def test_streaming_status_updates(self):
        """Test PATCH /api/streaming/models/status"""
        print_test_header("Streaming Status Updates")
        
        if 'model' not in self.tokens:
            self.assert_test(False, "", "Model token not available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['model']}"}
        
        # Test updating model status to live (using query parameters)
        params = {
            "is_live": True,
            "is_available": True
        }
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", 
                                        params=params, headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Model status update successful: {response.status_code}",
                f"Model status update failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    data.get('success') == True,
                    "Status update returns success",
                    "Status update doesn't return success"
                )
                
        except Exception as e:
            self.assert_test(False, "", f"Status update error: {str(e)}")

    def test_streaming_session_creation(self):
        """Test POST /api/streaming/session"""
        print_test_header("Streaming Session Creation")
        
        if 'viewer' not in self.tokens or not hasattr(self, 'model_id'):
            self.assert_test(False, "", "Required tokens/model_id not available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # Test creating streaming session
        session_data = {
            "model_id": self.model_id,
            "session_type": "public"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/streaming/session", 
                                       json=session_data, headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Streaming session creation successful: {response.status_code}",
                f"Streaming session creation failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    'session_id' in data,
                    "Session creation returns session_id",
                    "Session creation doesn't return session_id"
                )
                
                self.assert_test(
                    'webrtc_config' in data,
                    "Session creation returns WebRTC config",
                    "Session creation doesn't return WebRTC config"
                )
                
                if 'webrtc_config' in data:
                    ice_servers = data['webrtc_config'].get('iceServers', [])
                    self.assert_test(
                        len(ice_servers) > 0,
                        f"WebRTC config includes {len(ice_servers)} ICE servers",
                        "WebRTC config missing ICE servers"
                    )
                
        except Exception as e:
            self.assert_test(False, "", f"Session creation error: {str(e)}")

    def test_live_models_endpoint(self):
        """Test GET /api/streaming/models/live"""
        print_test_header("Live Models Endpoint")
        
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
                
                # Check if our test model is in the list
                if data:
                    model = data[0]
                    required_fields = ['model_id', 'is_live', 'is_available', 'current_viewers', 'show_rate']
                    for field in required_fields:
                        self.assert_test(
                            field in model,
                            f"Live model data includes {field}",
                            f"Live model data missing {field}"
                        )
                    
                    # Check for thumbnail
                    if 'thumbnail' in model and model['thumbnail']:
                        print_success(f"Live model includes thumbnail data: {len(model['thumbnail'])} chars")
                    else:
                        print_warning("Live model missing thumbnail data")
                
        except Exception as e:
            self.assert_test(False, "", f"Live models endpoint error: {str(e)}")

    def test_online_models_count(self):
        """Test GET /api/streaming/models/online"""
        print_test_header("Online Models Count")
        
        try:
            response = self.session.get(f"{API_BASE}/streaming/models/online")
            self.assert_test(
                response.status_code == 200,
                f"Online models count endpoint accessible: {response.status_code}",
                f"Online models count endpoint failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    'online_models' in data,
                    "Response includes online_models count",
                    "Response missing online_models count"
                )
                
                self.assert_test(
                    'live_models' in data,
                    "Response includes live_models count",
                    "Response missing live_models count"
                )
                
                if 'online_models' in data and 'live_models' in data:
                    print_info(f"Online models: {data['online_models']}, Live models: {data['live_models']}")
                
        except Exception as e:
            self.assert_test(False, "", f"Online models count error: {str(e)}")

    def test_thumbnail_upload(self):
        """Test PATCH /api/streaming/models/{model_id}/thumbnail"""
        print_test_header("Thumbnail Upload")
        
        if 'model' not in self.tokens or not hasattr(self, 'model_id'):
            self.assert_test(False, "", "Required tokens/model_id not available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['model']}"}
        
        # Test thumbnail data (base64 encoded small image)
        thumbnail_data = {
            "thumbnail": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
        }
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/{self.model_id}/thumbnail", 
                                        json=thumbnail_data, headers=headers)
            self.assert_test(
                response.status_code == 200,
                f"Thumbnail upload successful: {response.status_code}",
                f"Thumbnail upload failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    data.get('success') == True,
                    "Thumbnail upload returns success",
                    "Thumbnail upload doesn't return success"
                )
                
        except Exception as e:
            self.assert_test(False, "", f"Thumbnail upload error: {str(e)}")

    def test_webrtc_signaling(self):
        """Test WebRTC signaling endpoints"""
        print_test_header("WebRTC Signaling")
        
        if 'viewer' not in self.tokens:
            self.assert_test(False, "", "Viewer token not available")
            return
            
        headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # Test WebRTC signaling with invalid session (should return 404)
        signal_data = {
            "session_id": "invalid-session-id",
            "signal": {"type": "offer", "sdp": "test-sdp"}
        }
        
        try:
            response = self.session.post(f"{API_BASE}/streaming/webrtc/signal", 
                                       json=signal_data, headers=headers)
            self.assert_test(
                response.status_code == 404,
                f"WebRTC signaling properly validates session: {response.status_code}",
                f"WebRTC signaling validation failed: {response.status_code}"
            )
                
        except Exception as e:
            self.assert_test(False, "", f"WebRTC signaling error: {str(e)}")

    def test_role_based_access(self):
        """Test role-based access control for streaming endpoints"""
        print_test_header("Role-Based Access Control")
        
        if 'viewer' not in self.tokens:
            self.assert_test(False, "", "Viewer token not available")
            return
            
        viewer_headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
        
        # Test viewer trying to update model status (should fail)
        params = {
            "is_live": True,
            "is_available": True
        }
        
        try:
            response = self.session.patch(f"{API_BASE}/streaming/models/status", 
                                        params=params, headers=viewer_headers)
            self.assert_test(
                response.status_code in [403, 422],
                f"Viewer properly blocked from updating model status: {response.status_code}",
                f"Viewer should be blocked from model status updates: {response.status_code}"
            )
                
        except Exception as e:
            self.assert_test(False, "", f"Role-based access test error: {str(e)}")

    def run_all_tests(self):
        """Run all streaming focused tests"""
        print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BLUE}{Colors.BOLD}QUANTUMSTRIP STREAMING FOCUSED TEST SUITE{Colors.ENDC}")
        print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print_info(f"Testing backend at: {API_BASE}")
        print_info(f"Test started at: {datetime.utcnow().isoformat()}")
        
        # Setup
        self.setup_test_users()
        
        # Core streaming tests
        self.test_model_authentication()
        self.test_streaming_status_updates()
        self.test_streaming_session_creation()
        self.test_live_models_endpoint()
        self.test_online_models_count()
        self.test_thumbnail_upload()
        self.test_webrtc_signaling()
        self.test_role_based_access()
        
        # Print final results
        print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BLUE}{Colors.BOLD}FINAL TEST RESULTS{Colors.ENDC}")
        print(f"{Colors.BLUE}{Colors.BOLD}{'='*80}{Colors.ENDC}")
        print(f"{Colors.BOLD}Total Tests: {self.test_results['total']}{Colors.ENDC}")
        print(f"{Colors.GREEN}Passed: {self.test_results['passed']}{Colors.ENDC}")
        print(f"{Colors.RED}Failed: {self.test_results['failed']}{Colors.ENDC}")
        
        if self.test_results['failed'] == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL STREAMING TESTS PASSED! 🎉{Colors.ENDC}")
            print(f"{Colors.GREEN}QuantumStrip streaming system is working correctly!{Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ SOME TESTS FAILED{Colors.ENDC}")
            
        success_rate = (self.test_results['passed'] / self.test_results['total']) * 100 if self.test_results['total'] > 0 else 0
        print(f"\n{Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.ENDC}")

if __name__ == "__main__":
    tester = StreamingFocusedTester()
    tester.run_all_tests()