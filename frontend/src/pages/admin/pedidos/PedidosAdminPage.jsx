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
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Upload,
} from "lucide-react";

import {
  getTodosPedidos,
  actualizarEstadoPedido,
  actualizarPedido,
  eliminarPedido,
} from "../../../api/pedidoService";
import TableSearch from "../../../components/TableSearch";
import ConfirmModal from "../../../components/ConfirmModal"

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

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [pedidosPorPagina] = useState(15);

  // Modal de edición
  const [modalEditar, setModalEditar] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Modal de confirmación eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [pedidoEliminar, setPedidoEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Modal de completar pago
  const [modalCompletarPago, setModalCompletarPago] = useState(false);
  const [pedidoCompletarPago, setPedidoCompletarPago] = useState(null);
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [completandoPago, setCompletandoPago] = useState(false);

  // Estados disponibles
  const estados = [
    { id: 1, nombre: "Pendiente de Pago", color: "gray" },
    { id: 2, nombre: "Confirmado", color: "info" },
    { id: 3, nombre: "En Producción", color: "brand" },
    { id: 4, nombre: "Listo para Retiro", color: "purple" },
    { id: 5, nombre: "Entregado", color: "success" },
    { id: 6, nombre: "Cancelado", color: "error" },
    { id: 7, nombre: "Pago Parcial", color: "warning" },
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
        (p) => p.estado_id === parseInt(filtroEstado),
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
          p.perfiles?.email?.toLowerCase().includes(term),
      );
    }

    setPedidosFiltrados(resultado);
    setPaginaActual(1); // Reset a página 1 al filtrar
  }, [searchTerm, filtroEstado, pedidos]);

  // Lógica de paginación
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
            : p,
        ),
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error al cambiar el estado del pedido");
    } finally {
      setActualizandoEstado(null);
    }
  };

  //  Abrir modal de edición
  const abrirModalEditar = (pedido) => {
    setPedidoEditando({
      id: pedido.id,
      total: pedido.total,
      cupon_id: pedido.cupon_id,
      notas: pedido.notas || {},
    });
    setModalEditar(true);
  };

  //  NUEVO: Guardar cambios del pedido
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
        prev.map((p) => (p.id === pedidoEditando.id ? { ...p, ...data } : p)),
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

  //  Abrir modal de confirmación eliminar
  const abrirModalEliminar = (pedido) => {
    setPedidoEliminar(pedido);
    setModalEliminar(true);
  };

  // Confirmar eliminación
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
   * Abrir modal para completar pago restante
   */
  const abrirModalCompletarPago = (pedido) => {
    setPedidoCompletarPago(pedido);
    setModalCompletarPago(true);
    setArchivoComprobante(null);
  };

  /**
   * Manejar selección de comprobante
   */
  const handleSeleccionarComprobante = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar tipo
    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!tiposPermitidos.includes(archivo.type)) {
      alert("Solo se permiten imágenes (JPG, PNG, WebP) o PDF");
      return;
    }

    // Validar tamaño (5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      alert("El archivo no debe superar 5MB");
      return;
    }

    setArchivoComprobante(archivo);
  };

  /**
   * Completar el pago restante
   */
  const completarPagoRestante = async () => {
    if (!pedidoCompletarPago) return;

    setCompletandoPago(true);

    try {
      let comprobanteUrl = null;

      // Si hay comprobante, subirlo primero
      if (archivoComprobante) {
        const extension = archivoComprobante.name.split(".").pop();
        const nombreArchivo = `comprobante-restante-${
          pedidoCompletarPago.id
        }-${Date.now()}.${extension}`;

        // Solicitar URL firmada
        const responseUrl = await fetch(
          `${import.meta.env.VITE_API_URL}/storage/signed-upload`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ fileName: nombreArchivo }),
          },
        );

        if (!responseUrl.ok) throw new Error("Error al obtener URL de subida");

        const { signedUrl, path, bucket } = await responseUrl.json();

        // Subir archivo
        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: archivoComprobante,
          headers: { "Content-Type": archivoComprobante.type },
        });

        if (!uploadResponse.ok) throw new Error("Error al subir archivo");

        comprobanteUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/storage/v1/object/public/${bucket}/${path}`;
      }

      // Llamar al endpoint de completar pago
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pedidos/${
          pedidoCompletarPago.id
        }/completar-pago`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ comprobante_url: comprobanteUrl }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al completar pago");
      }

      // Actualizar localmente
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoCompletarPago.id
            ? {
                ...p,
                estado_id: 2, // Confirmado
                pago_completo: true,
                monto_pagado: p.total,
                monto_pendiente: 0,
              }
            : p,
        ),
      );

      alert("Pago completado exitosamente");
      setModalCompletarPago(false);
      setPedidoCompletarPago(null);
      setArchivoComprobante(null);
    } catch (error) {
      console.error("Error al completar pago:", error);
      alert(error.message || "Error al completar el pago");
    } finally {
      setCompletandoPago(false);
    }
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
   * Obtener clases de color con MEJOR CONTRASTE para Dark Mode
   */
  const getEstadoClasses = (color) => {
    const classes = {
      success:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      error:
        "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
      warning:
        "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      info: 
        "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      brand:
        "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      purple:
        "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
      gray:
        "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
    };
    return (
      classes[color] || classes.gray
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra todos los pedidos del sistema
          </p>
        </div>

        {/* Resumen */}
        {pedidos.length > 0 && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {estados.map((estado) => {
              const count = pedidos.filter(
                (p) => p.estado_id === estado.id,
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

{/* Filtros y búsqueda */}
        <div className="bg-white dark:bg-slate-800 rounded-t-xl shadow-sm border-b border-gray-200 dark:border-slate-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            
            {/* GRUPO IZQUIERDO: Buscador + Texto pegadito con Tab */}
            <div className="w-full sm:flex-1 flex flex-col sm:flex-row items-start sm:items-center">
              
              {/* 1. Buscador */}
{/* Este contenedor debe ser flex-1 para que la barra de búsqueda se estire */}
  <div className="flex-1 w-full max-w-2xl"> 
    <TableSearch
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      placeholder="Buscar por ID, cliente, email..."
      resultCount={pedidosFiltrados.length}
    />
  </div>
            </div>

            {/* GRUPO DERECHO: Filtro */}
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent text-sm"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pago
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
                        (e) => e.id === pedido.estado_id,
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
                                    parseInt(e.target.value),
                                  )
                                }
                                disabled={
                                  actualizandoEstado === pedido.id ||
                                  pedido.estado_id === 6
                                }
                                className={`appearance-none px-3 py-1.5 pr-8 text-xs font-bold rounded-full border cursor-pointer transition-all focus:ring-2 focus:ring-offset-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${getEstadoClasses(
                                  estadoActual?.color,
                                )}`}
                              >
                                {/* Mapeamos los estados FILTRANDO el ID 1 */}
                                {estados
                                  .filter((e) => e.id !== 1) // <--- ESTO OCULTA "PENDIENTE"
                                  .map((estado) => (
                                    <option key={estado.id} value={estado.id} className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">
                                      {estado.nombre}
                                    </option>
                                  ))}
                              </select>
                              
                              {/* Icono de carga o flecha */}
                              {actualizandoEstado === pedido.id ? (
                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin pointer-events-none opacity-50" />
                              ) : pedido.estado_id === 6 ? null : (
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
                              )}
                            </div>
                          </td>

                          {/* Columna de Estado de Pago */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {pedido.requiere_adelanto ? (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                    pedido.pago_completo
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}
                                >
                                  {pedido.pago_completo ? (
                                    <>
                                      <CheckCircle size={12} />
                                      Completo
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard size={12} />
                                      Parcial {pedido.porcentaje_adelanto}%
                                    </>
                                  )}
                                </span>
                                {!pedido.pago_completo && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Pendiente:{" "}
                                    {new Intl.NumberFormat("es-CR", {
                                      style: "currency",
                                      currency: "CRC",
                                    }).format(pedido.monto_pendiente)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                <CheckCircle size={12} />
                                Completo
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => verDetalle(pedido.id)}
                                className="p-2 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-white/20"
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {/* Botón Completar Pago (solo para pedidos con pago parcial) */}
                              {pedido.requiere_adelanto &&
                                !pedido.pago_completo && (
                                  <button
                                    onClick={() =>
                                      abrirModalCompletarPago(pedido)
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                                  >
                                    <CheckCircle size={16} />
                                    Completar Pago
                                  </button>
                                )}
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

            {/* Paginación */}
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

      </main>

      {/* Modal de Edición */}
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

      <ConfirmModal
        isOpen={modalEliminar}
        onClose={() => setModalEliminar(false)}
        onConfirm={confirmarEliminar}
        title="¿Eliminar Pedido?"
        message={
          pedidoEliminar ? (
            <span>
              Estás a punto de eliminar el pedido <strong className="text-gray-900 dark:text-white">#{pedidoEliminar.id}</strong>. 
              Esta acción no se puede deshacer.
            </span>
          ) : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={eliminando}
      />

      {/*  NUEVO: Modal de Completar Pago */}
      {modalCompletarPago && pedidoCompletarPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Completar Pago - Pedido #{pedidoCompletarPago.id}
              </h3>
              <button
                onClick={() => {
                  setModalCompletarPago(false);
                  setPedidoCompletarPago(null);
                  setArchivoComprobante(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {/* Información del pago */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total del pedido:
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("es-CR", {
                    style: "currency",
                    currency: "CRC",
                  }).format(pedidoCompletarPago.total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ya pagado ({pedidoCompletarPago.porcentaje_adelanto}%):
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat("es-CR", {
                    style: "currency",
                    currency: "CRC",
                  }).format(pedidoCompletarPago.monto_adelanto)}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    Monto restante:
                  </span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat("es-CR", {
                      style: "currency",
                      currency: "CRC",
                    }).format(pedidoCompletarPago.monto_pendiente)}
                  </span>
                </div>
              </div>
            </div>

            {/* Subir comprobante (opcional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comprobante de Pago (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 hover:border-biskoto dark:hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleSeleccionarComprobante}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-biskoto file:text-white
                    hover:file:bg-biskoto-dark
                    file:cursor-pointer file:transition-all"
                />
              </div>
              {archivoComprobante && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className="text-green-600 dark:text-green-400"
                      size={20}
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {archivoComprobante.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setArchivoComprobante(null)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Formatos: JPG, PNG, WebP, PDF (máx. 5MB)
              </p>
            </div>

            {/* Nota informativa */}
            <div className="mb-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-300">
                <strong>Nota:</strong> Al confirmar, el pedido pasará al estado
                "Confirmado" y se marcará como pagado completamente.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalCompletarPago(false);
                  setPedidoCompletarPago(null);
                  setArchivoComprobante(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={completarPagoRestante}
                disabled={completandoPago}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
              >
                {completandoPago ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Pago Completo
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
