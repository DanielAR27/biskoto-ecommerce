import api from './axiosConfig';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Llama al endpoint de refresco para renovar las credenciales.
 */
export const refreshToken = async (refreshToken) => {
  // Enviamos el token de refresco al backend
  const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
  return response.data;
};

export const registrar = async (userData) => {
  const response = await api.post('/auth/registrar', userData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const recuperarPassword = async (email) => {
  // Se calcula la URL de retorno dinámicamente (localhost o producción)
  const redirectTo = `${window.location.origin}/actualizar-password`;
  const response = await api.post('/auth/recuperar-password', { email, redirectTo });
  return response.data;
};

export const updatePassword = async (newPassword, token) => {
  // Solo se envía la contraseña, pero adjuntamos el token de recuperación en los headers
  const response = await api.post('/auth/actualizar-password', { password: newPassword }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};