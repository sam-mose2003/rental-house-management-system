const API_BASE_URL = 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error Response:`, errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Success:`, data);
    return data;
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
export const fetchVacantHouses = () => apiRequest('/houses?vacant=1');
export const addHouse = (houseData) => apiRequest('/houses', {
  method: 'POST',
  body: JSON.stringify(houseData),
});
export const deleteHouse = (houseId) => apiRequest(`/houses/${houseId}`, {
  method: 'DELETE',
});

// Tenant-specific APIs
export const getTenantPayments = (tenantId) => apiRequest(`/tenant-payments/${tenantId}`);
export const getTenantMaintenanceRequests = (tenantId) => apiRequest(`/tenant-maintenance/${tenantId}`);

// Tenant Dashboard APIs
export const registerTenant = (tenantData) => apiRequest('/tenants', {
  method: 'POST',
  body: JSON.stringify(tenantData),
});

export const makeTenantPayment = (paymentData) => apiRequest('/tenant-payment', {
  method: 'POST',
  body: JSON.stringify(paymentData),
});
