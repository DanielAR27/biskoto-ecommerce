import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Calendar,
  Edit,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import {
  getComentariosPorNoticia,
  crearComentario,
  actualizarComentario,
  eliminarComentario,
} from "../api/comentarioService";

/**
 * Sección de Comentarios
 * Muestra comentarios aprobados y permite crear/editar/eliminar propios comentarios
 */
const ComentariosSection = ({ noticiaId }) => {
  const { user } = useAuth();

  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Nuevo comentario
  const [nuevoComentario, setNuevoComentario] = useState("");

  // Editar comentario
  const [editando, setEditando] = useState(null);
  const [contenidoEditado, setContenidoEditado] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Eliminar comentario
  const [eliminando, setEliminando] = useState(null);

  /**
   * Cargar comentarios de la noticia
   */
  useEffect(() => {
    cargarComentarios();
  }, [noticiaId]);

  const cargarComentarios = async () => {
    try {
      setLoading(true);
      const data = await getComentariosPorNoticia(noticiaId);
      // Solo mostrar comentarios aprobados (o propios aunque estén pendientes)
      const comentariosFiltrados = data.filter(
        (c) => c.estado === "aprobado" || c.usuario_id === user?.id
      );
      setComentarios(comentariosFiltrados);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enviar nuevo comentario
   */
  const handleEnviar = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Debes iniciar sesión para comentar");
      return;
    }

    if (!nuevoComentario.trim()) {
      alert("El comentario no puede estar vacío");
      return;
    }

    setEnviando(true);

    try {
      await crearComentario({
        noticia_id: noticiaId,
        contenido: nuevoComentario,
      });

      setNuevoComentario("");
      await cargarComentarios();
    } catch (error) {
      console.error("Error al crear comentario:", error);
      alert("Error al enviar el comentario");
    } finally {
      setEnviando(false);
    }
  };

  /**
   * Iniciar edición
   */
  const iniciarEdicion = (comentario) => {
    setEditando(comentario.id);
    setContenidoEditado(comentario.contenido);
  };

  /**
   * Guardar edición
   */
  const guardarEdicion = async (comentarioId) => {
    if (!contenidoEditado.trim()) {
      alert("El comentario no puede estar vacío");
      return;
    }

    setGuardandoEdicion(true);

    try {
      await actualizarComentario(comentarioId, {
        contenido: contenidoEditado,
      });

      setEditando(null);
      setContenidoEditado("");
      await cargarComentarios();
    } catch (error) {
      console.error("Error al actualizar comentario:", error);
      alert("Error al guardar el comentario");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  /**
   * Cancelar edición
   */
  const cancelarEdicion = () => {
    setEditando(null);
    setContenidoEditado("");
  };

  /**
   * Eliminar comentario
   */
  const handleEliminar = async (comentarioId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      return;
    }

    setEliminando(comentarioId);

    try {
      await eliminarComentario(comentarioId);
      await cargarComentarios();
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      alert("Error al eliminar el comentario");
    } finally {
      setEliminando(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="text-biskoto" size={24} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Comentarios ({comentarios.length})
        </h2>
      </div>

      {/* Formulario para nuevo comentario */}
      {user ? (
        <form
          onSubmit={handleEnviar}
          className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-biskoto text-white rounded-full flex items-center justify-center font-bold">
              {user.nombre?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <textarea
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent resize-none"
                rows="3"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={enviando || !nuevoComentario.trim()}
                  className="px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Comentar
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Tu comentario será visible después de ser aprobado por un
                moderador.
              </p>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Debes iniciar sesión para dejar un comentario
          </p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      )}

      {/* Lista de comentarios */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 text-biskoto animate-spin" />
        </div>
      ) : comentarios.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <MessageSquare
            className="mx-auto mb-3 text-gray-300 dark:text-slate-600"
            size={48}
          />
          <p>No hay comentarios todavía</p>
          <p className="text-sm mt-1">¡Sé el primero en comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comentarios.map((comentario) => {
            const esPropioComentario =
              user && comentario.usuario_id === user.id;
            const estaEditando = editando === comentario.id;

            return (
              <div
                key={comentario.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center font-bold">
                    {comentario.perfiles?.nombre?.charAt(0) || "U"}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {comentario.perfiles?.nombre || "Usuario"}
                          {esPropioComentario && (
                            <span className="ml-2 text-xs text-biskoto">
                              (Tú)
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} />
                          <span>{formatearFecha(comentario.fecha)}</span>
                          {comentario.estado === "pendiente" && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                              Pendiente de aprobación
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones (solo para comentarios propios) */}
                      {esPropioComentario && !estaEditando && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => iniciarEdicion(comentario)}
                            className="p-1.5 text-gray-500 hover:text-biskoto transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleEliminar(comentario.id)}
                            disabled={eliminando === comentario.id}
                            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            {eliminando === comentario.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contenido del comentario */}
                    {estaEditando ? (
                      <div className="space-y-2">
                        <textarea
                          value={contenidoEditado}
                          onChange={(e) => setContenidoEditado(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent resize-none"
                          rows="3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => guardarEdicion(comentario.id)}
                            disabled={guardandoEdicion}
                            className="px-3 py-1.5 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                          >
                            {guardandoEdicion ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save size={14} />
                                Guardar
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comentario.contenido}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComentariosSection;
