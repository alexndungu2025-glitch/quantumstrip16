import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { streamingAPI } from '../api';
import { useAuth } from '../AuthContext';

const LiveModelCard = ({ model, onWatch }) => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-105 border border-gray-700">
      {/* Model Preview */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-pink-900">
        {/* Live Indicator */}
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
          LIVE
        </div>
        
        {/* Viewer Count */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          {model.current_viewers}
        </div>

        {/* Thumbnail or Mock Video Preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          {model.thumbnail ? (
            <img 
              src={model.thumbnail} 
              alt="Live stream preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <button 
            onClick={() => onWatch(model.model_id)}
            className="opacity-0 group-hover:opacity-100 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform scale-90 group-hover:scale-100"
          >
            Watch Live
          </button>
        </div>
      </div>

      {/* Model Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">Model {model.model_id.slice(-6)}</h3>
          <div className="flex items-center text-yellow-400">
            <svg className="w-4 h-4 mr-1" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-sm">4.8</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
          <span>Private: {model.show_rate} tokens/min</span>
          <span className="text-green-400">● Online</span>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onWatch(model.model_id)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
          >
            Watch Free
          </button>
          {user && (
            <button className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded text-sm font-semibold transition-colors">
              Private Show
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const LiveModelsSection = () => {
  const [liveModels, setLiveModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollInterval, setPollInterval] = useState(30000); // Start with 30 seconds
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchLiveModels();
    
    // Use variable poll interval
    const interval = setInterval(fetchLiveModels, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  const fetchLiveModels = async () => {
    try {
      setError(null);
      const models = await streamingAPI.getLiveModels();
      const newModelsCount = models?.length || 0;
      const previousCount = liveModels.length;
      
      setLiveModels(models || []);
      
      // If new models came online, increase polling frequency for 5 minutes
      if (newModelsCount > previousCount) {
        setPollInterval(5000); // Poll every 5 seconds
        setTimeout(() => {
          setPollInterval(30000); // Return to 30 seconds after 5 minutes
        }, 300000);
      }
      
    } catch (err) {
      console.error('Error fetching live models:', err);
      setError('Failed to load live models');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchModel = (modelId) => {
    // Always navigate to the timed stream viewer
    navigate(`/live-streaming/viewer/${modelId}`);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🔴 Live Now</h2>
          <div className="flex items-center text-green-400">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Loading...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-700"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="currentColor">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
          </svg>
          <h3 className="text-white text-lg font-semibold mb-2">Failed to Load Live Models</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchLiveModels}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🔴 Live Now</h2>
        <div className="flex items-center text-green-400">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span>{liveModels.length} model{liveModels.length !== 1 ? 's' : ''} live</span>
        </div>
      </div>
      
      {liveModels.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
            </svg>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No Models Live Right Now</h3>
          <p className="text-gray-400 mb-4">Check back later or explore our other features!</p>
          <button 
            onClick={fetchLiveModels}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {liveModels.map((model) => (
            <LiveModelCard 
              key={model.model_id} 
              model={model} 
              onWatch={handleWatchModel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveModelsSection;