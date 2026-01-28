import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Trash2, Plus, Minus, ShoppingBag, 
  ArrowRight, AlertCircle, Loader2 
} from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Visual del Carrito (Drawer Lateral).
 * Se encarga de mostrar los productos, gestionar cantidades y validar visualmente
 * si se puede proceder al pago.
 */
const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawerRef = useRef(null);
  
  // 1. Obtenemos todas las funciones y estados del Contexto
  const { 
    cart, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    addToCart,
    totalPrice,
    isSyncing,
    limpiarNoDisponibles, // <--- NUEVA FUNCIÓN: Limpia agotados, eliminados e inactivos
    sincronizarCarrito 
  } = useCart();

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeCart]);

  // Manejo de cambio de cantidad
  const handleQuantityChange = (item, newQuantity) => {
    // Bloqueamos cambios si el item está en un estado inválido
    if (['agotado', 'eliminado', 'inactivo'].includes(item.status)) return;
    
    if (newQuantity < 1) return;

    if (item.maxStock !== undefined && newQuantity > item.maxStock) {
      return;
    }

    addToCart({
      ...item,
      cantidad: newQuantity - item.quantity
    });
  };

  // Input manual de cantidad
  const handleManualInput = (e, item) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) return;
    if (item.maxStock !== undefined && val > item.maxStock) {
      val = item.maxStock;
    }
    if (val !== item.quantity) {
      handleQuantityChange(item, val);
    }
  };

  // 2. Lógica del Botón de Pago (El Portero)
  const handleCheckout = async () => {
    // Si ya hay errores visibles en rojo, no molestamos al servidor
    const tieneErrores = cart.some(item => ['agotado', 'eliminado', 'inactivo'].includes(item.status));
    if (tieneErrores) return;

    // Validamos stock en tiempo real
    const validacionExitosa = await sincronizarCarrito(cart);

    if (!validacionExitosa) {
      // Si el stock cambió mientras el usuario veía el carrito
      alert('El inventario ha cambiado. Hemos ajustado tu pedido a lo disponible.');
      return; 
    }

    closeCart();
    if (user) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  // 3. Validación Global para habilitar/deshabilitar botón
  const hasInvalidItems = cart.some(item => ['agotado', 'eliminado', 'inactivo'].includes(item.status));
  const canCheckout = !isSyncing && cart.length > 0 && !hasInvalidItems;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Panel Lateral */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="text-biskoto" size={24} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-biskoto text-[10px] font-bold text-white">
                      {cart.filter(i => i.status === 'ok').length}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tu Pedido</h2>
                {isSyncing && <Loader2 className="h-4 w-4 text-biskoto animate-spin ml-2" />}
              </div>
              <button onClick={closeCart} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>

            {/* Cuerpo del Carrito */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag size={40} className="text-gray-300" />
                  <p className="text-lg font-bold text-gray-900 dark:text-white">Tu carrito está vacío</p>
                  <button onClick={closeCart} className="text-biskoto font-bold text-sm uppercase tracking-widest hover:underline">Ver Menú</button>
                </div>
              ) : (
                <>
                  {/* 4. Botón de Limpieza Inteligente */}
                  {/* Aparece si hay CUALQUIER item problemático (agotado, borrado, inactivo) */}
                  {hasInvalidItems && (
                    <button 
                      onClick={limpiarNoDisponibles}
                      className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100 dark:border-red-800 mb-4"
                    >
                      <Trash2 size={14} /> 
                      Quitar productos no disponibles
                    </button>
                  )}

                  {cart.map((item) => {
                    // Estado de error individual
                    const isItemInvalid = ['agotado', 'eliminado', 'inactivo'].includes(item.status);
                    
                    return (
                      <div key={item.id} className={`flex gap-4 group transition-all duration-300 ${isItemInvalid ? 'opacity-60 grayscale bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl' : ''}`}>
                        
                        {/* Imagen del Producto */}
                        <div className="relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                          <img src={item.imagen || '/placeholder.png'} alt={item.nombre} className="h-full w-full object-cover" />
                        </div>

                        {/* Info del Producto */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{item.nombre}</h3>
                              <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            {/* 5. Etiquetas de Error (Rojo para errores graves, Ámbar para ajustes) */}
                            {item.status !== 'ok' && (
                              <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2 py-1 rounded-md w-fit ${
                                isItemInvalid
                                  ? 'text-red-600 bg-red-100 dark:bg-red-900/40' 
                                  : 'text-amber-600 bg-amber-100 dark:bg-amber-900/40'
                              }`}>
                                <AlertCircle size={10} /> {item.mensajeError}
                              </div>
                            )}
                          </div>

                          {/* Controles de Cantidad */}
                          <div className="flex items-center justify-between mt-2">
                            <div className={`flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-200 dark:border-slate-700 ${isItemInvalid ? 'opacity-50 pointer-events-none' : ''}`}>
                              <button 
                                onClick={() => handleQuantityChange(item, item.quantity - 1)} 
                                disabled={isItemInvalid}
                                className="p-1 hover:text-biskoto transition-colors dark:text-white"
                              >
                                <Minus size={14} />
                              </button>

                              <input
                                type="number"
                                min="1"
                                max={item.maxStock}
                                value={item.quantity}
                                onChange={(e) => handleManualInput(e, item)}
                                disabled={isItemInvalid}
                                className="w-10 text-center bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 dark:text-white p-0"
                              />

                              <button 
                                onClick={() => handleQuantityChange(item, item.quantity + 1)} 
                                disabled={isItemInvalid || (item.maxStock !== undefined && item.quantity >= item.maxStock)}
                                className="p-1 hover:text-biskoto transition-colors dark:text-white disabled:opacity-30"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <span className={`font-bold ${isItemInvalid ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                              {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format((item.price || item.precio) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer con Botón Principal */}
            {cart.length > 0 && (
              <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalPrice)}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="w-full py-4 bg-biskoto hover:bg-biskoto-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-biskoto/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verificando...
                    </>
                  ) : hasInvalidItems ? (
                    <>Revisá los productos marcados</>
                  ) : (
                    <>
                      {user ? 'Procesar Compra' : 'Iniciar Sesión para Pagar'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;