import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import IngredienteForm from "../../../components/admin/IngredienteForm";
import * as ingredienteService from "../../../api/ingredienteService";
import { ClipboardList, ArrowLeft } from "lucide-react";

/**
 * Página de Creación de Ingredientes.
 * Gestiona el proceso de alta de nuevos insumos conectando el formulario
 * con el servicio de backend y manejando la redirección post-creación.
 */
const CrearIngredientePage = () => {
  const navigate = useNavigate();

  // Estados locales para gestionar la interfaz durante la petición asíncrona
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Procesa los datos del formulario y realiza la petición al servidor.
   * En caso de éxito, redirige al inventario con una notificación.
   */
  const handleCreate = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Envía la solicitud de creación al servicio de ingredientes
      await ingredienteService.createIngrediente(formData);

      // Redirecciona al listado principal inyectando el mensaje de éxito en el estado
      navigate("/admin/ingredientes", {
        state: {
          successMessage:
            "Ingrediente registrado correctamente en el inventario.",
        },
      });
    } catch (err) {
      console.error(err);
      // Extrae el mensaje de error del backend o usa uno genérico si falla la red
      const msg =
        err.response?.data?.error ||
        "Ocurrió un error al intentar crear el ingrediente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Cabecera con navegación de retorno */}
        <div className="mb-8">
          <Link
            to="/admin/ingredientes"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al inventario
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {/* Ícono consistente con el listado principal: Marca en Light, Blanco en Dark */}
            <ClipboardList className="h-7 w-7 text-biskoto dark:text-white" />
            Nuevo Ingrediente
          </h1>
        </div>

        {/* Contenedor del Formulario */}
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-gray-200/50 dark:shadow-none rounded-2xl border border-gray-100 dark:border-slate-800 p-6 sm:p-8">
          <IngredienteForm
            onSubmit={handleCreate}
            loading={loading}
            error={error}
            buttonText="Registrar Ingrediente"
          />
        </div>
      </main>
    </div>
  );
};

export default CrearIngredientePage;
