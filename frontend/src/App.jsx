import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { fetchVacantHouses, registerTenant } from './utils/api';
import TenantDashboard from './pages/TenantDashboard';
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
        const data = await fetchVacantHouses();
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
    
    console.log('=== Tenant Registration Attempt ===');
    console.log('Form data:', form);
    console.log('Form validation:', {
      name: !!form.name,
      national_id: !!form.national_id,
      phone: !!form.phone,
      email: !!form.email,
      house_number: !!form.house_number,
      move_in_date: !!form.move_in_date
    });
    
    try {
      console.log('Calling registerTenant API...');
      const result = await registerTenant(form);
      console.log('API response:', result);
      
      setMessage('Registration successful! Your application is now pending approval.');
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
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      setMessage(err.message || 'Registration failed');
      setMessageType('error');
    } finally {
      console.log('Registration attempt completed');
      setSubmitting(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="app">
        <div className="card">
          <h1>Registration Submitted! 🎉</h1>
          <div className="success-message">
            <p>Your tenant application has been submitted successfully and is now pending approval.</p>
            <p>You will be able to access your dashboard once the administrator approves your application.</p>
            <p><strong>Application Details:</strong></p>
            <ul>
              <li>Name: {form.name || 'N/A'}</li>
              <li>Email: {form.email || 'N/A'}</li>
              <li>Phone: {form.phone || 'N/A'}</li>
              <li>House: {form.house_number || 'N/A'}</li>
            </ul>
          </div>
          <button 
            className="submit-btn" 
            onClick={() => setRegistrationComplete(false)}
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Tenant Registration</h1>
        <p>Fill in your details to apply for a house.</p>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <input
            name="name"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="national_id"
            type="text"
            placeholder="National ID"
            value={form.national_id}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <select
            name="house_number"
            value={form.house_number}
            onChange={handleChange}
            required
            disabled={loadingHouses || houses.length === 0}
          >
            <option value="">
              {loadingHouses
                ? 'Loading houses...'
                : houses.length === 0
                ? 'No vacant houses available'
                : 'Select a house'}
            </option>
            {houses.map((h) => (
              <option key={h.id} value={h.house_number}>
                {h.house_number}
              </option>
            ))}
          </select>

          <label className="date-label">
            Move-in date
            <input
              name="move_in_date"
              type="date"
              value={form.move_in_date}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" disabled={submitting || houses.length === 0}>
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
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
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
