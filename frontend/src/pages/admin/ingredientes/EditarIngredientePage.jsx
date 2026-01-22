import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import IngredienteForm from "../../../components/admin/IngredienteForm";
import * as ingredienteService from "../../../api/ingredienteService";
import { ClipboardList, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

/**
 * Página de Edición de Ingredientes.
 * Recupera los datos de un ingrediente existente, gestiona su estado de carga
 * y maneja la actualización a través del formulario reutilizable.
 */
const EditarIngredientePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados para gestionar los datos, la carga, el guardado y los errores
  const [ingrediente, setIngrediente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Efecto para la carga inicial de los datos del ingrediente al montar el componente
  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Función asíncrona para obtener el ingrediente desde el servicio
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ingredienteService.obtenerIngrediente(id);
      setIngrediente({
        ...data,
        unidad_id: data.unidad_id, // El backend ya envía esto como FK
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del ingrediente.");
    } finally {
      setLoading(false);
    }
  };

  // Maneja el proceso de actualización recibiendo los datos del formulario
  const handleUpdate = async (formData) => {
    setSaving(true);
    setError(null); // Limpia errores previos antes de intentar guardar

    try {
      // Envía los datos actualizados al backend
      await ingredienteService.updateIngrediente(id, formData);

      // Redirige al inventario con un mensaje de éxito
      navigate("/admin/ingredientes", {
        state: { successMessage: "Ingrediente actualizado correctamente." },
      });
    } catch (err) {
      console.error(err);
      // Extrae el mensaje de error específico o usa uno genérico
      const msg =
        err.response?.data?.error || "Error al actualizar el ingrediente.";
      setError(msg);
      setSaving(false); // Detiene el indicador de carga solo si hubo error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado con navegación de retorno */}
        <div className="mb-8">
          <Link
            to="/admin/ingredientes"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al inventario
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {/* Icono consistente: Marca en Light, Blanco en Dark */}
            <ClipboardList className="h-6 w-6 text-biskoto dark:text-white" />
            Editar Ingrediente
          </h1>
        </div>

        {/* Lógica de Renderizado Condicional (Carga / Error / Formulario) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cargando datos...
            </p>
          </div>
        ) : error && !ingrediente ? (
          // Estado de Error Crítico (si falla la carga inicial y no hay datos)
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
          // Formulario de Edición
          <div className="bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
            <IngredienteForm
              initialData={ingrediente}
              onSubmit={handleUpdate}
              loading={saving}
              error={error} // Pasa errores de validación/guardado al formulario
              buttonText="Guardar Cambios"
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default EditarIngredientePage;
