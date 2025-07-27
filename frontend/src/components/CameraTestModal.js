import React, { useState, useRef, useEffect } from 'react';
import { VIDEO_QUALITY_PRESETS } from '../hooks/useWebRTCStreaming';

const CameraTestModal = ({ isOpen, onClose, onTestComplete }) => {
  const [isTestingCamera, setIsTestingCamera] = useState(false);
  const [testStream, setTestStream] = useState(null);
  const [testQuality, setTestQuality] = useState('medium');
  const [cameraError, setCameraError] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [testResults, setTestResults] = useState(null);
  
  const testVideoRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadCameraDevices();
    }
  }, [isOpen]);

  const loadCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(cameras);
      if (cameras.length > 0) {
        setSelectedCamera(cameras[0].deviceId);
      }
    } catch (err) {
      console.error('Error loading camera devices:', err);
      setCameraError('Failed to load camera devices');
    }
  };

  const startCameraTest = async () => {
    setIsTestingCamera(true);
    setCameraError(null);
    
    try {
      const constraints = {
        video: {
          ...VIDEO_QUALITY_PRESETS[testQuality],
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setTestStream(stream);
      
      // Display test video
      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
      }
      
      // Analyze stream quality
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      setTestResults({
        resolution: `${settings.width}x${settings.height}`,
        frameRate: settings.frameRate,
        facingMode: settings.facingMode,
        deviceId: settings.deviceId
      });
      
    } catch (err) {
      console.error('Error starting camera test:', err);
      setCameraError('Failed to access camera. Please check permissions.');
    } finally {
      setIsTestingCamera(false);
    }
  };

  const stopCameraTest = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop());
      setTestStream(null);
    }
    
    if (testVideoRef.current) {
      testVideoRef.current.srcObject = null;
    }
    
    setTestResults(null);
  };

  const handleTestComplete = () => {
    stopCameraTest();
    onTestComplete({
      success: true,
      quality: testQuality,
      deviceId: selectedCamera,
      results: testResults
    });
    onClose();
  };

  const handleClose = () => {
    stopCameraTest();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Camera Test</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera Settings */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Camera Device</label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Video Quality</label>
              <select
                value={testQuality}
                onChange={(e) => setTestQuality(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                {Object.entries(VIDEO_QUALITY_PRESETS).map(([key, preset]) => (
                  <option key={key} value={key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Video Test Area */}
        <div className="mb-6">
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            {testStream ? (
              <video
                ref={testVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 text-gray-400" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
                    </svg>
                  </div>
                  <p className="text-white text-lg">Camera Preview</p>
                  <p className="text-gray-400">Click "Start Test" to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">Test Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Resolution:</span>
                <span className="text-white ml-2">{testResults.resolution}</span>
              </div>
              <div>
                <span className="text-gray-400">Frame Rate:</span>
                <span className="text-white ml-2">{testResults.frameRate} fps</span>
              </div>
              <div>
                <span className="text-gray-400">Facing Mode:</span>
                <span className="text-white ml-2">{testResults.facingMode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 ml-2">✓ Working</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {cameraError && (
          <div className="mb-6 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor">
                <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
              </svg>
              {cameraError}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {!testStream ? (
            <button
              onClick={startCameraTest}
              disabled={isTestingCamera || cameraDevices.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingCamera ? 'Starting Test...' : 'Start Test'}
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={stopCameraTest}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Stop Test
              </button>
              
              <button
                onClick={handleTestComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Use This Camera
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraTestModal;