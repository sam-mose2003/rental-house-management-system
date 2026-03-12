const API_BASE = 'http://127.0.0.1:5000';

export async function fetchVacantHouses() {
  const res = await fetch(`${API_BASE}/api/houses?vacant=1`);
  if (!res.ok) {
    throw new Error('Failed to load houses');
  }
  return await res.json();
}

export async function registerTenant(payload) {
  const res = await fetch(`${API_BASE}/api/tenants`, {
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

