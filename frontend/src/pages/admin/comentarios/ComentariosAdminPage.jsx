import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Newspaper,
} from "lucide-react";

import {
  getTodosComentarios,
  aprobarComentario,
  rechazarComentario,
  eliminarComentario,
} from "../../../api/comentarioService";
import Navbar from "../../../components/Navbar";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";

/**
 * Panel Admin - Gestión de Comentarios (CRUD Completo + Moderación)
 * Aprobar, Rechazar, Eliminar comentarios
 */
const ComentariosAdminPage = () => {
  const [comentarios, setComentarios] = useState([]);
  const [comentariosFiltrados, setComentariosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [procesando, setProcesando] = useState(null);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [comentarioEliminar, setComentarioEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Modal ver comentario completo
  const [modalVer, setModalVer] = useState(false);
  const [comentarioVer, setComentarioVer] = useState(null);

  const estados = [
    { value: "todos", label: "Todos" },
    { value: "pendiente", label: "Pendientes" },
    { value: "aprobado", label: "Aprobados" },
    { value: "rechazado", label: "Rechazados" },
  ];

  /**
   * Cargar comentarios
   */
  useEffect(() => {
    cargarComentarios();
  }, []);

  const cargarComentarios = async () => {
    try {
      setLoading(true);
      const data = await getTodosComentarios();
      setComentarios(data);
      setComentariosFiltrados(data);
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
      setError("No se pudieron cargar los comentarios.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtrar comentarios
   */
  useEffect(() => {
    let resultado = comentarios;

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((c) => c.estado === filtroEstado);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (c) =>
          c.contenido.toLowerCase().includes(term) ||
          c.perfiles?.nombre?.toLowerCase().includes(term) ||
          c.perfiles?.email?.toLowerCase().includes(term) ||
          c.noticias?.titulo?.toLowerCase().includes(term)
      );
    }

    setComentariosFiltrados(resultado);
  }, [searchTerm, filtroEstado, comentarios]);

  /**
   * Aprobar comentario
   */
  const handleAprobar = async (comentarioId) => {
    setProcesando(comentarioId);
    try {
      await aprobarComentario(comentarioId);
      await cargarComentarios();
    } catch (error) {
      console.error("Error al aprobar comentario:", error);
      alert("Error al aprobar el comentario");
    } finally {
      setProcesando(null);
    }
  };

  /**
   * Rechazar comentario
   */
  const handleRechazar = async (comentarioId) => {
    setProcesando(comentarioId);
    try {
      await rechazarComentario(comentarioId);
      await cargarComentarios();
    } catch (error) {
      console.error("Error al rechazar comentario:", error);
      alert("Error al rechazar el comentario");
    } finally {
      setProcesando(null);
    }
  };

  /**
   * Confirmar eliminación
   */
  const confirmarEliminar = async () => {
    if (!comentarioEliminar) return;

    setEliminando(true);
    try {
      await eliminarComentario(comentarioEliminar.id);
      await cargarComentarios();
      setModalEliminar(false);
      setComentarioEliminar(null);
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      alert("Error al eliminar el comentario");
    } finally {
      setEliminando(false);
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
   * Obtener badge de estado
   */
  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { variant: "warning", label: "Pendiente" },
      aprobado: { variant: "success", label: "Aprobado" },
      rechazado: { variant: "error", label: "Rechazado" },
    };
    return badges[estado] || badges.pendiente;
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
            Gestión de Comentarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modera y administra los comentarios de las noticias
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Pendientes
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {comentarios.filter((c) => c.estado === "pendiente").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Aprobados
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {comentarios.filter((c) => c.estado === "aprobado").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Rechazados
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {comentarios.filter((c) => c.estado === "rechazado").length}
            </p>
          </div>
        </div>

        {/* Búsqueda */}
        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Buscar por contenido, usuario, noticia..."
          resultCount={comentariosFiltrados.length}
        />

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex justify-end shadow-sm">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent text-sm"
          >
            {estados.map((estado) => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </select>
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

        {/* Tabla de comentarios */}
        {comentariosFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm p-12 text-center">
            <MessageSquare
              className="mx-auto mb-4 text-gray-300 dark:text-slate-600"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No hay comentarios
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filtroEstado !== "todos"
                ? "No se encontraron comentarios con los filtros aplicados"
                : "Todavía no hay comentarios en las noticias"}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Comentario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Noticia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
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
                  {comentariosFiltrados.map((comentario) => {
                    const estadoBadge = getEstadoBadge(comentario.estado);

                    return (
                      <tr
                        key={comentario.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {/* Comentario */}
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {comentario.contenido}
                          </p>
                          <button
                            onClick={() => {
                              setComentarioVer(comentario);
                              setModalVer(true);
                            }}
                            className="text-xs text-biskoto hover:underline mt-1"
                          >
                            Ver completo
                          </button>
                        </td>

                        {/* Usuario */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {comentario.perfiles?.nombre || "Usuario"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {comentario.perfiles?.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Noticia */}
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-center gap-2">
                            <Newspaper
                              size={16}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {comentario.noticias?.titulo ||
                                "Noticia eliminada"}
                            </p>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatearFecha(comentario.fecha)}
                            </span>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge variant={estadoBadge.variant}>
                            {estadoBadge.label}
                          </StatusBadge>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {comentario.estado === "pendiente" && (
                              <>
                                <button
                                  onClick={() => handleAprobar(comentario.id)}
                                  disabled={procesando === comentario.id}
                                  className="p-2 text-green-600 bg-green-50 dark:text-green-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-green-100 dark:hover:bg-white/20 disabled:opacity-50"
                                  title="Aprobar"
                                >
                                  {procesando === comentario.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRechazar(comentario.id)}
                                  disabled={procesando === comentario.id}
                                  className="p-2 text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-orange-100 dark:hover:bg-white/20 disabled:opacity-50"
                                  title="Rechazar"
                                >
                                  {procesando === comentario.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setComentarioEliminar(comentario);
                                setModalEliminar(true);
                              }}
                              className="p-2 text-red-600 bg-red-50 dark:text-red-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-white/20"
                              title="Eliminar"
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
        )}
      </main>

      {/* Modal Ver Comentario Completo */}
      {modalVer && comentarioVer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Comentario Completo
              </h3>
              <button
                onClick={() => setModalVer(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Usuario */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Usuario:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {comentarioVer.perfiles?.nombre} (
                  {comentarioVer.perfiles?.email})
                </p>
              </div>

              {/* Noticia */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Noticia:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {comentarioVer.noticias?.titulo || "Noticia eliminada"}
                </p>
              </div>

              {/* Fecha */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha:
                </p>
                <p className="text-gray-900 dark:text-white">
                  {formatearFecha(comentarioVer.fecha)}
                </p>
              </div>

              {/* Contenido */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Contenido:
                </p>
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {comentarioVer.contenido}
                  </p>
                </div>
              </div>

              {/* Estado */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estado:
                </p>
                <StatusBadge
                  variant={getEstadoBadge(comentarioVer.estado).variant}
                >
                  {getEstadoBadge(comentarioVer.estado).label}
                </StatusBadge>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setModalVer(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && comentarioEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              ¿Eliminar Comentario?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Esta acción no se puede deshacer.
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

export default ComentariosAdminPage;
