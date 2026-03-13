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
        <div className="registration-container">
          <h2>Loading available houses...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="registration-container">
        <h1>Rental House Management System</h1>
        <h2>Tenant Registration</h2>
        
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
                  placeholder="Enter your national ID"
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
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
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
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a house</option>
                  {houses.map((house) => (
                    <option key={house.id} value={house.house_number}>
                      {house.house_number} - {house.type} (KSH {house.rent}/month)
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
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <h3>Registration Submitted!</h3>
            <p>Your application has been submitted and is pending approval.</p>
            <p>You will be notified once your application is approved.</p>
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
        <h2>Tenant Login</h2>
        
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
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
              placeholder="Enter your password (National ID)"
              required
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account? <a href="/">Register here</a>
          </p>
          <p>
            Use your email and national ID as password (temporary)
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
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Tenant Dashboard</h1>
          <div className="tenant-info">
            <span>Welcome, {tenantInfo.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="info-card">
            <h3>Your Information</h3>
            <p><strong>Name:</strong> {tenantInfo.name}</p>
            <p><strong>House:</strong> {tenantInfo.house_number}</p>
            <p><strong>Email:</strong> {tenantInfo.email}</p>
            <p><strong>Phone:</strong> {tenantInfo.phone}</p>
          </div>
          
          <div className="info-card">
            <h3>Quick Actions</h3>
            <button className="action-btn">Make Payment</button>
            <button className="action-btn">Submit Maintenance Request</button>
            <button className="action-btn">View Payment History</button>
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
