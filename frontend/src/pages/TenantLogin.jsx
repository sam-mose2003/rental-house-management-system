import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TenantLogin.css';

const TenantLogin = () => {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const navigate = useNavigate();

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
        // Store tenant info in localStorage
        localStorage.setItem('tenantInfo', JSON.stringify(data.tenant));
        localStorage.setItem('tenantToken', data.token);
        
        setMessage('Login successful! Redirecting to dashboard...', 'success');
        setMessageType('success');
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
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
              placeholder="Enter your password"
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
};

export default TenantLogin;
