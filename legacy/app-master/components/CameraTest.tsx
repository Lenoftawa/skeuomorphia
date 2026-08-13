import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const CameraTest = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [scannedValue, setScannedValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError('Failed to enumerate devices: ' + (err as Error).message);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [selectedDevice]);

  const startScanner = () => {
    if (scannerRef.current) {
      stopScanner();
    }

    scannerRef.current = new Html5Qrcode('reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scannerRef.current.start(
      { deviceId: selectedDevice },
      config,
      (decodedText) => {
        setScannedValue(decodedText);
        setShowSuccess(true);
        setIsScanning(false);
        if (readerRef.current) {
          readerRef.current.classList.add('success-flash');
        }
        stopScanner();
      },
      (errorMessage) => {
        console.log(errorMessage);
      }
    ).then(() => {
      setIsScanning(true);
    }).catch(err => {
      setError('Failed to start scanner: ' + err);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => {
        console.error('Failed to stop scanner:', err);
      });
    }
  };

  const handleConfirm = () => {
    setShowSuccess(false);
    setScannedValue('');
    if (readerRef.current) {
      readerRef.current.classList.remove('success-flash');
    }
    startScanner();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Camera Test</h3>
      {error && <p className="text-red-500">{error}</p>}
      <select
        value={selectedDevice}
        onChange={(e) => setSelectedDevice(e.target.value)}
        className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </option>
        ))}
      </select>
      <div 
        id="reader" 
        ref={readerRef}
        className="w-full max-w-sm mx-auto border-4 border-transparent transition-all duration-300"
      ></div>
      {showSuccess && (
        <div className="mt-4 p-4 bg-green-100 rounded-md">
          <p className="text-green-800 font-bold">QR Code Success!</p>
          <p className="text-green-800">Scanned Value: {scannedValue}</p>
          <button
            onClick={handleConfirm}
            className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirm and Scan Again
          </button>
        </div>
      )}
      <style jsx>{`
        @keyframes flash {
          0%, 100% { border-color: transparent; }
          50% { border-color: #10B981; }
        }
        .success-flash {
          animation: flash 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CameraTest;