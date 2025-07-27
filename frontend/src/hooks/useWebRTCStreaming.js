import { useState, useEffect, useRef, useCallback } from 'react';
import { streamingAPI, authAPI } from '../api';

// WebRTC configuration with STUN servers
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Video quality presets
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

export const useWebRTCStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [streamQuality, setStreamQuality] = useState('medium');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const streamSessionId = useRef(null);

  // Initialize camera and microphone
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

  // Create peer connection for a viewer
  const createPeerConnection = useCallback(async (viewerId) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to viewer via signaling server
        sendSignalingMessage(viewerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${viewerId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        removePeerConnection(viewerId);
      }
    };

    peerConnections.current.set(viewerId, peerConnection);
    return peerConnection;
  }, [localStream]);

  // Remove peer connection
  const removePeerConnection = useCallback((viewerId) => {
    const peerConnection = peerConnections.current.get(viewerId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(viewerId);
    }
    setViewers(prev => prev.filter(v => v.id !== viewerId));
  }, []);

  // Send signaling message (in production, this would use WebSocket)
  const sendSignalingMessage = useCallback(async (targetUserId, message) => {
    if (!streamSessionId.current) return;
    
    try {
      await streamingAPI.sendWebRTCSignal({
        session_id: streamSessionId.current,
        signal_type: message.type,
        signal_data: message,
        target_user_id: targetUserId
      });
    } catch (err) {
      console.error('Error sending signaling message:', err);
    }
  }, []);

  // Handle viewer connection request
  const handleViewerConnection = useCallback(async (viewerId, offer) => {
    try {
      const peerConnection = await createPeerConnection(viewerId);
      
      // Set remote description (offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer back to viewer
      await sendSignalingMessage(viewerId, {
        type: 'answer',
        answer: answer
      });
      
      // Add viewer to list
      setViewers(prev => [...prev, { id: viewerId, connected: true }]);
      
    } catch (err) {
      console.error('Error handling viewer connection:', err);
    }
  }, [createPeerConnection, sendSignalingMessage]);

  // Start streaming session
  const startStreaming = useCallback(async (quality = 'medium') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Start local camera/microphone
      const stream = await startLocalStream(quality);
      setStreamQuality(quality);
      
      // Get current user's model profile to get model ID
      const userProfile = JSON.parse(localStorage.getItem('quantumstrip_user'));
      if (!userProfile || userProfile.role !== 'model') {
        throw new Error('User must be a model to start streaming');
      }
      
      // Get model dashboard data to get the correct model profile ID
      const dashboardData = await authAPI.getModelDashboard();
      const modelProfileId = dashboardData.profile.id;
      
      // Update model status to live
      await streamingAPI.updateModelStatus(true, true);
      
      // Create streaming session with correct model profile ID
      const sessionResponse = await streamingAPI.createStreamingSession({
        model_id: modelProfileId, // Use the model profile ID, not user ID
        session_type: 'public'
      });
      
      streamSessionId.current = sessionResponse.session_id;
      setIsStreaming(true);
      
      console.log('Streaming started with session:', sessionResponse.session_id);
      
    } catch (err) {
      console.error('Error starting streaming:', err);
      setError(err.message || 'Failed to start streaming. Please try again.');
      stopLocalStream();
    } finally {
      setIsLoading(false);
    }
  }, [startLocalStream, stopLocalStream, authAPI]);

  // Stop streaming session
  const stopStreaming = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Close all peer connections
      peerConnections.current.forEach((connection, viewerId) => {
        connection.close();
      });
      peerConnections.current.clear();
      
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
      streamSessionId.current = null;
      
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
      stopLocalStream();
      
      // Start with new quality
      const newStream = await startLocalStream(newQuality);
      setStreamQuality(newQuality);
      
      // Update all peer connections with new stream
      peerConnections.current.forEach((connection) => {
        connection.getSenders().forEach((sender) => {
          if (sender.track) {
            const newTrack = newStream.getTracks().find(
              track => track.kind === sender.track.kind
            );
            if (newTrack) {
              sender.replaceTrack(newTrack);
            }
          }
        });
      });
      
    } catch (err) {
      console.error('Error changing stream quality:', err);
      setError('Failed to change stream quality');
    }
  }, [isStreaming, startLocalStream, stopLocalStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
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
    
    // Refs
    localVideoRef,
    
    // Methods
    startStreaming,
    stopStreaming,
    changeStreamQuality,
    handleViewerConnection,
    
    // Utils
    availableQualities: Object.keys(VIDEO_QUALITY_PRESETS),
    qualityLabels: Object.fromEntries(
      Object.entries(VIDEO_QUALITY_PRESETS).map(([key, value]) => [key, value.label])
    )
  };
};

export default useWebRTCStreaming;