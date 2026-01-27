import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CheckoutPage from '../CheckoutPage';
import * as pedidoService from '../../../api/pedidoService';

// 1. Mocks de los Contextos (para controlar el estado fácilmente)
const mockCart = {
  cart: [],
  totalPrice: 0,
  clearCart: vi.fn(),
};

const mockUser = {
  user: {
    id: 1,
    nombre: 'Cliente Test',
    telefono: '88888888',
    direccion: 'Casa de prueba',
    email: 'test@cliente.com'
  }
};

vi.mock('../../../context/CartContext', () => ({
  useCart: () => mockCart
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUser
}));

// 2. Mock de Servicios API
vi.mock('../../../api/pedidoService');
vi.mock('../../../api/cuponService');

// 3. Mock del Navbar para no renderizar menú innecesario
vi.mock('../../../components/Navbar', () => ({
  default: () => <div data-testid="navbar-mock">Navbar</div>
}));

// 4. Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 5. Mock de fetch global (para la subida de comprobante)
global.fetch = vi.fn();

describe('CheckoutPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear valores por defecto del carrito
    mockCart.cart = [];
    mockCart.totalPrice = 0;
  });

  it('debe redirigir al home si el carrito está vacío', async () => {
    // Configuración: Carrito vacío
    mockCart.cart = [];
    mockCart.totalPrice = 0;

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('debe mostrar error si el teléfono es inválido en el Paso 1', async () => {
    // Configuración: Carrito con items
    mockCart.cart = [{ id: 1, nombre: 'Pastel', price: 5000, quantity: 1, imagen: 'img.jpg' }];
    mockCart.totalPrice = 5000;

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    // Se llena el teléfono con datos incorrectos (5 dígitos)
    const phoneInput = screen.getByPlaceholderText('8888-8888');
    fireEvent.change(phoneInput, { target: { value: '12345' } });

    // Intenta avanzar
    const continueBtn = screen.getByText(/Continuar al Pago/i);
    fireEvent.click(continueBtn);

    // Se verifica el mensaje de error
    expect(await screen.findByText('El teléfono debe tener 8 dígitos')).toBeInTheDocument();
    // Y se asegura que NO llamó a crearPedido
    expect(pedidoService.crearPedido).not.toHaveBeenCalled();
  });

  it('debe crear el pedido exitosamente y avanzar al Paso 2 (SINPE)', async () => {
    // Configuración inicial
    mockCart.cart = [{ id: 1, nombre: 'Pastel', price: 10000, quantity: 1, imagen: 'img.jpg' }];
    mockCart.totalPrice = 10000;

    // Mock de respuesta exitosa del backend
    const mockPedidoCreado = {
      id: 123,
      total: 10000,
      estado_id: 1,
      numeroReferencia: 'BISK-000123',
      datosPago: { telefono: '8888-8888', titular: 'Biskoto', monto: 10000 }
    };
    pedidoService.crearPedido.mockResolvedValue({ pedido: mockPedidoCreado });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    // 1. Llenar formulario correctamente
    fireEvent.change(screen.getByPlaceholderText('8888-8888'), { target: { value: '88888888' } });
    fireEvent.change(screen.getByPlaceholderText(/Calle, número/i), { target: { value: 'Dirección válida' } });

    // 2. Click en Continuar
    fireEvent.click(screen.getByText(/Continuar al Pago/i));

    // 3. Verificaciones
    await waitFor(() => {
      expect(pedidoService.crearPedido).toHaveBeenCalled();
    });

    // Verificar que se avanzó al paso 2 (aparece info de SINPE)
    expect(await screen.findByText('Datos para SINPE Móvil')).toBeInTheDocument();
    expect(screen.getByText('BISK-000123')).toBeInTheDocument();
  });

  it('debe permitir subir comprobante y confirmar el pago (Paso 2 -> Paso 3)', async () => {
    // Configuración compleja: renderizar el componente YA en el paso 2
    // Para lograr esto sin hacks, se simula el flujo completo rápido o se mockea el estado inicial si fuera posible.
    // En este caso, se hará el flujo completo pero mockeando todo para que sea instantáneo.
    
    mockCart.cart = [{ id: 1, nombre: 'Pastel', price: 5000, quantity: 1, imagen: 'img.jpg' }];
    mockCart.totalPrice = 5000;

    // Pedido creado
    const mockPedido = {
      id: 999,
      total: 5000,
      datosPago: { telefono: '8888-8888', monto: 5000 }
    };
    pedidoService.crearPedido.mockResolvedValue({ pedido: mockPedido });
    
    // Mocks para la subida de imagen
    global.fetch
      .mockResolvedValueOnce({ // Respuesta de signed-upload
        ok: true,
        json: async () => ({ signedUrl: 'http://fake-upload-url', path: 'path/img.jpg', bucket: 'comprobantes' })
      })
      .mockResolvedValueOnce({ // Respuesta del PUT a Supabase
        ok: true
      });

    pedidoService.confirmarPago.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    // --- FASE 1: Crear Pedido ---
    fireEvent.change(screen.getByPlaceholderText('8888-8888'), { target: { value: '88888888' } });
    fireEvent.change(screen.getByPlaceholderText(/Calle, número/i), { target: { value: 'Dir' } });
    fireEvent.click(screen.getByText(/Continuar al Pago/i));

    // Esperar a llegar al paso 2
    await screen.findByText('Datos para SINPE Móvil');

    // --- FASE 2: Subir Archivo ---
    // Simular selección de archivo
    const file = new File(['(comprobante)'], 'comprobante.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    
    // Vitest/Testing Library requiere userEvent para uploads complejos, 
    // pero fireEvent.change suele funcionar para inputs simples de archivo
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verificar que detectó el archivo (aparece el nombre)
    expect(await screen.findByText('comprobante.jpg')).toBeInTheDocument();

    // Click en Confirmar Pago
    const confirmarBtn = screen.getByText(/Confirmar Pago/i);
    fireEvent.click(confirmarBtn);

    // --- FASE 3: Verificaciones Finales ---
    await waitFor(() => {
      // 1. Debe haber pedido URL firmada
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/storage/signed-upload'),
        expect.anything()
      );
      // 2. Debe haber confirmado en backend
      expect(pedidoService.confirmarPago).toHaveBeenCalledWith(999, expect.stringContaining('path/img.jpg'));
      // 3. Debe haber limpiado el carrito
      expect(mockCart.clearCart).toHaveBeenCalled();
    });

    // 4. Debe mostrar mensaje de éxito final
    expect(await screen.findByText('¡Pedido Confirmado!')).toBeInTheDocument();
  });
});