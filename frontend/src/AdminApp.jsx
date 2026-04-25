import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css?v=3';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalHouses: 0,
    totalPayments: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Admin Dashboard</h1>
              <p className="subtitle">Rental House Management System</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="status-cards">
            <div className="status-card">
              <h3>Total Tenants</h3>
              <div className="status-info">
                <span className="status-value">{stats.totalTenants}</span>
              </div>
            </div>
            <div className="status-card">
              <h3>Total Houses</h3>
              <div className="status-info">
                <span className="status-value">{stats.totalHouses}</span>
              </div>
            </div>
            <div className="status-card">
              <h3>Total Payments</h3>
              <div className="status-info">
                <span className="status-value">KSH {stats.totalPayments.toLocaleString()}</span>
              </div>
            </div>
            <div className="status-card">
              <h3>Pending Approvals</h3>
              <div className="status-info">
                <span className="status-value">{stats.pendingApprovals}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/houses')} className="action-btn">
              🏠 Manage Houses
            </button>
            <button onClick={() => navigate('/tenants')} className="action-btn">
              👥 Manage Tenants
            </button>
            <button onClick={() => navigate('/payments')} className="action-btn">
              💳 View Payments
            </button>
            <button onClick={() => navigate('/maintenance')} className="action-btn">
              🔧 Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HouseManagement() {
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    house_number: '',
    price: '',
    house_type: 'Single Room',
    status: 'Vacant'
  });

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/houses');
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      } else {
        setError('Failed to fetch houses');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/houses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const newHouse = await response.json();
        setHouses(prev => [...prev, newHouse]);
        setForm({
          house_number: '',
          price: '',
          house_type: 'Single Room',
          status: 'Vacant'
        });
        alert('House added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add house');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (houseId) => {
    if (!confirm('Are you sure you want to delete this house?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/houses/${houseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHouses(prev => prev.filter(house => house.id !== houseId));
        alert('House deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete house');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading houses...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Manage Houses</h1>
              <p className="subtitle">Add and manage rental properties</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="info-card">
            <h3>Add New House</h3>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="house_number">House Number</label>
                  <input
                    type="text"
                    id="house_number"
                    name="house_number"
                    value={form.house_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Price (KSH)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="house_type">House Type</label>
                  <select
                    id="house_type"
                    name="house_type"
                    value={form.house_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Single Room">Single Room</option>
                    <option value="Bed Sitter">Bed Sitter</option>
                    <option value="One Bedroom">One Bedroom</option>
                    <option value="Two Bedroom">Two Bedroom</option>
                    <option value="Three Bedroom">Three Bedroom</option>
                    <option value="Four Bedroom">Four Bedroom</option>
                    <option value="Five Bedroom">Five Bedroom</option>
                    <option value="Six Bedroom">Six Bedroom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Adding House...' : 'Add House'}
              </button>
            </form>

            {error && (
              <div className="message error">
                {error}
              </div>
            )}
          </div>

          <div className="info-card">
            <h3>House List</h3>
            {houses.length > 0 ? (
              <div className="house-table">
                <table>
                  <thead>
                    <tr>
                      <th>House Number</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {houses.map((house) => (
                      <tr key={house.id}>
                        <td>{house.house_number}</td>
                        <td>
                          <span className={`status-badge ${house.status.toLowerCase()}`}>
                            {house.status}
                          </span>
                        </td>
                        <td>KSH {house.price.toLocaleString()}</td>
                        <td>{house.house_type}</td>
                        <td>
                          {house.status !== 'Occupied' && (
                            <button
                              onClick={() => handleDelete(house.id)}
                              className="delete-btn"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <p>No houses found.</p>
                <p className="empty-subtitle">Add your first house to get started.</p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/dashboard')} className="action-btn">
              📊 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantManagement() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tenants');
      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => a.id - b.id);
        setTenants(data);
        setPendingTenants(data.filter(t => t.status === 'pending'));
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tenantId) => {
    if (!confirm('Are you sure you want to approve this tenant?')) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:5000/api/approve-tenant/${tenantId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        let approvalMessage = data.tenant_message || 'Tenant approved successfully!';
        if (data.email_sent) {
          approvalMessage += ' 📧 Approval email sent to tenant.';
        } else {
          approvalMessage += ' ⚠️ Email notification failed, but tenant was approved.';
        }
        setMessage(approvalMessage);
        fetchTenants(); // Refresh the list
      } else {
        setError(data.error || 'Failed to approve tenant');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (tenantId) => {
    if (!confirm('Are you sure you want to reject this tenant? This action cannot be undone.')) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`http://localhost:5000/api/reject-tenant/${tenantId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Tenant rejected successfully!');
        fetchTenants(); // Refresh the list
      } else {
        setError(data.error || 'Failed to reject tenant');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Manage Tenants</h1>
              <p className="subtitle">Approve or reject tenant applications</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {message && (
            <div className="message success">
              {message}
            </div>
          )}

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          <div className="info-card">
            <h3>Pending Approvals ({pendingTenants.length})</h3>
            {pendingTenants.length > 0 ? (
              <div className="tenant-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>House</th>
                      <th>Move-in Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td>{tenant.name}</td>
                        <td>{tenant.email}</td>
                        <td>{tenant.phone}</td>
                        <td>{tenant.house_number}</td>
                        <td>{new Date(tenant.move_in_date).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons-inline">
                            <button
                              onClick={() => handleApprove(tenant.id)}
                              className="approve-btn"
                              disabled={submitting}
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleReject(tenant.id)}
                              className="reject-btn"
                              disabled={submitting}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>No pending tenant applications.</p>
                <p className="empty-subtitle">All caught up! Check back later for new applications.</p>
              </div>
            )}
          </div>

          <div className="info-card">
            <h3>All Tenants ({tenants.length})</h3>
            {tenants.length > 0 ? (
              <div className="tenant-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>House</th>
                      <th>Status</th>
                      <th>Move-in Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td>{tenant.name}</td>
                        <td>{tenant.email}</td>
                        <td>{tenant.house_number}</td>
                        <td>
                          <span className={`status-badge ${tenant.status.toLowerCase()}`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td>{new Date(tenant.move_in_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>No tenants found.</p>
                <p className="empty-subtitle">Tenants will appear here when they register.</p>
              </div>
            )}
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/dashboard')} className="action-btn">
              📊 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(form),
      });

      if (response.ok) {
        // Login successful, navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Invalid login credentials');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="tenant-auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Admin Login</h1>
            <h2>RHMS Admin Portal</h2>
          </div>
          
          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Router wrapper component
function AppRouter() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/houses" element={<HouseManagement />} />
          <Route path="/tenants" element={<TenantManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;
