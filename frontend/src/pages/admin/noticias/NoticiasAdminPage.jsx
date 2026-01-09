import { useState, useEffect } from "react";
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  X,
  Save,
  Search,
  Filter,
} from "lucide-react";

import {
  getNoticias,
  crearNoticia,
  actualizarNoticia,
  eliminarNoticia,
} from "../../../api/noticiaService";
import Navbar from "../../../components/Navbar";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";

/**
 * Panel Admin - Gestión de Noticias (CRUD Completo)
 * Create, Read, Update, Delete de noticias
 */
const NoticiasAdminPage = () => {
  const [noticias, setNoticias] = useState([]);
  const [noticiasFiltradas, setNoticiasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  // Modal crear/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [noticiaEditando, setNoticiaEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(false);
  const [noticiaEliminar, setNoticiaEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  // Modal ver noticia
  const [modalVer, setModalVer] = useState(false);
  const [noticiaVer, setNoticiaVer] = useState(null);

  // Categorías disponibles
  const categorias = [
    { value: "promocion", label: "Promoción" },
    { value: "receta", label: "Receta" },
    { value: "evento", label: "Evento" },
    { value: "general", label: "General" },
  ];

  /**
   * Cargar noticias
   */
  useEffect(() => {
    cargarNoticias();
  }, []);

  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const data = await getNoticias();
      setNoticias(data);
      setNoticiasFiltradas(data);
    } catch (err) {
      console.error("Error al cargar noticias:", err);
      setError("No se pudieron cargar las noticias.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtrar noticias
   */
  useEffect(() => {
    let resultado = noticias;

    // Filtro por categoría
    if (filtroCategoria !== "todas") {
      resultado = resultado.filter((n) => n.categoria === filtroCategoria);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          n.titulo.toLowerCase().includes(term) ||
          n.extracto?.toLowerCase().includes(term)
      );
    }

    setNoticiasFiltradas(resultado);
  }, [searchTerm, filtroCategoria, noticias]);

  /**
   * Abrir modal para crear
   */
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setNoticiaEditando({
      titulo: "",
      extracto: "",
      contenido: "",
      categoria: "general",
      imagen_url: "",
      activo: true,
    });
    setModalAbierto(true);
  };

  /**
   * Abrir modal para editar
   */
  const abrirModalEditar = (noticia) => {
    setModoEdicion(true);
    setNoticiaEditando({
      id: noticia.id,
      titulo: noticia.titulo,
      extracto: noticia.extracto || "",
      contenido: noticia.contenido,
      categoria: noticia.categoria,
      imagen_url: noticia.imagen_url || "",
      activo: noticia.activo,
    });
    setModalAbierto(true);
  };

  /**
   * Guardar noticia (crear o actualizar)
   */
  const handleGuardar = async () => {
    if (!noticiaEditando.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!noticiaEditando.contenido.trim()) {
      alert("El contenido es obligatorio");
      return;
    }

    setGuardando(true);

    try {
      if (modoEdicion) {
        // Actualizar
        await actualizarNoticia(noticiaEditando.id, noticiaEditando);
      } else {
        // Crear
        await crearNoticia(noticiaEditando);
      }

      await cargarNoticias();
      setModalAbierto(false);
      setNoticiaEditando(null);
    } catch (error) {
      console.error("Error al guardar noticia:", error);
      alert("Error al guardar la noticia");
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Confirmar eliminación
   */
  const confirmarEliminar = async () => {
    if (!noticiaEliminar) return;

    setEliminando(true);

    try {
      await eliminarNoticia(noticiaEliminar.id);
      await cargarNoticias();
      setModalEliminar(false);
      setNoticiaEliminar(null);
    } catch (error) {
      console.error("Error al eliminar noticia:", error);
      alert("Error al eliminar la noticia");
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
      month: "long",
      day: "numeric",
    });
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Gestión de Noticias
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              CRUD Completo - Blog de noticias y novedades
            </p>
          </div>
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Noticia
          </button>
        </div>

        {/* Búsqueda y Filtros */}
        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholder="Buscar por título o extracto..."
          resultCount={noticiasFiltradas.length}
        />

        <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700 flex justify-end shadow-sm">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent text-sm"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
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

        {/* Tabla de noticias */}
        {noticiasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm p-12 text-center">
            <Newspaper
              className="mx-auto mb-4 text-gray-300 dark:text-slate-600"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No hay noticias
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filtroCategoria !== "todas"
                ? "No se encontraron noticias con los filtros aplicados"
                : "Todavía no hay noticias publicadas"}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Noticia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
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
                  {noticiasFiltradas.map((noticia) => (
                    <tr
                      key={noticia.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      {/* Noticia */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {noticia.imagen_url && (
                            <img
                              src={noticia.imagen_url}
                              alt={noticia.titulo}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {noticia.titulo}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {noticia.extracto}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge variant="info">
                          {categorias.find((c) => c.value === noticia.categoria)
                            ?.label || noticia.categoria}
                        </StatusBadge>
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatearFecha(noticia.fecha_publicacion)}
                        </p>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge
                          variant={noticia.activo ? "success" : "error"}
                        >
                          {noticia.activo ? "Activa" : "Oculta"}
                        </StatusBadge>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Ver - NUEVO */}
                          <button
                            onClick={() => {
                              setNoticiaVer(noticia);
                              setModalVer(true);
                            }}
                            className="p-2 text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-white/20"
                            title="Ver contenido completo"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => abrirModalEditar(noticia)}
                            className="p-2 text-green-600 bg-green-50 dark:text-green-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-green-100 dark:hover:bg-white/20"
                            title="Editar noticia"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setNoticiaEliminar(noticia);
                              setModalEliminar(true);
                            }}
                            className="p-2 text-red-600 bg-red-50 dark:text-red-400 dark:bg-white/10 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-white/20"
                            title="Eliminar noticia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Crear/Editar */}
      {modalAbierto && noticiaEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {modoEdicion ? "Editar Noticia" : "Nueva Noticia"}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={noticiaEditando.titulo}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        titulo: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                    placeholder="Título de la noticia"
                  />
                </div>

                {/* Extracto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Extracto
                  </label>
                  <textarea
                    value={noticiaEditando.extracto}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        extracto: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent resize-none"
                    rows="2"
                    placeholder="Breve descripción de la noticia"
                  />
                </div>

                {/* Contenido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contenido *
                  </label>
                  <textarea
                    value={noticiaEditando.contenido}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        contenido: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent resize-none"
                    rows="10"
                    placeholder="Contenido completo de la noticia"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={noticiaEditando.categoria}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        categoria: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Imagen URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={noticiaEditando.imagen_url}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        imagen_url: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={noticiaEditando.activo}
                    onChange={(e) =>
                      setNoticiaEditando({
                        ...noticiaEditando,
                        activo: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-biskoto border-gray-300 rounded focus:ring-biskoto"
                  />
                  <label
                    htmlFor="activo"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Noticia activa (visible para usuarios)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {modoEdicion ? "Actualizar" : "Crear"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && noticiaEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              ¿Eliminar Noticia?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              Estás a punto de eliminar "
              <strong>{noticiaEliminar.titulo}</strong>". Esta acción también
              eliminará todos los comentarios asociados y no se puede deshacer.
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
      {/* Modal Ver Noticia Completa */}
      {modalVer && noticiaVer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Vista Previa de Noticia
              </h3>
              <button
                onClick={() => setModalVer(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Imagen */}
                {noticiaVer.imagen_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={noticiaVer.imagen_url}
                      alt={noticiaVer.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Título */}
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                    {noticiaVer.titulo}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white">
                      {categorias.find((c) => c.value === noticiaVer.categoria)
                        ?.label || noticiaVer.categoria}
                    </span>
                    <span>{formatearFecha(noticiaVer.fecha_publicacion)}</span>
                    <span>{noticiaVer.vistas || 0} vistas</span>
                    <span
                      className={
                        noticiaVer.activo ? "text-green-600" : "text-red-600"
                      }
                    >
                      {noticiaVer.activo ? "✓ Activa" : "✗ Inactiva"}
                    </span>
                  </div>
                </div>

                {/* Extracto */}
                {noticiaVer.extracto && (
                  <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border-l-4 border-biskoto">
                    <p className="text-lg text-gray-700 dark:text-gray-300 italic">
                      {noticiaVer.extracto}
                    </p>
                  </div>
                )}

                {/* Contenido */}
                <div className="prose dark:prose-invert max-w-none">
                  <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {noticiaVer.contenido}
                  </div>
                </div>

                {/* Metadatos adicionales */}
                <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Información Técnica
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">ID:</span> {noticiaVer.id}
                    </div>
                    <div>
                      <span className="font-medium">Slug:</span>{" "}
                      {noticiaVer.slug || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Creada:</span>{" "}
                      {new Date(noticiaVer.created_at).toLocaleString("es-CR")}
                    </div>
                    <div>
                      <span className="font-medium">Actualizada:</span>{" "}
                      {new Date(noticiaVer.updated_at).toLocaleString("es-CR")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setModalVer(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setModalVer(false);
                  abrirModalEditar(noticiaVer);
                }}
                className="flex-1 px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar Noticia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticiasAdminPage;
