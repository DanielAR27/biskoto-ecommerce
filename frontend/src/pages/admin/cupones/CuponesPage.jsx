import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as cuponService from "../../../api/cuponService";

// Importación de componentes reutilizables para estandarizar la UI
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
import TableActions from "../../../components/TableActions";

// Iconos específicos para la lógica de visualización de cupones
import { Plus, Ticket, Loader2, Calendar, Percent } from "lucide-react";

/**
 * Página de Gestión de Cupones.
 * Permite administrar códigos de descuento, validando su vigencia y estado.
 */
const CuponesPage = () => {
  const location = useLocation();

  // Estado para almacenar el listado de cupones y el término de búsqueda
  const [cupones, setCupones] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para controlar la interfaz de usuario (Carga, Errores y Notificaciones)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados para controlar el Modal de Eliminación
  const [cuponToDelete, setCuponToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    cargarCupones();
  }, []);

  // Detecta mensajes de éxito provenientes de otras rutas (ej. creación/edición)
  useEffect(() => {
    if (location.state?.successMessage) {
      showNotification("success", location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Función auxiliar para mostrar notificaciones temporales
  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Obtiene el listado de cupones desde el servicio
  const cargarCupones = async () => {
    try {
      setLoading(true);
      const data = await cuponService.getCupones();
      setCupones(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los cupones.");
    } finally {
      setLoading(false);
    }
  };

  // Abre el modal de confirmación estableciendo el cupón a eliminar
  const handleDeleteClick = (cupon) => {
    setCuponToDelete(cupon);
  };

  // Ejecuta la eliminación tras la confirmación del usuario
  const confirmDelete = async () => {
    if (!cuponToDelete) return;

    setIsDeleting(true);
    try {
      await cuponService.deleteCupon(cuponToDelete.id);

      setCupones((prev) => prev.filter((c) => c.id !== cuponToDelete.id));

      showNotification(
        "success",
        `El cupón "${cuponToDelete.codigo}" ha sido eliminado.`,
      );
      setCuponToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.error || "No se pudo eliminar el cupón.";
      showNotification("error", msg);
      setCuponToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper para verificar si un cupón ha expirado por fecha
  const isExpired = (fechaExpiracion) => {
    if (!fechaExpiracion) return false;

    // Desglosa la fecha para evitar conversiones de zona horaria automáticas
    const [year, month, day] = fechaExpiracion.split("-").map(Number);

    // Crea una fecha local y establece el final del día
    const exp = new Date(year, month - 1, day);
    exp.setHours(23, 59, 59, 999);

    // Compara con el instante actual
    return new Date() > exp;
  };

  // Determina la variante visual del badge según el estado del cupón
  const getStatusVariant = (vencido, inactivo) => {
    if (vencido) return "error"; // Rojo
    if (inactivo) return "default"; // Gris
    return "success"; // Verde
  };

  const getStatusText = (vencido, inactivo) => {
    if (vencido) return "Vencido";
    if (inactivo) return "Inactivo";
    return "Activo";
  };

  // Filtra los cupones en tiempo real según el término de búsqueda
  const cuponesFiltrados = cupones.filter((c) =>
    c.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la Sección */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <Ticket className="h-8 w-8 text-biskoto dark:text-white" />
              Gestión de Cupones
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los códigos de descuento y promociones.
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              to="/admin/cupones/nuevo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Cupón
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
          resultCount={cuponesFiltrados.length}
          placeholder="Buscar por código..."
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
                      Cargando cupones...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                    <button
                      onClick={cargarCupones}
                      className="mt-4 text-biskoto hover:underline font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : cuponesFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron cupones con el código "${searchTerm}".`
                        : "No hay cupones registrados en el sistema."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Descuento
                        </th>
                        {/* Agregamos 'hidden md:table-cell' para ocultar en móvil */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Expiración
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {cuponesFiltrados.map((cupon) => {
                        const vencido = isExpired(cupon.fecha_expiracion);
                        const inactivo = !cupon.activo;

                        return (
                          <tr
                            key={cupon.id}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white border border-biskoto/20 dark:border-white/20">
                                  <Ticket className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold font-mono text-gray-900 dark:text-white tracking-wide">
                                    {cupon.codigo}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900 dark:text-white font-medium">
                                <Percent className="h-4 w-4 mr-1 text-gray-400" />
                                {cupon.descuento_porcentaje}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div
                                className={`flex items-center text-sm ${vencido ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                {cupon.fecha_expiracion
                                  ? new Date(
                                      cupon.fecha_expiracion,
                                    ).toLocaleDateString("es-CR", {
                                      timeZone: "UTC",
                                    })
                                  : "Indefinido"}
                              </div>
                            </td>

                            {/* Columna de Estado usando Badge Reutilizable (Oculta en móvil) */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                              <StatusBadge
                                variant={getStatusVariant(vencido, inactivo)}
                              >
                                {getStatusText(vencido, inactivo)}
                              </StatusBadge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <TableActions
                                editLink={`/admin/cupones/editar/${cupon.id}`}
                                onDelete={() => handleDeleteClick(cupon)}
                                deleteTitle="Eliminar cupón"
                              />
                            </td>
                          </tr>
                        );
                      })}
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
        isOpen={!!cuponToDelete}
        onClose={() => setCuponToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Eliminar cupón?"
        message={
          cuponToDelete && (
            <>
              Estás a punto de eliminar el cupón{" "}
              <span className="font-bold font-mono text-gray-800 dark:text-gray-200">
                {cuponToDelete.codigo}
              </span>
              .
              <br className="hidden sm:block" />
              Esta acción no se puede deshacer.
            </>
          )
        }
      />
    </div>
  );
};

export default CuponesPage;
