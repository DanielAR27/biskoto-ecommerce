import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CategoriaForm from "../../../components/admin/CategoriaForm";
import * as categoriaService from "../../../api/categoriaService";
import { LayoutGrid, ArrowLeft } from "lucide-react";

/**
 * Página de Creación de Categorías.
 * Gestiona la interacción para el alta de nuevas categorías utilizando el formulario reutilizable.
 */
const CrearCategoriaPage = () => {
  const navigate = useNavigate();

  // Estados para controlar la carga y los errores de la solicitud
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Maneja el proceso de creación recibiendo los datos del formulario hijo
  const handleCreate = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Solicita la creación de la categoría al servicio backend
      await categoriaService.createCategoria(formData);

      // Redirige al listado y envía un mensaje de éxito mediante el estado de navegación
      navigate("/admin/categorias", {
        state: {
          successMessage: "Se ha creado una nueva categoría correctamente.",
        },
      });
    } catch (err) {
      // Gestiona los errores retornados por la API o excepciones de red
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Error al crear la categoría.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la página con navegación de retorno */}
        <div className="mb-8">
          <Link
            to="/admin/categorias"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al listado
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {/* Icono actualizado: Marca en Light, Blanco en Dark */}
            <LayoutGrid className="h-6 w-6 text-biskoto dark:text-white" />
            Nueva Categoría
          </h1>
        </div>

        {/* Renderiza el formulario reutilizable sin datos iniciales para el modo de creación */}
        <CategoriaForm
          onSubmit={handleCreate}
          loading={loading}
          error={error}
          buttonText="Crear Categoría"
        />
      </main>
    </div>
  );
};

export default CrearCategoriaPage;
