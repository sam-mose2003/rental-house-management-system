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

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        
        switch (response.status) {
          case 400:
            errorMessage = 'Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Please log in to continue.';
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested information was not found.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = errorMessage || 'Something went wrong. Please try again.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        continue;
      }
      
      let finalErrorMessage = error.message || 'Network error. Please check your connection.';
      
      if (error.message.includes('Failed to fetch')) {
        finalErrorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('NetworkError')) {
        finalErrorMessage = 'Network connection lost. Please check your internet and try again.';
      }
      
      throw new Error(finalErrorMessage);
    }
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

export const submitMaintenanceRequest = (maintenanceData) => apiRequest('/maintenance-request', {
  method: 'POST',
  body: JSON.stringify(maintenanceData),
});
