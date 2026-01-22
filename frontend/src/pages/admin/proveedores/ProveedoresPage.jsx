import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as proveedorService from "../../../api/proveedorService";

// Componentes Reutilizables
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import TableActions from "../../../components/TableActions";

// Iconos
import { Store, Truck, Loader2, Mail, Phone, Plus } from "lucide-react";

const ProveedoresPage = () => {
  const location = useLocation();

  // Estado local
  const [proveedores, setProveedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de carga y feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados del Modal
  const [proveedorToDelete, setProveedorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarProveedores();
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

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedorService.getProveedores();
      setProveedores(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los proveedores del sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (proveedor) => {
    setProveedorToDelete(proveedor);
  };

  const confirmDelete = async () => {
    if (!proveedorToDelete) return;

    setIsDeleting(true);
    try {
      await proveedorService.deleteProveedor(proveedorToDelete.id);
      setProveedores((prev) =>
        prev.filter((p) => p.id !== proveedorToDelete.id),
      );
      showNotification(
        "success",
        `El proveedor "${proveedorToDelete.nombre}" ha sido eliminado.`,
      );
      setProveedorToDelete(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "No se pudo eliminar el proveedor.";
      showNotification("error", msg);
      setProveedorToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      (p.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.contacto_nombre?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (p.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado Responsivo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <Store className="h-8 w-8 text-biskoto dark:text-white" />
              Gestión de Proveedores
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra tus contactos y fuentes de suministros.
            </p>
          </div>
          <div className="flex md:ml-4">
            <Link
              to="/admin/proveedores/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Proveedor
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
          resultCount={proveedoresFiltrados.length}
          placeholder="Buscar por empresa, contacto o email..."
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
                      Cargando proveedores...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                    <button
                      onClick={cargarProveedores}
                      className="mt-4 text-biskoto hover:underline font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : proveedoresFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron proveedores que coincidan con "${searchTerm}".`
                        : "No hay proveedores registrados. ¡Agrega el primero!"}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        {/* Padding reducido en móvil */}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Proveedor
                        </th>
                        {/* Ocultamos Contacto en pantallas medianas hacia abajo */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Contacto
                        </th>
                        {/* Ocultamos Teléfono en pantallas medianas hacia abajo */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Teléfono
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {proveedoresFiltrados.map((prov) => (
                        <tr
                          key={prov.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {/* Icono/Avatar responsivo */}
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white border border-biskoto/20 dark:border-white/20">
                                <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="ml-3 sm:ml-4">
                                <div className="text-sm font-bold text-gray-900 dark:text-white max-w-[140px] sm:max-w-none truncate">
                                  {prov.nombre}
                                </div>
                                {/* Información extra para Móviles (ya que ocultamos columnas) */}
                                <div className="block md:hidden text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {prov.contacto_nombre && (
                                    <span className="block">
                                      {prov.contacto_nombre}
                                    </span>
                                  )}
                                  {prov.telefono && (
                                    <span className="flex items-center gap-1 mt-0.5">
                                      <Phone size={10} /> {prov.telefono}
                                    </span>
                                  )}
                                </div>
                                {/* Email visible siempre */}
                                {prov.email && (
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Mail
                                      size={12}
                                      className="hidden sm:block"
                                    />{" "}
                                    {prov.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Columna Contacto (Desktop) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white hidden md:table-cell">
                            {prov.contacto_nombre || (
                              <span className="text-gray-400 italic">--</span>
                            )}
                          </td>

                          {/* Columna Teléfono (Desktop) */}
                          <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {prov.telefono ? (
                                <>
                                  <Phone size={14} className="text-gray-400" />
                                  {prov.telefono}
                                </>
                              ) : (
                                <span className="text-gray-400 italic">--</span>
                              )}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <TableActions
                              editLink={`/admin/proveedores/editar/${prov.id}`}
                              onDelete={() => handleDeleteClick(prov)}
                              deleteTitle="Eliminar proveedor"
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
        isOpen={!!proveedorToDelete}
        onClose={() => setProveedorToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar proveedor?"
        message={
          proveedorToDelete && (
            <>
              Estás a punto de eliminar al proveedor{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                "{proveedorToDelete.nombre}"
              </span>
              .
              <br className="mt-2" />
              <span className="text-xs sm:text-sm text-gray-500 block mt-1">
                Nota: Si este proveedor tiene compras registradas, el sistema
                impedirá la eliminación para proteger el historial.
              </span>
            </>
          )
        }
      />
    </div>
  );
};

export default ProveedoresPage;
