import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext'; 
import * as authService from '../../api/authService';
import * as profileService from '../../api/profileService';

// 1. Mockeamos los servicios para controlar qué responden
vi.mock('../../api/authService');
vi.mock('../../api/profileService');

// Componente de prueba para consumir el contexto (Consumer)
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      {user ? (
        <>
          <span data-testid="user-email">{user.email}</span>
          <button onClick={logout}>Cerrar Sesión</button>
        </>
      ) : (
        <button onClick={() => login('test@test.com', 'password123')}>Iniciar Sesión</button>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  
  // Limpiar mocks antes de cada test para que no se mezclen datos
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debe mostrar "Cargando..." inicialmente y luego mostrar el contenido si no hay token', async () => {
    // Simulamos que NO hay token en localStorage
    localStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Debería mostrar cargando brevemente (aunque sea muy rápido)
    // Nota: A veces es tan rápido que React lo salta, pero probamos el estado final
    
    // Esperamos a que termine de cargar
    await waitFor(() => {
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });
  });

  it('debe recuperar la sesión automáticamente si existe un token en localStorage', async () => {
    // 1. Configurar escenario: Hay token guardado
    localStorage.getItem.mockReturnValue('fake-token');
    
    // 2. Configurar respuesta simulada de la API de perfil
    const mockUser = { id: 1, email: 'admin@biskoto.com', nombre: 'Admin' };
    profileService.getMiPerfil.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 3. Verificación
    // Debe haber llamado al servicio de perfil
    await waitFor(() => {
      expect(profileService.getMiPerfil).toHaveBeenCalledTimes(1);
    });

    // El usuario debe estar en pantalla
    expect(await screen.findByTestId('user-email')).toHaveTextContent('admin@biskoto.com');
  });

  it('debe hacer login exitosamente y guardar tokens', async () => {
    localStorage.getItem.mockReturnValue(null);
    
    // Mocks de respuesta exitosa
    const loginResponse = { token: 'new-token', refresh_token: 'new-refresh' };
    const userProfile = { id: 2, email: 'cliente@test.com' };
    
    authService.login.mockResolvedValue(loginResponse);
    profileService.getMiPerfil.mockResolvedValue(userProfile);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar a que cargue (estado inicial sin usuario)
    await waitFor(() => screen.getByText('Iniciar Sesión'));

    // Ejecutar acción de Login
    await act(async () => {
      screen.getByText('Iniciar Sesión').click();
    });

    // Verificaciones
    expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password123');
    
    // Importante: verificar que guardó en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh');
    
    // Verificar que actualizó el estado visual
    expect(await screen.findByTestId('user-email')).toHaveTextContent('cliente@test.com');
  });

  it('debe hacer logout correctamente y limpiar localStorage', async () => {
    // Escenario inicial: Usuario logueado
    localStorage.getItem.mockReturnValue('token-existente');
    profileService.getMiPerfil.mockResolvedValue({ email: 'user@logout.com' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Esperar a que aparezca el botón de cerrar sesión
    const logoutBtn = await screen.findByText('Cerrar Sesión');

    // Ejecutar Logout
    act(() => {
      logoutBtn.click();
    });

    // Verificaciones
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    
    // Debe volver a mostrar el botón de login
    expect(await screen.findByText('Iniciar Sesión')).toBeInTheDocument();
  });
});