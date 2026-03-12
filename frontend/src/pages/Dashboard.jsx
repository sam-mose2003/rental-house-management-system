import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalHouses: 0,
    totalPayments: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome to RHMS Admin Dashboard</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Houses"
          value={stats.totalHouses}
          icon="🏠"
          color="green"
        />
        <StatCard
          title="Total Payments"
          value={`$${stats.totalPayments.toLocaleString()}`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon="⏳"
          color="red"
        />
      </div>

      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.location.href = '/tenants'}>
            <span className="btn-icon">👤</span>
            Manage Tenants
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/payments'}>
            <span className="btn-icon">💳</span>
            Record Payment
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/maintenance'}>
            <span className="btn-icon">🔧</span>
            Maintenance Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
