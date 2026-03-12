import React, { useState, useEffect } from 'react';
import { getMaintenanceRequests, resolveMaintenanceRequest } from '../utils/api';
import './Maintenance.css';

const Maintenance = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getMaintenanceRequests();
        setRequests(data);
      } catch (err) {
        setError('Failed to load maintenance requests');
        console.error('Maintenance error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleResolve = async (requestId) => {
    try {
      await resolveMaintenanceRequest(requestId);
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'Resolved' }
          : req
      ));
    } catch (err) {
      setError('Failed to resolve maintenance request');
      console.error('Resolve error:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase();
    return (
      <span className={`status-badge ${statusClass}`}>
        {status}
      </span>
    );
  };

  const getPriorityColor = (issue) => {
    const urgentKeywords = ['urgent', 'emergency', 'leak', 'broken', 'no water', 'no power'];
    const isUrgent = urgentKeywords.some(keyword => 
      issue.toLowerCase().includes(keyword)
    );
    return isUrgent ? 'urgent' : 'normal';
  };

  if (loading) {
    return (
      <div className="maintenance-loading">
        <div className="spinner"></div>
        <p>Loading maintenance requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maintenance-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const openRequests = requests.filter(req => req.status !== 'Resolved');
  const resolvedRequests = requests.filter(req => req.status === 'Resolved');

  return (
    <div className="maintenance">
      <div className="maintenance-header">
        <h1>Maintenance Requests</h1>
        <p>Manage and track tenant maintenance requests</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="maintenance-stats">
        <div className="stat-card open">
          <h3>Open Requests</h3>
          <p className="stat-number">{openRequests.length}</p>
        </div>
        <div className="stat-card resolved">
          <h3>Resolved</h3>
          <p className="stat-number">{resolvedRequests.length}</p>
        </div>
        <div className="stat-card total">
          <h3>Total Requests</h3>
          <p className="stat-number">{requests.length}</p>
        </div>
      </div>

      <div className="maintenance-sections">
        <div className="section">
          <h2>Open Requests ({openRequests.length})</h2>
          <div className="requests-container">
            {openRequests.length === 0 ? (
              <div className="no-requests">
                <p>No open maintenance requests</p>
              </div>
            ) : (
              openRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`maintenance-request ${getPriorityColor(request.issue)}`}
                >
                  <div className="request-header">
                    <div className="request-info">
                      <h3>Request #{request.id}</h3>
                      <span className="house-number">{request.house_number}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="request-meta">
                      <span className="tenant-name">
                        {request.tenant || 'Anonymous'}
                      </span>
                      <span className="request-date">
                        {new Date(request.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="request-content">
                    <p className="issue-description">{request.issue}</p>
                  </div>
                  
                  <div className="request-actions">
                    <button
                      className="resolve-btn"
                      onClick={() => handleResolve(request.id)}
                      disabled={request.status === 'Resolved'}
                    >
                      {request.status === 'Resolved' ? '✓ Resolved' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="section">
          <h2>Resolved Requests ({resolvedRequests.length})</h2>
          <div className="requests-container">
            {resolvedRequests.length === 0 ? (
              <div className="no-requests">
                <p>No resolved maintenance requests</p>
              </div>
            ) : (
              resolvedRequests.map((request) => (
                <div key={request.id} className="maintenance-request resolved">
                  <div className="request-header">
                    <div className="request-info">
                      <h3>Request #{request.id}</h3>
                      <span className="house-number">{request.house_number}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="request-meta">
                      <span className="tenant-name">
                        {request.tenant || 'Anonymous'}
                      </span>
                      <span className="request-date">
                        {new Date(request.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="request-content">
                    <p className="issue-description">{request.issue}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
