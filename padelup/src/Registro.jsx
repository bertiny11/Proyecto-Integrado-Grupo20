import { useState } from 'react';
import './Registro.css'; // Puedes crear este archivo para estilos personalizados

function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación básica
    if (!nombre || !email || !password || !confirmar) {
      setMensaje('Completa todos los campos.');
      return;
    }

    if (password !== confirmar) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    // Simulación de registro exitoso
    setMensaje(`¡Registro exitoso, ${nombre}! 🎉`);
    // Aquí podrías enviar los datos a una API o guardar en localStorage
  };

  return (
    <div className="registro-container">
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </label>

        <label>
          Correo electrónico:
          <input
            type="email"
            value={holadw}
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

        <label>
          Confirmar contraseña:
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button type="submit">Registrarse</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}
    </div>
  );
}

export default Registro;
