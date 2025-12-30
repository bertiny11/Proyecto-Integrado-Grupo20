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
      theme: "theme-orange",
      ctaText: "Reservar Ahora",
      features: ["Pistas Indoor", "Iluminación LED", "Parking Gratuito"]
    },
    {
      id: 1,
      title: "Clases y Formación",
      subtitle: "Mejora tu técnica con nuestros entrenadores profesionales.",
      theme: "theme-blue",
      ctaText: "Ver Tutoriales",
      features: ["Todos los Niveles", "Análisis de Video", "Grupos Reducidos"]
    },
    {
      id: 2,
      title: "Torneos y Eventos",
      subtitle: "Compite y diviértete en nuestros eventos exclusivos.",
      theme: "theme-purple",
      ctaText: "Inscribirse",
      features: ["Premios en Metálico", "Welcome Pack", "Ranking Oficial"]
    },
    {
      id: 3,
      title: "test",
      theme: "theme-black",
      features: []
    }
    
  ];

  const handleLogoClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      onNavigate('dashboard');
    }
    // Si no está logueado, ya está en home, no hace nada
  };

  return (
    <div className={`home-container ${tabs[activeTab].theme}`}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <div 
            className="logo" 
            onClick={handleLogoClick} 
            style={{ cursor: 'pointer' }}
          >
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
            Iniciar Sesión
          </button>
          <button 
            className="btn-signup"
            onClick={() => onNavigate('auth', 'signup')}
          >
            Registrarse
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
          <button className="btn-primary-dark" onClick={() => onNavigate('auth', 'signup')}>Empezar ahora →</button>
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
            <div className="hero-text-container" key={activeTab}>
              <h1 className="hero-title">
                {tabs[activeTab].title}
              </h1>
              <p className="hero-subtitle">
                {tabs[activeTab].subtitle}
              </p>
              
              <div className="hero-features">
                {tabs[activeTab].features.map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
              </div>

              <button className="hero-cta-button">
                {tabs[activeTab].ctaText}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="hero-footer">
            <div className="tabs-container">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-indicator"></span>
                  {tab.title}
                </button>
              ))}
            </div>
            
          </div>
        </main>
      </div>

      {/* How it Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">¿Cómo funciona?</h2>
        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <h3 className="feature-title">Reservas Rápidas</h3>
            <p className="feature-description">
              Encuentra y reserva tu pista ideal en segundos. Accede a las mejores instalaciones cerca de ti.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Partidos Nivelados</h3>
            <p className="feature-description">
              Juega con gente de tu mismo nivel. Nuestro sistema te empareja para partidos equilibrados y divertidos.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 className="feature-title">Comunidad Activa</h3>
            <p className="feature-description">
              Conecta con otros jugadores, únete a torneos y comparte tus experiencias con una comunidad apasionada.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="feature-title">Gestión Total</h3>
            <p className="feature-description">
              Organiza tus partidos, clases y estadísticas desde un solo lugar. Disponible 24/7 para ti.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src="/padelup_logo2.png" alt="PadelUp Logo" className="footer-logo-img" />
                <span className="footer-logo-text">PadelUp</span>
              </div>
              <p className="footer-description">
                PadelUp permite a los jugadores transformar su juego, haciendo que la reserva de pistas y la búsqueda de compañeros sea más fácil de compartir, entender y actuar.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.535c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <ul>
                  <li><a href="#">Características</a></li>
                  <li><a href="#">Precios</a></li>
                  <li><a href="#">Integraciones</a></li>
                  <li><a href="#">Novedades</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Recursos</h4>
                <ul>
                  <li><a href="#">Documentación</a></li>
                  <li><a href="#">Tutoriales</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Soporte</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h4>Compañía</h4>
                <ul>
                  <li><a href="#">Sobre nosotros</a></li>
                  <li><a href="#">Empleo</a></li>
                  <li><a href="#">Contacto</a></li>
                  <li><a href="#">Partners</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2025 PadelUp. Todos los derechos reservados.
            </div>
            <div className="footer-legal">
              <a href="#">Política de Privacidad</a>
              <a href="#">Términos de Servicio</a>
              <a href="#">Configuración de Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

