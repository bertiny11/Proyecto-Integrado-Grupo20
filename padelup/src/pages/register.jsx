import React from "react";
import "../styles/Register.css";

const Register = () => {

    return (
        <div className="register-container">
            <div className="register-card">
                <h2>Crear cuenta</h2>
                <form className="register-form">
                <input type="text" placeholder="Nombre completo" required />
                <input type="email" placeholder="Correo electrónico" required />
                <input type="password" placeholder="Contraseña" required />
                <input type="password" placeholder="Confirmar contraseña" required />
                <button type="submit">Registrarse</button>
                </form>
                <p className="login-link">
                ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
                </p>
            </div>
        </div>
    );
};

export default Register;
