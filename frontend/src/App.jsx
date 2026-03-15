import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TenantAuth from './components/TenantAuth';
import TenantDashboard from './pages/TenantDashboard';

function AppRouter() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<TenantAuth />} />
          <Route path="/login" element={<TenantAuth />} />
          <Route path="/register" element={<TenantAuth />} />
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;
