import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCAdaptor } from '@antmedia/webrtc_adaptor';
import { streamingAPI } from '../api';

export const useAntMediaViewer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const remoteVideoRef = useRef(null);
  const webRTCAdaptor = useRef(null);
  const streamSessionId = useRef(null);
  const antMediaStreamId = useRef(null);
  const modelId = useRef(null);

  // Initialize WebRTC Adaptor for viewing
  const initializeWebRTCAdaptor = useCallback(async (config) => {
    try {
      webRTCAdaptor.current = new WebRTCAdaptor({
        websocket_url: config.websocket_url || "ws://localhost:5080/LiveApp/websocket",
        mediaConstraints: {
          video: false,
          audio: false
        },
        peerconnection_config: {
          iceServers: config.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        remoteVideoId: "remoteVideo",
        bandwidth: '900k',
        callback: (info, obj) => {
          if (info === "initialized") {
            console.log("Ant Media WebRTC Viewer Adaptor initialized");
          } else if (info === "play_started") {
            console.log("Play started");
            setIsConnected(true);
            setConnectionState('connected');
            setError(null);
            setIsLoading(false);
          } else if (info === "play_finished") {
            console.log("Play finished");
            setIsConnected(false);
            setConnectionState('disconnected');
          } else if (info === "stream_information") {
            // Stream information received
            console.log("Stream information:", obj);
          } else if (info === "closed") {
            console.log("Connection closed");
            setConnectionState('closed');
            setIsConnected(false);
          } else if (info === "pong") {
            // Keep-alive response
          } else if (info === "refreshConnection") {
            // Connection refresh needed
            console.log("Refreshing connection");
          } else if (info === "ice_connection_state_changed") {
            console.log("ICE connection state changed:", obj);
            if (obj && obj.state) {
              setConnectionState(obj.state);
            }
          } else if (info === "updated_stats") {
            // Connection stats updated
          }
        },
        callbackError: (error, message) => {
          console.error("Ant Media WebRTC Viewer Error: ", error, message);
          setError(message || 'Viewing error occurred');
          setIsLoading(false);
          setIsConnected(false);
          setConnectionState('failed');
        }
      });

      return webRTCAdaptor.current;
    } catch (err) {
      console.error('Error initializing Ant Media WebRTC Viewer Adaptor:', err);
      setError('Failed to initialize streaming viewer');
      throw err;
    }
  }, []);

  // Connect to a model's stream
  const connectToStream = useCallback(async (modelIdParam) => {
    setIsLoading(true);
    setError(null);
    setConnectionState('connecting');
    modelId.current = modelIdParam;
    
    try {
      console.log(`Connecting to Ant Media stream for model: ${modelIdParam}`);
      
      // Join the model's existing streaming session
      const sessionResponse = await streamingAPI.joinStreamingSession({
        model_id: modelIdParam,
        session_type: 'public'
      });
      
      console.log('Joined Ant Media streaming session:', sessionResponse.session_id);
      streamSessionId.current = sessionResponse.session_id;
      antMediaStreamId.current = sessionResponse.stream_id;
      
      // Get Ant Media configuration
      const antMediaConfig = sessionResponse.ant_media_config;
      
      // Initialize WebRTC Adaptor for viewing
      await initializeWebRTCAdaptor(antMediaConfig);
      
      // Start playing the stream
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        console.log('Starting play with stream ID:', antMediaStreamId.current);
        webRTCAdaptor.current.play(antMediaStreamId.current);
      }
      
    } catch (err) {
      console.error('Error connecting to stream:', err);
      let errorMessage = 'Failed to connect to stream. Please try again.';
      
      // Provide more specific error messages
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Model not found or not currently streaming.';
        } else if (err.response.status === 400) {
          errorMessage = 'Model is currently unavailable for streaming.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        }
      }
      
      setError(errorMessage);
      setConnectionState('failed');
      setIsLoading(false);
    }
  }, [initializeWebRTCAdaptor]);

  // Disconnect from stream
  const disconnectFromStream = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Stop playing
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        webRTCAdaptor.current.stop(antMediaStreamId.current);
      }
      
      // End streaming session
      if (streamSessionId.current) {
        await streamingAPI.endStreamingSession(streamSessionId.current);
        streamSessionId.current = null;
      }
      
      // Clear remote stream
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      
      setIsConnected(false);
      setConnectionState('new');
      setError(null);
      antMediaStreamId.current = null;
      modelId.current = null;
      
    } catch (err) {
      console.error('Error disconnecting from stream:', err);
      setError('Error disconnecting from stream');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request different video quality (if supported by server)
  const requestQualityChange = useCallback(async (quality) => {
    if (!antMediaStreamId.current || !webRTCAdaptor.current) return;
    
    try {
      // For Ant Media Server, quality changes might require reconnection
      // or server-side configuration changes
      console.log('Quality change requested:', quality);
      
      // Implementation depends on server configuration
      // This is a placeholder for quality change functionality
      
    } catch (err) {
      console.error('Error requesting quality change:', err);
    }
  }, []);

  // Handle video element setup
  useEffect(() => {
    if (remoteVideoRef.current && webRTCAdaptor.current) {
      // Set up remote video element
      const video = remoteVideoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log('Remote video metadata loaded');
        video.play().catch(err => {
          console.warn('Could not auto-play remote video:', err);
        });
      };

      const handleError = (e) => {
        console.error('Remote video error:', e);
        setError('Error playing remote video');
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
      };
    }
  }, [remoteVideoRef.current, webRTCAdaptor.current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromStream();
      }
      if (webRTCAdaptor.current) {
        webRTCAdaptor.current.closeWebSocket();
      }
    };
  }, [isConnected, disconnectFromStream]);

  return {
    // State
    isConnected,
    remoteStream,
    connectionState,
    error,
    isLoading,
    
    // Refs
    remoteVideoRef,
    
    // Methods
    connectToStream,
    disconnectFromStream,
    requestQualityChange,
    
    // Connection info
    isConnecting: isLoading && !isConnected,
    hasRemoteStream: isConnected,
    streamId: antMediaStreamId.current
  };
};

export default useAntMediaViewer;