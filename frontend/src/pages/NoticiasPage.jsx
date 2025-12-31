import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Calendar,
  User,
  Search,
  Filter,
  Loader2,
  Plus,
  X,
  Save,
} from "lucide-react";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getNoticias, crearNoticia } from "../api/noticiaService";
/**
 * Página pública de Noticias
 * Muestra lista de noticias activas con filtros
 */
const NoticiasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [noticias, setNoticias] = useState([]);
  const [noticiasFiltradas, setNoticiasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  // Estados para el modal de crear noticia
  const [modalCrear, setModalCrear] = useState(false);
  const [nuevaNoticia, setNuevaNoticia] = useState({
    titulo: "",
    extracto: "",
    contenido: "",
    categoria: "general",
    imagen_url: "",
    activo: true,
  });
  const [guardando, setGuardando] = useState(false);

  const categorias = [
    { value: "todas", label: "Todas" },
    { value: "promocion", label: "Promociones" },
    { value: "receta", label: "Recetas" },
    { value: "evento", label: "Eventos" },
    { value: "general", label: "General" },
  ];

  /**
   * Cargar noticias activas
   */
  const cargarNoticias = async () => {
    try {
      setLoading(true);
      const data = await getNoticias();
      // Solo noticias activas para usuarios
      const noticiasActivas = data.filter((n) => n.activo);
      setNoticias(noticiasActivas);
      setNoticiasFiltradas(noticiasActivas);
    } catch (error) {
      console.error("Error al cargar noticias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarNoticias();
  }, []);

  /**
   * Abrir modal para crear
   */
  const abrirModalCrear = () => {
    setNuevaNoticia({
      titulo: "",
      extracto: "",
      contenido: "",
      categoria: "general",
      imagen_url: "",
      activo: true,
    });
    setModalCrear(true);
  };

  /**
   * Guardar nueva noticia
   */
  const handleGuardar = async () => {
    if (!nuevaNoticia.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!nuevaNoticia.contenido.trim()) {
      alert("El contenido es obligatorio");
      return;
    }

    setGuardando(true);

    try {
      await crearNoticia(nuevaNoticia);
      await cargarNoticias();
      setModalCrear(false);
      setNuevaNoticia({
        titulo: "",
        extracto: "",
        contenido: "",
        categoria: "general",
        imagen_url: "",
        activo: true,
      });
    } catch (error) {
      console.error("Error al guardar noticia:", error);
      alert("Error al guardar la noticia");
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Filtrar noticias
   */
  useEffect(() => {
    let resultado = noticias;

    // Filtro por categoría
    if (categoriaSeleccionada !== "todas") {
      resultado = resultado.filter(
        (n) => n.categoria === categoriaSeleccionada
      );
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          n.titulo.toLowerCase().includes(term) ||
          n.extracto?.toLowerCase().includes(term) ||
          n.contenido.toLowerCase().includes(term)
      );
    }

    setNoticiasFiltradas(resultado);
  }, [searchTerm, categoriaSeleccionada, noticias]);

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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
              Noticias y Novedades
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Entérate de nuestras últimas promociones, recetas y eventos
            </p>
          </div>

          {/* Botón Nueva Noticia - Solo Admin */}
          {user?.rol === "admin" && (
            <button
              onClick={abrirModalCrear}
              className="px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Nueva Noticia
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar noticias..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
            />
          </div>

          {/* Filtro categoría */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
            >
              {categorias.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de noticias */}
        {noticiasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
            <Newspaper
              className="mx-auto mb-4 text-gray-300 dark:text-slate-600"
              size={64}
            />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No hay noticias disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || categoriaSeleccionada !== "todas"
                ? "No se encontraron noticias con los filtros aplicados"
                : "Vuelve pronto para ver las últimas novedades"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticiasFiltradas.map((noticia) => (
              <article
                key={noticia.id}
                onClick={() =>
                  navigate(`/noticias/${noticia.slug || noticia.id}`)
                }
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Imagen */}
                {noticia.imagen_url && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={noticia.imagen_url}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Contenido */}
                <div className="p-6">
                  {/* Categoría */}
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white">
                      {categorias.find((c) => c.value === noticia.categoria)
                        ?.label || noticia.categoria}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {noticia.titulo}
                  </h3>

                  {/* Extracto */}
                  {noticia.extracto && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {noticia.extracto}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatearFecha(noticia.fecha_publicacion)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={16} />
                      <span>{noticia.vistas || 0} vistas</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      {/* Modal Crear Noticia */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Nueva Noticia
              </h3>
              <button
                onClick={() => setModalCrear(false)}
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
                    value={nuevaNoticia.titulo}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
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
                    value={nuevaNoticia.extracto}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
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
                    value={nuevaNoticia.contenido}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
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
                    value={nuevaNoticia.categoria}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
                        categoria: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="promocion">Promoción</option>
                    <option value="receta">Receta</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>

                {/* Imagen URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={nuevaNoticia.imagen_url}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
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
                    id="activo-modal"
                    checked={nuevaNoticia.activo}
                    onChange={(e) =>
                      setNuevaNoticia({
                        ...nuevaNoticia,
                        activo: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-biskoto border-gray-300 rounded focus:ring-biskoto"
                  />
                  <label
                    htmlFor="activo-modal"
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    Noticia activa (visible para usuarios)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setModalCrear(false)}
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
                    Crear
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

export default NoticiasPage;
