import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as ingredienteService from "../../../api/ingredienteService";

// Componentes Reutilizables
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
import TableActions from "../../../components/TableActions";

// Iconos
import { Plus, ClipboardList, Loader2, AlertTriangle } from "lucide-react";

const IngredientesPage = () => {
  const location = useLocation();

  // Estados de datos
  const [ingredientes, setIngredientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados del Modal
  const [ingredienteToDelete, setIngredienteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarIngredientes();
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

  const cargarIngredientes = async () => {
    try {
      setLoading(true);
      const data = await ingredienteService.getIngredientes();
      setIngredientes(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los ingredientes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (ingrediente) => {
    setIngredienteToDelete(ingrediente);
  };

  const confirmDelete = async () => {
    if (!ingredienteToDelete) return;

    setIsDeleting(true);
    try {
      await ingredienteService.deleteIngrediente(ingredienteToDelete.id);
      setIngredientes((prev) =>
        prev.filter((ing) => ing.id !== ingredienteToDelete.id),
      );
      showNotification(
        "success",
        `El ingrediente "${ingredienteToDelete.nombre}" ha sido eliminado.`,
      );
      setIngredienteToDelete(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "No se pudo eliminar el ingrediente.";
      showNotification("error", msg);
      setIngredienteToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const ingredientesFiltrados = ingredientes.filter(
    (ing) =>
      ing.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Buscamos en la abreviatura o nombre de la relación
      ing.unidades_medida?.abreviatura
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado Responsivo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-biskoto dark:text-white" />
              Inventario de Ingredientes
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gestiona los insumos y materias primas del sistema.
            </p>
          </div>
          <div className="flex md:ml-4">
            <Link
              to="/admin/ingredientes/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Ingrediente
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
          resultCount={ingredientesFiltrados.length}
          placeholder="Buscar ingrediente..."
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
                      Cargando inventario...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                    <button
                      onClick={cargarIngredientes}
                      className="mt-4 text-biskoto hover:underline font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : ingredientesFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron ingredientes que coincidan con "${searchTerm}".`
                        : "No hay ingredientes registrados en el inventario."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        {/* Padding ajustado para móvil */}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ingrediente
                        </th>
                        {/* Ocultamos columna Unidad en móvil */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Unidad
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {ingredientesFiltrados.map((ing) => (
                        <tr
                          key={ing.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Avatar responsivo */}
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white font-bold uppercase border border-biskoto/20 dark:border-white/20 text-xs sm:text-sm">
                                {ing.nombre.charAt(0)}
                              </div>
                              <div className="ml-3 sm:ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[120px] sm:max-w-none truncate">
                                  {ing.nombre}
                                </div>
                                {/* Unidad mostrada debajo del nombre SOLO en móvil */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                                  {ing.unidades_medida?.abreviatura}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Columna Unidad oculta en móvil */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {ing.unidades_medida?.nombre} (
                            {ing.unidades_medida?.abreviatura})
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            {ing.es_ilimitado ? (
                              // CASO ILIMITADO: Badge azul o neutro con símbolo infinito
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                <span className="text-lg leading-none mr-1">
                                  ∞
                                </span>{" "}
                                Ilimitado
                              </span>
                            ) : (
                              // CASO NORMAL: Lógica de StatusBadge existente
                              <StatusBadge
                                variant={
                                  ing.stock_actual < 0
                                    ? "error"
                                    : ing.stock_actual === 0
                                      ? "warning"
                                      : ing.stock_actual <= 5
                                        ? "info"
                                        : "success"
                                }
                              >
                                <span className="flex items-center justify-center gap-1">
                                  {ing.stock_actual < 0 && (
                                    <AlertTriangle className="h-3 w-3 animate-pulse" />
                                  )}
                                  {ing.stock_actual}
                                </span>
                              </StatusBadge>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <TableActions
                              editLink={`/admin/ingredientes/editar/${ing.id}`}
                              onDelete={() => handleDeleteClick(ing)}
                              deleteTitle="Eliminar ingrediente"
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
        isOpen={!!ingredienteToDelete}
        onClose={() => setIngredienteToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar ingrediente?"
        message={
          ingredienteToDelete && (
            <>
              Estás a punto de eliminar el ingrediente{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                "{ingredienteToDelete.nombre}"
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

export default IngredientesPage;
