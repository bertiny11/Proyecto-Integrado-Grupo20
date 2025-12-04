import axios from 'axios';

// Obtener la URL base de la API desde variables de entorno (.env)
// Si no está definida, usa localhost:5000 por defecto (desarrollo local)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5176';
console.log('API_URL ->', API_URL); // depuración en consola del navegador

// Crear instancia de axios con configuración base
// baseURL: URL del servidor backend
// headers: tipo de contenido que enviamos y recibimos (JSON)
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

// INTERCEPTOR: Se ejecuta ANTES de cada petición HTTP
// Función: Añade el token JWT al header Authorization si existe
// Esto permite que peticiones protegidas (como /api/profile) funcionen
api.interceptors.request.use(config => {
    // Recuperar el token guardado en localStorage (se guardó en login)
    const token = localStorage.getItem('token');
    // Si existe token, lo añade al header con formato "Bearer <token>"
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;// Retorna la configuración actualizada
}, err => Promise.reject(err));

// Función para registrar un nuevo usuario
// Parámetro: { name, email, password }
// Retorna: respuesta del servidor (éxito o error)
export const registerUser = (payload) => api.post('/register', payload);

// Función para iniciar sesión
// Parámetro: { email, password }
// Retorna: token JWT y datos del usuario si es correcto
export const loginUser = (payload) => api.post('/login', payload);

// Función para obtener datos del perfil del usuario autenticado
// Solo funciona si el usuario ha iniciado sesión (requiere token)
// Retorna: datos del usuario logueado
export const getProfile = () => api.get('/api/profile');

export default api;