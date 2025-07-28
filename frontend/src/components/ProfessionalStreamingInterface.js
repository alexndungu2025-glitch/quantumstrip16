import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { streamingAPI, tokenAPI } from '../api';
import LiveModelsSection from './LiveModelsSection';

// Professional Streaming Platform Header
const ProfessionalHeader = ({ user, onLogout, tokenBalance }) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="bg-gradient-to-r from-red-700 to-red-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Live Count */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-bold text-lg">💋</span>
              </div>
              <h1 className="text-white text-xl font-bold">QUANTUMSTRIP</h1>
            </div>
            
            {/* Live Count */}
            <div className="flex items-center bg-red-800 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-white text-sm font-medium">
                {tokenBalance?.live_count || 0} LIVE
              </span>
            </div>
            
            {/* Top Models */}
            <div className="hidden md:flex items-center text-white">
              <svg className="w-5 h-5 mr-2" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm">Top Models</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Models, categories, countries, tip menu"
                className="w-full bg-red-800 border border-red-600 rounded-lg px-4 py-2 text-white placeholder-red-300 focus:outline-none focus:border-red-400"
              />
              <svg className="absolute right-3 top-2.5 w-5 h-5 text-red-300" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Right Side - Auth & Tokens */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Token Balance */}
                <button
                  onClick={() => navigate('/token-purchase')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Add Tokens
                </button>
                
                {/* Notifications */}
                <button className="text-white hover:text-red-200 p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                
                <button className="text-white hover:text-red-200 p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center bg-red-800 hover:bg-red-900 px-3 py-2 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium mr-2">
                      {tokenBalance?.balance || 0}
                    </span>
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                      <div className="py-2">
                        <button
                          onClick={() => navigate('/viewer-dashboard')}
                          className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                        >
                          My Profile
                        </button>
                        <button
                          onClick={() => navigate('/token-purchase')}
                          className="block w-full text-left px-4 py-2 text-white hover:bg-gray-700"
                        >
                          Buy Tokens
                        </button>
                        <hr className="border-gray-700 my-2" />
                        <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-red-200 px-4 py-2 font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white hover:bg-gray-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Professional Sidebar Navigation
const ProfessionalSidebar = ({ selectedCategory, onCategoryChange }) => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'girls', label: 'Girls', icon: '👩', count: 1205 },
    { id: 'couples', label: 'Couples', icon: '💑', count: 284 },
    { id: 'guys', label: 'Guys', icon: '👨', count: 156 },
    { id: 'trans', label: 'Trans', icon: '⚧', count: 89 }
  ];
  
  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📺', label: 'Feed', path: '/feed' },
    { icon: '⭐', label: 'Recommended', path: '/recommended' },
    { icon: '❤️', label: 'My Favorites', path: '/favorites' },
    { icon: '🔒', label: 'Best for Privates', path: '/privates' },
    { icon: '📚', label: 'My Collection', path: '/collection' },
    { icon: '📋', label: 'Watch History', path: '/history' }
  ];
  
  const specials = [
    { icon: '🎭', label: 'QuantumStrip Cosplay Con', count: 52 },
    { icon: '🇰🇪', label: 'Kenyan', count: 6 },
    { icon: '🇺🇦', label: 'Ukrainian', count: 139 },
    { icon: '✨', label: 'New Models', count: 502 },
    { icon: '🥽', label: 'VR Cams', count: 114 }
  ];
  
  return (
    <div className="bg-gray-900 w-64 min-h-screen p-4 fixed left-0 top-16 z-40 overflow-y-auto">
      {/* Category Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-1 bg-gray-800 p-1 rounded-lg">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
              <span className="ml-1 text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="mb-8">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors"
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      
      {/* Specials Section */}
      <div>
        <h3 className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wide">
          Specials
        </h3>
        {specials.map((special, index) => (
          <button
            key={index}
            className="flex items-center justify-between w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors"
          >
            <div className="flex items-center">
              <span className="mr-3 text-lg">{special.icon}</span>
              <span className="text-sm">{special.label}</span>
            </div>
            <span className="text-xs text-gray-500">{special.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Professional Streaming Interface
export const ProfessionalStreamingInterface = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('girls');
  const [tokenBalance, setTokenBalance] = useState({ balance: 0, live_count: 0 });
  const [showPromotion, setShowPromotion] = useState(true);
  
  // Load token balance and live count
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const [balance, counts] = await Promise.all([
            tokenAPI.getBalance(),
            streamingAPI.getOnlineModelsCount()
          ]);
          
          setTokenBalance({
            balance: balance.balance || 0,
            live_count: counts.live_models || 0
          });
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      }
    };
    
    loadUserData();
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-900">
      <ProfessionalHeader 
        user={user} 
        onLogout={() => { logout(); navigate('/'); }} 
        tokenBalance={tokenBalance}
      />
      
      <div className="flex">
        <ProfessionalSidebar 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        {/* Main Content */}
        <div className="flex-1 ml-64 p-6">
          {/* Promotion Banner */}
          {showPromotion && (
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Special for You</h3>
                  <p className="text-yellow-100">Get tokens now with 25% OFF!</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/token-purchase')}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  GET TOKENS
                </button>
                <button
                  onClick={() => setShowPromotion(false)}
                  className="text-white hover:text-yellow-200 p-2"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          {/* Today's Recommendations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-2xl font-bold">Today's Recommendations for You</h2>
              <button className="text-red-400 hover:text-red-300 font-medium">
                See All
              </button>
            </div>
            
            {/* Live Models Section */}
            <LiveModelsSection />
          </div>
          
          {/* Match Your Latest Picks */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-2xl font-bold">Match Your Latest Picks</h2>
              <button className="text-red-400 hover:text-red-300 font-medium">
                See All
              </button>
            </div>
            
            {/* Additional content would go here */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-full h-full flex items-center justify-center">
                    <span className="text-white text-2xl">📸</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs">
                    Model {i}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalStreamingInterface;