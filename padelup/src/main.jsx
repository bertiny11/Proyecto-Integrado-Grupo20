import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Register from './pages/register.jsx';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Register  />
  </StrictMode>,
)
