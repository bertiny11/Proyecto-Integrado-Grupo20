import { useState, useEffect } from 'react';
import '../styles/Home.css';
import dropdownArrow from '../assets/dropdown-menu-arrow.svg';

function Home({ onNavigate }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: "Reserva tu Pista",
      subtitle: "La mejor experiencia de pádel en instalaciones de primera clase.",
      theme: "theme-orange"

    },
    {
      id: 1,
      title: "Clases y Formación",
      subtitle: "Mejora tu técnica con nuestros entrenadores profesionales.",
      theme: "theme-blue"

    },
    {
      id: 2,
      title: "Torneos y Eventos",
      subtitle: "Compite y diviértete en nuestros eventos exclusivos.",
      theme: "theme-purple"
    }
  ];

  return (
    <div className={`home-container ${tabs[activeTab].theme}`}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <img src="/padelup_logo2.png" alt="PadelUp Logo" className="logo-img" />
          </div>
          <ul className="nav-menu">
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <span>Aprende</span>
              <img src={dropdownArrow} alt="" className="dropdown-arrow" />
              {showDropdown && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item">Niveles</li>
                  <li className="dropdown-item">Entrenadores</li>
                  <li className="dropdown-item">Horarios</li>
                </ul>
              )}
            </li>
            <li className="nav-item">Reserva</li>
            <li className="nav-item">Partidos</li>
          </ul>
        </div>

        <div className="navbar-right">
          <button 
            className="btn-login"
            onClick={() => onNavigate('auth', 'login')}
          >
            Log in
          </button>
          <button 
            className="btn-signup"
            onClick={() => onNavigate('auth', 'signup')}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Main Hero Title Section */}
      <div className="main-hero-title-section">
        <span className="hero-label">LA PLATAFORMA DE PÁDEL LÍDER</span>
        <h1 className="main-hero-title">
          Donde los jugadores de pádel<br />
          llevan su juego al siguiente nivel
        </h1>
        <p className="main-hero-subtitle">
          La forma más rápida y sencilla de reservar pistas, encontrar compañeros y mejorar tu técnica.<br />
          Encuentra todo lo que necesitas en un solo lugar.
        </p>
        <div className="main-hero-buttons">
          <button className="btn-primary-dark">Empezar ahora →</button>
          <button className="btn-secondary-light">Saber más</button>
        </div>
      </div>

      {/* Hero Section Wrapper */}
      <div className="hero-wrapper">
        <main className="hero-section">
          <div className="hero-background">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
            <div className="gradient-orb orb-4"></div>
            <div className="gradient-orb orb-5"></div>
            <div className="glass-overlay"></div>
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              {tabs[activeTab].title.split(' ').map((word, i) => (
                <span key={i} style={{display: 'block'}}>{word}</span>
              ))}
            </h1>
            <p className="hero-subtitle">
              {tabs[activeTab].subtitle}
            </p>
          </div>

          <div className="hero-footer">
            <div className="tabs-container">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.title}
                </button>
              ))}
            </div>
            
          </div>
        </main>
      </div>

      
    </div>
  );
}

export default Home;

