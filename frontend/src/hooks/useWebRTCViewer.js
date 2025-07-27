import { useState, useEffect, useRef, useCallback } from 'react';
import { streamingAPI } from '../api';

// WebRTC configuration with STUN servers
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTCViewer = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const streamSessionId = useRef(null);
  const modelId = useRef(null);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfiguration);
    
    // Handle received stream from model
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      const [stream] = event.streams;
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        // Ensure video plays
        remoteVideoRef.current.play().catch(err => {
          console.warn('Could not auto-play remote video:', err);
        });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage(modelId.current, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Peer connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setError(null);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        if (pc.connectionState === 'failed') {
          setError('Connection failed. Trying to reconnect...');
        }
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        // Attempt ICE restart
        restartConnection();
      }
    };

    peerConnection.current = pc;
    return pc;
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

  // Connect to a model's stream
  const connectToStream = useCallback(async (modelIdParam) => {
    setIsLoading(true);
    setError(null);
    setConnectionState('connecting');
    modelId.current = modelIdParam;
    
    try {
      console.log(`Connecting to stream for model: ${modelIdParam}`);
      
      // Create streaming session with the model
      const sessionResponse = await streamingAPI.createStreamingSession({
        model_id: modelIdParam,
        session_type: 'public'
      });
      
      console.log('Streaming session created:', sessionResponse.session_id);
      streamSessionId.current = sessionResponse.session_id;
      
      // Initialize peer connection
      const pc = initializePeerConnection();
      
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await pc.setLocalDescription(offer);
      console.log('Local description set, sending offer');
      
      // Send offer to model
      await sendSignalingMessage(modelIdParam, {
        type: 'offer',
        offer: offer
      });
      
      // Start polling for signaling messages (in production, use WebSocket)
      startSignalingPolling();
      
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
  }, [initializePeerConnection, sendSignalingMessage]);

  // Start polling for signaling messages
  const startSignalingPolling = useCallback(() => {
    let pollAttempts = 0;
    const maxPollAttempts = 30; // 30 seconds max
    
    const pollInterval = setInterval(async () => {
      if (!streamSessionId.current || !peerConnection.current) {
        clearInterval(pollInterval);
        return;
      }
      
      pollAttempts++;
      
      try {
        const response = await streamingAPI.getWebRTCSignals(streamSessionId.current);
        
        if (response.signals && response.signals.length > 0) {
          console.log(`Processing ${response.signals.length} signaling messages`);
          for (const signal of response.signals) {
            await handleSignalingMessage(signal.signal_data);
          }
        }
        
        // Stop polling if connected
        if (isConnected) {
          console.log('Connection established, stopping signaling poll');
          setIsLoading(false);
          clearInterval(pollInterval);
        }
        
        // Also stop if we've been polling too long
        if (pollAttempts >= maxPollAttempts) {
          console.log('Signaling poll timeout');
          clearInterval(pollInterval);
          if (!isConnected) {
            setIsLoading(false);
            setError('Connection timeout. Model may not be streaming.');
            setConnectionState('failed');
          }
        }
        
      } catch (err) {
        console.error('Error polling signaling messages:', err);
        
        // Don't immediately fail on signaling errors, give it a few tries
        if (pollAttempts >= 5) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setError('Connection failed. Please try again.');
          setConnectionState('failed');
        }
      }
    }, 1000); // Poll every second

    // Cleanup function
    return () => clearInterval(pollInterval);
  }, [isConnected, handleSignalingMessage]);

  // Handle received signaling messages
  const handleSignalingMessage = useCallback(async (message) => {
    if (!peerConnection.current) return;
    
    try {
      switch (message.type) {
        case 'answer':
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
          break;
          
        case 'ice-candidate':
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(message.candidate)
          );
          break;
          
        default:
          console.log('Unknown signaling message type:', message.type);
      }
    } catch (err) {
      console.error('Error handling signaling message:', err);
    }
  }, []);

  // Restart connection (for ICE restart)
  const restartConnection = useCallback(async () => {
    if (!peerConnection.current || !modelId.current) return;
    
    try {
      const offer = await peerConnection.current.createOffer({
        iceRestart: true
      });
      
      await peerConnection.current.setLocalDescription(offer);
      
      await sendSignalingMessage(modelId.current, {
        type: 'offer',
        offer: offer
      });
      
    } catch (err) {
      console.error('Error restarting connection:', err);
    }
  }, [sendSignalingMessage]);

  // Disconnect from stream
  const disconnectFromStream = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Close peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
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
      modelId.current = null;
      
    } catch (err) {
      console.error('Error disconnecting from stream:', err);
      setError('Error disconnecting from stream');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request different video quality
  const requestQualityChange = useCallback(async (quality) => {
    if (!modelId.current) return;
    
    try {
      await sendSignalingMessage(modelId.current, {
        type: 'quality-request',
        quality: quality
      });
    } catch (err) {
      console.error('Error requesting quality change:', err);
    }
  }, [sendSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromStream();
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
    hasRemoteStream: !!remoteStream
  };
};

export default useWebRTCViewer;