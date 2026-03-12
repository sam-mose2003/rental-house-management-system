import { useEffect, useState } from 'react';
import './App.css';
import { fetchVacantHouses, registerTenant } from './api';

function App() {
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

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchVacantHouses();
        setHouses(data);
      } catch (err) {
        setMessage('Could not load houses. Please try again later.');
        setMessageType('error');
      } finally {
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
      await registerTenant(form);
      setMessage('Registration successful! We will contact you shortly.');
      setMessageType('success');
      setForm({
        name: '',
        national_id: '',
        phone: '',
        email: '',
        house_number: '',
        move_in_date: '',
      });
      const data = await fetchVacantHouses();
      setHouses(data);
    } catch (err) {
      setMessage(err.message || 'Registration failed');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

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

export default App;
