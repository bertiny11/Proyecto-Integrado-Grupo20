import { useState } from 'react';
import '../styles/Home.css';

function Home({ onNavigate }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <img src="/logo padelup.jpeg" alt="PadelUp Logo" className="logo-img" />
          </div>
          <ul className="nav-menu">
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <span>Aprende</span>
              {showDropdown && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item">Test 1</li>
                  <li className="dropdown-item">Test 2</li>
                  <li className="dropdown-item">Test 3</li>
                  <li className="dropdown-item">Test 4</li>
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
          {/* <button className="btn-pro">Mi Cuenta</button> */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">
            <strong>Reserva, compite y conecta,</strong> a tu manera.
          </h1>
          <p className="hero-description">
            PadelUp es una plataforma donde puedes <span className="highlight">reservar pistas de pádel, medir tu nivel frente a otros jugadores y aprender con tutoriales diseñados</span> para mejorar tu juego. Todo lo que necesitas para disfrutar del pádel en un solo lugar.
          </p>
        </div>
        
      </main>
    </div>
  );
}

export default Home;
