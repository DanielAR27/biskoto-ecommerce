import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../CartContext';
import * as productoService from '../../api/productoService';

// 1. Mock del servicio de productos (validarDisponibilidad)
// Esto evita que el test intente llamar al backend real
vi.mock('../../api/productoService', () => ({
  validarDisponibilidad: vi.fn(),
}));

// Componente de prueba para consumir el hook useCart
const TestComponent = () => {
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    totalPrice, 
    totalItems,
    sincronizarCarrito,
    clearCart
  } = useCart();

  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="total-price">{totalPrice}</div>
      <button onClick={() => clearCart()}>Vaciar</button>
      
      {/* Botón para agregar un item de prueba */}
      <button 
        onClick={() => addToCart({ 
          id: 1, 
          nombre: 'Galleta Chocolate', 
          precio: 1000, 
          cantidad: 1, 
          maxStock: 10,
          imagen: 'img.jpg' 
        })}
      >
        Agregar Galleta
      </button>

       {/* Botón para agregar un item con stock limitado */}
       <button 
        onClick={() => addToCart({ 
          id: 2, 
          nombre: 'Pastel Limitado', 
          precio: 5000, 
          cantidad: 5, 
          maxStock: 5 
        })}
      >
        Agregar Pastel
      </button>

      {/* Botón para forzar sincronización */}
      <button onClick={() => sincronizarCarrito(cart)}>Sincronizar</button>

      <ul>
        {cart.map(item => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.nombre} - Cant: {item.quantity} - Estado: {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('CartContext', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debe iniciar con un carrito vacío si no hay nada en localStorage', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0');
  });

  it('debe recuperar el carrito desde localStorage al iniciar', () => {
    // Simulamos datos previos guardados
    const carritoPrevio = [{
      id: 1,
      nombre: 'Galleta Guardada',
      price: 1000,
      quantity: 2,
      maxStock: 10,
      status: 'ok'
    }];
    localStorage.setItem('biskoto_cart', JSON.stringify(carritoPrevio));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
    expect(screen.getByTestId('item-1')).toHaveTextContent('Galleta Guardada');
  });

  it('debe agregar un producto nuevo correctamente', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await act(async () => {
      screen.getByText('Agregar Galleta').click();
    });

    // Verificamos totales
    expect(screen.getByTestId('total-items')).toHaveTextContent('1');
    expect(screen.getByTestId('total-price')).toHaveTextContent('1000');
    
    // Verificamos que se guardó en localStorage
    const stored = JSON.parse(localStorage.getItem('biskoto_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(1);
  });

  it('debe sumar cantidad si el producto ya existe', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Click 2 veces
    await act(async () => {
      screen.getByText('Agregar Galleta').click();
      screen.getByText('Agregar Galleta').click();
    });

    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
    // El precio debe ser 2000 (2 * 1000)
    expect(screen.getByTestId('total-price')).toHaveTextContent('2000');
  });

  it('no debe permitir agregar más del stock máximo (maxStock)', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Agregamos el pastel que tiene maxStock: 5
    await act(async () => {
      screen.getByText('Agregar Pastel').click(); // Cantidad va a 5
    });
    
    expect(screen.getByTestId('total-items')).toHaveTextContent('5');

    // Intentamos agregar de nuevo (debería fallar o no sumar porque 5+5 > 5)
    await act(async () => {
      screen.getByText('Agregar Pastel').click();
    });

    // La cantidad debe seguir siendo 5
    expect(screen.getByTestId('total-items')).toHaveTextContent('5');
  });

  // --- PRUEBAS CRÍTICAS DE SINCRONIZACIÓN ---

  it('debe marcar items como "agotado" si la API dice stock 0', async () => {
    // 1. Mock de la respuesta de la API: ID 1 tiene 0 stock
    productoService.validarDisponibilidad.mockResolvedValue({
      disponibilidadReal: { 1: 0 }
    });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Agregamos item
    await act(async () => {
      screen.getByText('Agregar Galleta').click();
    });

    // Ejecutamos sincronización
    await act(async () => {
      screen.getByText('Sincronizar').click();
    });

    // Verificamos que el servicio fue llamado
    expect(productoService.validarDisponibilidad).toHaveBeenCalled();

    // Verificamos el cambio de estado en la UI
    // El texto debe contener "Estado: agotado" y "Cant: 0"
    const item = await screen.findByTestId('item-1');
    expect(item).toHaveTextContent('Estado: agotado');
    expect(item).toHaveTextContent('Cant: 0');
  });

  it('debe ajustar la cantidad si el stock es insuficiente (pero > 0)', async () => {
    // Escenario: El usuario tiene 5 pasteles, pero el backend dice que solo quedan 2
    productoService.validarDisponibilidad.mockResolvedValue({
      disponibilidadReal: { 2: 2 } 
    });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Agregamos 5 pasteles
    await act(async () => {
      screen.getByText('Agregar Pastel').click();
    });

    // Sincronizamos
    await act(async () => {
      screen.getByText('Sincronizar').click();
    });

    // Verificación
    const item = await screen.findByTestId('item-2');
    expect(item).toHaveTextContent('Estado: ajustado');
    expect(item).toHaveTextContent('Cant: 2'); // Se redujo de 5 a 2
  });

  it('debe mantener el estado "ok" si hay suficiente stock', async () => {
    productoService.validarDisponibilidad.mockResolvedValue({
      disponibilidadReal: { 1: 50 } // Hay de sobra
    });

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await act(async () => {
      screen.getByText('Agregar Galleta').click(); // Pide 1
      screen.getByText('Sincronizar').click();
    });

    const item = await screen.findByTestId('item-1');
    expect(item).toHaveTextContent('Estado: ok');
    expect(item).toHaveTextContent('Cant: 1');
  });
});