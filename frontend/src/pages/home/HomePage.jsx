import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
//import Navbar from "../../components/Navbar";
import { getProductosCatalogo } from "../../api/productoService";
import { getCategoriasActivas } from "../../api/categoriaService";
import {
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  Loader2,
} from "lucide-react";

/**
 * Componente HomePage (Catálogo Público).
 * Se encarga de renderizar la vista principal de la aplicación, mostrando un grid
 * de productos paginados. Utiliza parámetros de URL para gestionar el estado de
 * la navegación (página actual, búsqueda y categorías), permitiendo compartir enlaces específicos.
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se gestionan los parámetros de la URL (query strings)
  const [searchParams, setSearchParams] = useSearchParams();

  // Se derivan los estados iniciales desde la URL
  const paginaActual = parseInt(searchParams.get("page") || "1", 10);
  const terminoBusqueda = searchParams.get("search") || "";

  // MODIFICADO: Ahora categoriasFiltro es un array (puede tener múltiples categorías)
  // La URL guarda las categorías separadas por coma: ?categorias=id1,id2,id3
  const categoriasFiltro = searchParams.get("categorias")
    ? searchParams
        .get("categorias")
        .split(",")
        .map((id) => parseInt(id, 10))
    : [];

  // Estados locales para datos y carga
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Efecto para cargar categorías activas al montar el componente.
   */
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setCargandoCategorias(true);
        const data = await getCategoriasActivas();
        setCategorias(data);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      } finally {
        setCargandoCategorias(false);
      }
    };

    cargarCategorias();
  }, []);

  /**
   * Efecto para la carga de datos.
   * Se ejecuta cada vez que cambian los parámetros de paginación, búsqueda o categorías en la URL.
   */
  useEffect(() => {
    const cargarCatalogo = async () => {
      setCargando(true);
      setError(null);
      try {
        // Se construyen los parámetros de la petición
        const params = {
          page: paginaActual,
          limit: 20,
          search: terminoBusqueda,
        };

        // MODIFICADO: Enviamos el array de categorías como string separado por comas
        if (categoriasFiltro.length > 0) {
          params.categoria_ids = categoriasFiltro.join(",");
        }

        const data = await getProductosCatalogo(params);

        setProductos(data.productos || []);
        setTotalPaginas(data.totalPaginas || 1);
      } catch (err) {
        console.error("Error cargando catálogo:", err);
        setError("No se pudieron cargar los productos. Intente nuevamente.");
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogo();
  }, [paginaActual, terminoBusqueda, categoriasFiltro.join(",")]); // Convertimos a string para comparación

  /**
   * Manejador de búsqueda.
   * Actualiza la URL reseteando la página a 1 cuando el usuario busca algo nuevo.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.target;
    const nuevoTermino = form.search.value;

    const newParams = { page: 1 };
    if (nuevoTermino) newParams.search = nuevoTermino;
    if (categoriasFiltro.length > 0)
      newParams.categorias = categoriasFiltro.join(",");

    setSearchParams(newParams);
  };

  /**
   * MODIFICADO: Manejador de filtro por categoría (selección múltiple).
   * Si la categoría ya está seleccionada, la quita. Si no, la agrega.
   */
  const handleCategoriaClick = (catId) => {
    let nuevasCategorias;

    if (catId === null) {
      // Clic en "Todas" - limpiar todas las categorías
      nuevasCategorias = [];
    } else if (categoriasFiltro.includes(catId)) {
      // Si ya está seleccionada, quitarla
      nuevasCategorias = categoriasFiltro.filter((id) => id !== catId);
    } else {
      // Si no está seleccionada, agregarla
      nuevasCategorias = [...categoriasFiltro, catId];
    }

    const newParams = { page: 1 };
    if (terminoBusqueda) newParams.search = terminoBusqueda;
    if (nuevasCategorias.length > 0)
      newParams.categorias = nuevasCategorias.join(",");

    setSearchParams(newParams);
  };

  /**
   * Limpia todos los filtros activos.
   */
  const limpiarFiltros = () => {
    setSearchParams({ page: 1 });
    // También limpiamos el input de búsqueda
    const searchInput = document.querySelector('input[name="search"]');
    if (searchInput) searchInput.value = "";
  };

  /**
   * Manejador de cambio de página.
   * Navega a la página solicitada manteniendo los filtros activos.
   */
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      const newParams = { page: nuevaPagina };
      if (terminoBusqueda) newParams.search = terminoBusqueda;
      if (categoriasFiltro.length > 0)
        newParams.categorias = categoriasFiltro.join(",");

      setSearchParams(newParams);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Obtener nombres de categorías seleccionadas para mostrar en UI
  const categoriasSeleccionadasNombres = categorias
    .filter((c) => categoriasFiltro.includes(c.id))
    .map((c) => c.nombre);

  // Verificar si hay filtros activos
  const hayFiltrosActivos = terminoBusqueda || categoriasFiltro.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header / Hero Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user ? `Hola de nuevo, ${user.nombre}` : "Bienvenido a Biskoto"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {user
              ? "Aquí tienes nuestros productos más recientes seleccionados para ti."
              : "Explora nuestra variedad de dulces y repostería artesanal."}
          </p>

          {/* Barra de Herramientas (Búsqueda) */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <form
              onSubmit={handleSearch}
              className="relative w-full sm:max-w-md"
            >
              <input
                type="text"
                name="search"
                defaultValue={terminoBusqueda}
                placeholder="Buscar galletas, pasteles..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-transparent transition-shadow"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
          </div>

          {/* Filtros por Categoría */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar por categoría:
              </span>

              {/* Botón limpiar filtros */}
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="ml-auto text-sm text-biskoto hover:text-biskoto-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Pills de categorías */}
            <div className="flex flex-wrap gap-2">
              {/* Botón "Todas" - activo solo cuando NO hay categorías seleccionadas */}
              <button
                onClick={() => handleCategoriaClick(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  categoriasFiltro.length === 0
                    ? "bg-biskoto text-white shadow-md scale-105"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                }`}
              >
                Todas
              </button>

              {/* Skeleton mientras cargan categorías */}
              {cargandoCategorias ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse"
                    />
                  ))}
                </>
              ) : (
                /* Botones de categorías - MODIFICADO: Ahora pueden estar múltiples activos */
                categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoriaClick(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      categoriasFiltro.includes(cat.id)
                        ? "bg-biskoto text-white shadow-md scale-105"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))
              )}
            </div>

            {/* Indicador de filtros activos */}
            {hayFiltrosActivos && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {terminoBusqueda && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-biskoto/10 dark:bg-indigo-500/20 text-biskoto dark:text-indigo-300 rounded-full">
                    Búsqueda: "{terminoBusqueda}"
                    <button
                      onClick={() => {
                        const newParams = { page: 1 };
                        if (categoriasFiltro.length > 0)
                          newParams.categorias = categoriasFiltro.join(",");
                        setSearchParams(newParams);
                        const searchInput = document.querySelector(
                          'input[name="search"]',
                        );
                        if (searchInput) searchInput.value = "";
                      }}
                      className="ml-1 hover:text-biskoto-700 dark:hover:text-indigo-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {/* MODIFICADO: Mostrar cada categoría seleccionada como un tag individual */}
                {categoriasSeleccionadasNombres.map((nombre, index) => (
                  <span
                    key={categoriasFiltro[index]}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-biskoto/10 dark:bg-indigo-500/20 text-biskoto dark:text-indigo-300 rounded-full"
                  >
                    {nombre}
                    <button
                      onClick={() =>
                        handleCategoriaClick(categoriasFiltro[index])
                      }
                      className="ml-1 hover:text-biskoto-700 dark:hover:text-indigo-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Estado de Carga */}
        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-200 dark:bg-slate-800 rounded-xl"
              ></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay productos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hayFiltrosActivos
                ? "No encontramos coincidencias con los filtros seleccionados."
                : "No hay productos disponibles en este momento."}
            </p>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="mt-4 px-4 py-2 bg-biskoto text-white rounded-lg hover:bg-biskoto-700 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          /* Grid de Productos */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos.map((producto) => {
                // Lógica para determinar imagen y estado de stock
                const imagenPrincipal =
                  producto.producto_imagenes?.find((img) => img.es_principal)
                    ?.url ||
                  producto.producto_imagenes?.[0]?.url ||
                  "https://placehold.co/300x300?text=Sin+Imagen";

                // 1. Calculamos disponibilidad real considerando ingredientes
                let stockDisponible = producto.stock_actual;

                if (producto.producto_ingredientes?.length > 0) {
                  const limitesIngredientes =
                    producto.producto_ingredientes.map((pi) => {
                      if (pi.ingredientes?.es_ilimitado) return Infinity;

                      const stockIng = pi.ingredientes?.stock_actual || 0;
                      return Math.floor(
                        stockIng / (pi.cantidad_necesaria || 1),
                      );
                    });

                  stockDisponible = Math.min(
                    stockDisponible,
                    ...limitesIngredientes,
                  );
                }

                const sinStock = stockDisponible <= 0;

                return (
                  <div
                    key={producto.id}
                    className={`group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col ${
                      sinStock
                        ? "opacity-75 grayscale-[0.5]"
                        : "hover:border-biskoto/50 dark:hover:border-indigo-400"
                    }`}
                  >
                    {/* Imagen del Producto */}
                    <Link
                      to={`/producto/${producto.id}`}
                      className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-900 block"
                    >
                      <img
                        src={imagenPrincipal}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Etiqueta de Categoría */}
                      {producto.categorias && (
                        <span className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-slate-700">
                          {producto.categorias.nombre}
                        </span>
                      )}

                      {/* Etiqueta de AGOTADO */}
                      {sinStock && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg transform -rotate-12 border-2 border-white dark:border-slate-800">
                            Agotado
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Información y Acciones */}
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-biskoto dark:group-hover:text-indigo-400 transition-colors">
                        {producto.nombre}
                      </h3>

                      {/* Mostrar stock restante si queda poco */}
                      {!sinStock && stockDisponible <= 5 && (
                        <p className="text-xs text-orange-500 font-medium mb-1">
                          ¡Solo quedan {stockDisponible}!
                        </p>
                      )}

                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
                        {producto.descripcion}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-700">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          ₡{parseFloat(producto.precio).toLocaleString("es-CR")}
                        </span>

                        {/* Botón de Acción */}
                        <button
                          onClick={() => navigate(`/producto/${producto.id}`)}
                          className={`p-2 rounded-lg transition-colors shadow-sm active:scale-95 flex items-center gap-2 ${
                            sinStock
                              ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300"
                              : "bg-biskoto text-white hover:bg-biskoto-600"
                          }`}
                          title={
                            sinStock
                              ? "Ver detalles del producto"
                              : "Añadir al pedido"
                          }
                        >
                          {sinStock ? (
                            <Eye size={20} />
                          ) : (
                            <ShoppingCart size={20} />
                          )}

                          <span className="text-sm font-bold hidden sm:inline">
                            {sinStock ? "Ver detalle" : "Pedir"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
