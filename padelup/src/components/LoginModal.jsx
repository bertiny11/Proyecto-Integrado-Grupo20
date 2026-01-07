import { useState } from 'react';

// Importar función de login desde el servicio de API
import { loginUser } from '../services/api';
import '../styles/Modal.css';

// Componente funcional que recibe props:
// onClose: función para cerrar el modal
// onLoginSuccess: función que se ejecuta tras login exitoso
function LoginModal({ onClose, onLoginSuccess }) {

  // Estado para guardar el email ingresado
  const [email, setEmail] = useState('');

  // Estado para guardar la contraseña ingresada
  const [password, setPassword] = useState('');

  // Estado para mostrar/ocultar formulario de recuperación de contraseña
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Estado para guardar mensajes de error (ej: credenciales inválidas)
  const [error, setError] = useState('');

  // Estado para mostrar spinner/deshabilitar botón mientras se procesa login
  const [loading, setLoading] = useState(false);

    // Función que maneja el envío del formulario de login
  const handleSubmit = async (e) => {

    // Prevenir recarga de página
    e.preventDefault();

    // Limpiar errores previos
    setError('');

    // Mostrar estado de carga (desabilita botón)   
    setLoading(true);

    try {
      // Llamar a la API de login con email y contraseña
      // loginUser() retorna { data } que contiene { token, user }
      const { data } = await loginUser({ email, password });

      // Guardar el token en localStorage para usarlo en peticiones futuras
      localStorage.setItem('token', data.token);

      // Guardar datos del usuario (id, email, nombre) en localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Log para debugging
      console.log('Login exitoso:', data);

      // Ejecutar función callback si está definida (notifica al componente padre)
      onLoginSuccess?.(data.user);

      // Cerrar el modal
      onClose();
    } catch (err) {
      // Si hay error, mostrar mensaje del servidor o mensaje genérico
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      console.error('Error login:', err);
    } finally {
      // Ocultar estado de carga (habilita botón nuevamente)
      setLoading(false);
    }
  };

  // Función para manejar olvido de contraseña (simulado)
  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log('Recuperar contraseña para:', email);
    // Aquí irá la lógica de recuperación de contraseña
    alert('Se ha enviado un enlace de recuperación a tu correo electrónico');
    setShowForgotPassword(false);
  };

  return (
    // Contenedor del modal (fondo oscuro)
    <div className="modal-overlay" onClick={onClose}>

      {/* Contenedor del contenido del modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Botón para cerrar modal */}
        <button className="modal-close" onClick={onClose}>×</button>
        
        {/* Mostrar formulario de login O recuperación contraseña según estado */}
        {!showForgotPassword ? (
          <>
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Campo de email */}
              <div className="form-group">
                <label htmlFor="email">Correo electrónico *</label>
                <input
                  type="email"
                  id="email"
                  // Actualizar estado cuando el usuario escribe
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {/* Campo de contraseña */}
              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  type="password"
                  id="password"
                  // Actualizar estado cuando el usuario escribe
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Mostrar mensaje de error si existe */}
              {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

              {/* Botón para ir a recuperación de contraseña */}
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
              
              {/* Botón submit: deshabilitado mientras carga */}
              <button type="submit" className="btn-submit-form" disabled={loading}>
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>
          </>
        ) : (
          // Formulario alternativo: recuperación de contraseña
          <>
            <h2>Recuperar contraseña</h2>
            <p className="forgot-password-text">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleForgotPassword} className="modal-form">
              <div className="form-group">
                <label htmlFor="recovery-email">Correo electrónico *</label>
                <input
                  type="email"
                  id="recovery-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <button type="submit" className="btn-submit-form">
                Enviar enlace de recuperación
              </button>
              
              {/* Botón para volver al login */}
              <button 
                type="button" 
                className="btn-back"
                onClick={() => setShowForgotPassword(false)}
              >
                Volver al inicio de sesión
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginModal;
