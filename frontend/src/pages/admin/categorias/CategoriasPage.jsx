import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as categoriaService from "../../../api/categoriaService";

// Componentes reutilizables
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
import TableActions from "../../../components/TableActions";

// Íconos específicos de la página
import { Plus, Package, Loader2 } from "lucide-react";

const CategoriasPage = () => {
  const location = useLocation();

  const [categorias, setCategorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados para el Modal de eliminación
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para controlar qué categoría está siendo toggleada
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (location.state?.successMessage) {
      showNotification("success", location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriaService.getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle del estado activo/inactivo de una categoría.
   * Actualiza el estado local inmediatamente para una UI responsiva.
   */
  const handleToggle = async (categoria) => {
    setTogglingId(categoria.id);

    try {
      const response = await categoriaService.toggleCategoria(categoria.id);

      // Actualizar estado local
      setCategorias((prev) =>
        prev.map((cat) =>
          cat.id === categoria.id ? { ...cat, activo: !cat.activo } : cat,
        ),
      );

      showNotification("success", response.mensaje);
    } catch (err) {
      const msg = err.response?.data?.error || "Error al cambiar el estado.";
      showNotification("error", msg);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteClick = (categoria) => {
    setCategoryToDelete(categoria);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await categoriaService.deleteCategoria(categoryToDelete.id);
      setCategorias((prev) =>
        prev.filter((cat) => cat.id !== categoryToDelete.id),
      );
      showNotification(
        "success",
        `La categoría "${categoryToDelete.nombre}" ha sido eliminada.`,
      );
      setCategoryToDelete(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "No se pudo eliminar la categoría.";
      showNotification("error", msg);
      setCategoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <Package className="h-8 w-8 text-biskoto dark:text-white" />
              Gestión de Categorías
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra las familias de productos de tu tienda.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/admin/categorias/nueva"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nueva Categoría
            </Link>
          </div>
        </div>

        {/* Notificación Toast Reutilizable */}
        {notification && (
          <ToastNotification
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Barra de Búsqueda Reutilizable */}
        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={categoriasFiltradas.length}
          placeholder="Buscar categoría..."
        />

        {/* Tabla */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-slate-700 sm:rounded-b-xl bg-white dark:bg-slate-800 transition-colors duration-300">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Cargando catálogo...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                  </div>
                ) : categoriasFiltradas.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron categorías que coincidan con "${searchTerm}".`
                        : "No hay categorías registradas en el inventario."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Descripción
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">
                            Cant. Productos
                          </span>
                          <span className="sm:hidden">Cant.</span>
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
                      {categoriasFiltradas.map((cat) => (
                        <tr
                          key={cat.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          {/* Columna Nombre */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white font-bold uppercase border border-biskoto/20 dark:border-white/20 text-xs sm:text-sm">
                                {cat.nombre.charAt(0)}
                              </div>
                              <div className="ml-3 sm:ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[120px] sm:max-w-none truncate">
                                  {cat.nombre}
                                </div>
                                {/* Descripción móvil */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden max-w-[120px] truncate">
                                  {cat.descripcion}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna Descripción (Desktop) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                            {cat.descripcion || (
                              <span className="italic text-gray-400 dark:text-gray-600">
                                Sin descripción
                              </span>
                            )}
                          </td>

                          {/* Columna Cantidad */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge
                              variant={
                                (cat.productos?.[0]?.count || 0) > 0
                                  ? "brand"
                                  : "error"
                              }
                            >
                              {cat.productos?.[0]?.count || 0}
                              <span className="hidden sm:inline ml-1">
                                items
                              </span>
                            </StatusBadge>
                          </td>

                          {/* Nueva columna: Toggle Estado */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggle(cat)}
                                disabled={togglingId === cat.id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-biskoto focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-wait ${
                                  cat.activo !== false
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-slate-600"
                                }`}
                                title={
                                  cat.activo !== false
                                    ? "Desactivar categoría"
                                    : "Activar categoría"
                                }
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                                    cat.activo !== false
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                                {togglingId === cat.id && (
                                  <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
                                )}
                              </button>
                              <span
                                className={`text-xs ${
                                  cat.activo !== false
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {cat.activo !== false ? "Visible" : "Oculta"}
                              </span>
                            </div>
                          </td>

                          {/* Columna Acciones */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <TableActions
                              editLink={`/admin/categorias/editar/${cat.id}`}
                              onDelete={() => handleDeleteClick(cat)}
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

      {/* Modal Reutilizable */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar categoría?"
        message={
          categoryToDelete && (
            <>
              Estás a punto de eliminar la categoría{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                "{categoryToDelete.nombre}"
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

export default CategoriasPage;
