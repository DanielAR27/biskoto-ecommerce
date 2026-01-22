import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CompraForm from "../../../components/admin/CompraForm";
import { getCompraById, updateCompra } from "../../../api/compraService";
import { PackageSearch, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

/**
 * Página para editar una compra existente.
 * Carga los datos actuales y permite modificarlos.
 */
const EditarCompraPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    cargarCompra();
  }, [id]);

  const cargarCompra = async () => {
    try {
      setLoading(true);
      const data = await getCompraById(id);
      setCompra(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar compra:", err);
      setError("No se pudo cargar la información de la compra.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      setLoadingSubmit(true);
      setSubmitError(null);
      await updateCompra(id, formData);

      navigate("/admin/compras", {
        state: {
          successMessage: `Compra #${id} actualizada correctamente. El inventario ha sido ajustado.`,
        },
      });
    } catch (err) {
      console.error("Error al actualizar compra:", err);
      setSubmitError(
        err.response?.data?.error ||
          "No se pudo actualizar la compra en el sistema.",
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/admin/compras"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al historial
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl flex-shrink-0">
              <PackageSearch className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Editar Compra #{id}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modifica los datos de la factura y los ingredientes recibidos.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">
              Cargando datos de la compra...
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
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors inline-block"
            >
              Regresar al listado
            </Link>
          </div>
        ) : (
          <CompraForm
            onSubmit={handleUpdate}
            loading={loadingSubmit}
            error={submitError}
            buttonText="Actualizar Compra"
            initialData={compra}
            isReadOnly={false}
          />
        )}
      </main>
    </div>
  );
};

export default EditarCompraPage;
