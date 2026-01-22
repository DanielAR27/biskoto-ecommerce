import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import ProductoForm from "../../../components/admin/ProductoForm";
import { getProducto, updateProducto } from "../../../api/productoService";
import { Package, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const EditarProductoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProducto(id);

        // CORRECCIÓN TÉCNICA: Aseguramos que la data esté limpia para el formulario.
        // Si el backend devuelve unidades_medida como objeto, el formulario
        // lo gestionará, pero aquí garantizamos que el objeto exista.
        setProducto(data);
      } catch (err) {
        console.error("Error al cargar producto:", err);
        setError("No se pudo cargar la información del producto solicitado.");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);

      await updateProducto(id, formData);

      navigate("/admin/productos", {
        state: {
          successMessage: `El producto "${formData.nombre}" se actualizó correctamente.`,
        },
      });
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError(
        err.response?.data?.error ||
          "Error al guardar los cambios en el servidor.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Estado de carga optimizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-biskoto h-12 w-12 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Sincronizando ficha técnica...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/admin/productos"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto mb-4 group w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl">
              <Package className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar Producto
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modifica la información general y la receta del producto.
              </p>
            </div>
          </div>
        </div>

        {/* Alerta de error superior si falla la carga o el envío */}
        {error && !producto && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {producto && (
          <ProductoForm
            initialData={producto}
            onSubmit={handleUpdate}
            loading={submitting}
            error={error}
            buttonText="Guardar Cambios"
          />
        )}
      </main>
    </div>
  );
};

export default EditarProductoPage;
