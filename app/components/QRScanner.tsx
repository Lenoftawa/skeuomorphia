import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode('reader');

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scannerRef.current
      .start({ facingMode: 'environment' }, config, onScan, onError)
      .catch((err) => {
        console.error('Failed to start scanner:', err);
        if (onError) onError(err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => console.error('Failed to stop scanner:', err));
      }
    };
  }, [onScan, onError]);

  return <div id="reader" style={{ width: '100%', maxWidth: '600px' }}></div>;
};

export default QRScanner;