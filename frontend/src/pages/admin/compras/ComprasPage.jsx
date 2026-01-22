import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as compraService from "../../../api/compraService";

// Componentes Reutilizables
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
import TableActions from "../../../components/TableActions";

// Iconos
import {
  PackagePlus,
  Calendar,
  Plus,
  Loader2,
  Receipt,
  User,
} from "lucide-react";

const ComprasPage = () => {
  const location = useLocation();

  // Estados de datos
  const [compras, setCompras] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados del Modal
  const [compraToDelete, setCompraToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarCompras();
  }, []);

  // Notificación de éxito al redirigir desde la creación/edición de compra
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

  const cargarCompras = async () => {
    try {
      setLoading(true);
      const data = await compraService.getCompras();
      setCompras(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el historial de compras.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (compra) => {
    setCompraToDelete(compra);
  };

  const confirmDelete = async () => {
    if (!compraToDelete) return;

    setIsDeleting(true);
    try {
      await compraService.deleteCompra(compraToDelete.id);
      setCompras((prev) => prev.filter((c) => c.id !== compraToDelete.id));
      showNotification(
        "success",
        `Compra #${compraToDelete.id} eliminada. Stock revertido.`,
      );
      setCompraToDelete(null);
    } catch (err) {
      // Si el trigger de la DB bloquea el borrado por stock insuficiente, el error aparecerá aquí
      const msg = err.response?.data?.error || "No se pudo eliminar la compra.";
      showNotification("error", msg);
      setCompraToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const comprasFiltradas = compras.filter(
    (c) =>
      c.id.toString().includes(searchTerm) ||
      c.proveedores?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.notas?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado Responsivo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <PackagePlus className="h-8 w-8 text-biskoto dark:text-white" />
              Historial de Compras
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Registra entradas de ingredientes y gestiona facturas de
              proveedores.
            </p>
          </div>
          <div className="flex md:ml-4">
            <Link
              to="/admin/compras/nueva"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-colors w-full md:w-auto justify-center"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nueva Compra
            </Link>
          </div>
        </div>

        {notification && (
          <ToastNotification
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={comprasFiltradas.length}
          placeholder="Buscar por proveedor, ID o notas..."
        />

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-slate-700 sm:rounded-b-xl bg-white dark:bg-slate-800 transition-colors duration-300">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Cargando facturas...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                    <button
                      onClick={cargarCompras}
                      className="mt-4 text-biskoto hover:underline font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : comprasFiltradas.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? "No hay coincidencias."
                        : "No se han registrado compras aún."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Factura / Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                          Proveedor
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Total
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {comprasFiltradas.map((compra) => (
                        <tr
                          key={compra.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-biskoto/10 dark:bg-white/10 rounded-lg flex items-center justify-center text-biskoto dark:text-white">
                                <Receipt className="h-5 w-5" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  #{compra.id}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar size={12} />{" "}
                                  {formatDate(compra.fecha_compra)}
                                </div>
                                {/* Proveedor visible solo en móvil debajo del ID */}
                                <div className="text-xs text-biskoto dark:text-gray-400 md:hidden mt-1 flex items-center gap-1 font-medium">
                                  <User size={12} />{" "}
                                  {compra.proveedores?.nombre}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell font-medium">
                            {compra.proveedores?.nombre}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge variant="brand">
                              {formatCurrency(compra.monto_total)}
                            </StatusBadge>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <TableActions
                              editLink={`/admin/compras/editar/${compra.id}`}
                              viewLink={`/admin/compras/${compra.id}`}
                              onDelete={() => handleDeleteClick(compra)}
                              deleteTitle="Anular compra"
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

      <ConfirmModal
        isOpen={!!compraToDelete}
        onClose={() => setCompraToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Anular registro de compra?"
        message={
          compraToDelete && (
            <>
              Se eliminará la factura{" "}
              <span className="font-bold">#{compraToDelete.id}</span>.
              <br />
              <span className="text-red-500 font-medium text-sm mt-2 block">
                El stock de los ingredientes asociados se restará
                automáticamente.
              </span>
            </>
          )
        }
      />
    </div>
  );
};

export default ComprasPage;
