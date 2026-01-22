import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar"; // Ajusta la ruta según tu estructura
import ProveedorForm from "../../../components/admin/ProveedorForm";
import * as proveedorService from "../../../api/proveedorService"; // Ajusta la ruta a tu API
import { Store, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const EditarProveedorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proveedor, setProveedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usamos la función del servicio que creamos antes
      const data = await proveedorService.obtenerProveedor(id);

      setProveedor(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del proveedor.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      // Llamada al endpoint PUT
      await proveedorService.updateProveedor(id, formData);

      navigate("/admin/proveedores", {
        state: {
          successMessage: `El proveedor "${formData.nombre}" ha sido actualizado correctamente.`,
        },
      });
    } catch (err) {
      console.error("Error update:", err);
      // Capturamos error del backend (ej: Nombre duplicado)
      const msg =
        err.response?.data?.error || "Error al actualizar el proveedor.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Navegación y Encabezado */}
        <div className="mb-8">
          <Link
            to="/admin/proveedores"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl border border-biskoto/20">
              {/* Icono de Tienda/Proveedor */}
              <Store className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar Proveedor
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Modifica los datos de contacto, teléfonos y correos.
              </p>
            </div>
          </div>
        </div>

        {/* Estados de Carga y Error */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cargando datos del proveedor...
            </p>
          </div>
        ) : error && !proveedor ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50">
            <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Proveedor no encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <Link
              to="/admin/proveedores"
              className="text-biskoto hover:underline"
            >
              Volver al directorio
            </Link>
          </div>
        ) : (
          /* Renderizamos el Formulario Reutilizable */
          <ProveedorForm
            initialData={proveedor}
            onSubmit={handleUpdate}
            loading={saving}
            error={error}
            buttonText="Guardar Cambios"
          />
        )}
      </main>
    </div>
  );
};

export default EditarProveedorPage;
