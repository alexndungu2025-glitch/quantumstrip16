import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, apiUtils } from './api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AuthActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_PROFILE_SUCCESS: 'UPDATE_PROFILE_SUCCESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_START:
    case AuthActionTypes.REGISTER_START:
    case AuthActionTypes.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.LOAD_USER_SUCCESS:
    case AuthActionTypes.UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };

    case AuthActionTypes.LOGIN_FAILURE:
    case AuthActionTypes.REGISTER_FAILURE:
    case AuthActionTypes.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      dispatch({ type: AuthActionTypes.LOAD_USER_START });
      
      const token = localStorage.getItem('quantumstrip_token');
      const savedUser = localStorage.getItem('quantumstrip_user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching user profile
          const user = await authAPI.getProfile();
          dispatch({ 
            type: AuthActionTypes.LOGIN_SUCCESS, 
            payload: { user, token } 
          });
        } catch (error) {
          // Only clear storage if it's actually an auth error (401/403)
          // Don't logout users for network issues or server errors
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            localStorage.removeItem('quantumstrip_token');
            localStorage.removeItem('quantumstrip_user');
            dispatch({ 
              type: AuthActionTypes.LOAD_USER_FAILURE, 
              payload: 'Session expired' 
            });
          } else {
            // For network errors or server issues, keep user logged in with saved data
            console.warn('Profile fetch failed but keeping user logged in:', error);
            const savedUserData = JSON.parse(savedUser);
            dispatch({ 
              type: AuthActionTypes.LOGIN_SUCCESS, 
              payload: { user: savedUserData, token } 
            });
          }
        }
      } else {
        dispatch({ 
          type: AuthActionTypes.LOAD_USER_FAILURE, 
          payload: null 
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AuthActionTypes.LOGIN_START });
      
      const response = await authAPI.login(email, password);
      const { access_token, user } = response;
      
      // Store token and user data
      localStorage.setItem('quantumstrip_token', access_token);
      localStorage.setItem('quantumstrip_user', JSON.stringify(user));
      
      dispatch({ 
        type: AuthActionTypes.LOGIN_SUCCESS, 
        payload: { user, token: access_token } 
      });
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      dispatch({ 
        type: AuthActionTypes.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActionTypes.REGISTER_START });
      
      const response = await authAPI.register(userData);
      
      dispatch({ type: AuthActionTypes.REGISTER_SUCCESS });
      
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      dispatch({ 
        type: AuthActionTypes.REGISTER_FAILURE, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      dispatch({ type: AuthActionTypes.LOGOUT });
      return { success: true };
    } catch (error) {
      // Even if API call fails, we should still logout locally
      dispatch({ type: AuthActionTypes.LOGOUT });
      return { success: true };
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authAPI.updateProfile(profileData);
      
      // Update localStorage with new user data
      localStorage.setItem('quantumstrip_user', JSON.stringify(updatedUser));
      
      dispatch({ 
        type: AuthActionTypes.UPDATE_PROFILE_SUCCESS, 
        payload: updatedUser 
      });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = apiUtils.handleApiError(error);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh user profile to keep session fresh
  const refreshProfile = async () => {
    if (!state.isAuthenticated || !state.token) return;
    
    try {
      const user = await authAPI.getProfile();
      
      // Update localStorage with fresh user data
      localStorage.setItem('quantumstrip_user', JSON.stringify(user));
      
      dispatch({ 
        type: AuthActionTypes.UPDATE_PROFILE_SUCCESS, 
        payload: user 
      });
      
      return { success: true, user };
    } catch (error) {
      // Only logout if it's actually an auth error
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        await logout();
      }
      console.warn('Profile refresh failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Auto-refresh profile every 15 minutes to keep session active
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const refreshInterval = setInterval(() => {
        refreshProfile();
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [state.isAuthenticated, state.token]);

  // Clear error function
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Get user role
  const getUserRole = () => {
    return state.user?.role || null;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user is viewer
  const isViewer = () => hasRole('viewer');

  // Check if user is model
  const isModel = () => hasRole('model');

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Get user's display name
  const getDisplayName = () => {
    if (!state.user) return '';
    return state.user.username || state.user.email || 'User';
  };

  // Check if user account is verified
  const isVerified = () => {
    return state.user?.is_verified || false;
  };

  // Check if user account is active
  const isActive = () => {
    return state.user?.is_active || false;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError,
    
    // Utility functions
    getUserRole,
    hasRole,
    isViewer,
    isModel,
    isAdmin,
    getDisplayName,
    isVerified,
    isActive,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = (Component, allowedRoles = []) => {
  return (props) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-4">Please log in to access this page.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="mb-4">You don't have permission to access this page.</p>
            <button 
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default AuthContext;