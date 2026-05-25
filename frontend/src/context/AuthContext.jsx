import { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../api/authService';
import * as profileService from '../api/profileService';

// Se crea el contexto de autenticación
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carga Inicial de Sesión.
   * Al iniciar la app, verifica si hay token. Si existe, intenta obtener el perfil.
   * Gracias al nuevo interceptor en axiosConfig, si el token expiró, axios intentará
   * renovarlo automáticamente antes de que esta función falle.
   */
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        // Intentamos cargar el perfil directamente. 
        // Si no hay cookie de sesión, fallará silenciosamente.
        const perfil = await profileService.getMiPerfil();
        setUser(perfil);
      } catch (error) {
        setUser(null);
      }
      setLoading(false);
    };

    cargarUsuario();
  }, []);

  /**
   * Login del Sistema.
   * Ahora guarda tanto el access token como el refresh token que devuelve el backend.
   */
  const login = async (email, password) => {
    try {
      await authService.login(email, password);
      
      // Una vez autenticado, descargamos los datos del usuario
      const perfil = await profileService.getMiPerfil();
      setUser(perfil);
      return perfil;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registro de Usuario.
   * (Sin cambios: el registro no inicia sesión automáticamente en este flujo)
   */
  const register = async (userData) => {
    try {
      const data = await authService.registrar(userData);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Actualización de Perfil.
   */
  const updateUserProfile = async (datos) => {
    try {
      const response = await profileService.actualizarPerfil(datos);
      const perfilActualizado = response.perfil || response; 
      setUser(prev => ({ ...prev, ...perfilActualizado }));
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Cierre de Sesión (Logout).
   * Se asegura de destruir ambas llaves de acceso del almacenamiento local.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error("Error al cerrar sesión", e);
    } finally {
      setUser(null);
    }
  };

  const resetPasswordRequest = async (email) => {
    try {
      await authService.recuperarPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (newPassword, token) => {
      try {
        const data = await authService.updatePassword(newPassword, token);
        return data;
      } catch (error) {
        throw error;
      }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      updateUserProfile,
      logout, 
      resetPasswordRequest,
      updatePassword,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};