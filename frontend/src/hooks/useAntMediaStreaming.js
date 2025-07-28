import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCAdaptor } from '@antmedia/webrtc_adaptor';
import { streamingAPI, authAPI } from '../api';

// Video quality presets for Ant Media Server
export const VIDEO_QUALITY_PRESETS = {
  low: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 },
    label: 'Low Quality (480p)'
  },
  medium: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24 },
    label: 'Medium Quality (720p)'
  },
  high: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
    label: 'High Quality (1080p)'
  },
  auto: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24 },
    label: 'Auto Quality'
  }
};

export const useAntMediaStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [streamQuality, setStreamQuality] = useState('medium');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  
  const localVideoRef = useRef(null);
  const webRTCAdaptor = useRef(null);
  const streamSessionId = useRef(null);
  const antMediaStreamId = useRef(null);
  const thumbnailCanvas = useRef(null);

  // Initialize Ant Media WebRTC Adaptor
  const initializeWebRTCAdaptor = useCallback(async () => {
    try {
      // Get Ant Media Server configuration
      const config = await streamingAPI.getAntMediaConfig();
      
      // Initialize WebRTC Adaptor with Ant Media Server
      webRTCAdaptor.current = new WebRTCAdaptor({
        websocket_url: config.websocket_url || "ws://localhost:5080/LiveApp/websocket",
        mediaConstraints: {
          video: VIDEO_QUALITY_PRESETS[streamQuality],
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        },
        peerconnection_config: {
          iceServers: config.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        sdp_constraints: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        },
        localVideoId: "localVideo",
        bandwidth: '900k',
        callback: (info, obj) => {
          if (info === "initialized") {
            console.log("Ant Media WebRTC Adaptor initialized");
          } else if (info === "publish_started") {
            console.log("Publishing started");
            setIsStreaming(true);
            setConnectionState('connected');
            setError(null);
          } else if (info === "publish_finished") {
            console.log("Publishing finished");
            setIsStreaming(false);
            setConnectionState('disconnected');
          } else if (info === "stream_information") {
            // Update viewer count if available
            if (obj && obj.streamId === antMediaStreamId.current) {
              setViewers(prev => [...prev.slice(0, obj.totalWebRTCWatchersCount || 0)]);
            }
          } else if (info === "closed") {
            console.log("Connection closed");
            setConnectionState('closed');
            setIsStreaming(false);
          } else if (info === "pong") {
            // Keep-alive response
          } else if (info === "refreshConnection") {
            // Connection refresh needed
            console.log("Refreshing connection");
          }
        },
        callbackError: (error, message) => {
          console.error("Ant Media WebRTC Error: ", error, message);
          setError(message || 'Streaming error occurred');
          setIsLoading(false);
          setIsStreaming(false);
          setConnectionState('failed');
        }
      });

      return webRTCAdaptor.current;
    } catch (err) {
      console.error('Error initializing Ant Media WebRTC Adaptor:', err);
      setError('Failed to initialize streaming service');
      throw err;
    }
  }, [streamQuality]);

  // Start local stream
  const startLocalStream = useCallback(async (quality = 'medium') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const constraints = {
        video: VIDEO_QUALITY_PRESETS[quality],
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(err => {
          console.warn('Could not auto-play video:', err);
        });
      }
      
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone. Please check permissions.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Capture thumbnail from video stream
  const captureThumbnail = useCallback(() => {
    if (!localVideoRef.current || !localStream) return null;
    
    try {
      if (!thumbnailCanvas.current) {
        thumbnailCanvas.current = document.createElement('canvas');
      }
      
      const canvas = thumbnailCanvas.current;
      const video = localVideoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setThumbnailUrl(thumbnailDataUrl);
      
      return thumbnailDataUrl;
    } catch (err) {
      console.error('Error capturing thumbnail:', err);
      return null;
    }
  }, [localStream]);

  // Upload thumbnail to backend
  const uploadThumbnail = useCallback(async (thumbnailData) => {
    if (!thumbnailData) return;
    
    try {
      const dashboardData = await authAPI.getModelDashboard();
      const modelProfileId = dashboardData.profile.id;
      
      await streamingAPI.updateModelThumbnail(modelProfileId, thumbnailData);
      console.log('Thumbnail uploaded successfully');
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
    }
  }, []);

  // Start streaming session using Ant Media Server
  const startStreaming = useCallback(async (quality = 'medium') => {
    setIsLoading(true);
    setError(null);
    setConnectionState('connecting');
    
    try {
      // Start local camera/microphone
      await startLocalStream(quality);
      setStreamQuality(quality);
      
      // Get current user's model profile
      const userProfile = JSON.parse(localStorage.getItem('quantumstrip_user'));
      if (!userProfile || userProfile.role !== 'model') {
        throw new Error('User must be a model to start streaming');
      }
      
      // Get model dashboard data to get the correct model profile ID
      const dashboardData = await authAPI.getModelDashboard();
      const modelProfileId = dashboardData.profile.id;
      
      // Update model status to live
      await streamingAPI.updateModelStatus(true, true);
      
      // Create streaming session with Ant Media Server
      const sessionResponse = await streamingAPI.createStreamingSession({
        model_id: modelProfileId,
        session_type: 'public'
      });
      
      streamSessionId.current = sessionResponse.session_id;
      antMediaStreamId.current = sessionResponse.stream_id;
      
      // Initialize WebRTC Adaptor if not already done
      if (!webRTCAdaptor.current) {
        await initializeWebRTCAdaptor();
      }
      
      // Start publishing to Ant Media Server
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        console.log('Starting publish with stream ID:', antMediaStreamId.current);
        webRTCAdaptor.current.publish(antMediaStreamId.current);
        
        // Start broadcast on server side
        await streamingAPI.startAntMediaBroadcast(antMediaStreamId.current);
      }
      
      // Capture thumbnail after a short delay
      setTimeout(() => {
        const thumbnail = captureThumbnail();
        if (thumbnail) {
          uploadThumbnail(thumbnail);
        }
      }, 2000);
      
      console.log('Streaming started with Ant Media Server, session:', sessionResponse.session_id);
      
    } catch (err) {
      console.error('Error starting streaming:', err);
      setError(err.message || 'Failed to start streaming. Please try again.');
      stopLocalStream();
      setConnectionState('failed');
    } finally {
      setIsLoading(false);
    }
  }, [startLocalStream, stopLocalStream, initializeWebRTCAdaptor, captureThumbnail, uploadThumbnail]);

  // Stop streaming session
  const stopStreaming = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Stop publishing
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        webRTCAdaptor.current.stop(antMediaStreamId.current);
        
        // Stop broadcast on server side
        await streamingAPI.stopAntMediaBroadcast(antMediaStreamId.current);
      }
      
      // Stop local stream
      stopLocalStream();
      
      // End streaming session
      if (streamSessionId.current) {
        await streamingAPI.endStreamingSession(streamSessionId.current);
      }
      
      // Update model status to offline
      await streamingAPI.updateModelStatus(false, true);
      
      setIsStreaming(false);
      setViewers([]);
      setConnectionState('disconnected');
      streamSessionId.current = null;
      antMediaStreamId.current = null;
      
    } catch (err) {
      console.error('Error stopping streaming:', err);
      setError('Error stopping stream');
    } finally {
      setIsLoading(false);
    }
  }, [stopLocalStream]);

  // Change stream quality
  const changeStreamQuality = useCallback(async (newQuality) => {
    if (!isStreaming) return;
    
    try {
      // Stop current stream
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        webRTCAdaptor.current.stop(antMediaStreamId.current);
      }
      
      // Update quality and restart
      setStreamQuality(newQuality);
      await startLocalStream(newQuality);
      
      // Restart publishing with new quality
      if (webRTCAdaptor.current && antMediaStreamId.current) {
        // Reinitialize with new quality
        await initializeWebRTCAdaptor();
        webRTCAdaptor.current.publish(antMediaStreamId.current);
      }
      
    } catch (err) {
      console.error('Error changing stream quality:', err);
      setError('Failed to change stream quality');
    }
  }, [isStreaming, startLocalStream, initializeWebRTCAdaptor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
      if (webRTCAdaptor.current) {
        webRTCAdaptor.current.closeWebSocket();
      }
    };
  }, [isStreaming, stopStreaming]);

  return {
    // State
    isStreaming,
    localStream,
    viewers,
    streamQuality,
    error,
    isLoading,
    thumbnailUrl,
    connectionState,
    
    // Refs
    localVideoRef,
    
    // Methods
    startStreaming,
    stopStreaming,
    changeStreamQuality,
    captureThumbnail,
    
    // Utils
    availableQualities: Object.keys(VIDEO_QUALITY_PRESETS),
    qualityLabels: Object.fromEntries(
      Object.entries(VIDEO_QUALITY_PRESETS).map(([key, value]) => [key, value.label])
    )
  };
};

export default useAntMediaStreaming;