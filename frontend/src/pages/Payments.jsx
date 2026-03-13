import React, { useState, useEffect } from 'react';
import { getPayments, addPayment, getTenants } from '../utils/api';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    tenant_id: '',
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsData, tenantsData] = await Promise.all([
          getPayments(),
          getTenants()
        ]);
        setPayments(paymentsData);
        setTenants(tenantsData);
      } catch (err) {
        setError('Failed to load payment data');
        console.error('Payments error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    
    try {
      const newPayment = await addPayment(formData);
      setPayments(prev => [newPayment, ...prev]);
      setFormData({
        tenant_id: '',
        amount: '',
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError('Failed to add payment');
      console.error('Add payment error:', err);
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

  if (loading) {
    return (
      <div className="payments-loading">
        <div className="spinner"></div>
        <p>Loading payment data...</p>
      </div>
    );
  }

  if (error && !showAddForm) {
    return (
      <div className="payments-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="payments">
      <div className="payments-header">
        <h1>Payment Management</h1>
        <p>Record and track tenant payments</p>
        <button 
          className="add-payment-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Payment'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="add-payment-form">
          <h3>Add New Payment</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tenant_id">Tenant</label>
              <select
                id="tenant_id"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {tenant.house_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (KSH)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount in KSH"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
              >
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Check">Check</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="payment_date">Payment Date</label>
              <input
                type="date"
                id="payment_date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Record Payment
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

      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tenant</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No payments recorded yet
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td className="tenant-name">{getTenantName(payment.tenant_id)}</td>
                  <td className="amount">KSH {parseFloat(payment.amount).toLocaleString()}</td>
                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="payment-method">
                    <span className={`method-badge ${payment.payment_method.toLowerCase().replace(' ', '-')}`}>
                      {payment.payment_method}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="payments-summary">
        <div className="summary-card">
          <h3>Total Payments</h3>
          <p className="total-amount">
            KSH {payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="summary-card">
          <h3>Number of Transactions</h3>
          <p className="transaction-count">{payments.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Payments;
