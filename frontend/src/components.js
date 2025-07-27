import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useTokens, useModelEarnings, useAdminStats } from './hooks';
import { useResponsive, getResponsiveSpacing, getResponsiveText, getResponsiveGrid } from './responsive';
import { apiUtils } from './api';
import LanguageSwitcher from './components/LanguageSwitcher';

// Mock data for performers (existing)
const mockPerformers = [
  {
    id: 1,
    name: "Vivian_MaxxX",
    image: "https://images.unsplash.com/photo-1672794444732-e007954a177c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 1234,
    isNew: false,
    isHD: true,
    hasTicketShow: true,
    tokensEarned: 45600,
    rating: 4.8
  },
  {
    id: 2,
    name: "African_Dream",
    image: "https://images.unsplash.com/photo-1699746277651-3b1438122eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 856,
    isNew: false,
    isHD: false,
    tokensEarned: 32100,
    rating: 4.6
  },
  {
    id: 3,
    name: "NairobiBabe",
    image: "https://images.unsplash.com/photo-1561740303-a0fd9fabc646?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 654,
    isNew: false,
    isHD: true,
    tokensEarned: 67800,
    rating: 4.9
  },
  {
    id: 4,
    name: "SwahiliQueen",
    image: "https://images.unsplash.com/photo-1644224010199-407a662c9228?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 432,
    isNew: false,
    isHD: true,
    tokensEarned: 23400,
    rating: 4.7
  },
  {
    id: 5,
    name: "KampalaGirl",
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ug",
    isLive: true,
    viewers: 765,
    isNew: false,
    isHD: true,
    tokensEarned: 54300,
    rating: 4.8
  },
  {
    id: 6,
    name: "DarEsSalaamBaby",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "tz",
    isLive: true,
    viewers: 543,
    isNew: false,
    isHD: true,
    tokensEarned: 78900,
    rating: 4.9
  }
];

const mockCouples = [
  {
    id: 7,
    name: "NairobiLovers",
    image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 1543,
    isNew: false,
    isHD: true,
    tokensEarned: 89600,
    rating: 4.8
  },
  {
    id: 8,
    name: "EastAfricaCouple",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 876,
    isNew: false,
    isHD: true,
    tokensEarned: 65400,
    rating: 4.7
  }
];

const countryFlags = {
  ke: "🇰🇪",
  ug: "🇺🇬", 
  tz: "🇹🇿",
  rw: "🇷🇼"
};

// Token packages
const tokenPackages = [
  { tokens: 50, price: 500, popular: false },
  { tokens: 100, price: 1000, popular: true },
  { tokens: 200, price: 1900, popular: false },
  { tokens: 500, price: 4500, popular: false },
  { tokens: 1000, price: 8500, popular: false }
];

