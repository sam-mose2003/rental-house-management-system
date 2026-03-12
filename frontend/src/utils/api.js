const API_BASE_URL = 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Dashboard APIs
export const getDashboardStats = () => apiRequest('/dashboard-stats');

// Tenant APIs
export const getTenants = () => apiRequest('/tenants');
export const getPendingTenants = () => apiRequest('/pending-tenants');
export const approveTenant = (id) => apiRequest(`/approve-tenant/${id}`, { method: 'POST' });
export const rejectTenant = (id) => apiRequest(`/reject-tenant/${id}`, { method: 'POST' });

// Payment APIs
export const getPayments = () => apiRequest('/payments');
export const addPayment = (paymentData) => apiRequest('/add-payment', {
  method: 'POST',
  body: JSON.stringify(paymentData),
});

// Maintenance APIs
export const getMaintenanceRequests = () => apiRequest('/maintenance-requests');
export const resolveMaintenanceRequest = (id) => apiRequest(`/resolve-maintenance/${id}`, { method: 'POST' });

// House APIs
export const getHouses = () => apiRequest('/houses');
