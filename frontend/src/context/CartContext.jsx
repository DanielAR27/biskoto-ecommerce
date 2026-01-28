import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validarDisponibilidad } from '../api/productoService';

const CartContext = createContext();

/**
 * Hook personalizado para acceder al contexto del carrito.
 */
export const useCart = () => {
  return useContext(CartContext);
};

/**
 * Proveedor del estado global del carrito.
 * Se han implementado mecanismos de validación síncrona y verificación de stock 
 * que retornan el estado de la validación para su uso en el checkout.
 */
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const storedCart = localStorage.getItem('biskoto_cart');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Error al recuperar el carrito:", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Sincroniza el carrito con el backend y actualiza el estado local.
   * CAMBIO: Ahora retorna una Promesa<boolean>.
   * - Retorna `true` si el stock es suficiente para cubrir lo solicitado (o mejoró).
   * - Retorna `false` si hubo conflictos y se tuvo que reducir la cantidad de algún item.
   * Esto permite que el Drawer sepa si debe detener al usuario antes de pagar.
   */
  const sincronizarCarrito = useCallback(async (cartToSync) => {
    // Si no hay items, se considera un estado válido técnicamente.
    if (!cartToSync || cartToSync.length === 0) return true;

    try {
      setIsSyncing(true);
      const itemsParaValidar = cartToSync.map(item => ({ 
        id: item.id, 
        cantidad: item.quantity 
      }));

      // 1. Consultamos la verdad absoluta al servidor
      const data = await validarDisponibilidad(itemsParaValidar);

      // 2. Calculamos si hubo conflictos comparando la respuesta con lo que enviamos.
      // Usamos una variable local para determinar el valor de retorno de la función.
      let validacionExitosa = true;

      cartToSync.forEach(item => {
        const stockReal = data.disponibilidadReal[item.id];
        // Si se agotó (0) o si lo que pedimos es mayor a lo que hay, la validación falla.
        if (stockReal === 0 || (stockReal !== undefined && item.quantity > stockReal)) {
          validacionExitosa = false;
        }
      });

      // 3. Se actualiza el estado visual (UI) para reflejar los nuevos límites y mensajes
      setCart(prevCart => {
        return prevCart.map(item => {
          // Revisamos primero el estado explícito que nos mandó el backend
          const estadoProducto = data.estadoProductos ? data.estadoProductos[item.id] : 'ok';
          
          if (estadoProducto === 'eliminado') {
             return {
               ...item,
               quantity: 0,
               status: 'eliminado', // Nuevo estado
               mensajeError: 'Producto ya no existe'
             };
          }

          if (estadoProducto === 'inactivo') {
             return {
               ...item,
               quantity: 0,
               status: 'inactivo', // Nuevo estado
               mensajeError: 'Producto fuera de venta'
             };
          }

          // Lógica de Stock
          const stockReal = data.disponibilidadReal[item.id];
          
          if (stockReal === 0) {
            return { 
              ...item, quantity: 0, maxStock: 0, status: 'agotado', mensajeError: 'Agotado' 
            };
          }
          
          // Si no había stock de un producto y vuelve a estarlo, se agrega uno al carrito
          // en caso de que el usuario no lo haya eliminado.
          if (item.quantity === 0 && stockReal > 0) {
             return {
               ...item,
               quantity: 1, // <--- Resucita con 1
               maxStock: stockReal,
               status: 'ok',
               mensajeError: null
             };
          }
      
          if (stockReal !== undefined && item.quantity > stockReal) {
            return { 
              ...item, quantity: stockReal, maxStock: stockReal, status: 'ajustado', mensajeError: `Solo quedan ${stockReal}`
            };
          }

          const nuevoMaxStock = stockReal !== undefined ? stockReal : item.maxStock;
          return { 
            ...item, maxStock: nuevoMaxStock, status: 'ok', mensajeError: null 
          };
        });
      });

      // Retornamos el veredicto para que el componente que llamó pueda tomar decisiones (ej. bloquear checkout)
      return validacionExitosa;

    } catch (error) {
      console.error("Fallo de red al sincronizar stock:", error);
      // En caso de error de red, decidimos no bloquear agresivamente, o podríamos retornar false.
      // Se opta por true para no impedir el flujo por errores técnicos momentáneos, 
      // delegando la validación final al backend al crear la orden.
      return true; 
    } finally {
      setIsSyncing(false);
    }
  }, []);

  /**
   * Persiste el estado del carrito en localStorage ante cualquier modificación.
   */
  useEffect(() => {
    localStorage.setItem('biskoto_cart', JSON.stringify(cart));
  }, [cart]);

  /**
   * Abre el carrito y dispara la validación.
   * Se mantiene la inyección de dependencias (cartOverride) para evitar condiciones de carrera.
   */
  const openCart = (cartOverride = null) => {
    setIsCartOpen(true);
    sincronizarCarrito(cartOverride || cart);
  };

  const closeCart = () => setIsCartOpen(false);
  
  const toggleCart = () => {
    const newState = !isCartOpen;
    setIsCartOpen(newState);
    if (newState) sincronizarCarrito(cart);
  };

  const getItemQuantity = (id) => {
    const item = cart.find(i => i.id === id);
    return item && item.status !== 'agotado' ? item.quantity : 0;
  };

  /**
   * Agrega productos calculando el nuevo estado antes de actualizar.
   * Esto permite encadenar la apertura del drawer con los datos frescos.
   */
  const addToCart = (itemToAdd, shouldOpenDrawer = false) => {
    let newCart = [];
    const existingItemIndex = cart.findIndex(item => item.id === itemToAdd.id);

    if (existingItemIndex >= 0) {
      newCart = [...cart];
      const item = newCart[existingItemIndex];
      const newQuantity = item.quantity + itemToAdd.cantidad;

      if (itemToAdd.maxStock !== undefined && newQuantity > itemToAdd.maxStock) {
        return; 
      }

      newCart[existingItemIndex] = {
        ...item,
        quantity: newQuantity,
        status: 'ok',
        mensajeError: null
      };
    } else {
      newCart = [...cart, { 
        ...itemToAdd, 
        quantity: itemToAdd.cantidad,
        price: itemToAdd.precio || itemToAdd.price,
        status: 'ok'
      }];
    }

    setCart(newCart);

    if (shouldOpenDrawer) {
      openCart(newCart);
    }
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Elimina items que ya no existen, están inactivos o agotados
  const limpiarNoDisponibles = () => {
    setCart(prevCart => prevCart.filter(item => 
      item.status !== 'eliminado' && 
      item.status !== 'inactivo' && 
      item.status !== 'agotado'
    ));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + ((item.price || item.precio) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      limpiarNoDisponibles,
      getItemQuantity,
      totalItems,
      totalPrice,
      isCartOpen,
      isSyncing,
      sincronizarCarrito, // Se expone para que el Drawer pueda invocar la validación manualmente
      openCart,
      closeCart,
      toggleCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};