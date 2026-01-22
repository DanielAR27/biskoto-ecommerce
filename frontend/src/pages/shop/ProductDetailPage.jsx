import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  AlertCircle,
  ChefHat,
  Info,
  Truck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Importaciones de servicios, contextos y componentes
import { getProducto } from "../../api/productoService";
import { useCart } from "../../context/CartContext";
import Navbar from "../../components/Navbar";

/**
 * Componente de visualización detallada de un producto.
 * Gestiona la navegación de imágenes, el cálculo dinámico de disponibilidad basado en insumos
 * y la integración con el sistema de carrito persistente.
 */
const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Acciones globales del carrito
  const { addToCart, getItemQuantity } = useCart();

  // Estados locales de datos y UI
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para la gestión de la compra local
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [maxFabricable, setMaxFabricable] = useState(0);

  /**
   * Recupera la información técnica del producto y sus relaciones al montar el componente.
   */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProducto(id);
        setProduct(data);

        // Establece la imagen principal por defecto
        if (data.producto_imagenes && data.producto_imagenes.length > 0) {
          const principalIndex = data.producto_imagenes.findIndex(
            (img) => img.es_principal,
          );
          setSelectedImageIndex(principalIndex !== -1 ? principalIndex : 0);
        }

        calcularDisponibilidad(data);
      } catch (err) {
        console.error("Error cargando producto:", err);
        setError("No se pudo procesar la solicitud del producto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  /**
   * Determina la capacidad máxima de producción evaluando el ingrediente con menor stock.
   * Aplica la lógica de "Reactivo Limitante" entre insumos y stock final del producto.
   */
  const calcularDisponibilidad = (data) => {
    if (
      !data.producto_ingredientes ||
      data.producto_ingredientes.length === 0
    ) {
      setMaxFabricable(data.stock_actual ?? 0);
      return;
    }
    const limitesPorIngrediente = data.producto_ingredientes.map((item) => {
      // Si es ilimitado, retornamos Infinito para que no afecte el Math.min
      if (item.ingredientes?.es_ilimitado) {
        return Infinity;
      }

      const stockDisponible = item.ingredientes?.stock_actual || 0;
      const necesarioPorUnidad = item.cantidad_necesaria || 1;
      return Math.floor(stockDisponible / necesarioPorUnidad);
    });

    const limiteIngredientes = Math.min(...limitesPorIngrediente);
    const limiteProducto = data.stock_actual ?? 999999;

    // Si todos los ingredientes son infinitos, limiteIngredientes será Infinity.
    // En ese caso, el límite será solo el stock físico del producto.
    setMaxFabricable(Math.min(limiteIngredientes, limiteProducto));
  };

  // Lógica de validación de cantidades contra el carrito actual
  const quantityInCart = product ? getItemQuantity(product.id) : 0;
  const availableToAdd = Math.max(0, maxFabricable - quantityInCart);
  const isOutOfStock = availableToAdd === 0;

  /**
   * Mantiene la cantidad seleccionada dentro de los rangos permitidos de inventario.
   */
  useEffect(() => {
    if (quantity > availableToAdd && availableToAdd > 0)
      setQuantity(availableToAdd);
    else if (availableToAdd === 0) setQuantity(0);
    else if (quantity === 0 && availableToAdd > 0) setQuantity(1);
  }, [availableToAdd, quantity]);

  // Manejadores de navegación para la galería de imágenes
  const nextImage = () => {
    if (!product?.producto_imagenes) return;
    setSelectedImageIndex(
      (prev) => (prev + 1) % product.producto_imagenes.length,
    );
  };

  const prevImage = () => {
    if (!product?.producto_imagenes) return;
    setSelectedImageIndex(
      (prev) =>
        (prev - 1 + product.producto_imagenes.length) %
        product.producto_imagenes.length,
    );
  };

  // Manejadores de control de cantidad
  const handleIncrement = () => {
    if (quantity < availableToAdd) setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  /**
   * Procesa la adición del producto al carrito global y despliega el panel lateral.
   */
  const handleAddToCart = () => {
    if (quantity > 0) {
      addToCart(
        {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          imagen: product.producto_imagenes[selectedImageIndex]?.url,
          cantidad: quantity,
          maxStock: maxFabricable,
        },
        true,
      ); // <--- El 'true' activa la apertura segura del carrito
    }
  };

  /**
   * Valida y formatea la entrada manual de cantidades.
   */
  const handleManualQuantity = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) return;

    if (val > availableToAdd) {
      setQuantity(availableToAdd);
    } else {
      setQuantity(val);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
      </div>
    );
  if (error || !product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-slate-900">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-gray-600 dark:text-gray-300">
          {error || "Producto no encontrado"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-biskoto hover:underline font-bold"
        >
          Regresar
        </button>
      </div>
    );

  const currentImage = product.producto_imagenes?.[selectedImageIndex]?.url;
  const hasMultipleImages = product.producto_imagenes?.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-biskoto transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
          {/* Seccíon de Visualización: Galería Interactiva */}
          <div className="p-6 md:p-8 bg-gray-100/50 dark:bg-slate-800/50 flex flex-col gap-4 group/gallery select-none">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm relative">
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover/gallery:opacity-100 z-10 text-gray-800 dark:text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover/gallery:opacity-100 z-10 text-gray-800 dark:text-white"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.nombre}
                  className={`w-full h-full object-cover transition-all duration-500 ${isOutOfStock && quantityInCart === 0 ? "grayscale opacity-70" : "group-hover/gallery:scale-105"}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ChefHat size={64} />
                </div>
              )}

              {maxFabricable === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <span className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest shadow-lg transform -rotate-12 border-4 border-white dark:border-slate-800 z-20">
                    Agotado
                  </span>
                </div>
              )}
            </div>

            {hasMultipleImages && (
              <div className="flex gap-3 overflow-x-auto py-2 custom-scrollbar">
                {product.producto_imagenes.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index ? "border-biskoto ring-2 ring-biskoto/30 scale-105" : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300 dark:hover:border-slate-600"}`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sección de Información: Detalles y Conversión */}
          <div className="p-6 md:p-12 flex flex-col justify-center">
            {product.categorias && (
              <span className="inline-block text-xs font-black tracking-widest uppercase mb-3 drop-shadow-sm transition-colors duration-300 text-biskoto dark:text-gray-400">
                {product.categorias.nombre}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
              {product.nombre}
            </h1>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                }).format(product.precio)}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 text-lg">
              {product.descripcion ||
                "Producto artesanal elaborado con altos estándares de calidad."}
            </p>

            {product.producto_ingredientes?.length > 0 && (
              <div className="mb-8 p-4 bg-orange-50 dark:bg-slate-700/30 rounded-xl border border-orange-100 dark:border-slate-600">
                <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-2">
                  <Info size={14} /> Ingredientes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {product.producto_ingredientes
                    .map((i) => i.ingredientes?.nombre)
                    .join(", ")}
                  .
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-slate-700 pt-8 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Disponibilidad
                </span>
                {maxFabricable === 0 ? (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                    <AlertCircle size={14} /> Insumos agotados
                  </span>
                ) : isOutOfStock ? (
                  <span className="flex items-center gap-1.5 text-orange-500 font-bold text-sm bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                    <AlertCircle size={14} /> Límite en carrito alcanzado
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    <Truck size={14} /> {maxFabricable} disponibles en
                    inventario
                  </span>
                )}
              </div>

              {/* Controles de Acción Principal */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-900 rounded-xl p-1 sm:w-40 border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-gray-600 dark:text-white hover:text-biskoto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableToAdd}
                    value={isOutOfStock ? 0 : quantity}
                    onChange={handleManualQuantity}
                    disabled={isOutOfStock}
                    className="w-12 text-center bg-transparent border-none focus:ring-0 font-bold text-xl text-gray-900 dark:text-white p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= availableToAdd || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-gray-600 dark:text-white hover:text-biskoto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-biskoto text-white h-12 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-biskoto/20 hover:bg-biskoto-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:bg-gray-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  {isOutOfStock
                    ? maxFabricable === 0
                      ? "Agotado"
                      : "Máximo alcanzado"
                    : "Agregar al Pedido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
