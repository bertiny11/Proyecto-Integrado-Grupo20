import { useState } from 'react';
import { registerUser } from '../services/api'; // Importamos tu servicio de API
import "../styles/Register.css";

const Register = ({ onNavigate }) => {

    // 1. ESTADO: Copiado de RegisterModal (Lógica de datos)
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        udni: '', // Este será el Usuario UCA / Correo / DNI
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // 2. LÓGICA: Manejo de cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error específico al escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // 3. LÓGICA: Validación (Copiado y adaptado de RegisterModal)
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (!formData.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos';
        if (!formData.udni.trim()) newErrors.udni = 'El usuario/correo es requerido';
        
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mínimo 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        return newErrors;
    };

    // 4. LÓGICA: Envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        
        const newErrors = validateForm();
        
        if (Object.keys(newErrors).length === 0) {
            setLoading(true);
            try {
                // Llamada a la API
                const { data } = await registerUser({
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    udni: formData.udni,
                    password: formData.password
                });
                
                console.log('Registro exitoso:', data);
                alert('¡Registro exitoso! Bienvenido.');
                
                // Redirigir al Dashboard usando tu función onNavigate
                onNavigate('dashboard'); 

            } catch (err) {
                setApiError(err.response?.data?.error || 'Error al registrar. Inténtalo de nuevo.');
                console.error('Error registro:', err);
            } finally {
                setLoading(false);
            }
        } else {
            setErrors(newErrors);
        }
    };

    // 5. RENDERIZADO: La estructura visual de Register.jsx + lógica conectada
    return (
        <div className="register-page">
            {/* Botón flotante "Volver al inicio" */}
            <button className="btn-back" onClick={() => onNavigate('home')}>
                ← Volver al inicio
            </button>

            <div className="register-container">
                <h2 className="register-title">Crea tu cuenta</h2>

                {/* Botón de Login con UCA */}
                <button className="btn-uca-login" type="button">
                     {/* <img src="/logo-uca.png" alt="" /> */}
                    🏛️ Continuar con usuario UCA
                </button>

                {/* Separador "o" */}
                <div className="separator">
                    <span>o</span>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    
                    {/* Nombre */}
                    <div className="form-group">
                        <input 
                            type="text" 
                            name="nombre"
                            placeholder="Nombre completo" 
                            value={formData.nombre}
                            onChange={handleChange}
                            // Si hay error, pintamos el borde rojo (puedes definir clase .error en css)
                            style={errors.nombre ? {borderColor: 'red'} : {}}
                        />
                        {errors.nombre && <span style={{color:'red', fontSize:'12px', textAlign:'left', display:'block', marginTop:'5px'}}>{errors.nombre}</span>}
                    </div>

                    {/* Apellidos */}
                    <div className="form-group">
                        <input 
                            type="text" 
                            name="apellidos"
                            placeholder="Apellidos" 
                            value={formData.apellidos}
                            onChange={handleChange}
                            style={errors.apellidos ? {borderColor: 'red'} : {}}
                        />
                        {errors.apellidos && <span style={{color:'red', fontSize:'12px', textAlign:'left', display:'block', marginTop:'5px'}}>{errors.apellidos}</span>}
                    </div>

                    {/* Usuario / Email / DNI */}
                    <div className="form-group">
                        <input 
                            type="text" 
                            name="udni"
                            placeholder="Correo electrónico o usuario" 
                            value={formData.udni}
                            onChange={handleChange}
                            style={errors.udni ? {borderColor: 'red'} : {}}
                        />
                        {errors.udni && <span style={{color:'red', fontSize:'12px', textAlign:'left', display:'block', marginTop:'5px'}}>{errors.udni}</span>}
                    </div>

                    {/* Contraseña */}
                    <div className="form-group">
                        <input 
                            type="password" 
                            name="password"
                            placeholder="Contraseña" 
                            value={formData.password}
                            onChange={handleChange}
                            style={errors.password ? {borderColor: 'red'} : {}}
                        />
                        {errors.password && <span style={{color:'red', fontSize:'12px', textAlign:'left', display:'block', marginTop:'5px'}}>{errors.password}</span>}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="form-group">
                        <input 
                            type="password" 
                            name="confirmPassword"
                            placeholder="Confirmar contraseña" 
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={errors.confirmPassword ? {borderColor: 'red'} : {}}
                        />
                        {errors.confirmPassword && <span style={{color:'red', fontSize:'12px', textAlign:'left', display:'block', marginTop:'5px'}}>{errors.confirmPassword}</span>}
                    </div>
                    
                    {/* Mensaje de error general de la API */}
                    {apiError && <p style={{color: 'red', textAlign:'center', fontSize:'14px'}}>{apiError}</p>}

                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Continuar'}
                    </button>
                </form>

                <p className="legal-text">
                    Al continuar, aceptas nuestros <a href="#">Términos</a> y <a href="#">Política de Privacidad</a>.
                </p>

                <p className="login-link">
                    ¿Ya tienes una cuenta? 
                    <span 
                        onClick={() => onNavigate('auth', 'login')} 
                        className="link-action"
                    >
                        Inicia sesión
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Register;