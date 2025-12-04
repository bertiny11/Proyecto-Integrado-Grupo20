import { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';
import '../styles/Auth.css';

function Auth({ onNavigate }) {
  // Estado para alternar entre Login (true) y Registro (false)
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Unificamos el estado: 'udni' será el usuario en Login y en Registro
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    udni: '', // Este campo actúa como Usuario
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar errores al escribir
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Validación EXCLUSIVA para el registro
  const validateRegister = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre requerido';
    if (!formData.apellidos.trim()) newErrors.apellidos = 'Apellidos requeridos';
    if (!formData.udni.trim()) newErrors.udni = 'Usuario requerido';
    if (!formData.password) newErrors.password = 'Contraseña requerida';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setErrors({});

    // ---------------- LÓGICA DE LOGIN ----------------
    if (isLogin) {
        // En Login solo validamos que haya algo escrito
        if (!formData.udni || !formData.password) {
            setApiError('Ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        try {
            // Enviamos solo lo que pide el Login
            const { data } = await loginUser({
                udni: formData.udni, // Mapeamos udni a username
                password: formData.password
            });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            onNavigate('dashboard');

        } catch (err) {
            console.error(err);
            setApiError(err.response?.data?.error || 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }

    // ---------------- LÓGICA DE REGISTRO ----------------
    } else {
        const validationErrors = validateRegister();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            // Enviamos el objeto completo para registro
            const { data } = await registerUser({
                nombre: formData.nombre,
                apellidos: formData.apellidos,
                udni: formData.udni,
                password: formData.password
            });
            
            alert('¡Registro exitoso!');
            // Cambiamos a login automáticamente
            toggleAuthMode();
            
        } catch (err) {
            console.error(err);
            setApiError(err.response?.data?.error || 'Error al registrar');
        } finally {
            setLoading(false);
        }
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setApiError('');
    setErrors({});
  };

  return (
    <div className="auth-container">
      <button className="back-button" onClick={() => onNavigate('home')}>← Volver</button>
      
      <div className="auth-card">
        <h1 className="auth-title">
          {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h1>

        <form onSubmit={handleSubmit} className="auth-form">
          {apiError && <div className="error-message" style={{color: 'red', marginBottom: '10px', textAlign: 'center'}}>{apiError}</div>}

          {/* --- CAMPOS EXCLUSIVOS DE REGISTRO (ARRIBA) --- */}
          {/* Usamos renderizado condicional: Si es Login, esto NO existe en el DOM */}
          {!isLogin && (
            <>
              <div className="form-group">
                <input
                  type="text" name="nombre" placeholder="Nombre completo"
                  value={formData.nombre} onChange={handleChange}
                />
                {errors.nombre && <span style={{color:'red', fontSize:'12px'}}>{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <input
                  type="text" name="apellidos" placeholder="Apellidos"
                  value={formData.apellidos} onChange={handleChange}
                />
                {errors.apellidos && <span style={{color:'red', fontSize:'12px'}}>{errors.apellidos}</span>}
              </div>
            </>
          )}

          {/* --- CAMPOS COMUNES (USUARIO Y PASSWORD) --- */}
          <div className="form-group">
            <input
              type="text" 
              name="udni" 
              placeholder="Usuario" // Solo dice Usuario
              value={formData.udni} 
              onChange={handleChange}
              required
            />
             {errors.udni && <span style={{color:'red', fontSize:'12px'}}>{errors.udni}</span>}
          </div>

          <div className="form-group">
            <input
              type="password" name="password" placeholder="Contraseña"
              value={formData.password} onChange={handleChange}
              required
            />
            {errors.password && <span style={{color:'red', fontSize:'12px'}}>{errors.password}</span>}
          </div>

          {/* --- CAMPO EXCLUSIVO DE REGISTRO (ABAJO) --- */}
          {!isLogin && (
            <div className="form-group">
              <input
                type="password" name="confirmPassword" placeholder="Confirmar contraseña"
                value={formData.confirmPassword} onChange={handleChange}
              />
              {errors.confirmPassword && <span style={{color:'red', fontSize:'12px'}}>{errors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>

          <p className="toggle-text">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button type="button" onClick={toggleAuthMode} className="toggle-link">
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Auth;