import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('signup'); // signup, login, forgot
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
    move_in_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Forgot password form state
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
      console.log('useEffect: Starting to fetch vacant houses...');
      try {
        const response = await fetch('http://localhost:5000/api/houses?vacant=1');
        const data = await response.json();
        console.log('useEffect: Successfully fetched houses:', data);
        setHouses(data);
      } catch (err) {
        console.error('useEffect: Error fetching houses:', err);
        setMessage('Could not load houses. Please try again later.');
        setMessageType('error');
      } finally {
        console.log('useEffect: Finished loading houses');
        setLoadingHouses(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone validation: numbers only, exactly 10 digits
    if (name === 'phone') {
      const phoneOnly = value.replace(/\D/g, '');
      if (phoneOnly.length <= 10) {
        setForm((prev) => ({ ...prev, [name]: phoneOnly }));
      }
      return;
    }
    
    // National ID validation: numbers only, 8-12 digits
    if (name === 'national_id') {
      const idOnly = value.replace(/\D/g, '');
      if (idOnly.length <= 12) {
        setForm((prev) => ({ ...prev, [name]: idOnly }));
      }
      return;
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
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
    } catch (err) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/tenant-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenantInfo', JSON.stringify(data.tenant));
        localStorage.setItem('tenantToken', data.token);
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage(data.error || 'Login failed. Please check your credentials.', 'error');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setForgotLoading(true);

    try {
      // In a real app, this would send a password reset email
      // For now, we'll just show a success message
      setMessage(`Password reset instructions have been sent to ${forgotForm.email}. Please check your email.`, 'success');
      setMessageType('success');
      setForgotForm({ email: '' });
      
      // Switch back to login after 3 seconds
      setTimeout(() => {
        switchView('login');
      }, 3000);
    } catch (error) {
      setMessage('Network error. Please try again.', 'error');
      setMessageType('error');
    } finally {
      setForgotLoading(false);
    }
  };

  if (loadingHouses) {
    return (
      <div className="app">
        <div className="loading">Loading available houses...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="registration-container">
        <h1>RHMS</h1>
        <h2>Tenant Portal</h2>
        
        {/* View Switcher */}
        <div className="view-switcher">
          <button 
            className={`view-btn ${currentView === 'signup' ? 'active' : ''}`}
            onClick={() => switchView('signup')}
          >
            Sign Up
          </button>
          <button 
            className={`view-btn ${currentView === 'login' ? 'active' : ''}`}
            onClick={() => switchView('login')}
          >
            Login
          </button>
          <button 
            className={`view-btn ${currentView === 'forgot' ? 'active' : ''}`}
            onClick={() => switchView('forgot')}
          >
            Forgot Password
          </button>
        </div>
        
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
                  onChange={handleChange}
                  placeholder="Enter your full name"
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
                  onChange={handleChange}
                  placeholder="Enter your national ID (8-12 digits)"
                  pattern="[0-9]{8,12}"
                  title="National ID must be 8-12 digits"
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
                  onChange={handleChange}
                  placeholder="07XX XXX XXX"
                  pattern="[0-9]{10}"
                  title="Phone number must be exactly 10 digits"
                  maxLength="10"
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
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="house_number">Select House</label>
                <select
                  id="house_number"
                  name="house_number"
                  value={form.house_number}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a house</option>
                  {houses.map((house) => (
                    <option key={house.id} value={house.house_number}>
                      House {house.house_number} - {house.type || 'Standard'} - KSH {house.rent || 10000}/month
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
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Submitting Application...' : 'Complete Registration'}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <h3>🎉 Registration Successful!</h3>
            <p>Your application has been submitted and is currently pending approval.</p>
            <p>You will receive an email notification once your application has been reviewed.</p>
            <button onClick={() => window.location.reload()} className="submit-btn">
              Submit Another Application
            </button>
          </div>
        )}
          </>
        )}

        {/* Login View */}
        {currentView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="registration-form">
            <h3>Welcome Back</h3>
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
              <label htmlFor="password">Password (National ID)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Enter your national ID"
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="form-footer">
              <p>
                Don't have an account? 
                <button type="button" className="link-btn" onClick={() => switchView('signup')}>
                  Sign up here
                </button>
              </p>
              <p>
                <button type="button" className="link-btn" onClick={() => switchView('forgot')}>
                  Forgot password?
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Forgot Password View */}
        {currentView === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="registration-form">
            <h3>Reset Password</h3>
            <p className="form-description">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
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
              <p>
                <button type="button" className="link-btn" onClick={() => switchView('login')}>
                  Back to login
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function TenantLogin() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5000/api/tenant-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenantInfo', JSON.stringify(data.tenant));
        localStorage.setItem('tenantToken', data.token);
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setMessage(data.error || 'Login failed. Please check your credentials.', 'error');
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
    <div className="tenant-login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="Enter your national ID"
              required
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            New to RHMS? <a href="/">Create an account</a>
          </p>
          <p style={{fontSize: '0.85rem', color: '#a0aec0'}}>
            💡 Use your registered email and national ID as password
          </p>
        </div>
      </div>
    </div>
  );
}

function TenantDashboard() {
  const [tenantInfo, setTenantInfo] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState('pending');

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenantInfo');
    const storedToken = localStorage.getItem('tenantToken');
    
    if (!storedTenant || !storedToken) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const tenant = JSON.parse(storedTenant);
      setTenantInfo(tenant);
      setApplicationStatus(tenant.status || 'pending');
    } catch (error) {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tenantInfo');
    localStorage.removeItem('tenantToken');
    window.location.href = '/login';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'pending': return '#f39c12';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '📝';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved': return 'Your application has been approved! You can now access your house.';
      case 'rejected': return 'Your application has been rejected. Please contact support for details.';
      case 'pending': return 'Your application is under review. We will notify you once a decision is made.';
      default: return 'Application status unknown. Please contact support.';
    }
  };

  if (!tenantInfo) {
    return (
      <div className="app">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Tenant Dashboard</h1>
          <div className="tenant-info">
            <span>👋 Welcome, <strong>{tenantInfo.name}</strong></span>
            <button onClick={handleLogout} className="logout-btn">Sign Out</button>
          </div>
        </div>
        
        <div className="dashboard-content">
          {/* Application Status Card */}
          <div className={`status-card status-${applicationStatus}`}>
            <div className="status-header">
              <h3>📋 Application Status</h3>
              <span className="status-badge" style={{ 
                backgroundColor: getStatusColor(applicationStatus),
                color: 'white'
              }}>
                {getStatusIcon(applicationStatus)} {applicationStatus.toUpperCase()}
              </span>
            </div>
            <p className="status-message">{getStatusMessage(applicationStatus)}</p>
            
            {/* Progress Timeline */}
            <div className="progress-timeline">
              <div className={`timeline-item ${applicationStatus === 'pending' ? 'active' : 'completed'}`}>
                <div className="timeline-dot">📝</div>
                <div className="timeline-content">
                  <h4>Application Submitted</h4>
                  <p>Your tenant application has been received</p>
                </div>
              </div>
              
              <div className={`timeline-item ${applicationStatus === 'approved' ? 'active' : applicationStatus === 'pending' ? 'pending' : 'rejected'}`}>
                <div className="timeline-dot">
                  {applicationStatus === 'approved' ? '✅' : applicationStatus === 'rejected' ? '❌' : '⏳'}
                </div>
                <div className="timeline-content">
                  <h4>Review Process</h4>
                  <p>
                    {applicationStatus === 'approved' ? 'Application approved!' : 
                     applicationStatus === 'rejected' ? 'Application rejected' : 
                     'Your application is being reviewed'}
                  </p>
                </div>
              </div>
              
              <div className={`timeline-item ${applicationStatus === 'approved' ? 'active' : 'disabled'}`}>
                <div className="timeline-dot">🏠</div>
                <div className="timeline-content">
                  <h4>House Assignment</h4>
                  <p>
                    {applicationStatus === 'approved' ? 
                      `House ${tenantInfo.house_number} assigned to you` : 
                      'Waiting for house assignment'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className="info-card">
            <h3>🏠 Your Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{tenantInfo.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{tenantInfo.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{tenantInfo.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">National ID:</span>
                <span className="info-value">{tenantInfo.national_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Requested House:</span>
                <span className="info-value">{tenantInfo.house_number || 'Not assigned yet'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Move-in Date:</span>
                <span className="info-value">{tenantInfo.move_in_date || 'Not determined yet'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="actions-card">
            <h3>⚡ Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => window.location.href = '/'}>
                📝 Update Application
              </button>
              <button className="action-btn" onClick={() => alert('Contact: support@rhms.com')}>
                📧 Contact Support
              </button>
              <button className="action-btn" onClick={() => alert('Coming soon!')}>
                📄 View Documents
              </button>
              <button className="action-btn" onClick={() => alert('Coming soon!')}>
                💳 Make Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<RegistrationForm />} />
          <Route path="/login" element={<TenantLogin />} />
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
