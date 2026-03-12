import React, { useState, useEffect } from 'react';
import { getTenants, getPendingTenants, approveTenant, rejectTenant } from '../utils/api';
import './Tenants.css';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('approved');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsData, pendingData] = await Promise.all([
          getTenants(),
          getPendingTenants()
        ]);
        setTenants(tenantsData);
        setPendingTenants(pendingData);
      } catch (err) {
        setError('Failed to load tenant data');
        console.error('Tenants error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (tenantId) => {
    try {
      await approveTenant(tenantId);
      // Move tenant from pending to approved
      const tenant = pendingTenants.find(t => t.id === tenantId);
      if (tenant) {
        setTenants([...tenants, { ...tenant, status: 'approved' }]);
        setPendingTenants(pendingTenants.filter(t => t.id !== tenantId));
      }
    } catch (err) {
      setError('Failed to approve tenant');
      console.error('Approve error:', err);
    }
  };

  const handleReject = async (tenantId) => {
    try {
      await rejectTenant(tenantId);
      setPendingTenants(pendingTenants.filter(t => t.id !== tenantId));
    } catch (err) {
      setError('Failed to reject tenant');
      console.error('Reject error:', err);
    }
  };

  const TenantTable = ({ tenantList, showActions = false }) => (
    <div className="tenant-table-container">
      <table className="tenant-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>National ID</th>
            <th>Phone</th>
            <th>Email</th>
            <th>House Number</th>
            <th>Move In Date</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tenantList.length === 0 ? (
            <tr>
              <td colSpan={showActions ? "8" : "7"} className="no-data">
                No tenants found
              </td>
            </tr>
          ) : (
            tenantList.map((tenant) => (
              <tr key={tenant.id}>
                <td>{tenant.id}</td>
                <td className="tenant-name">{tenant.name}</td>
                <td>{tenant.national_id}</td>
                <td>{tenant.phone}</td>
                <td>{tenant.email}</td>
                <td className="house-number">{tenant.house_number}</td>
                <td>{new Date(tenant.move_in_date).toLocaleDateString()}</td>
                {showActions && (
                  <td className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(tenant.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleReject(tenant.id)}
                    >
                      ✗ Reject
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="tenants-loading">
        <div className="spinner"></div>
        <p>Loading tenant data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tenants-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="tenants">
      <div className="tenants-header">
        <h1>Tenant Management</h1>
        <p>Manage tenant registrations and approvals</p>
      </div>

      <div className="tenant-tabs">
        <button
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Tenants ({tenants.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingTenants.length})
        </button>
      </div>

      <div className="tenant-content">
        {activeTab === 'approved' ? (
          <div className="approved-tenants">
            <h2>Approved Tenants</h2>
            <TenantTable tenantList={tenants} />
          </div>
        ) : (
          <div className="pending-tenants">
            <h2>Pending Tenant Approvals</h2>
            <TenantTable tenantList={pendingTenants} showActions={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tenants;
