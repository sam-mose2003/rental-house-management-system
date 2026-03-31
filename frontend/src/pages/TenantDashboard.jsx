import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitMaintenanceRequest, makeTenantPayment } from '../utils/api';
import './TenantDashboard.css';
import '../components/LoadingSkeleton.css';

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [payments, setPayments] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [balanceInfo, setBalanceInfo] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    const storedTenant = localStorage.getItem('tenantInfo');
    const storedToken = localStorage.getItem('tenantToken');
    
    if (!storedTenant || !storedToken) {
      navigate('/login');
      return;
    }
    
    try {
      const tenant = JSON.parse(storedTenant);
      setTenantInfo(tenant);
      
      // Load tenant's data
      loadTenantData(tenant.id);
    } catch (error) {
      console.error('Error parsing tenant data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const loadTenantData = async (tenantId) => {
    try {
      setLoading(true);
      setMessage(null);
      const token = localStorage.getItem('tenantToken');
      
      const dashboardResponse = await fetch('http://localhost:5000/api/tenant-dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setTenantInfo(dashboardData.tenant);
        setPayments(dashboardData.payments || []);
        setMaintenanceRequests(dashboardData.maintenance_requests || []);
        
        localStorage.setItem('tenantInfo', JSON.stringify(dashboardData.tenant));
        
        if (dashboardData.balanceInfo) {
          setBalanceInfo(dashboardData.balanceInfo);
        }
        
        if (!dashboardData.is_approved) {
          setMessage(dashboardData.message);
          setMessageType('warning');
        } else {
          setMessage('Welcome back! Your dashboard is up to date.');
          setMessageType('success');
          setTimeout(() => setMessage(null), 3000);
        }
      } else {
        const errorData = await dashboardResponse.json();
        setMessage(errorData.error || 'Failed to load dashboard. Please try refreshing the page.');
        setMessageType('error');
      }
      
    } catch (error) {
      console.error('Error loading tenant data:', error);
      setMessage('Unable to connect to the server. Please check your internet connection and try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenantInfo');
    localStorage.removeItem('tenantToken');
    navigate('/login');
  };

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'M-Pesa',
    payment_date: new Date().toISOString().split('T')[0]
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    issue: '',
    priority: 'Normal'
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    national_id: ''
  });

  useEffect(() => {
    if (tenantInfo) {
      setProfileForm({
        name: tenantInfo.name || '',
        email: tenantInfo.email || '',
        phone: tenantInfo.phone || '',
        national_id: tenantInfo.national_id || ''
      });
    }
  }, [tenantInfo]);

  // Validation functions
  const validateNationalId = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 13;
  };

  const validatePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length <= 10;
  };

  const handleProfileSave = async () => {
    setLoading(true);
    setMessage(null);

    // Validate inputs
    if (!validateNationalId(profileForm.national_id)) {
      setMessage('National ID must be between 8 and 13 digits.');
      setMessageType('error');
      return;
    }

    if (!validatePhoneNumber(profileForm.phone)) {
      setMessage('Phone number must not exceed 10 digits.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const updatedTenant = await response.json();
        setTenantInfo(updatedTenant);
        localStorage.setItem('tenantInfo', JSON.stringify(updatedTenant));
        setMessage('Profile updated successfully!');
        setMessageType('success');
        setEditingProfile(false);
      } else {
        setMessage('Failed to update profile. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'm-pesa': return '📱';
      case 'cash': return '💵';
      case 'bank transfer': return '🏦';
      case 'check': return '📄';
      case 'mobile money': return '📱';
      default: return '💳';
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (tenantInfo.status !== 'approved') {
      setMessage('Please wait for approval before making payments.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Validate form
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setMessage('Please enter a valid payment amount.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!paymentForm.payment_method) {
      setMessage('Please select a payment method.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!paymentForm.payment_date) {
      setMessage('Please select a payment date.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      await makeTenantPayment({
        tenant_id: tenantInfo.id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date
      });

      setMessage('Payment submitted successfully!');
      setMessageType('success');
      setPaymentForm({
        amount: '',
        payment_method: 'M-Pesa',
        payment_date: new Date().toISOString().split('T')[0]
      });
      
      try {
        const paymentsResponse = await fetch(`/api/tenant-payments/${tenantInfo.id}`);
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          setPayments(paymentsData || []);
        }
      } catch (refreshError) {
        console.error('Error refreshing payments:', refreshError);
      }
      
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Payment submission error:', error);
      setMessage(error.message || 'Failed to submit payment. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (tenantInfo.status !== 'approved') {
      setMessage('Please wait for approval before submitting maintenance requests.');
      setMessageType('warning');
      setLoading(false);
      return;
    }

    if (!maintenanceForm.issue.trim()) {
      setMessage('Please describe the maintenance issue before submitting.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (maintenanceForm.issue.trim().length < 10) {
      setMessage('Please provide more details about the maintenance issue (at least 10 characters).');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      await submitMaintenanceRequest({
        tenant_id: tenantInfo.id,
        tenant: tenantInfo.name,
        house_number: tenantInfo.house_number,
        issue: maintenanceForm.issue,
        priority: maintenanceForm.priority
      });

      setMessage('✅ Maintenance request submitted successfully! We\'ll get back to you soon.');
      setMessageType('success');
      setMaintenanceForm({
        issue: '',
        priority: 'Normal'
      });
      
      try {
        const maintenanceResponse = await fetch(`/api/tenant-maintenance/${tenantInfo.id}`);
        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json();
          setMaintenanceRequests(maintenanceData || []);
        }
      } catch (refreshError) {
        console.error('Error refreshing maintenance requests:', refreshError);
      }

      setTimeout(() => setMessage(null), 5000);
      
    } catch (error) {
      console.error('Maintenance request error:', error);
      
      let errorMessage = 'Failed to submit maintenance request. Please try again.';
      
      if (error.message.includes('Unable to connect')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You don\'t have permission to submit maintenance requests.';
      } else if (error.message.includes('server')) {
        errorMessage = 'Server is temporarily unavailable. Please try again in a few minutes.';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!tenantInfo) {
    return <div className="loading">Loading...</div>;
  }

  if (loading && !tenantInfo) {
    return (
      <div className="tenant-dashboard">
        <div className="loading-container">
          <div className="loading-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-info">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line subtitle"></div>
              </div>
            </div>
            <div className="skeleton-cards">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          </div>
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tenant-dashboard">
      <div className="tenant-header">
        <div className="tenant-info">
          <h1>🏠 Tenant Dashboard</h1>
          <div className="tenant-details">
            <p><strong>Name:</strong> {tenantInfo.name}</p>
            <p><strong>House:</strong> {tenantInfo.house_number}</p>
            <p><strong>Status:</strong> <span className="status-text" style={{ color: getStatusColor(tenantInfo.status) }}>
              {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
            </span></p>
          </div>
        </div>
        <div className="status-badge" style={{ backgroundColor: getStatusColor(tenantInfo.status), color: 'white' }}>
          {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
        </div>
      </div>

      {tenantInfo.status !== 'approved' && (
        <div className="approval-warning">
          <div className="warning-content">
            <h3>⏳ Account Pending Approval</h3>
            <p>Your tenant registration is currently pending approval by the administrator. You can view your information but cannot make payments or submit maintenance requests until approved.</p>
            <div className="restrictions-list">
              <h4>Restricted Features:</h4>
              <ul>
                <li>❌ Make payments</li>
                <li>❌ Submit maintenance requests</li>
                <li>❌ Access full dashboard features</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'warning' ? 'alert-warning' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="tenant-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Personal Details
        </button>
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
          📊 History
        </button>
      </div>

      <div className="tenant-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Application Overview</h2>
            <div className="status-card">
              <div className="status-item">
                <label>Application Status:</label>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(tenantInfo.status), color: 'white' }}>
                  {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
                </span>
              </div>
              <div className="status-item">
                <label>House Assignment:</label>
                <span>{tenantInfo.house_number || 'Not assigned yet'}</span>
              </div>
              <div className="status-item">
                <label>Move-in Date:</label>
                <span>{tenantInfo.move_in_date ? new Date(tenantInfo.move_in_date).toLocaleDateString() : 'Not set'}</span>
              </div>
              {balanceInfo && (
                <>
                  <div className="status-item">
                    <label>House Type:</label>
                    <span>{balanceInfo.house_type}</span>
                  </div>
                  <div className="status-item">
                    <label>Monthly Rent:</label>
                    <span className="house-price">KSH {balanceInfo.house_price.toLocaleString()}</span>
                  </div>
                  <div className="status-item">
                    <label>Total Paid:</label>
                    <span className="total-paid">KSH {balanceInfo.total_paid.toLocaleString()}</span>
                  </div>
                  <div className="status-item">
                    <label>Remaining Balance:</label>
                    <span className={`balance ${balanceInfo.balance > 0 ? 'balance-due' : 'balance-paid'}`}>
                      KSH {Math.abs(balanceInfo.balance).toLocaleString()}
                      {balanceInfo.balance > 0 ? ' (Due)' : ' (Paid)'}
                    </span>
                  </div>
                  <div className="status-item">
                    <label>Payment Status:</label>
                    <span className={`payment-status ${balanceInfo.payment_status.toLowerCase()}`}>
                      {balanceInfo.payment_status}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button onClick={() => setActiveTab('profile')} className="action-card">
                  👤 Edit Personal Details
                </button>
                <button onClick={() => setActiveTab('maintenance')} className="action-card">
                  🔧 Request Maintenance
                </button>
                <button onClick={() => setActiveTab('payments')} className="action-card">
                  💰 Make Payment
                </button>
                <button onClick={() => setActiveTab('history')} className="action-card">
                  📊 View History
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Personal Details</h2>
            {editingProfile ? (
              <div className="profile-edit-form">
                <h3>Edit Profile Information</h3>
                <div className="form-row">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Email Address:</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Phone Number:</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setProfileForm({...profileForm, phone: digits});
                    }}
                    placeholder="Enter phone number (max 10 digits)"
                    required
                  />
                  <small className="form-hint">Maximum 10 digits</small>
                </div>
                <div className="form-row">
                  <label>National ID:</label>
                  <input
                    type="text"
                    value={profileForm.national_id}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setProfileForm({...profileForm, national_id: digits});
                    }}
                    placeholder="Enter national ID (8-13 digits)"
                    required
                  />
                  <small className="form-hint">Must be between 8 and 13 digits</small>
                </div>
                <div className="profile-edit-actions">
                  <button onClick={handleProfileSave} disabled={loading} className="save-btn">
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button onClick={() => setEditingProfile(false)} className="cancel-btn">
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-view">
                <div className="profile-info">
                  <div className="info-group">
                    <h3>Basic Information</h3>
                    <div className="info-item">
                      <label>Full Name:</label>
                      <span>{tenantInfo.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email Address:</label>
                      <span>{tenantInfo.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone Number:</label>
                      <span>{tenantInfo.phone}</span>
                    </div>
                    <div className="info-item">
                      <label>National ID:</label>
                      <span>{tenantInfo.national_id}</span>
                    </div>
                  </div>
                  
                  <div className="info-group">
                    <h3>Housing Information</h3>
                    <div className="info-item">
                      <label>House Number:</label>
                      <span>{tenantInfo.house_number || 'Not assigned'}</span>
                    </div>
                    <div className="info-item">
                      <label>Move-in Date:</label>
                      <span>{tenantInfo.move_in_date ? new Date(tenantInfo.move_in_date).toLocaleDateString() : 'Not set'}</span>
                    </div>
                    <div className="info-item">
                      <label>Application Status:</label>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(tenantInfo.status), color: 'white' }}>
                        {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <button onClick={() => setEditingProfile(true)} className="edit-profile-btn">
                    ✏️ Edit Personal Details
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payment-section">
            <h2>Make a Payment</h2>
            {tenantInfo.status !== 'approved' ? (
              <div className="approval-notice">
                <div className="approval-message">
                  <h3>⏳ Awaiting Approval</h3>
                  <p>Your account is currently pending approval. You can make payments once your account is approved.</p>
                  <div className="status-info">
                    <strong>Current Status:</strong> 
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(tenantInfo.status), color: 'white' }}>
                      {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-group">
                  <label htmlFor="amount">Amount (KSH)</label>
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
                    <option value="M-Pesa">M-Pesa 📱</option>
                    <option value="Cash">Cash 💵</option>
                    <option value="Bank Transfer">Bank Transfer 🏦</option>
                    <option value="Check">Check 📄</option>
                    <option value="Mobile Money">Mobile Money 📱</option>
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
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="maintenance-section">
            <h2>Submit Maintenance Request</h2>
            {tenantInfo.status !== 'approved' ? (
              <div className="approval-notice">
                <div className="approval-message">
                  <h3>⏳ Awaiting Approval</h3>
                  <p>Your account is currently pending approval. You can submit maintenance requests once your account is approved.</p>
                  <div className="status-info">
                    <strong>Current Status:</strong> 
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(tenantInfo.status), color: 'white' }}>
                      {tenantInfo.status ? tenantInfo.status.charAt(0).toUpperCase() + tenantInfo.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
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
                  payments.map((payment, index) => (
                    <div key={index} className="history-item">
                      <div className="history-info">
                        <strong>KSH {payment.amount?.toLocaleString() || '0'}</strong>
                        <span className="history-date">
                          {payment.date || 'Unknown date'}
                        </span>
                      </div>
                      <span className="payment-method">
                        {getPaymentMethodIcon(payment.method)} {payment.method || 'Unknown'}
                      </span>
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
                  maintenanceRequests.map((request, index) => (
                    <div key={index} className="history-item">
                      <div className="history-info">
                        <p>{request.issue || 'No description'}</p>
                        <span className="history-date">
                          {request.date ? new Date(request.date).toLocaleDateString() : 'Submitted recently'}
                        </span>
                      </div>
                      <span className={`status-badge ${request.status?.toLowerCase()}`}>
                        {request.status || 'Unknown'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="logout-section">
        <button onClick={handleLogout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default TenantDashboard;
