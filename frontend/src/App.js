import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './i18n';
import { AuthProvider, useAuth } from './AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import {
  AgeVerificationModal,
  PrivateShowInterface,
  LoginPage,
  ViewerDashboard,
  ModelDashboard,
  AdminDashboard,
} from './components';
import {
  RegisterPage,
  TokenPurchasePage,
  IntegratedStreamingInterface as StreamingInterface,
} from './IntegratedComponents';
import { ModelLiveStreamingInterface } from './components/LiveStreamingInterface';
import TimedStreamViewer from './components/TimedStreamViewer';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
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
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<StreamingInterface />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      } />
      
      <Route path="/viewer-dashboard" element={
        <ProtectedRoute allowedRoles={['viewer']}>
          <ViewerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/model-dashboard" element={
        <ProtectedRoute allowedRoles={['model']}>
          <ModelDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/token-purchase" element={
        <ProtectedRoute allowedRoles={['viewer']}>
          <TokenPurchasePage />
        </ProtectedRoute>
      } />
      
      <Route path="/private-show/:modelId?" element={
        <ProtectedRoute>
          <PrivateShowInterface />
        </ProtectedRoute>
      } />
      
      {/* New Live Streaming Routes */}
      <Route path="/live-streaming/model" element={
        <ProtectedRoute allowedRoles={['model']}>
          <ModelLiveStreamingInterface />
        </ProtectedRoute>
      } />
      
      <Route path="/live-streaming/viewer/:modelId" element={
        <TimedStreamViewer />
      } />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Dashboard Redirect Component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin-dashboard" replace />;
    case 'model':
      return <Navigate to="/model-dashboard" replace />;
    case 'viewer':
    default:
      return <Navigate to="/viewer-dashboard" replace />;
  }
};

// Age Verification Wrapper
const AgeVerificationWrapper = ({ children }) => {
  const [showAgeVerification, setShowAgeVerification] = React.useState(() => {
    return !localStorage.getItem('quantumstrip_age_verified');
  });
  const [selectedCategory, setSelectedCategory] = React.useState('girls');

  const handleAgeVerificationConfirm = (category) => {
    setSelectedCategory(category);
    setShowAgeVerification(false);
    localStorage.setItem('quantumstrip_age_verified', 'true');
    localStorage.setItem('quantumstrip_preferred_category', category);
  };

  const handleAgeVerificationClose = () => {
    // Redirect away from site
    window.location.href = 'https://google.com';
  };

  return (
    <>
      {showAgeVerification && (
        <AgeVerificationModal 
          isOpen={true}
          onClose={handleAgeVerificationClose}
          onConfirm={handleAgeVerificationConfirm}
        />
      )}
      {children}
    </>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-black">
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <AgeVerificationWrapper>
              <AppRoutes />
            </AgeVerificationWrapper>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;