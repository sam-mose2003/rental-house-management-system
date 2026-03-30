import React, { useState, useEffect } from 'react';
import '../components/LoadingSkeleton.css';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('online');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health', { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        setStatus('online');
        setIsVisible(false);
      } catch (error) {
        setStatus('offline');
        setIsVisible(true);
      }
    };

    const interval = setInterval(checkConnection, 30000);
    checkConnection();

    const handleOnline = () => {
      setStatus('online');
      setIsVisible(false);
    };

    const handleOffline = () => {
      setStatus('offline');
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible && status === 'online') {
    return null;
  }

  return (
    <div className={`connection-status ${status}`}>
      {status === 'online' ? (
        <span>🟢 Connected</span>
      ) : status === 'offline' ? (
        <span>🔴 Offline - Check your connection</span>
      ) : (
        <span>🟡 Connecting...</span>
      )}
    </div>
  );
};

export default ConnectionStatus;
