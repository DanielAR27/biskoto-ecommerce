import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, User, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

import { getNoticia } from "../api/noticiaService";
import Navbar from "../components/Navbar";
import ComentariosSection from "../components/ComentariosSection";
/**
 * Página de Detalle de Noticia
 * Muestra contenido completo y sección de comentarios
 */
const NoticiaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorias = {
    promocion: "Promoción",
    receta: "Receta",
    evento: "Evento",
    general: "General",
  };

  /**
   * Cargar noticia
   */
  useEffect(() => {
    const cargarNoticia = async () => {
      try {
        setLoading(true);
        const data = await getNoticia(id);

        // Verificar que la noticia esté activa (si no es admin)
        if (!data.activo) {
          setError("Esta noticia no está disponible");
          return;
        }

        setNoticia(data);
      } catch (err) {
        console.error("Error al cargar noticia:", err);
        setError("No se pudo cargar la noticia");
      } finally {
        setLoading(false);
      }
    };

    cargarNoticia();
  }, [id]);

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
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !noticia) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error al cargar la noticia
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "La noticia que buscas no existe"}
            </p>
            <button
              onClick={() => navigate("/noticias")}
              className="px-6 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-dark transition-colors"
            >
              Volver a Noticias
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Botón volver */}
        <button
          onClick={() => navigate("/noticias")}
          className="mb-6 flex items-center gap-2 text-biskoto hover:text-biskoto-dark transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a Noticias
        </button>

        {/* Artículo */}
        <article className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          {/* Imagen principal */}
          {noticia.imagen_url && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={noticia.imagen_url}
                alt={noticia.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Contenido */}
          <div className="p-8">
            {/* Categoría */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white">
                {categorias[noticia.categoria] || noticia.categoria}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              {noticia.titulo}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{formatearFecha(noticia.fecha_publicacion)}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>{noticia.vistas || 0} vistas</span>
              </div>
            </div>

            {/* Extracto */}
            {noticia.extracto && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 font-medium">
                {noticia.extracto}
              </p>
            )}

            {/* Contenido principal */}
            <div className="prose dark:prose-invert max-w-none">
              {noticia.contenido.split("\n").map(
                (parrafo, index) =>
                  parrafo.trim() && (
                    <p
                      key={index}
                      className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed"
                    >
                      {parrafo}
                    </p>
                  ),
              )}
            </div>
          </div>
        </article>

        {/* Sección de Comentarios */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comentarios
          </h2>

          {/* Placeholder para comentarios */}
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8">
            <ComentariosSection noticiaId={noticia.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoticiaDetailPage;
