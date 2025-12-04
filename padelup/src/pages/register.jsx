import React from "react";
import "../styles/Register.css";

const Register = ({ onNavigate }) => {

    return (
        <div className="register-page">
            {/* Botón flotante "Volver al inicio" */}
            <button className="btn-back" onClick={() => onNavigate('home')}>
                ← Volver al inicio
            </button>

            <div className="register-container">
                <h2 className="register-title">Crea tu cuenta</h2>
                
                {/* Separador "o" */}
                <div className="separator">
                    <span>o</span>
                </div>

                <form className="register-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <input type="text" placeholder="Nombre completo" required />
                    </div>
                    <div className="form-group">
                        <input type="text" placeholder="Apellidos" required />
                    </div>
                    {/* Cambiado el placeholder para coincidir con la imagen */}
                    <div className="form-group">
                        <input type="text" placeholder="Correo electrónico o usuario" required />
                    </div>
                    <div className="form-group">
                        <input type="password" placeholder="Contraseña" required />
                    </div>
                    <div className="form-group">
                        <input type="password" placeholder="Confirmar contraseña" required />
                    </div>
                    
                    <button type="submit" className="btn-submit">Continuar</button>
                </form>

                {/* Texto legal */}
                <p className="legal-text">
                    Al continuar, aceptas nuestros <a href="#">Términos</a> y <a href="#">Política de Privacidad</a>.
                </p>

                {/* Link para iniciar sesión */}
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
