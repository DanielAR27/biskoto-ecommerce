import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CompraForm from "../../../components/admin/CompraForm";
import * as compraService from "../../../api/compraService";
import { Receipt, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

/**
 * Página de Consulta de Compra.
 * Recupera los datos de una compra específica por ID y los proyecta
 * en el formulario unificado en modo 'isReadOnly'.
 */
const ConsultarCompraPage = () => {
  const { id } = useParams(); // Se obtiene el ID de la URL

  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga el detalle de la compra al montar el componente.
   */
  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        setLoading(true);
        const data = await compraService.getCompraById(id);
        setCompra(data);
      } catch (err) {
        console.error("Error al recuperar la compra:", err);
        setError("No se pudo cargar la información de la factura solicitada.");
      } finally {
        setLoading(false);
      }
    };

    if (id) cargarDetalle();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Cabecera de la página */}
        <div className="mb-8">
          <Link
            to="/admin/compras"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto transition-colors mb-4 group w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al historial
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-biskoto/10 rounded-2xl">
                <Receipt className="h-8 w-8 text-biskoto" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Detalle de Compra
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visualizando registro histórico de abastecimiento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lógica de renderizado según estado */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">
              Consultando base de datos...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-red-800 dark:text-red-400 font-bold text-lg">
              Ocurrió un problema
            </h2>
            <p className="text-red-600 dark:text-red-400/80 mb-6">{error}</p>
            <Link
              to="/admin/compras"
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Regresar al listado
            </Link>
          </div>
        ) : (
          /* El CompraForm ahora recibe los datos y se bloquea */
          <CompraForm
            initialData={compra}
            isReadOnly={true}
            buttonText="Histórico" // No se muestra en modo lectura pero se envía por prop-types
          />
        )}
      </main>
    </div>
  );
};

export default ConsultarCompraPage;
