import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import TenantApp from './TenantApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantApp />
  </StrictMode>,
)
