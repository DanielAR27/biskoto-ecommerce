import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de respuestas.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detectar si es un error 401 (No autorizado) y si NO es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si el error viene del login o del refresh mismo, no intentamos renovar
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Llamada directa con axios puro para evitar dependencias circulares
        // Se envían las cookies automáticamente con withCredentials
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, { withCredentials: true });

        // Reintentamos la petición original, las cookies actualizadas se enviarán solas
        return api(originalRequest);

      } catch (refreshError) {
        // Si falla la renovación, simplemente rechazamos el error
        // No hacemos window.location.href aquí para evitar bucles infinitos
        console.error('Sesión caducada definitivamente:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;