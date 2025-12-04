
import { useState } from 'react'
import Register  from './pages/register'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [authMode, setAuthMode] = useState('login') // 'login' o 'signup'
  const [isTransitioning, setIsTransitioning] = useState(false)

  const navigateTo = (page, mode = 'login') => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(page)
      setAuthMode(mode)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 250) // Transición rápida
  }

  return (
    <div className={`page-wrapper ${isTransitioning ? 'page-fade-out' : 'page-fade-in'}`}>
      {currentPage === 'home' && <Home onNavigate={navigateTo} />}
      {currentPage === 'auth' && <Auth onNavigate={navigateTo} initialMode={authMode} />}
      {currentPage === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
      {currentPage === 'register' && <Register onNavigate={navigateTo} />}
    </div>
  )
}

export default App;
