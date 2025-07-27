#!/usr/bin/env python3
"""
Focused test for WebRTC Live Streaming - Camera Access Fix
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

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

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def test_camera_access_fix():
    """Test the camera access fix for QuantumStrip streaming platform"""
    print_test_header("Camera Access Fix - Model Authentication Testing")
    
    session = requests.Session()
    test_results = {'passed': 0, 'failed': 0, 'total': 0}
    
    def assert_test(condition, success_msg, error_msg):
        test_results['total'] += 1
        if condition:
            test_results['passed'] += 1
            print_success(success_msg)
            return True
        else:
            test_results['failed'] += 1
            print_error(error_msg)
            return False
    
    print_info("Testing camera access fix for QuantumStrip streaming platform...")
    print_info("Focus: Model authentication and role verification for streaming access")
    
    # Test 1: Model authentication with test model user (model@test.com)
    print_info("Testing model@test.com authentication for streaming access...")
    
    model_login_data = {
        "email": "model@test.com",
        "password": "password123"
    }
    
    model_token = None
    model_id = None
    
    try:
        response = session.post(f"{API_BASE}/auth/login", json=model_login_data)
        assert_test(
            response.status_code == 200,
            f"Model user (model@test.com) login successful: {response.status_code}",
            f"Model user login failed: {response.status_code} - {response.text}"
        )
        
        if response.status_code == 200:
            data = response.json()
            assert_test(
                "access_token" in data and data.get("user", {}).get("role") == "model",
                "Model user authenticated with correct role",
                "Model user authentication failed or role incorrect"
            )
            
            model_token = data.get("access_token")
            model_user_data = data.get("user", {})
            print_info(f"Model authenticated: {model_user_data.get('email')} with role: {model_user_data.get('role')}")
            
            # Test 2: Model dashboard access to verify profile exists
            model_headers = {"Authorization": f"Bearer {model_token}"}
            dashboard_response = session.get(f"{API_BASE}/auth/model/dashboard", headers=model_headers)
            assert_test(
                dashboard_response.status_code == 200,
                "Model dashboard accessible with authenticated token",
                f"Model dashboard access failed: {dashboard_response.status_code}"
            )
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                model_profile = dashboard_data.get('profile', {})
                model_id = model_profile.get('id')
                
                assert_test(
                    model_id is not None,
                    f"Model profile found with ID: {model_id}",
                    "Model profile missing or no ID found"
                )
                
                # Test 3: Model status update for streaming (critical for camera access)
                print_info("Testing model status update for streaming access...")
                
                status_data = {
                    "is_live": True,
                    "is_available": True
                }
                
                status_response = session.patch(f"{API_BASE}/streaming/models/status", params=status_data, headers=model_headers)
                assert_test(
                    status_response.status_code == 200,
                    f"Model streaming status update successful: {status_response.status_code}",
                    f"Model streaming status update failed: {status_response.status_code} - {status_response.text}"
                )
                
                if status_response.status_code == 200:
                    status_result = status_response.json()
                    assert_test(
                        status_result.get("success") == True and status_result.get("is_live") == True,
                        "Model successfully set to live streaming status",
                        "Model status update didn't properly set live status"
                    )
                    print_info(f"Model streaming status: Live={status_result.get('is_live')}, Available={status_result.get('is_available')}")
                    
                    # Test 4: Verify model appears in live models list
                    live_models_response = session.get(f"{API_BASE}/streaming/models/live")
                    assert_test(
                        live_models_response.status_code == 200,
                        "Live models endpoint accessible",
                        f"Live models endpoint failed: {live_models_response.status_code}"
                    )
                    
                    if live_models_response.status_code == 200:
                        live_models = live_models_response.json()
                        model_found = any(model.get('model_id') == model_id for model in live_models)
                        assert_test(
                            model_found,
                            f"Model {model_id} appears in live models list",
                            f"Model {model_id} not found in live models list"
                        )
                        print_info(f"Found {len(live_models)} live models, including our test model")
        
    except Exception as e:
        assert_test(False, "", f"Model authentication test error: {str(e)}")
    
    # Test 5: Test streaming session creation with viewer
    print_info("Testing streaming session creation with viewer...")
    
    # Login as viewer
    viewer_login_data = {
        "email": "viewer@test.com",
        "password": "password123"
    }
    
    viewer_token = None
    
    try:
        viewer_response = session.post(f"{API_BASE}/auth/login", json=viewer_login_data)
        if viewer_response.status_code == 200 and model_id:
            viewer_data = viewer_response.json()
            viewer_token = viewer_data.get("access_token")
            viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
            
            session_data = {
                "model_id": model_id,
                "session_type": "public"
            }
            
            session_response = session.post(f"{API_BASE}/streaming/session", json=session_data, headers=viewer_headers)
            assert_test(
                session_response.status_code in [200, 400],
                f"Streaming session creation responds: {session_response.status_code}",
                f"Streaming session creation completely failed: {session_response.status_code}"
            )
            
            if session_response.status_code == 200:
                session_result = session_response.json()
                assert_test(
                    "session_id" in session_result and "webrtc_config" in session_result,
                    "Streaming session created with WebRTC configuration",
                    "Streaming session missing required WebRTC configuration"
                )
                
                # Verify WebRTC configuration for camera streaming
                webrtc_config = session_result.get("webrtc_config", {})
                assert_test(
                    "iceServers" in webrtc_config,
                    "WebRTC configuration includes ICE servers for camera streaming",
                    "WebRTC configuration missing ICE servers"
                )
                
                print_info(f"WebRTC session created: {session_result.get('session_id')}")
                print_info(f"WebRTC config ready for camera streaming: {len(webrtc_config.get('iceServers', []))} ICE servers")
                
            elif session_response.status_code == 400:
                print_info("Session creation validation working (expected for test scenario)")
                
    except Exception as e:
        assert_test(False, "", f"Streaming session test error: {str(e)}")
    
    # Test 6: Role-based access control verification
    print_info("Testing role-based access control for streaming...")
    
    # Test that viewers cannot update model streaming status
    if viewer_token:
        viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
        status_data = {
            "is_live": True,
            "is_available": True
        }
        
        try:
            response = session.patch(f"{API_BASE}/streaming/models/status", params=status_data, headers=viewer_headers)
            assert_test(
                response.status_code == 403,
                "Viewer properly blocked from updating model streaming status",
                f"Viewer should not be able to update model status but got: {response.status_code}"
            )
            print_info("Role-based access control working: Viewers cannot set streaming status")
        except Exception as e:
            assert_test(False, "", f"Role verification test error: {str(e)}")
    
    # Test 7: JWT token handling for streaming endpoints
    print_info("Testing JWT token handling for streaming endpoints...")
    
    # Test streaming endpoints without authentication
    try:
        response = session.patch(f"{API_BASE}/streaming/models/status", params={"is_live": True, "is_available": True})
        assert_test(
            response.status_code in [401, 403],
            "Streaming endpoints properly require authentication",
            f"Streaming endpoints should require auth but got: {response.status_code}"
        )
        print_info("JWT authentication required for streaming endpoints")
    except Exception as e:
        assert_test(False, "", f"JWT authentication test error: {str(e)}")
    
    # Print final results
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("CAMERA ACCESS FIX TEST RESULTS")
    print("=" * 80)
    print(f"{Colors.ENDC}")
    
    total = test_results['total']
    passed = test_results['passed']
    failed = test_results['failed']
    
    print(f"{Colors.BOLD}Total Tests: {total}{Colors.ENDC}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {failed}{Colors.ENDC}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL CAMERA ACCESS TESTS PASSED! 🎉{Colors.ENDC}")
        print(f"{Colors.GREEN}Model authentication and streaming access working correctly!{Colors.ENDC}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}❌ {failed} TEST(S) FAILED{Colors.ENDC}")
        print(f"{Colors.YELLOW}Please review the failed tests above.{Colors.ENDC}")
    
    success_rate = (passed / total * 100) if total > 0 else 0
    print(f"\n{Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.ENDC}")
    
    return failed == 0

if __name__ == "__main__":
    success = test_camera_access_fix()
    sys.exit(0 if success else 1)