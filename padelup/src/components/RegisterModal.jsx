import { useState } from 'react';
// Importar función de registro desde el servicio de API
import { registerUser } from '../services/api';
import '../styles/Modal.css';

// Componente funcional que recibe props:
// onClose: función para cerrar el modal
// onRegisterSuccess: función que se ejecuta tras registro exitoso
function RegisterModal({ onClose }) {
  // Estado para guardar todos los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',      // Nombre completo del usuario
    apellidos: '',  //Apellidos completo de los usuario
    udni: '',         // Email del usuario
    password: '',      // Contraseña
    confirmPassword: '' // Confirmación de contraseña
  });

  // Estado para guardar errores de validación local (frontend)
  const [errors, setErrors] = useState({});
  
  // Estado para mostrar spinner mientras se procesa el registro
  const [loading, setLoading] = useState(false);
  
  // Estado para guardar errores que devuelve la API (backend)
  const [apiError, setApiError] = useState('');

  // Función que actualiza el estado formData cuando el usuario escribe
  // e: evento del input (name = campo, value = valor ingresado)

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Actualizar solo el campo que cambió, manteniendo los otros
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar nombre completo
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    }

    if (!formData.udni.trim()) {
      newErrors.udni = 'El usuario es requerido';
    }
  
    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return newErrors;
  };

  // Función que maneja el envío del formulario de registro
  const handleSubmit = async (e) => {
    // Prevenir recarga de página
    e.preventDefault();
    
    // Limpiar errores previos de la API
    setApiError('');
    
    // Validar formulario (frontend)
    const newErrors = validateForm();
    
    // Si no hay errores, proceder con el registro
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Llamar a la API de registro con los datos
        const { data } = await registerUser({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          udni: formData.udni,
          password: formData.password
        });
        
        // Log para debugging
        console.log('Registro exitoso:', data);
        
        // Mostrar mensaje de éxito
        alert('¡Registro exitoso! Ahora puedes iniciar sesión');
        
        // Ejecutar función callback si está definida
        onRegisterSuccess?.();

        // Cerrar el modal
        onClose();
      } catch (err) {
        // Si hay error del servidor, mostrar mensaje
        setApiError(err.response?.data?.error || 'Error al registrar');
        console.error('Error registro:', err);
      } finally {
        // Ocultar estado de carga
        setLoading(false);
      }
    } else {
      // Si hay errores de validación, mostrarlos
      setErrors(newErrors);
    }
  };

  return (
    // Contenedor del modal (fondo oscuro)
    <div className="modal-overlay" onClick={onClose}>
      {/* Contenedor del contenido del modal */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botón para cerrar modal */}
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Campo de nombre completo */}
          <div className="form-group">
            <label htmlFor="fullName">Nombre completo *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan Pérez"
              // Añadir clase 'error' si hay error en este campo
              className={errors.fullName ? 'error' : ''}
            />
            {/* Mostrar mensaje de error si existe */}
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* Campo Apellidos */}
          <div className="form-group">
            <label htmlFor="apellidos">Apellidos *</label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Pérez García"
              className={errors.apellidos ? 'error' : ''}
            />
            {errors.apellidos && <span className="error-message">{errors.apellidos}</span>}
          </div>

          {/* Campo DNI */}
          <div className="form-group">
            <label htmlFor="udni">DNI *</label>
            <input
              type="text"
              id="udni"
              name="udni"
              value={formData.udni}
              onChange={handleChange}
              placeholder="12345678A"
              className={errors.udni ? 'error' : ''}
            />
            {errors.udni && <span className="error-message">{errors.udni}</span>}
          </div>

          {/* Campo de contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Campo de confirmación de contraseña */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Repetir contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Mostrar error de la API si existe */}
          {apiError && <p style={{ color: 'red', fontSize: '14px' }}>{apiError}</p>}


          <button type="submit" className="btn-submit-form" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
