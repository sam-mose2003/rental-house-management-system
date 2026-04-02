import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import './TenantAuth.css';

const TenantAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [houses, setHouses] = useState([]);
  const [loadingHouses, setLoadingHouses] = useState(true);

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    national_id: '',
    phone: '',
    email: '',
    house_number: '',
    move_in_date: ''
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    national_id: ''
  });

  // Load houses on component mount
  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/houses`);
      if (!response.ok) throw new Error('Failed to load houses');
      const data = await response.json();
      // Filter out occupied houses - only show vacant ones
      const vacantHouses = data ? data.filter(house => house.status !== 'Occupied') : [];
      setHouses(vacantHouses);
    } catch (error) {
      console.error('Error loading houses:', error);
      setHouses([]);
    } finally {
      setLoadingHouses(false);
    }
  };

  // Validation functions
  const validateNationalId = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 13;
  };

  const validatePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length <= 10;
  };

  // Handle registration input changes
  const handleRegChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'national_id') {
      const digits = value.replace(/\D/g, '');
      setRegForm(prev => ({ ...prev, [name]: digits }));
    } else if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      setRegForm(prev => ({ ...prev, [name]: digits }));
    } else {
      setRegForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle login input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow digits for national_id
    if (name === 'national_id') {
      const digits = value.replace(/\D/g, '');
      setLoginForm(prev => ({ ...prev, [name]: digits }));
    } else {
      setLoginForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Validate form
    if (!validateNationalId(regForm.national_id)) {
      setMessage('National ID must be between 8 and 13 digits.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!validatePhoneNumber(regForm.phone)) {
      setMessage('Phone number must not exceed 10 digits.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(regForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! You can now login.');
        setMessageType('success');
        // Clear form
        setRegForm({
          name: '',
          national_id: '',
          phone: '',
          email: '',
          house_number: '',
          move_in_date: '',
        });
        // Switch to login view after successful registration
        setTimeout(() => setIsLogin(true), 2000);
      } else {
        setMessage(data.error || 'Registration failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.national_id // Send national_id as password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store tenant info and token
        localStorage.setItem('tenantInfo', JSON.stringify(data.tenant));
        localStorage.setItem('tenantToken', data.token);
        
        setMessage('Login successful! Redirecting to dashboard...');
        setMessageType('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Invalid email or national ID');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-circle">🏠</div>
          <h1>HMS</h1>
          <h2>{isLogin ? 'Tenant Login' : 'Tenant Registration Form'}</h2>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        {!isLogin ? (
          // Registration Form
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={regForm.name}
                  onChange={handleRegChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleRegChange}
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
                  value={regForm.national_id}
                  onChange={handleRegChange}
                  placeholder="8-13 digits"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={regForm.phone}
                  onChange={handleRegChange}
                  placeholder="Max 10 digits"
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
                  value={regForm.house_number}
                  onChange={handleRegChange}
                  required
                  disabled={loadingHouses}
                >
                  <option value="">Select a house</option>
                  {houses.length === 0 && !loadingHouses && (
                    <option value="" disabled>No vacant houses available</option>
                  )}
                  {houses.map(house => (
                    <option key={house.id} value={house.house_number}>
                      {house.house_number}
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
                  value={regForm.move_in_date}
                  onChange={handleRegChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsLogin(true)} 
                className="login-btn"
              >
                Login
              </button>
            </div>
          </form>
        ) : (
          // Login Form
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-national-id">National ID</label>
              <input
                type="text"
                id="login-national-id"
                name="national_id"
                value={loginForm.national_id}
                onChange={handleLoginChange}
                placeholder="Enter your National ID"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Signing in...' : 'Login'}
              </button>
              <button 
                type="button" 
                onClick={() => setIsLogin(false)} 
                className="register-btn"
              >
                Register
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TenantAuth;
