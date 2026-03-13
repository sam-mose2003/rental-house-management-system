import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance';
import Houses from './pages/Houses';
import './AdminApp.css';

function AdminApp() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/houses" element={<Houses />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default AdminApp;
