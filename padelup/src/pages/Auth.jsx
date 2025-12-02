import { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';
import '../styles/Auth.css';

function Auth({ onNavigate, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  // Estado para mostrar errores
  const [error, setError] = useState('');

  // Estado para mostrar spinner mientras se procesa
  const [loading, setLoading] = useState(false);
  
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
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('');
  };

    // Validar contraseñas coincidan en registro
  const validateForm = () => {
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      console.log('validateForm: passwords mismatch');
      return false;
    }
    if (!isLogin && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      console.log('validateForm: password too short');
      return false;
    }
    console.log('validateForm OK');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit llamado', { isLogin, formData });
    setError('');
    
    // Validar formulario
    if (!validateForm()){
      console.log('handleSubmit: validation failed');
      return;
      }
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN: enviar email y contraseña
        const { data } = await loginUser({
          email: formData.email,
          password: formData.password
        });
        
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Login exitoso:', data);
        
        // Redirigir al dashboard
        onNavigate('dashboard');
      } else {
        // REGISTRO: enviar nombre, email y contraseña
        const { data } = await registerUser({
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        });
        
        console.log('Registro exitoso:', data);
        alert('¡Registro exitoso! Ahora inicia sesión');
        
        // Cambiar a modo login automáticamente
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: '',
          fullName: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.log('Calling API...', isLogin ? '/api/login' : '/api/register');
      // Mostrar error del servidor o error genérico
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
      console.error('Error:', err);
    } finally {
      setLoading(false);
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

          {/* Botón Continuar */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
            onClick={() => console.log('botón Continuar click')} // <-- depuración temporal
          >
            {loading ? (isLogin ? 'Ingresando...' : 'Registrando...') : 'Continuar'}
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
