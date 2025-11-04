import { useState } from 'react';
import './Login.css';

function Login({ cambiarVista }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMensaje('Por favor, completa todos los campos.');
      return;
    }

    setMensaje(`Bienvenido, ${email.split('@')[0]} 👋`);
  };

  return (
    <div className="login-container">
      <h2>Iniciar sesión</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Correo electrónico:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </label>

        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit">Entrar</button>

        <div className="registro-link-bottom">
          <p>¿Aún no estás registrado?{' '}
            <span className="registro-enlace" onClick={() => cambiarVista('registro')}>
              Regístrate ahora
            </span>
          </p>
        </div>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}

export default Login;
