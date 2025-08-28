import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const HealthCheck = () => {
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await apiClient.healthCheck();
      setIsHealthy(healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isHealthy) {
    return null; // Don't show anything if healthy
  }

  return (
    <div className="alert alert-error" style={{ margin: 0, borderRadius: 0 }}>
      <div className="container">
        <strong>⚠️ Server Connection Issue</strong>
        <span style={{ marginLeft: '1rem' }}>
          Unable to connect to the backend server. Please check if the server is running.
        </span>
        <button 
          onClick={checkHealth} 
          disabled={isChecking}
          className="btn btn-outline"
          style={{ marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default HealthCheck;
