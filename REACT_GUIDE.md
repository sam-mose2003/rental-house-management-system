# React Guide for RHMS Project

## Table of Contents
1. [React Basics](#1-react-basics)
2. [React Hooks](#2-react-hooks)
3. [React Router](#3-react-router)
4. [Forms & Events](#4-forms--events)
5. [Conditional Rendering](#5-conditional-rendering)
6. [Lists & Mapping](#6-lists--mapping)
7. [Tab System](#7-tab-system)
8. [API Communication](#8-api-communication)
9. [Authentication Flow](#9-authentication-flow)

---

## 1. React Basics

### Components
React apps are built using **components** - reusable pieces of UI.

**Types of Components:**
- `App.jsx` - Main router component
- `TenantAuth.jsx` - Login/Registration form
- `TenantDashboard.jsx` - Tenant dashboard
- `TenantLogin.jsx` - Login page

### JSX (JavaScript XML)
Allows writing HTML-like code inside JavaScript:

```jsx
return (
  <div className="tenant-auth-container">
    <h1>HMS</h1>
    <form>...</form>
  </div>
);
```

---

## 2. React Hooks

Hooks are special functions that let you use React features.

### useState - Managing Data
Stores data that changes over time. When state changes, React automatically updates the UI.

```jsx
// From TenantAuth.jsx
const [isLogin, setIsLogin] = useState(false);      // Toggle login/register
const [message, setMessage] = useState(null);       // Success/error messages
const [loading, setLoading] = useState(false);      // Form submission state
const [houses, setHouses] = useState([]);           // Houses from API
```

**How it works:**
1. `useState(initialValue)` returns: `[currentValue, updateFunction]`
2. Use the value: `{message}`
3. Update it: `setMessage('Hello')`
4. React re-renders automatically

### useEffect - Side Effects
Runs code when component loads or dependencies change.

```jsx
// Run once when component mounts
useEffect(() => {
  loadHouses();
}, []);

// Run when 'navigate' changes
useEffect(() => {
  const storedTenant = localStorage.getItem('tenantInfo');
  if (!storedTenant) {
    navigate('/login');
    return;
  }
}, [navigate]);
```

### useNavigate - Page Navigation
Redirect users programmatically:

```jsx
const navigate = useNavigate();

// Redirect after successful login
navigate('/dashboard');
```

---

## 3. React Router

In `App.jsx`, define application routes:

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TenantAuth />} />
        <Route path="/login" element={<TenantAuth />} />
        <Route path="/register" element={<TenantAuth />} />
        <Route path="/dashboard" element={<TenantDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
```

---

## 4. Forms & Events

### Controlled Inputs
React manages form input values:

```jsx
const handleRegChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'national_id') {
    const digits = value.replace(/\D/g, '');
    setRegForm(prev => ({ ...prev, [name]: digits }));
  } else {
    setRegForm(prev => ({ ...prev, [name]: value }));
  }
};

// Input element
<input
  type="text"
  name="national_id"
  value={regForm.national_id}
  onChange={handleRegChange}
/>
```

### Form Submission

```jsx
const handleRegister = async (e) => {
  e.preventDefault();  // Stop page reload
  setLoading(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setMessage('Registration successful!');
      setMessageType('success');
    } else {
      setMessage(data.error || 'Registration failed');
      setMessageType('error');
    }
  } catch (error) {
    setMessage('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

---

## 5. Conditional Rendering

Show different UI based on conditions:

```jsx
// Toggle between forms
{!isLogin ? (
  <form onSubmit={handleRegister}>...</form>
) : (
  <form onSubmit={handleLogin}>...</form>
)}

// Show message only if exists
{message && (
  <div className={`message ${messageType}`}>
    {message}
  </div>
)}

// Different status colors
<span style={{ color: getStatusColor(tenantInfo.status) }}>
  {tenantInfo.status}
</span>
```

---

## 6. Lists & Mapping

Display lists using `.map()`:

```jsx
// House dropdown options
<select name="house_number">
  <option value="">Select a house</option>
  {houses.map(house => (
    <option key={house.id} value={house.house_number}>
      {house.house_number}
    </option>
  ))}
</select>

// Payment history
{payments.map((payment, index) => (
  <div key={index} className="history-item">
    <strong>KSH {payment.amount?.toLocaleString()}</strong>
    <span>{payment.date}</span>
  </div>
))}
```

**Important:** Always use a unique `key` prop when mapping arrays.

---

## 7. Tab System

Dashboard tab navigation:

```jsx
const [activeTab, setActiveTab] = useState('overview');

// Tab buttons
<div className="tenant-tabs">
  <button 
    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
    onClick={() => setActiveTab('overview')}
  >
    Overview
  </button>
  <button 
    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
    onClick={() => setActiveTab('profile')}
  >
    Profile
  </button>
</div>

// Show content based on active tab
<div className="tenant-content">
  {activeTab === 'overview' && <div>Overview Content</div>}
  {activeTab === 'profile' && <div>Profile Content</div>}
</div>
```

---

## 8. API Communication

### GET Request (Fetch Data)
```jsx
const response = await fetch('http://localhost:5000/api/houses');
const data = await response.json();
setHouses(data);
```

### POST Request (Send Data)
```jsx
const response = await fetch('http://localhost:5000/api/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

### With Authentication
```jsx
const response = await fetch('http://localhost:5000/api/tenant-dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 9. Authentication Flow

### Login Process
```jsx
const handleLogin = async (e) => {
  e.preventDefault();
  
  const response = await fetch(`${API_BASE_URL}/api/tenant-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: loginForm.email,
      password: loginForm.national_id
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    
    // Store in localStorage
    localStorage.setItem('tenantInfo', JSON.stringify(data.tenant));
    localStorage.setItem('tenantToken', data.token);
    
    // Redirect to dashboard
    navigate('/dashboard');
  }
};
```

### Protected Route Check
```jsx
useEffect(() => {
  const storedTenant = localStorage.getItem('tenantInfo');
  const storedToken = localStorage.getItem('tenantToken');
  
  if (!storedTenant || !storedToken) {
    navigate('/login');
    return;
  }
  
  // Load user data
  loadTenantData(tenant.id);
}, [navigate]);
```

### Logout
```jsx
const handleLogout = () => {
  localStorage.removeItem('tenantInfo');
  localStorage.removeItem('tenantToken');
  navigate('/login');
};
```

---

## Quick Reference

### Common Patterns

```jsx
// State declaration
const [count, setCount] = useState(0);

// Event handler
const handleClick = () => {
  setCount(count + 1);
};

// Conditional class
className={`btn ${isActive ? 'active' : ''}`}

// Prevent form submit reload
e.preventDefault()

// Async/await pattern
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error(error);
  }
};
```

---

## File Summary

| File | Purpose | Key Concepts |
|------|---------|--------------|
| `main.jsx` | Entry point | `createRoot`, `StrictMode` |
| `App.jsx` | Router setup | `BrowserRouter`, `Routes` |
| `TenantAuth.jsx` | Login/Register | `useState`, `useEffect`, forms |
| `TenantDashboard.jsx` | Dashboard | Tabs, API, conditional UI |
| `TenantLogin.jsx` | Login page | Navigation, localStorage |

---

## Learning Path

1. Start with `main.jsx` - understand how React mounts
2. Study `App.jsx` - learn routing
3. Read `TenantAuth.jsx` - see forms, state, and API calls
4. Explore `TenantDashboard.jsx` - advanced patterns

**Practice Exercises:**
- Add a new input field to the registration form
- Create a new tab in the dashboard
- Add form validation for a new field
- Fetch and display new data from the API
