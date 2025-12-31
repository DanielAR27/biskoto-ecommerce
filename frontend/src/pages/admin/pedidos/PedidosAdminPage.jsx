import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Calendar,
  User,
  CreditCard,
  Eye,
  Filter,
  Loader2,
  AlertCircle,
  ChevronDown,
  Edit, // 👈 NUEVO
  Trash2, // 👈 NUEVO
  X, // 👈 NUEVO
  Save, // 👈 NUEVO
  ChevronLeft, // 👈 NUEVO
  ChevronRight, // 👈 NUEVO
} from "lucide-react";

import {
  getTodosPedidos,
  actualizarEstadoPedido,
  actualizarPedido, // 👈 NUEVO
  eliminarPedido, // 👈 NUEVO
} from "../../../api/pedidoService";
import Navbar from "../../../components/Navbar";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";

/**
 * Panel Admin - Gestión de Pedidos COMPLETO
 * CRUD Completo con paginación, edición y eliminación
 */
const PedidosAdminPage = () => {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  // 👇 NUEVO: Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [pedidosPorPagina] = useState(15);

  // 👇 NUEVO: Modal de edición
  const [modalEditar, setModalEditar] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // 👇 NUEVO: Modal de confirmación eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [pedidoEliminar, setPedidoEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados disponibles
  const estados = [
    { id: 1, nombre: "Pendiente de Pago", color: "warning" },
    { id: 2, nombre: "Confirmado", color: "info" },
    { id: 3, nombre: "En Producción", color: "brand" },
    { id: 4, nombre: "Listo para Retiro", color: "warning" },
    { id: 5, nombre: "Entregado", color: "success" },
    { id: 6, nombre: "Cancelado", color: "error" },
  ];

  /**
   * Cargar todos los pedidos
   */
  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setLoading(true);
        const data = await getTodosPedidos();
        setPedidos(data);
        setPedidosFiltrados(data);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
        setError("No se pudieron cargar los pedidos.");
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  /**
   * Filtrar pedidos por búsqueda y estado
   */
  useEffect(() => {
    let resultado = pedidos;

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(
        (p) => p.estado_id === parseInt(filtroEstado)
      );
    }

    // Filtro por búsqueda (ID, nombre cliente, email)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.id.toString().includes(term) ||
          p.perfiles?.nombre?.toLowerCase().includes(term) ||
          p.perfiles?.apellido?.toLowerCase().includes(term) ||
          p.perfiles?.email?.toLowerCase().includes(term)
      );
    }

    setPedidosFiltrados(resultado);
    setPaginaActual(1); // 👈 NUEVO: Reset a página 1 al filtrar
  }, [searchTerm, filtroEstado, pedidos]);

  // 👇 NUEVO: Lógica de paginación
  const indiceUltimo = paginaActual * pedidosPorPagina;
  const indicePrimero = indiceUltimo - pedidosPorPagina;
  const pedidosActuales = pedidosFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Cambiar estado de un pedido
   */
  const handleCambiarEstado = async (pedidoId, nuevoEstadoId) => {
    setActualizandoEstado(pedidoId);

    try {
      await actualizarEstadoPedido(pedidoId, nuevoEstadoId);

      // Actualizar localmente
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoId
            ? {
                ...p,
                estado_id: nuevoEstadoId,
                estados_pedido: estados.find((e) => e.id === nuevoEstadoId),
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error al cambiar el estado del pedido");
    } finally {
      setActualizandoEstado(null);
    }
  };

  // 👇 NUEVO: Abrir modal de edición
  const abrirModalEditar = (pedido) => {
    setPedidoEditando({
      id: pedido.id,
      total: pedido.total,
      cupon_id: pedido.cupon_id,
      notas: pedido.notas || {},
    });
    setModalEditar(true);
  };

  // 👇 NUEVO: Guardar cambios del pedido
  const guardarEdicion = async () => {
    if (!pedidoEditando) return;

    setGuardandoEdicion(true);

    try {
      const data = {
        total: parseFloat(pedidoEditando.total),
        cupon_id: pedidoEditando.cupon_id || null,
        notas: pedidoEditando.notas,
      };

      await actualizarPedido(pedidoEditando.id, data);

      // Actualizar localmente
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoEditando.id ? { ...p, ...data } : p))
      );

      setModalEditar(false);
      setPedidoEditando(null);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      alert("Error al guardar los cambios");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // 👇 NUEVO: Abrir modal de confirmación eliminar
  const abrirModalEliminar = (pedido) => {
    setPedidoEliminar(pedido);
    setModalEliminar(true);
  };

  // 👇 NUEVO: Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!pedidoEliminar) return;

    setEliminando(true);

    try {
      await eliminarPedido(pedidoEliminar.id);

      // Eliminar localmente
      setPedidos((prev) => prev.filter((p) => p.id !== pedidoEliminar.id));

      setModalEliminar(false);
      setPedidoEliminar(null);
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert(error.response?.data?.error || "Error al eliminar el pedido");
    } finally {
      setEliminando(false);
    }
  };

  /**
   * Ver detalle del pedido
   */
  const verDetalle = (pedidoId) => {
    navigate(`/pedido/${pedidoId}`);
  };

  /**
   * Formatear fecha
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-CR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Obtener clases de color según estado
   */
  const getEstadoClasses = (color) => {
    const classes = {
      success:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
      error:
        "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
      warning:
        "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
      info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      brand:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    };
    return (
      classes[color] ||
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            CRUD Completo - Administra todos los pedidos del sistema
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-slate-800 rounded-t-xl shadow-sm border-b border-gray-200 dark:border-slate-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Búsqueda */}
            <div className="w-full sm:w-auto flex-1 max-w-md">
              <TableSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Buscar por ID, cliente, email..."
                resultCount={pedidosFiltrados.length}
              />
            </div>

            {/* 👇 NUEVO: Contador de resultados */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {indicePrimero + 1}-
              {Math.min(indiceUltimo, pedidosFiltrados.length)} de{" "}
              {pedidosFiltrados.length}
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent text-sm"
              >
                <option value="todos">Todos los estados</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle
              className="text-red-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabla de pedidos */}
        {pedidosActuales.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm p-12 text-center">
            <Package
              className="mx-auto mb-4 text-gray-300 dark:text-slate-600"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No hay pedidos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filtroEstado !== "todos"
                ? "No se encontraron pedidos con los filtros aplicados"
                : "Todavía no hay pedidos en el sistema"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {pedidosActuales.map((pedido) => {
                      {
                        /* 👈 CAMBIADO: pedidosFiltrados → pedidosActuales */
                      }
                      const estadoActual = estados.find(
                        (e) => e.id === pedido.estado_id
                      );

                      return (
                        <tr
                          key={pedido.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          {/* ID del Pedido */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package
                                size={16}
                                className="text-biskoto mr-2"
                              />
                              <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                #{pedido.id.toString().padStart(6, "0")}
                              </span>
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <User
                                size={16}
                                className="text-gray-400 mr-2 flex-shrink-0"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pedido.perfiles?.nombre}{" "}
                                  {pedido.perfiles?.apellido}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {pedido.perfiles?.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Fecha */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Calendar size={14} className="mr-2" />
                              {formatearFecha(pedido.fecha)}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <CreditCard
                                size={14}
                                className="text-gray-400 mr-2"
                              />
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat("es-CR", {
                                  style: "currency",
                                  currency: "CRC",
                                }).format(pedido.total)}
                              </span>
                            </div>
                          </td>

                          {/* Estado (Dropdown) */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative">
                              <select
                                value={pedido.estado_id}
                                onChange={(e) =>
                                  handleCambiarEstado(
                                    pedido.id,
                                    parseInt(e.target.value)
                                  )
                                }
                                disabled={
                                  actualizandoEstado === pedido.id ||
                                  pedido.estado_id === 6
                                }
                                className={`appearance-none px-3 py-1.5 pr-8 text-xs font-semibold rounded-full border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getEstadoClasses(
                                  estadoActual?.color
                                )}`}
                              >
                                {estados.map((estado) => (
                                  <option key={estado.id} value={estado.id}>
                                    {estado.nombre}
                                  </option>
                                ))}
                              </select>
                              {actualizandoEstado === pedido.id ? (
                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin pointer-events-none" />
                              ) : pedido.estado_id === 6 ? null : (
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                              )}
                            </div>
                          </td>

                          {/* 👇 CAMBIADO: Acciones - Ahora con 3 botones */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => verDetalle(pedido.id)}
                                className="p-2 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-white/20"
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => abrirModalEditar(pedido)}
                                className="p-2 text-green-600 bg-green-50 dark:text-green-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-green-100 dark:hover:bg-white/20"
                                title="Editar pedido"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => abrirModalEliminar(pedido)}
                                disabled={![1, 6].includes(pedido.estado_id)}
                                className="p-2 text-red-600 bg-red-50 dark:text-red-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  [1, 6].includes(pedido.estado_id)
                                    ? "Eliminar pedido"
                                    : "Solo se pueden eliminar pedidos Pendientes o Cancelados"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 👇 NUEVO: Paginación */}
            {totalPaginas > 1 && (
              <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-b-xl shadow-sm border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Página {paginaActual} de {totalPaginas}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {[...Array(totalPaginas)].map((_, index) => {
                      const numeroPagina = index + 1;
                      // Mostrar solo algunas páginas alrededor de la actual
                      if (
                        numeroPagina === 1 ||
                        numeroPagina === totalPaginas ||
                        (numeroPagina >= paginaActual - 1 &&
                          numeroPagina <= paginaActual + 1)
                      ) {
                        return (
                          <button
                            key={numeroPagina}
                            onClick={() => cambiarPagina(numeroPagina)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              paginaActual === numeroPagina
                                ? "bg-biskoto text-white"
                                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {numeroPagina}
                          </button>
                        );
                      } else if (
                        numeroPagina === paginaActual - 2 ||
                        numeroPagina === paginaActual + 2
                      ) {
                        return (
                          <span key={numeroPagina} className="px-2">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Resumen */}
        {pedidos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {estados.map((estado) => {
              const count = pedidos.filter(
                (p) => p.estado_id === estado.id
              ).length;
              if (count === 0) return null;

              return (
                <div
                  key={estado.id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-slate-700"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {estado.nombre}
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {count}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 👇 NUEVO: Modal de Edición */}
      {modalEditar && pedidoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Pedido #{pedidoEditando.id}
              </h3>
              <button
                onClick={() => setModalEditar(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total (₡)
                </label>
                <input
                  type="number"
                  value={pedidoEditando.total}
                  onChange={(e) =>
                    setPedidoEditando((prev) => ({
                      ...prev,
                      total: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notas Administrativas
                </label>
                <textarea
                  value={pedidoEditando.notas?.admin || ""}
                  onChange={(e) =>
                    setPedidoEditando((prev) => ({
                      ...prev,
                      notas: { ...prev.notas, admin: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Notas internas sobre el pedido..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalEditar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdicion}
                className="flex-1 px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardandoEdicion ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👇 NUEVO: Modal de Confirmación Eliminar */}
      {modalEliminar && pedidoEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              ¿Eliminar Pedido?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Estás a punto de eliminar el pedido{" "}
              <strong>#{pedidoEliminar.id}</strong>. Esta acción no se puede
              deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosAdminPage;
