import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useResponsive } from '../responsive';
import useWebRTCViewer from '../hooks/useWebRTCViewer';
import { tokenAPI, tipAPI } from '../api';

const TimedStreamViewer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { modelId } = useParams();
  const { isMobile, isTablet } = useResponsive();
  
  // Viewing time states
  const [viewingTime, setViewingTime] = useState(0);
  const [maxViewingTime, setMaxViewingTime] = useState(10); // 10 seconds for non-authenticated users
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hasActiveTip, setHasActiveTip] = useState(false);
  const [userTokens, setUserTokens] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  
  // Timer refs
  const viewingTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  
  // WebRTC hook
  const {
    isConnected,
    remoteStream,
    connectionState,
    error,
    isLoading,
    remoteVideoRef,
    connectToStream,
    disconnectFromStream,
    hasRemoteStream
  } = useWebRTCViewer();

  // Connection retry logic
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [showConnectionError, setShowConnectionError] = useState(false);

  // Retry connection if it fails
  useEffect(() => {
    if (error && !isConnected && retryCount < maxRetries && modelId) {
      const retryTimeout = setTimeout(() => {
        console.log(`Retrying connection attempt ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        connectToStream(modelId);
      }, 2000 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(retryTimeout);
    } else if (error && retryCount >= maxRetries) {
      setShowConnectionError(true);
    }
  }, [error, isConnected, retryCount, maxRetries, modelId, connectToStream]);

  // Synchronize remote video element with stream changes
  useEffect(() => {
    if (remoteVideoRef.current && hasRemoteStream) {
      // The stream should already be set by the hook, but ensure it plays
      if (remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.play().catch(err => {
          console.warn('Could not auto-play remote video:', err);
        });
      }
    }
  }, [hasRemoteStream, remoteVideoRef]);

  // Set viewing time limits based on authentication
  useEffect(() => {
    if (!user) {
      // Non-authenticated users: 10 seconds
      setMaxViewingTime(10);
      setTimeRemaining(10);
    } else if (user && !hasActiveTip) {
      // Authenticated users without active tip: 20 seconds
      setMaxViewingTime(20);
      setTimeRemaining(20);
    } else {
      // Users with active tip: unlimited
      setMaxViewingTime(Infinity);
      setTimeRemaining(Infinity);
    }
  }, [user, hasActiveTip]);

  // Get user token balance
  useEffect(() => {
    if (user) {
      const fetchTokens = async () => {
        try {
          const response = await tokenAPI.getBalance();
          setUserTokens(response.balance || 0);
        } catch (err) {
          console.error('Error fetching token balance:', err);
        }
      };
      fetchTokens();
    }
  }, [user]);

  // Start viewing timer
  useEffect(() => {
    if (isConnected && hasRemoteStream && maxViewingTime !== Infinity) {
      viewingTimerRef.current = setInterval(() => {
        setViewingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxViewingTime) {
            setIsTimeUp(true);
            disconnectFromStream();
            return maxViewingTime;
          }
          return newTime;
        });
      }, 1000);
      
      countdownTimerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (viewingTimerRef.current) {
        clearInterval(viewingTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isConnected, hasRemoteStream, maxViewingTime, disconnectFromStream]);

  // Connect to stream when component mounts with retry logic
  useEffect(() => {
    if (modelId) {
      setRetryCount(0); // Reset retry count for new model
      setShowConnectionError(false);
      connectToStream(modelId);
    }
    
    return () => {
      if (isConnected) {
        disconnectFromStream();
      }
    };
  }, [modelId]);

  // Handle time up
  useEffect(() => {
    if (isTimeUp) {
      if (!user) {
        // Show login prompt
        setShowTipModal(true);
      } else if (user && !hasActiveTip) {
        // Show tip prompt
        setShowTipModal(true);
      }
    }
  }, [isTimeUp, user, hasActiveTip]);

  const handleLoginRedirect = () => {
    // Save the current URL to redirect back after login
    localStorage.setItem('quantumstrip_redirect_after_login', `/live-streaming/viewer/${modelId}`);
    navigate('/login');
  };

  const handleTipModel = async (tipAmount) => {
    if (!user) {
      handleLoginRedirect();
      return;
    }
    
    if (userTokens < tipAmount) {
      // Redirect to token purchase
      navigate('/token-purchase');
      return;
    }
    
    try {
      // Send tip to model
      await tipAPI.sendTip(modelId, tipAmount);
      
      // Set active tip and reset timers
      setHasActiveTip(true);
      setIsTimeUp(false);
      setViewingTime(0);
      setTimeRemaining(Infinity);
      setMaxViewingTime(Infinity);
      setShowTipModal(false);
      
      // Update token balance
      setUserTokens(prev => prev - tipAmount);
      
      // Reconnect to stream
      connectToStream(modelId);
    } catch (err) {
      console.error('Error sending tip:', err);
    }
  };

  const TimeUpModal = () => {
    if (!showTipModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-white text-xl font-bold mb-4">
            {!user ? 'Time\'s Up!' : 'Free Viewing Time Ended'}
          </h3>
          
          {!user ? (
            <div>
              <p className="text-gray-300 mb-4">
                You've enjoyed 10 seconds of free viewing! Login to get 20 more seconds.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleLoginRedirect}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold"
                >
                  Login for More Time
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">
                You've used your 20 seconds of free viewing! Tip the model to continue watching.
              </p>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Your tokens: {userTokens}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTipModel(5)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Tip 5 Tokens
                  </button>
                  <button
                    onClick={() => handleTipModel(10)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Tip 10 Tokens
                  </button>
                  <button
                    onClick={() => handleTipModel(20)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Tip 20 Tokens
                  </button>
                  <button
                    onClick={() => handleTipModel(50)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
                  >
                    Tip 50 Tokens
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/token-purchase')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
                >
                  Buy Tokens
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ViewingTimeDisplay = () => {
    if (maxViewingTime === Infinity) {
      return (
        <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
          Unlimited Viewing
        </div>
      );
    }
    
    return (
      <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm">
        {timeRemaining}s remaining
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </button>
            <h1 className="text-white text-lg font-semibold">Live Stream</h1>
          </div>
          <ViewingTimeDisplay />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-screen pt-16">
        {/* Video Area */}
        <div className="flex-1 bg-gray-900 relative">
          <div className="w-full h-full flex items-center justify-center">
            {isTimeUp && !hasActiveTip ? (
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-16 h-16 text-red-500" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
                  </svg>
                </div>
                <p className="text-white text-xl">Time's Up!</p>
                <p className="text-gray-400">
                  {!user ? 'Login to continue watching' : 'Tip the model to continue'}
                </p>
              </div>
            ) : hasRemoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  console.log('Remote video metadata loaded');
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play().catch(err => {
                      console.error('Failed to play remote video:', err);
                    });
                  }
                }}
                onError={(e) => {
                  console.error('Remote video error:', e);
                }}
              />
            ) : (
              <div className="text-center">
                {isLoading ? (
                  <div>
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl">Connecting...</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-16 h-16 text-gray-400" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
                      </svg>
                    </div>
                    <p className="text-white text-xl">Stream Unavailable</p>
                    <p className="text-gray-400">Model is not currently live</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connection Status */}
          {isConnected && hasRemoteStream && !isTimeUp && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-60 rounded-lg p-3">
              <div className="flex items-center text-white">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-red-400 font-semibold">LIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-white">
                  <span className="text-sm text-gray-400">Tokens: </span>
                  <span className="font-semibold">{userTokens}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              {!user ? (
                <button
                  onClick={handleLoginRedirect}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Login for More Time
                </button>
              ) : (
                <button
                  onClick={() => setShowTipModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Tip Model
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Up Modal */}
      <TimeUpModal />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg max-w-sm">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TimedStreamViewer;