// Age Verification Modal Component (Updated for QuantumStrip)
export const AgeVerificationModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedCategory, setSelectedCategory] = useState('girls');
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedCategory);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="text-center text-white px-8">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full mr-3">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('age_verification.title')}
          </h1>
        </div>
        
        <p className="text-lg mb-2">{t('age_verification.welcome')}</p>
        <p className="text-lg mb-8">{t('age_verification.join_community')}</p>
        
        <p className="text-white mb-6">{t('age_verification.interested_in')}</p>
        
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('girls')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'girls' 
                ? 'bg-pink-600 border-pink-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-pink-400'
            }`}
          >
            <div className="text-2xl mb-1">♀</div>
            <div>{t('age_verification.girls')}</div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('guys')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'guys' 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="text-2xl mb-1">♂</div>
            <div>{t('age_verification.guys')}</div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('couples')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'couples' 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="text-2xl mb-1">💕</div>
            <div>{t('age_verification.couples')}</div>
          </button>
        </div>
        
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-full text-lg font-semibold transition-colors mb-6"
        >
          {t('age_verification.over_18')}
        </button>
        
        <div className="text-xs text-gray-400 max-w-2xl mx-auto">
          <p className="mb-2">
            {t('age_verification.terms_text')}
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white underline"
        >
          {t('age_verification.exit_here')}
        </button>
      </div>
    </div>
  );
};

// Login Page Component (Backend Integrated)
export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const spacing = getResponsiveSpacing(isMobile, isTablet);
  const textSizes = getResponsiveText(isMobile, isTablet);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Check if there's a redirect URL in localStorage
      const redirectUrl = localStorage.getItem('quantumstrip_redirect_after_login');
      
      if (redirectUrl) {
        localStorage.removeItem('quantumstrip_redirect_after_login');
        navigate(redirectUrl);
      } else {
        // Redirect to dashboard - the router will handle the redirect based on user role
        navigate('/dashboard');
      }
    }
    // Error is handled by the auth context and displayed below
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className={`max-w-md w-full bg-gray-800 rounded-xl shadow-2xl ${spacing.card} border border-gray-700`}>
        <div className="text-center mb-8">
          <h1 className={`${textSizes.h1} bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2`}>
            QUANTUMSTRIP
          </h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none pr-12"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !formData.email || !formData.password}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isLoading || !formData.email || !formData.password
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              disabled={isLoading}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign up
            </button>
          </p>
          
          <button
            onClick={() => navigate('/')}
            disabled={isLoading}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Page Component (Backend Integrated)
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const spacing = getResponsiveSpacing(isMobile, isTablet);
  const textSizes = getResponsiveText(isMobile, isTablet);
  
  const [userType, setUserType] = useState('viewer');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    terms: false
  });

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!formData.terms) {
      alert('Please accept the terms and conditions');
      return;
    }
    
    if (parseInt(formData.age) < 18) {
      alert('You must be 18 or older to register');
      return;
    }
    
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      age: parseInt(formData.age),
      role: userType
    };
    
    const result = await register(userData);
    
    if (result.success) {
      alert('Registration successful! Please log in with your credentials.');
      navigate('/login');
    }
    // Error is handled by the auth context and displayed below
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            QUANTUMSTRIP
          </h1>
          <p className="text-gray-300">Create your account</p>
        </div>
        
        {/* User Type Selector */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setUserType('viewer')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'viewer' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Viewer
          </button>
          <button
            onClick={() => setUserType('model')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'model' 
                ? 'bg-pink-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Model
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="254712345678"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Age
            </label>
            <input
              type="number"
              min="18"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Must be 18+"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Create a password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={(e) => setFormData({...formData, terms: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Create {userType.charAt(0).toUpperCase() + userType.slice(1)} Account
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign in
            </button>
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Header Component (Updated for QuantumStrip)
export const Header = ({ userType, isAuthenticated, onLogout, userTokens = 0 }) => {
  const navigate = useNavigate();
  
  const navigateTo = (path) => {
    switch(path) {
      case 'home':
        navigate('/');
        break;
      case 'token-purchase':
        navigate('/token-purchase');
        break;
      case 'admin-dashboard':
        navigate('/admin-dashboard');
        break;
      case 'model-dashboard':
        navigate('/model-dashboard');
        break;
      case 'viewer-dashboard':
        navigate('/viewer-dashboard');
        break;
      case 'register':
        navigate('/register');
        break;
      case 'login':
        navigate('/login');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="lg:hidden text-gray-300 hover:text-white mr-4">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full mr-3">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              QUANTUMSTRIP
            </h1>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Language Switcher */}
          <div className="mr-4">
            <LanguageSwitcher variant="compact" />
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center">
              {userType === 'viewer' && (
                <div className="flex items-center mr-4">
                  <button
                    onClick={() => navigateTo('token-purchase')}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg mr-2 flex items-center hover:from-green-700 hover:to-green-800"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-1">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {userTokens} Tokens
                  </button>
                </div>
              )}
              
              <button
                onClick={() => navigateTo(userType === 'admin' ? 'admin-dashboard' : 
                                        userType === 'model' ? 'model-dashboard' : 'viewer-dashboard')}
                className="text-gray-300 hover:text-white mr-4"
              >
                Dashboard
              </button>
              
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigateTo('register')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mr-2 border border-gray-600"
              >
                Sign Up
              </button>
              <button
                onClick={() => navigateTo('login')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// Sidebar Component (Updated for QuantumStrip)
export const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  
  return (
    <aside className="w-64 bg-gray-900 h-full border-r border-gray-700">
      {/* Token Giveaway Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 m-4 rounded-lg">
        <div className="flex items-center text-white">
          <div className="text-2xl font-bold mr-2">50</div>
          <div>
            <div className="font-semibold">Tokens</div>
            <div className="text-sm">Free Bonus</div>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="px-4">
        <div className="space-y-1">
          <button 
            onClick={() => setActiveMenu('home')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'home' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </button>
          
          <button 
            onClick={() => setActiveMenu('feed')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'feed' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Feed
          </button>
          
          <button 
            onClick={() => setActiveMenu('favorites')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'favorites' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            My Favorites
          </button>
          
          <button 
            onClick={() => setActiveMenu('privates')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'privates' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Private Shows
          </button>
        </div>
        
        <div className="mt-8">
          <h3 className="text-gray-400 text-sm font-semibold mb-3">CATEGORIES</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🇰🇪</span>
                Kenyan Models
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">156</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🇺🇬</span>
                Ugandan Models
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">89</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🇹🇿</span>
                Tanzanian Models
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">67</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                New Models
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">234</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">📱</span>
                Mobile Streaming
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">98</span>
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

// Performer Card Component (Updated)
export const PerformerCard = ({ performer, userType, isAuthenticated }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleWatchLive = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/private-show');
  };
  
  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-w-16 aspect-h-9">
        <img 
          src={performer.image} 
          alt={performer.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Overlay indicators */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {performer.hasTicketShow && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Private Show</span>
          )}
          {performer.isNew && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-semibold">NEW</span>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {performer.isHD && (
            <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">HD</span>
          )}
          <div className="flex items-center bg-black bg-opacity-70 text-yellow-400 text-xs px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {performer.rating}
          </div>
        </div>

        <div className="absolute bottom-2 right-2">
          <span className="text-white text-sm">{countryFlags[performer.country]}</span>
        </div>
        
        {/* Live indicator */}
        {performer.isLive && (
          <div className="absolute bottom-2 left-2 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
            <span className="text-white text-xs font-semibold">LIVE</span>
          </div>
        )}
        
        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="text-center">
              <button 
                onClick={handleWatchLive}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg mb-2 font-semibold"
              >
                {isAuthenticated ? 'Watch Live' : 'Login to Watch'}
              </button>
              <div className="text-white text-sm">
                {performer.viewers} viewers
              </div>
              <div className="text-green-400 text-xs mt-1">
                20 tokens/min
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{performer.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-400 text-xs">{performer.viewers} viewers</span>
          <div className="flex items-center space-x-1">
            <button className="text-gray-400 hover:text-red-400">
              <svg className="w-4 h-4" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Component
export const Section = ({ title, performers, showMore = true, navigateTo, userType, isAuthenticated }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {title.includes('Kenyan') && <span className="text-2xl mr-2">🇰🇪</span>}
          <h2 className="text-white text-xl font-semibold">{title}</h2>
        </div>
        {showMore && (
          <button className="text-purple-400 hover:text-purple-300 font-semibold">
            See All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {performers.map(performer => (
          <PerformerCard 
            key={performer.id} 
            performer={performer} 
            navigateTo={navigateTo}
            userType={userType}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
    </div>
  );
};

// Navigation Tabs Component
export const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'girls', label: 'Girls', count: 2156 },
    { id: 'couples', label: 'Couples', count: 342 },
    { id: 'guys', label: 'Guys', count: 189 },
    { id: 'trans', label: 'Trans', count: 67 }
  ];
  
  return (
    <div className="border-b border-gray-700 mb-6">
      <nav className="flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs">({tab.count})</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Streaming Interface Component (Main Home Page)
export const StreamingInterface = ({ activeTab, navigateTo, userType, isAuthenticated, onLogout }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [userTokens] = useState(150); // Mock user tokens

  return (
    <>
      <Header 
        userType={userType} 
        isAuthenticated={isAuthenticated} 
        onLogout={onLogout}
        userTokens={userTokens}
      />
      
      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 p-6 pb-20">
          <NavigationTabs activeTab={currentTab} setActiveTab={setCurrentTab} />
          
          {currentTab === 'girls' && (
            <>
              <Section 
                title="🇰🇪 Kenyan Models" 
                performers={mockPerformers.slice(0, 6)} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
              
              <Section 
                title="Top Rated Models" 
                performers={mockPerformers.slice(2, 8)} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
              
              <Section 
                title="Mobile Streaming" 
                performers={mockPerformers.slice(1, 7)} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
          
          {currentTab === 'couples' && (
            <>
              <Section 
                title="East African Couples" 
                performers={mockCouples} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
              
              <Section 
                title="Top Couple Shows" 
                performers={mockCouples.slice(0, 4)} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
          
          {currentTab === 'guys' && (
            <>
              <Section 
                title="Male Models" 
                performers={mockPerformers.slice(3, 8).map(p => ({...p, name: p.name.replace('Queen', 'King')}))} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
          
          {currentTab === 'trans' && (
            <>
              <Section 
                title="Trans Models" 
                performers={mockPerformers.slice(0, 5).map(p => ({...p, name: p.name + '_Trans'}))} 
                navigateTo={navigateTo}
                userType={userType}
                isAuthenticated={isAuthenticated}
              />
            </>
          )}
        </main>
      </div>
      
      <BottomCTA navigateTo={navigateTo} isAuthenticated={isAuthenticated} />
    </>
  );
};

// Bottom Call to Action Component (Updated)
export const BottomCTA = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  if (isAuthenticated) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 z-40">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center">
          <div className="bg-white rounded-full p-2 mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-600">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-semibold">Join QuantumStrip to interact with models!</span>
        </div>
        
        <button 
          onClick={() => navigate('/register')}
          className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Join FREE
        </button>
      </div>
    </div>
  );
};

// Token Purchase Page Component
export const TokenPurchasePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(tokenPackages[1]);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Mock M-Pesa STK Push
    setTimeout(() => {
      alert(`M-Pesa STK Push sent to ${phoneNumber}! Please enter your PIN to complete the purchase of ${selectedPackage.tokens} tokens for KES ${selectedPackage.price}.`);
      setIsProcessing(false);
      navigate('/viewer-dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <Header 
        userType={user?.role} 
        isAuthenticated={true}
        onLogout={() => navigate('/')}
      />
      
      <div className="max-w-4xl mx-auto p-6 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Purchase Tokens</h1>
          <p className="text-gray-300">Choose your token package and pay securely with M-Pesa</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Token Packages */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Select Package</h2>
            
            <div className="space-y-3">
              {tokenPackages.map((pkg) => (
                <div
                  key={pkg.tokens}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPackage.tokens === pkg.tokens
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-white mr-2">{pkg.tokens}</span>
                        <span className="text-gray-300">Tokens</span>
                        {pkg.popular && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        KES {(pkg.price / pkg.tokens).toFixed(1)} per token
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-400">
                        KES {pkg.price.toLocaleString()}
                      </div>
                      {pkg.tokens >= 200 && (
                        <div className="text-xs text-green-400">Save {Math.round((1 - pkg.price / pkg.tokens / 10) * 100)}%</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700">
              <h3 className="text-blue-300 font-semibold mb-2">What can you do with tokens?</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Private shows: 20 tokens/minute</li>
                <li>• Tip models: Starting from 1 token</li>
                <li>• Send messages and requests</li>
                <li>• Access exclusive content</li>
              </ul>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Details</h2>
            
            <form onSubmit={handlePurchase} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <div
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      paymentMethod === 'mpesa'
                        ? 'border-green-500 bg-green-900/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="bg-green-600 text-white px-3 py-1 rounded font-bold text-sm mr-3">
                        M-PESA
                      </div>
                      <span className="text-white">Pay with M-Pesa</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="254712345678"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter your M-Pesa registered phone number
                </p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Order Summary</h3>
                <div className="flex justify-between text-gray-300 mb-2">
                  <span>{selectedPackage.tokens} Tokens</span>
                  <span>KES {selectedPackage.price.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between text-white font-semibold">
                    <span>Total</span>
                    <span>KES {selectedPackage.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isProcessing
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Pay KES ${selectedPackage.price.toLocaleString()} with M-Pesa`
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/viewer-dashboard')}
                className="text-gray-400 hover:text-white text-sm"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Viewer Dashboard Component
export const ViewerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userTokens] = useState(150);
  const [favoriteModels] = useState(mockPerformers.slice(0, 4));
  const [recentPurchases] = useState([
    { id: 1, date: '2024-01-15', tokens: 100, amount: 1000, status: 'completed' },
    { id: 2, date: '2024-01-10', tokens: 50, amount: 500, status: 'completed' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <Header 
        userType="viewer" 
        isAuthenticated={true}
        onLogout={logout}
        userTokens={userTokens}
      />
      
      <div className="max-w-6xl mx-auto p-6 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Viewer Dashboard</h1>
          <button
            onClick={() => navigate('/token-purchase')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800"
          >
            Buy Tokens
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userTokens}</p>
                <p className="text-gray-400 text-sm">Available Tokens</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-pink-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{favoriteModels.length}</p>
                <p className="text-gray-400 text-sm">Favorite Models</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-gray-400 text-sm">Private Shows</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">KES 1,500</p>
                <p className="text-gray-400 text-sm">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Favorite Models */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Favorite Models</h2>
            <div className="space-y-4">
              {favoriteModels.map((model) => (
                <div key={model.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <img 
                      src={model.image} 
                      alt={model.name}
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                    <div>
                      <h3 className="text-white font-semibold">{model.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {model.isLive ? (
                          <span className="text-green-400">● Online</span>
                        ) : (
                          'Offline'
                        )}
                      </p>
                    </div>
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm">
                    {model.isLive ? 'Watch' : 'Message'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Purchases */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Purchases</h2>
            <div className="space-y-4">
              {recentPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-semibold">{purchase.tokens} Tokens</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(purchase.date).toLocaleDateString()} • KES {purchase.amount}
                    </p>
                  </div>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs">
                    {purchase.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Model Dashboard Component
export const ModelDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [modelStats] = useState({
    tokensEarned: 45600,
    keshBalance: 22800, // 50% of tokens earned
    withdrawableAmount: 22800,
    totalViewers: 15430,
    rating: 4.8,
    liveHours: 156
  });

  const [recentEarnings] = useState([
    { id: 1, date: '2024-01-15', tokens: 1200, amount: 600, type: 'Private Show' },
    { id: 2, date: '2024-01-15', tokens: 800, amount: 400, type: 'Tips' },
    { id: 3, date: '2024-01-14', tokens: 2100, amount: 1050, type: 'Private Show' },
  ]);

  const handleWithdrawRequest = () => {
    if (modelStats.keshBalance < 20000) {
      alert(`Minimum withdrawal amount is KES 20,000. You currently have KES ${modelStats.keshBalance.toLocaleString()}`);
      return;
    }
    alert('Withdrawal request submitted! Your earnings will be sent to your M-Pesa within 24 hours.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-gray-900 to-black">
      <Header 
        userType="model" 
        isAuthenticated={true}
        onLogout={logout}
      />
      
      <div className="max-w-6xl mx-auto p-6 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Model Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/private-show')}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800"
            >
              Go Live
            </button>
            <button
              onClick={handleWithdrawRequest}
              className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-pink-800"
            >
              Withdraw Earnings
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{modelStats.tokensEarned.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Tokens Earned</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-pink-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V4.5C15 3.1 13.9 2 12.5 2S10 3.1 10 4.5V7.5L4 7V9L10 8.5V15L8 16V21H10V17L12 15.5L14 17V21H16V16L14 15V8.5L21 9Z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">KES {modelStats.keshBalance.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Available Balance</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{modelStats.totalViewers.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Viewers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-yellow-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{modelStats.rating}</p>
                <p className="text-gray-400 text-sm">Rating</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Earnings Overview */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Earnings</h2>
            <div className="space-y-4">
              {recentEarnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-semibold">{earning.type}</h3>
                    <p className="text-gray-400 text-sm">
                      {new Date(earning.date).toLocaleDateString()} • {earning.tokens} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">KES {earning.amount}</p>
                    <p className="text-xs text-gray-400">Your share (50%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Withdrawal Information */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Withdrawal Info</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-700">
                <h3 className="text-green-300 font-semibold mb-2">Available for Withdrawal</h3>
                <p className="text-2xl font-bold text-white">KES {modelStats.withdrawableAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {modelStats.withdrawableAmount >= 20000 
                    ? 'Ready to withdraw' 
                    : `Need KES ${(20000 - modelStats.withdrawableAmount).toLocaleString()} more for minimum withdrawal`
                  }
                </p>
              </div>
              
              <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700">
                <h4 className="text-blue-300 font-semibold mb-2">Withdrawal Details</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Minimum withdrawal: KES 20,000</li>
                  <li>• Processing time: 24 hours</li>
                  <li>• Method: M-Pesa</li>
                  <li>• Revenue share: 50% to models</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Settings */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Settings</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input
                type="text"
                defaultValue="NairobiBabe"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Show Rate (tokens/min)</label>
              <input
                type="number"
                defaultValue="20"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
              <textarea
                rows="3"
                defaultValue="Hey there! I'm your friendly Nairobi girl ready to have some fun! 💕"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>
          <button className="mt-4 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [adminStats] = useState({
    totalUsers: 12450,
    activeModels: 234,
    totalRevenue: 45600000, // in KES
    dailyRevenue: 125000,
    platformShare: 22800000, // 50% of total revenue
    modelPayouts: 22800000
  });

  const [recentTransactions] = useState([
    { id: 1, user: 'viewer123', model: 'NairobiBabe', amount: 1000, tokens: 100, date: '2024-01-15' },
    { id: 2, user: 'user456', model: 'SwahiliQueen', amount: 500, tokens: 50, date: '2024-01-15' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black">
      <Header 
        userType="admin" 
        isAuthenticated={true}
        onLogout={logout}
      />
      
      <div className="max-w-6xl mx-auto p-6 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Platform Revenue (50%)</p>
            <p className="text-2xl font-bold text-green-400">KES {adminStats.platformShare.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{adminStats.totalUsers.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-pink-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{adminStats.activeModels}</p>
                <p className="text-gray-400 text-sm">Active Models</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">KES {adminStats.dailyRevenue.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Daily Revenue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">KES {adminStats.totalRevenue.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Revenue</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-semibold">{transaction.user} → {transaction.model}</h3>
                    <p className="text-gray-400 text-sm">
                      {transaction.tokens} tokens • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">KES {transaction.amount}</p>
                    <p className="text-xs text-gray-400">Platform: KES {transaction.amount / 2}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* System Settings */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">System Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Platform Revenue Share (%)</label>
                <input
                  type="number"
                  defaultValue="50"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Withdrawal (KES)</label>
                <input
                  type="number"
                  defaultValue="20000"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Show Rate (tokens/min)</label>
                <input
                  type="number"
                  defaultValue="20"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-red-500 focus:outline-none"
                />
              </div>
              
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
                Update Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Private Show Interface Component - redirects to new live streaming interface
export const PrivateShowInterface = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // Redirect based on user role to the appropriate streaming interface
    if (user?.role === 'model') {
      navigate('/live-streaming/model');
    } else {
      // For viewers, redirect to main page to select a model
      navigate('/');
    }
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-xl">Redirecting to live streaming...</p>
      </div>
    </div>
  );
};

// Export all components and data
export { mockPerformers, mockCouples, tokenPackages, countryFlags };