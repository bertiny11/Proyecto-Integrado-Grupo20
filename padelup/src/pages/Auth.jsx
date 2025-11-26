import { useState, useEffect } from 'react';
import '../styles/Auth.css';

function Auth({ onNavigate, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  // Actualizar modo cuando cambie initialMode
  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  // Deshabilitar scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log('Login:', { email: formData.email, password: formData.password });
      // TODO: Implementar lógica de login
      // onNavigate('dashboard');
    } else {
      console.log('Register:', formData);
      // TODO: Implementar lógica de registro
      // onNavigate('dashboard');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Limpiar formulario al cambiar
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={() => onNavigate('home')}>
        ← Volver al inicio
      </button>
      
      <div className="auth-card">
        <h1 className="auth-title">
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Botón de UCA */}
          <button type="button" className="uca-button">
            <img 
              src="/Logo_UCA.png" 
              alt="Logo UCA" 
              className="uca-logo"
            />
            <span>Continuar con usuario UCA</span>
          </button>

          <div className="divider">
            <span>o</span>
          </div>

          {/* Campos del formulario con transición */}
          <div className={`form-fields ${isLogin ? 'login-mode' : 'register-mode'}`}>
            <div className={`form-group ${!isLogin ? 'visible' : 'hidden'}`}>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nombre completo"
                required={!isLogin}
                disabled={isLogin}
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Correo electrónico o usuario"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Contraseña"
                required
              />
            </div>

            <div className={`form-group ${!isLogin ? 'visible' : 'hidden'}`}>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmar contraseña"
                required={!isLogin}
                disabled={isLogin}
              />
            </div>
          </div>

          <button type="submit" className="submit-button">
            Continuar
          </button>

          <p className="terms-text">
            Al continuar, aceptas nuestros <a href="#">Términos</a> y <a href="#">Política de Privacidad</a>.
          </p>

          <p className="toggle-text">
            {isLogin ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
            <button type="button" onClick={toggleAuthMode} className="toggle-link">
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Auth;
