import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

  // Animación de fade-in
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

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
        (n) => n.categoria === categoriaSeleccionada,
      );
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          n.titulo.toLowerCase().includes(term) ||
          n.extracto?.toLowerCase().includes(term) ||
          n.contenido.toLowerCase().includes(term),
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-biskoto via-biskoto-700 to-biskoto-900 dark:from-biskoto-900 dark:via-slate-900 dark:to-slate-950 text-white overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center -translate-y-6"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6">
              Noticias y Novedades
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto font-light">
              Entérate de nuestras últimas promociones, recetas y eventos
              especiales
            </p>
          </motion.div>
        </div>

        {/* Onda decorativa */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
              className="text-gray-50 dark:text-slate-950"
            />
          </svg>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Botón Nueva Noticia - Solo Admin */}
        {user?.rol === "admin" && (
          <motion.div {...fadeIn} className="mb-8 flex justify-end">
            <button
              onClick={abrirModalCrear}
              className="px-6 py-3 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Noticia
            </button>
          </motion.div>
        )}

        {/* Filtros */}
        <motion.div
          {...fadeIn}
          className="mb-8 flex flex-col sm:flex-row gap-4"
        >
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent transition-all"
            />
          </div>

          {/* Filtro categoría */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent transition-all"
            >
              {categorias.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Lista de Noticias */}
        {noticiasFiltradas.length === 0 ? (
          <motion.div
            {...fadeIn}
            className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700"
          >
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
                : "Pronto tendremos novedades para compartir"}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {noticiasFiltradas.map((noticia, index) => (
              <motion.article
                key={noticia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => navigate(`/noticias/${noticia.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-200 dark:border-slate-700"
              >
                {/* Imagen */}
                {noticia.imagen_url && (
                  <div className="aspect-video overflow-hidden bg-gray-200 dark:bg-slate-700">
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
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-biskoto/10 text-biskoto dark:bg-biskoto-900/30 dark:text-biskoto-400">
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
              </motion.article>
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
                className="flex-1 px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
