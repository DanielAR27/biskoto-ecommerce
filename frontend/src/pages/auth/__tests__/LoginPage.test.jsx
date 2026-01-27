import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../LoginPage';

// --- CONFIGURACIÓN DE MOCKS ---

// Se definen mocks globales para poder espiarlos y resetearlos
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

// Variables mutables para controlar el estado del hook useAuth dinámicamente
let mockUser = null;
let mockLoading = false;

// Mock de AuthContext usando las variables mutables
// Esto permite cambiar 'mockUser' en un test y que el componente reaccione
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: mockUser,
    loading: mockLoading
  })
}));

// Mock de react-router-dom interceptando useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mocks de componentes visuales para aislar la lógica
vi.mock('../../../components/IconBackground', () => ({
  default: ({ children }) => <div data-testid="icon-background">{children}</div>
}));

vi.mock('../../../components/ThemeToggleBtn', () => ({
  default: () => <button>Toggle Theme</button>
}));

describe('LoginPage Component', () => {
  
  // Se ejecuta antes de cada test individual para asegurar un estado limpio
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
    
    // ESTADO CRÍTICO POR DEFECTO:
    // Se asegura que no haya usuario ni carga al iniciar,
    // evitando redirecciones automáticas indeseadas por el useEffect.
    mockUser = null;
    mockLoading = false;
  });

  // Función auxiliar para renderizar el componente dentro del contexto de Router
  const renderLogin = (initialEntries = ['/login']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<h1>Home Page</h1>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renderiza el formulario de inicio de sesión correctamente', () => {
    // Se renderiza la página
    renderLogin();

    // Se verifica la presencia de los elementos clave de la interfaz
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ejemplo@correo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  it('permite escribir en los campos y alternar la visibilidad de la contraseña', () => {
    renderLogin();

    const emailInput = screen.getByPlaceholderText('ejemplo@correo.com');
    const passwordInput = screen.getByPlaceholderText('********');
    
    // Se simula la interacción del usuario escribiendo en los inputs
    fireEvent.change(emailInput, { target: { value: 'test@biskoto.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    // Se verifica que los inputs reflejen el valor escrito
    expect(emailInput.value).toBe('test@biskoto.com');
    expect(passwordInput.value).toBe('secret123');

    // Se verifica la funcionalidad del botón de mostrar/ocultar contraseña
    // Inicialmente debe ser tipo password (oculto)
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Se hace clic en el botón de alternar (ubicado junto al input)
    const toggleBtn = passwordInput.nextElementSibling;
    fireEvent.click(toggleBtn);

    // Ahora debe ser tipo text (visible)
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('llama a la función login y redirige a /home en caso de éxito', async () => {
    // Se configura el mock para simular una respuesta exitosa del backend
    mockLogin.mockResolvedValue({});

    renderLogin();

    // Se llenan los campos del formulario
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'cliente@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('********'), { target: { value: '123456' } });

    // Se simula el envío del formulario esperando a que las promesas se resuelvan
    const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Se verifica que la función login del contexto fue llamada con los datos correctos
    expect(mockLogin).toHaveBeenCalledWith('cliente@test.com', '123456');
    
    // Se verifica que el usuario fue redirigido a la página de inicio
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('muestra una alerta de error si el login falla', async () => {
    // Se configura el mock para simular un error (promesa rechazada)
    mockLogin.mockRejectedValue({ error: 'Credenciales inválidas' });

    renderLogin();

    // Se llenan los campos con datos erróneos
    fireEvent.change(screen.getByPlaceholderText('ejemplo@correo.com'), { target: { value: 'fail@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('********'), { target: { value: 'wrongpass' } });

    // Se intenta iniciar sesión
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    });

    // Se verifica que NO se haya producido redirección alguna
    // (Aquí fallaba antes porque mockUser quedaba sucio del test anterior)
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Se verifica que el mensaje de error del backend aparezca en pantalla
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('muestra un mensaje de éxito si el usuario viene redirigido del registro', () => {
    // Se simula un estado de navegación previo (como si viniera de registrarse)
    const entries = [
      {
        pathname: '/login',
        state: { successMsg: '¡Registro exitoso! Por favor inicia sesión.' }
      }
    ];

    render(
      <MemoryRouter initialEntries={entries}>
        <LoginPage />
      </MemoryRouter>
    );

    // Se verifica que el banner de éxito se renderice correctamente
    expect(screen.getByText('¡Registro exitoso! Por favor inicia sesión.')).toBeInTheDocument();
  });

  it('redirige automáticamente al home si el usuario ya tiene sesión activa', async () => {
    // Se simula que ya existe un usuario autenticado antes de renderizar
    mockUser = { email: 'ya_logueado@test.com' };

    renderLogin();

    // Se verifica que el useEffect detecte al usuario y redirija automáticamente
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });
});