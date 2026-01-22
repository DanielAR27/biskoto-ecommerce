import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CuponForm from "../../../components/admin/CuponForm";
import * as cuponService from "../../../api/cuponService";
import { Ticket, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

/**
 * Página de Edición de Cupones.
 * Se encarga de recuperar la información del cupón seleccionado y gestionar su actualización.
 */
const EditarCuponPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // El desarrollador define los estados para el manejo de datos asíncronos
  const [cupon, setCupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Efecto para cargar los datos iniciales al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Función para obtener el cupón desde el backend
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cuponService.obtenerCupon(id);
      setCupon(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del cupón.");
    } finally {
      setLoading(false);
    }
  };

  // Gestiona el envío del formulario actualizado
  const handleUpdate = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      // Se envía la petición de actualización al servicio
      await cuponService.updateCupon(id, formData);

      // El desarrollador redirige al listado con un mensaje de feedback positivo
      navigate("/admin/cupones", {
        state: { successMessage: "Cupón actualizado correctamente." },
      });
    } catch (err) {
      console.error("Error update:", err);
      // Se extrae el mensaje de error específico si el backend lo provee (ej. código duplicado)
      const msg =
        err.response?.data?.error ||
        "Ocurrió un error inesperado al actualizar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado con navegación de retorno */}
        <div className="mb-8">
          <Link
            to="/admin/cupones"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl border border-biskoto/20">
              <Ticket className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar Cupón
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Modifica los parámetros del descuento o cambia su estado.
              </p>
            </div>
          </div>
        </div>

        {/* Renderizado condicional basado en el estado de la petición */}
        {loading ? (
          // Estado de Carga
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cargando datos del cupón...
            </p>
          </div>
        ) : error && !cupon ? (
          // Estado de Error Crítico
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50">
            <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error de Carga
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={cargarDatos}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Intentar Nuevamente
            </button>
          </div>
        ) : (
          // Formulario de Edición con datos precargados
          <CuponForm
            initialData={cupon}
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

export default EditarCuponPage;
