import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css?v=3';

function TenantPortal() {
  const navigate = useNavigate();
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
    move_in_date: ''
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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('useEffect: Houses data received:', data);
        setHouses(data || []);
      } catch (error) {
        console.error('useEffect: Error fetching houses:', error);
        setHouses([]);
      } finally {
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
        // Check if it's a duplicate email error
        if (data.error && data.error.includes('already exists')) {
          setMessage('You already have an account! Redirecting to login...', 'error');
          setMessageType('error');
          setTimeout(() => {
            switchView('login');
            // Pre-fill the login form with the email
            setLoginForm(prev => ({ ...prev, email: form.email }));
          }, 2000);
        } else {
          setMessage(data.error || 'Registration failed. Please try again.');
          setMessageType('error');
        }
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
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setMessageType('success');
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('token', data.token);
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
                </div>

                <div className="form-group">
                  <label htmlFor="house_number">Preferred House</label>
                  <select
                    id="house_number"
                    name="house_number"
                    value={form.house_number}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
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
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setMessage(data.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
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
        const tenant = JSON.parse(storedTenant);
        setTenantInfo(tenant);
        setApplicationStatus(tenant.status || 'pending');
      } catch (error) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (tenantInfo) {
      fetchMaintenanceRequests();
      fetchPayments();
    }
  }, [tenantInfo]);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tenant-maintenance/${tenantInfo.id}`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceRequests(data);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tenant-payments/${tenantInfo.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#f39c12';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '⏳';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved': return 'Congratulations! Your application has been approved.';
      case 'rejected': return 'We regret to inform you that your application has been rejected.';
      default: return 'Your application is currently under review.';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleUpdateApplication = () => {
    // Navigate to update form
    navigate('/');
  };

  const handleContactSupport = () => {
    // Open email client or support page
    window.location.href = 'mailto:support@rhms.com';
  };

  const handleViewDocuments = () => {
    // Navigate to documents page
    alert('Document viewer coming soon!');
  };

  const handleMakePayment = () => {
    // Navigate to payment page
    navigate('/');
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const issue = formData.get('issue');
    const houseNumber = formData.get('house_number');
    
    try {
      const response = await fetch('http://localhost:5000/api/maintenance-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantInfo.id,
          issue: issue,
          house_number: houseNumber
        }),
      });

      if (response.ok) {
        alert('Maintenance request submitted successfully!');
        setShowMaintenanceForm(false);
        fetchMaintenanceRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit maintenance request');
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
    const paymentType = formData.get('payment_type');
    
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
          payment_type: paymentType
        }),
      });

      if (response.ok) {
        alert('Payment submitted successfully!');
        setShowPaymentForm(false);
        fetchPayments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit payment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <h1>Welcome, {tenantInfo.name}!</h1>
            <p className="header-subtitle">Tenant Dashboard</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <div className="dashboard-content">
          {/* Application Status Card */}
          <div className={`status-card status-${applicationStatus}`}>
            <div className="status-header">
              <h3>Application Status</h3>
              <span className={`status-badge status-${applicationStatus}`}>
                {getStatusIcon(applicationStatus)} {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
              </span>
            </div>
            <p className="status-message">
              {getStatusMessage(applicationStatus)}
            </p>
            
            {/* Progress Timeline */}
            <div className="progress-timeline">
              <div className={`timeline-item ${applicationStatus === 'pending' ? 'active' : 'completed'}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>Application Submitted</h4>
                  <p>Your application has been received and is under review.</p>
                </div>
              </div>
              
              <div className={`timeline-item ${applicationStatus === 'approved' ? 'active' : 'pending'}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>Application Approved</h4>
                  <p>Congratulations! Your application has been approved.</p>
                </div>
              </div>
              
              <div className={`timeline-item ${applicationStatus === 'rejected' ? 'active' : 'pending'}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>Application Rejected</h4>
                  <p>We regret to inform you about the rejection.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Information Card */}
          <div className="info-card">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name:</label>
                <span>{tenantInfo.name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{tenantInfo.email}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{tenantInfo.phone}</span>
              </div>
              <div className="info-item">
                <label>National ID:</label>
                <span>{tenantInfo.national_id}</span>
              </div>
              {tenantInfo.house_number && (
                <div className="info-item">
                  <label>House Number:</label>
                  <span>{tenantInfo.house_number}</span>
                </div>
              )}
              {tenantInfo.move_in_date && (
                <div className="info-item">
                  <label>Move-in Date:</label>
                  <span>{new Date(tenantInfo.move_in_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Requests Card */}
          <div className="info-card">
            <h3>Maintenance Requests</h3>
            <div className="maintenance-list">
              {maintenanceRequests.length > 0 ? (
                maintenanceRequests.map((request) => (
                  <div key={request.id} className="maintenance-item">
                    <div className="maintenance-header">
                      <span className="maintenance-id">#{request.id}</span>
                      <span className={`maintenance-status status-${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="maintenance-issue">{request.issue}</div>
                    <div className="maintenance-date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p>No maintenance requests found.</p>
              )}
            </div>
            <button 
              onClick={() => setShowMaintenanceForm(true)} 
              className="action-btn"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              🔧 Submit Maintenance Request
            </button>
          </div>

          {/* Payments Card */}
          <div className="info-card">
            <h3>Payment History</h3>
            <div className="payment-list">
              {payments.length > 0 ? (
                payments.map((payment, index) => (
                  <div key={index} className="payment-item">
                    <div className="payment-header">
                      <span className="payment-amount">${payment.amount}</span>
                      <span className="payment-method">{payment.payment_method}</span>
                    </div>
                    <div className="payment-date">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p>No payments found.</p>
              )}
            </div>
            <button 
              onClick={() => setShowPaymentForm(true)} 
              className="action-btn"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              💳 Make Payment
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="actions-card">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button onClick={handleUpdateApplication} className="action-btn">
                📝 Update Application
              </button>
              <button onClick={handleContactSupport} className="action-btn">
                💬 Contact Support
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

      {/* Maintenance Request Modal */}
      {showMaintenanceForm && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Maintenance Request</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowMaintenanceForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="form-group">
                <label>House Number</label>
                <select name="house_number" required>
                  <option value="">Select your house</option>
                  <option value={tenantInfo.house_number}>{tenantInfo.house_number}</option>
                </select>
              </div>
              <div className="form-group">
                <label>Issue Description</label>
                <textarea 
                  name="issue" 
                  required 
                  placeholder="Describe the maintenance issue..."
                  rows="4"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowMaintenanceForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && (
        <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Make Payment</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowPaymentForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label>Payment Amount ($)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1" 
                  step="0.01"
                  placeholder="Enter amount"
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select name="payment_method" required>
                  <option value="">Select payment method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Type</label>
                <select name="payment_type" required>
                  <option value="">Select payment type</option>
                  <option value="Rent">Rent</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowPaymentForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;
