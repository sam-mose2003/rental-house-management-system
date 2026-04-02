// API configuration - works in both development and production
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:5000'
  : 'https://your-render-backend-url.onrender.com';  // Replace with your actual Render URL

export async function fetchVacantHouses() {
  const res = await fetch(`${API_BASE_URL}/api/houses?vacant=1`);
  if (!res.ok) {
    throw new Error('Failed to load houses');
  }
  return await res.json();
}

export async function registerTenant(payload) {
  const res = await fetch(`${API_BASE_URL}/api/tenants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data.tenant;
}

