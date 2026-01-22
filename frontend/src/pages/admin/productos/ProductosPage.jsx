import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as productoService from "../../../api/productoService";

// Importación de componentes reutilizables para estandarizar la UI
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
import TableActions from "../../../components/TableActions";

// Iconos específicos requeridos para la cabecera y estados de carga
import { Plus, Package, Loader2, CreditCard } from "lucide-react";

/**
 * Página de Gestión de Productos.
 * Mantiene la misma estructura de UI y UX que la página de categorías para mayor consistencia.
 */
const ProductosPage = () => {
  const location = useLocation();

  // Estado para almacenar el listado de productos y el término de búsqueda
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para controlar la interfaz de usuario (Carga, Errores y Notificaciones)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados para controlar el Modal de Eliminación
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para controlar qué producto está siendo toggleado
  const [togglingId, setTogglingId] = useState(null);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  // Detecta mensajes de éxito provenientes de otras rutas (ej. creación/edición)
  useEffect(() => {
    if (location.state?.successMessage) {
      showNotification("success", location.state.successMessage);
      // Limpia el estado del historial para evitar mostrar el mensaje al recargar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Función auxiliar para mostrar notificaciones temporales
  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Obtiene el listado administrativo (sin imágenes pesadas) desde el servicio
  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await productoService.getProductosAdmin();
      setProductos(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos del inventario.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle del estado activo/inactivo de un producto.
   * Actualiza el estado local inmediatamente para una UI responsiva.
   */
  const handleToggle = async (producto) => {
    setTogglingId(producto.id);

    try {
      const response = await productoService.toggleActivo(producto.id);

      // Actualizar estado local
      setProductos((prev) =>
        prev.map((prod) =>
          prod.id === producto.id ? { ...prod, activo: !prod.activo } : prod,
        ),
      );

      showNotification(
        "success",
        response.message || "Visibilidad actualizada.",
      );
    } catch (err) {
      const msg =
        err.response?.data?.error || "Error al cambiar la visibilidad.";
      showNotification("error", msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Abre el modal de confirmación estableciendo el producto a eliminar
  const handleDeleteClick = (producto) => {
    setProductToDelete(producto);
  };

  // Ejecuta la eliminación del producto tras la confirmación del usuario
  const confirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await productoService.deleteProducto(productToDelete.id);

      setProductos((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showNotification(
        "success",
        `El producto "${productToDelete.nombre}" ha sido eliminado.`,
      );
      setProductToDelete(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "No se pudo eliminar el producto.";
      showNotification("error", msg);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtra los productos en tiempo real por nombre o categoría
  const productosFiltrados = productos.filter(
    (prod) =>
      prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.categorias?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Formateador de moneda para CRC (Colones)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount);
  };

  // Determina la variante de color para el badge de stock
  const getStockVariant = (stock) => {
    if (stock > 10) return "success"; // Verde
    if (stock > 0) return "warning"; // Amarillo
    return "error"; // Rojo
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <Package className="h-8 w-8 text-biskoto dark:text-white" />
              Gestión de Productos
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra el inventario técnico, precios y disponibilidad.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/admin/productos/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Producto
            </Link>
          </div>
        </div>

        {/* Componente de Notificación (Toast) */}
        {notification && (
          <ToastNotification
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Barra de Búsqueda y Filtrado */}
        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={productosFiltrados.length}
          placeholder="Buscar por nombre o categoría..."
        />

        {/* Tabla de Resultados */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-slate-700 sm:rounded-b-xl bg-white dark:bg-slate-800 transition-colors duration-300">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Cargando inventario...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                  </div>
                ) : productosFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron productos que coincidan con "${searchTerm}".`
                        : "No hay productos registrados en el inventario."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        {/* Padding reducido en móvil (px-3) */}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nombre
                        </th>
                        {/* Ocultamos la columna Categoría en pantallas pequeñas */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Categoría
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Stock
                        </th>
                        {/* Nueva columna: Estado */}
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {productosFiltrados.map((prod) => (
                        <tr
                          key={prod.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          {/* Columna Nombre: Ajuste de padding y Avatar responsivo */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Avatar: h-8 en móvil, h-10 en escritorio */}
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white font-bold uppercase border border-biskoto/20 dark:border-white/20 text-xs sm:text-sm">
                                {prod.nombre.charAt(0)}
                              </div>
                              <div className="ml-3 sm:ml-4">
                                {/* Nombre truncado en móvil para evitar desbordes */}
                                <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[100px] sm:max-w-none truncate flex items-center gap-2">
                                  {prod.nombre}

                                  {/* Badge de Adelanto */}
                                  {prod.requiere_adelanto && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                      <CreditCard size={12} />
                                      {prod.porcentaje_adelanto}%
                                    </span>
                                  )}
                                </div>
                                {/* Mostrar Categoría aquí SOLO en móvil (gris pequeño) */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                                  {prod.categorias?.nombre || "General"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna Categoría (Badge): Solo visible en Desktop (md:table-cell) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                            <StatusBadge variant="default">
                              {prod.categorias?.nombre || "General"}
                            </StatusBadge>
                          </td>

                          {/* Precio: Padding reducido */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(prod.precio)}
                          </td>

                          {/* Stock: Padding reducido */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge
                              variant={getStockVariant(prod.stock_actual)}
                            >
                              {prod.stock_actual}
                            </StatusBadge>
                          </td>

                          {/* Nueva columna: Toggle Estado */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggle(prod)}
                                disabled={togglingId === prod.id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-biskoto focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-wait ${
                                  prod.activo !== false
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-slate-600"
                                }`}
                                title={
                                  prod.activo !== false
                                    ? "Desactivar producto"
                                    : "Activar producto"
                                }
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                                    prod.activo !== false
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                                {togglingId === prod.id && (
                                  <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
                                )}
                              </button>
                              <span
                                className={`text-xs ${
                                  prod.activo !== false
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {prod.activo !== false ? "Visible" : "Oculto"}
                              </span>
                            </div>
                          </td>

                          {/* Acciones: Padding reducido */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <TableActions
                              editLink={`/admin/productos/editar/${prod.id}`}
                              onDelete={() => handleDeleteClick(prod)}
                              deleteTitle="Eliminar producto"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación Reutilizable */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar producto?"
        message={
          productToDelete && (
            <>
              Estás a punto de eliminar el producto{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                "{productToDelete.nombre}"
              </span>
              .
              <br className="hidden sm:block" />
              ¿Estás seguro de que quieres continuar?
            </>
          )
        }
      />
    </div>
  );
};

export default ProductosPage;
