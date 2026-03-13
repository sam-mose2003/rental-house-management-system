import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

function RegistrationForm() {
  const [houses, setHouses] = useState([]);
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [form, setForm] = useState({
    name: '',
    national_id: '',
    phone: '',
    email: '',
    house_number: '',
    move_in_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [registrationComplete, setRegistrationComplete] = useState(false);

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
        <h2>Tenant Registration Portal</h2>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {!registrationComplete ? (
          <form onSubmit={handleSubmit} className="registration-form">
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
    } catch (error) {
      window.location.href = '/login';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tenantInfo');
    localStorage.removeItem('tenantToken');
    window.location.href = '/login';
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
          <div className="info-card">
            <h3>🏠 Your Information</h3>
            <p><strong>Full Name:</strong> {tenantInfo.name}</p>
            <p><strong>House Number:</strong> {tenantInfo.house_number}</p>
            <p><strong>Email:</strong> {tenantInfo.email}</p>
            <p><strong>Phone:</strong> {tenantInfo.phone}</p>
            <p><strong>Status:</strong> <span style={{color: '#48bb78', fontWeight: '600'}}>✅ Active Tenant</span></p>
          </div>
          
          <div className="info-card">
            <h3>🚀 Quick Actions</h3>
            <button className="action-btn">💳 Make Payment</button>
            <button className="action-btn">🔧 Maintenance Request</button>
            <button className="action-btn">📊 Payment History</button>
            <button className="action-btn">📧 Contact Support</button>
          </div>
          
          <div className="info-card">
            <h3>📈 Account Summary</h3>
            <p><strong>Current Month:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <p><strong>Rent Due:</strong> <span style={{color: '#e53e3e', fontWeight: '600'}}>KSH 10,000</span></p>
            <p><strong>Payment Status:</strong> <span style={{color: '#ed8936', fontWeight: '600'}}>⏰ Pending</span></p>
            <p><strong>Move-in Date:</strong> {tenantInfo.move_in_date ? new Date(tenantInfo.move_in_date).toLocaleDateString() : 'Not set'}</p>
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
