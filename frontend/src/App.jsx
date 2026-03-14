import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css?v=3';
import './share.css';

function TenantPortal() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('signup');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [houses, setHouses] = useState([]);
  const [form, setForm] = useState({
    name: '',
    national_id: '',
    phone: '',
    email: '',
    house_number: '',
    move_in_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const [forgotForm, setForgotForm] = useState({
    email: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);

  const switchView = (view) => {
    setCurrentView(view);
    setMessage(null);
    setMessageType('success');
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('http://localhost:5000/api/houses?vacant=1');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHouses(data || []);
      } catch (error) {
        console.error('Error fetching houses:', error);
        setHouses([]);
      } finally {
        setLoadingHouses(false);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! Your application has been submitted for approval.');
        setMessageType('success');
        setRegistrationComplete(true);
        setForm({
          name: '',
          national_id: '',
          phone: '',
          email: '',
          house_number: '',
          move_in_date: '',
        });
      } else {
        setMessage(data.error || 'Registration failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('token', data.token);
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setMessage(data.error || 'Login failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setForgotLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forgotForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset instructions sent to your email.', 'success');
        setTimeout(() => {
          switchView('login');
        }, 3000);
      } else {
        setMessage(data.error || 'Failed to send reset instructions. Please try again.', 'error');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="app">
      {loadingHouses ? (
        <div className="loading">Loading available houses...</div>
      ) : (
        <div className="registration-container">
          <h1>RHMS</h1>
          <h2>Tenant Portal</h2>
          
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Sign Up View */}
          {currentView === 'signup' && (
            <>
              {!registrationComplete ? (
                <form onSubmit={handleSubmit} className="registration-form">
                  <h3>Create Account</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="national_id">National ID</label>
                      <input
                        type="text"
                        id="national_id"
                        name="national_id"
                        value={form.national_id}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="house_number">House Number</label>
                      <select
                        id="house_number"
                        name="house_number"
                        value={form.house_number}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a house</option>
                        {houses.map((house) => (
                          <option key={house.id} value={house.house_number}>
                            House {house.house_number} ({house.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="move_in_date">Move-in Date</label>
                      <input
                        type="date"
                        id="move_in_date"
                        name="move_in_date"
                        value={form.move_in_date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? 'Creating Account...' : 'Sign Up'}
                  </button>
                  
                  <div className="form-footer">
                    <p>
                      Already have an account? 
                      <button type="button" className="link-btn" onClick={() => switchView('login')}>
                        Login here
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <div className="success-message">
                  <h3>🎉 Registration Successful!</h3>
                  <p>Your application has been submitted and is currently pending approval.</p>
                  <p>You will receive an email notification once your application has been reviewed.</p>
                  
                  <div className="share-section">
                    <h4>🔗 Share Registration Link</h4>
                    <p>Share this link with friends who need to create tenant accounts:</p>
                    <div className="share-link-container">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/register`}
                        className="share-link-input"
                        onClick={(e) => e.target.select()}
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/register`);
                          alert('Link copied to clipboard!');
                        }}
                        className="copy-btn"
                      >
                        📋 Copy Link
                      </button>
                    </div>
                  </div>
                  
                  <button onClick={() => window.location.reload()} className="submit-btn">
                    Submit Another Application
                  </button>
                  <div className="form-footer">
                    <p>
                      Already have an account? 
                      <button type="button" className="link-btn" onClick={() => switchView('login')}>
                        Login here
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Login View */}
          {currentView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="login-form">
              <h2>Tenant Login</h2>
              {message && (
                <div className="message error">
                  {message}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="form-footer">
                <button type="button" className="link-btn" onClick={() => switchView('signup')}>
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password View */}
          {currentView === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="forgot-form">
              <h2>Forgot Password</h2>
              {message && (
                <div className={`message ${messageType}`}>
                  {message}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={forgotForm.email}
                  onChange={handleForgotChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={forgotLoading}>
                {forgotLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              <div className="form-footer">
                <button type="button" className="link-btn" onClick={() => switchView('login')}>
                  Back to login
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function TenantLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('token', data.token);
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setMessage(data.error || 'Login failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="login-card">
        <h2>Tenant Login</h2>
        {message && (
          <div className="message error">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
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
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="form-footer">
            <button type="button" className="link-btn" onClick={() => navigate('/')}>
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TenantDashboard() {
  const navigate = useNavigate();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState('pending');
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant');
    if (storedTenant) {
      try {
        setTenantInfo(JSON.parse(storedTenant));
      } catch (error) {
        console.error('Error parsing tenant info:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (tenantInfo) {
      fetchMaintenanceRequests();
      fetchPayments();
    }
  }, [tenantInfo]);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tenant-maintenance/${encodeURIComponent(tenantInfo.name)}`);
      
      if (response.ok) {
        const data = await response.json();
        const formattedRequests = data.map(request => ({
          id: request[0],
          issue: request[1],
          status: request[2],
          created_at: request[3],
          house_number: request[4] || tenantInfo.house_number
        }));
        setMaintenanceRequests(formattedRequests);
      } else {
        setMaintenanceRequests([]);
      }
    } catch (error) {
      setMaintenanceRequests([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tenant-payments/${tenantInfo.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (error) {
      setPayments([]);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const issue = formData.get('issue');
    const priority = formData.get('priority');
    
    try {
      const response = await fetch('http://localhost:5000/api/maintenance-request', {
        method: 'POST',
        body: JSON.stringify({
          tenant_name: tenantInfo.name,
          issue: issue,
          priority: priority,
          payment_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        alert('Maintenance request submitted successfully!');
        setShowMaintenanceForm(false);
        await fetchMaintenanceRequests();
      } else {
        alert('Failed to submit maintenance request. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const amount = formData.get('amount');
    const paymentMethod = formData.get('payment_method');
    
    try {
      const response = await fetch('http://localhost:5000/api/tenant-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantInfo.id,
          amount: amount,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        alert('Payment submitted successfully!');
        setShowPaymentForm(false);
        await fetchPayments();
      } else {
        alert('Failed to submit payment. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Open': '#f39c12',
      'In Progress': '#3b82f6',
      'Resolved': '#10b981'
    };
    
    return (
      <span 
        className="status-badge" 
        style={{ 
          backgroundColor: statusColors[status] || '#6b7280',
          color: 'white'
        }}
      >
        {status}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleUpdateApplication = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    navigate('/');
  };

  const handleViewDocuments = () => {
    navigate('/');
  };

  const handleMakePayment = () => {
    setShowPaymentForm(true);
  };

  if (!tenantInfo) {
    return (
      <div className="app">
        <div className="loading">Loading tenant information...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Welcome, {tenantInfo.name}!</h1>
              <p className="subtitle">Tenant Dashboard</p>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="status-cards">
            <div className="status-card">
              <h3>Application Status</h3>
              <div className="status-info">
                <span className="status-label">Status:</span>
                <span className="status-value" style={{ color: getStatusColor(applicationStatus) }}>
                  {applicationStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="info-cards">
            <div className="info-card">
              <h3>Personal Information</h3>
              <div className="personal-info">
                <p><strong>Name:</strong> {tenantInfo.name}</p>
                <p><strong>Email:</strong> {tenantInfo.email}</p>
                <p><strong>Phone:</strong> {tenantInfo.phone}</p>
                <p><strong>National ID:</strong> {tenantInfo.national_id}</p>
                <p><strong>House:</strong> {tenantInfo.house_number}</p>
                <p><strong>Move-in Date:</strong> {new Date(tenantInfo.move_in_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="info-card">
              <h3>Maintenance Requests</h3>
              <div className="maintenance-list">
                {maintenanceRequests.length > 0 ? (
                  maintenanceRequests.map((request, index) => (
                    <div key={index} className="maintenance-item">
                      <div className="maintenance-header">
                        <span className="maintenance-issue">{request.issue}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="maintenance-details">
                        <div className="maintenance-date">
                          <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        <div className="maintenance-house">
                          <strong>House:</strong> {request.house_number}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🔧</div>
                    <p>No maintenance requests found.</p>
                    <p className="empty-subtitle">Submit a maintenance request to track its progress.</p>
                  </div>
                )}
              </div>
              <button onClick={() => setShowMaintenanceForm(true)} className="action-btn">
                🔧 Request Maintenance
              </button>
            </div>

            <div className="info-card">
              <h3>Payment History</h3>
              <div className="payment-list">
                {payments.length > 0 ? (
                  payments.map((payment, index) => (
                    <div key={index} className="payment-item">
                      <div className="payment-header">
                        <span className="payment-amount">KSH {payment[1]?.toLocaleString() || '0'}</span>
                        <span className="payment-method">{payment[3] || 'Unknown'}</span>
                      </div>
                      <div className="payment-date">
                        {payment[2] ? new Date(payment[2]).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">💳</div>
                    <p>No payments found.</p>
                    <p className="empty-subtitle">Submit a payment to track your payment history here.</p>
                  </div>
                )}
              </div>
              <button onClick={() => setShowPaymentForm(true)} className="action-btn">
                💳 Make Payment
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleUpdateApplication} className="action-btn">
              📝 Update Application
            </button>
            <button onClick={handleContactSupport} className="action-btn">
              📞 Contact Support
            </button>
            <button onClick={handleViewDocuments} className="action-btn">
              📄 View Documents
            </button>
            <button onClick={handleMakePayment} className="action-btn">
              💳 Make Payment
            </button>
          </div>
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
          <Route path="/" element={<TenantPortal />} />
          <Route path="/login" element={<TenantLogin />} />
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="/register" element={<TenantPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;
