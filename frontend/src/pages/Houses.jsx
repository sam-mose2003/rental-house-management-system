import React, { useState, useEffect } from 'react';
import { getHouses, addHouse, deleteHouse } from '../utils/api';
import './Houses.css';

const Houses = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    house_number: '',
    status: 'Vacant'
  });

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const data = await getHouses();
        setHouses(data);
      } catch (err) {
        setError('Failed to load houses');
        console.error('Houses error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHouses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const newHouse = await addHouse(formData);
      setHouses(prev => [newHouse, ...prev]);
      setFormData({ house_number: '', status: 'Vacant' });
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add house');
      console.error('Add house error:', err);
    }
  };

  const handleDelete = async (houseId, houseNumber) => {
    if (!window.confirm(`Are you sure you want to delete house ${houseNumber}?`)) {
      return;
    }

    try {
      await deleteHouse(houseId);
      setHouses(prev => prev.filter(house => house.id !== houseId));
    } catch (err) {
      setError('Failed to delete house');
      console.error('Delete house error:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase();
    return (
      <span className={`status-badge ${statusClass}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="houses-loading">
        <div className="spinner"></div>
        <p>Loading houses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="houses-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="houses">
      <div className="houses-header">
        <h1>House Management</h1>
        <button 
          className="add-house-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add House'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="add-house-form">
          <h3>Add New House</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="house_number">House Number</label>
              <input
                type="text"
                id="house_number"
                name="house_number"
                value={formData.house_number}
                onChange={handleInputChange}
                placeholder="e.g., A101, B201"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Vacant">Vacant</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Add House
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="houses-table-container">
        <table className="houses-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>House Number</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {houses.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No houses found. Add your first house above!
                </td>
              </tr>
            ) : (
              houses.map((house) => (
                <tr key={house.id}>
                  <td>{house.id}</td>
                  <td className="house-number">{house.house_number}</td>
                  <td>{getStatusBadge(house.status)}</td>
                  <td className="action-buttons">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(house.id, house.house_number)}
                      title="Delete house"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="houses-summary">
        <div className="summary-card">
          <h3>Total Houses</h3>
          <p className="summary-number">{houses.length}</p>
        </div>
        <div className="summary-card">
          <h3>Vacant Houses</h3>
          <p className="summary-number">
            {houses.filter(h => h.status === 'Vacant').length}
          </p>
        </div>
        <div className="summary-card">
          <h3>Occupied Houses</h3>
          <p className="summary-number">
            {houses.filter(h => h.status === 'Occupied').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Houses;
