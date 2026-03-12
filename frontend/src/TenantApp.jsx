import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TenantDashboard from './pages/TenantDashboard';
import './App.css';

function TenantApp() {
  return (
    <Router>
      <div className="app">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<TenantDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default TenantApp;
