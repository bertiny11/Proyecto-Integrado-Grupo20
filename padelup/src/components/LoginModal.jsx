import { useState } from 'react';
import '../styles/Modal.css';

function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', { email, password });
    // Aquí irá la lógica de autenticación
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    console.log('Recuperar contraseña para:', email);
    // Aquí irá la lógica de recuperación de contraseña
    alert('Se ha enviado un enlace de recuperación a tu correo electrónico');
    setShowForgotPassword(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {!showForgotPassword ? (
          <>
            <h2>Iniciar sesión</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="email">Correo electrónico *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>

              <button type="submit" className="btn-submit-form">
                Iniciar sesión
              </button>
            </form>
          </>
        ) : (
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
