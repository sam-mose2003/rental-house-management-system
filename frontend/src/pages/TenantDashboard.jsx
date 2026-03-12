import React, { useState, useEffect } from 'react';
import { makeTenantPayment, submitMaintenanceRequest, getTenantPayments, getTenantMaintenanceRequests } from '../utils/api';
import './TenantDashboard.css';

const TenantDashboard = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Mock tenant data - in real app, this would come from auth/session
  const tenantInfo = {
    id: 1,
    name: 'John Doe',
    house_number: 'A101',
    email: 'john@example.com',
    phone: '0712345678'
  };

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0]
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    issue: '',
    priority: 'Normal'
  });

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const [paymentsData, maintenanceData] = await Promise.all([
        getTenantPayments(tenantInfo.id),
        getTenantMaintenanceRequests(tenantInfo.id)
      ]);
      setPayments(paymentsData);
      setMaintenanceRequests(maintenanceData);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await makeTenantPayment({
        ...paymentForm,
        tenant_id: tenantInfo.id
      });
      
      setMessage('Payment submitted successfully!');
      setMessageType('success');
      setPaymentForm({
        amount: '',
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh payments list
      const updatedPayments = await getTenantPayments(tenantInfo.id);
      setPayments(updatedPayments);
    } catch (error) {
      setMessage('Failed to submit payment. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await submitMaintenanceRequest({
        ...maintenanceForm,
        tenant: tenantInfo.name,
        house_number: tenantInfo.house_number,
        tenant_id: tenantInfo.id
      });
      
      setMessage('Maintenance request submitted successfully!');
      setMessageType('success');
      setMaintenanceForm({
        issue: '',
        priority: 'Normal'
      });
      
      // Refresh maintenance requests
      const updatedRequests = await getTenantMaintenanceRequests(tenantInfo.id);
      setMaintenanceRequests(updatedRequests);
    } catch (error) {
      setMessage('Failed to submit maintenance request. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tenant-dashboard">
      <div className="tenant-header">
        <div className="tenant-info">
          <h1>Tenant Dashboard</h1>
          <div className="tenant-details">
            <p><strong>Name:</strong> {tenantInfo.name}</p>
            <p><strong>House:</strong> {tenantInfo.house_number}</p>
            <p><strong>Email:</strong> {tenantInfo.email}</p>
            <p><strong>Phone:</strong> {tenantInfo.phone}</p>
          </div>
        </div>
        <div className="status-badge pending">
          Pending Approval
        </div>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="tenant-tabs">
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💰 Make Payment
        </button>
        <button
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          🔧 Maintenance Request
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 My History
        </button>
      </div>

      <div className="tenant-content">
        {activeTab === 'payments' && (
          <div className="payment-section">
            <h2>Make a Payment</h2>
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment_method">Payment Method</label>
                <select
                  id="payment_method"
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="payment_date">Payment Date</label>
                <input
                  type="date"
                  id="payment_date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : 'Submit Payment'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-section">
            <h2>Submit Maintenance Request</h2>
            <form onSubmit={handleMaintenanceSubmit} className="maintenance-form">
              <div className="form-group">
                <label htmlFor="issue">Issue Description</label>
                <textarea
                  id="issue"
                  value={maintenanceForm.issue}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, issue: e.target.value})}
                  rows="4"
                  placeholder="Please describe the maintenance issue..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, priority: e.target.value})}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <div className="history-subsection">
              <h3>Payment History</h3>
              <div className="history-list">
                {payments.length === 0 ? (
                  <p>No payment records found.</p>
                ) : (
                  payments.map(payment => (
                    <div key={payment.id} className="history-item">
                      <div className="history-info">
                        <strong>${payment.amount}</strong>
                        <span className="history-date">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="payment-method">{payment.payment_method}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="history-subsection">
              <h3>Maintenance Requests</h3>
              <div className="history-list">
                {maintenanceRequests.length === 0 ? (
                  <p>No maintenance requests found.</p>
                ) : (
                  maintenanceRequests.map(request => (
                    <div key={request.id} className="history-item">
                      <div className="history-info">
                        <p>{request.issue}</p>
                        <span className="history-date">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
