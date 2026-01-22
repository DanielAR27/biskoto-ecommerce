import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CuponForm from "../../../components/admin/CuponForm";
import * as cuponService from "../../../api/cuponService";
import { Ticket, ArrowLeft } from "lucide-react";

/**
 * Página para el registro de nuevos cupones.
 * Coordina el envío de los datos del formulario al backend.
 */
const CrearCuponPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Maneja la creación del cupón.
   * Recibe el objeto formData desde CuponForm.
   */
  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Enviamos la petición al endpoint de creación
      await cuponService.createCupon(formData);

      // Redirección con mensaje de éxito
      navigate("/admin/cupones", {
        state: {
          successMessage: `El cupón "${formData.codigo}" ha sido creado exitosamente.`,
        },
      });
    } catch (err) {
      console.error("Error al crear el cupón:", err);
      // Extraemos el mensaje de error del backend (ej. "Ya existe un cupón con este código")
      const msg =
        err.response?.data?.error ||
        "No se pudo registrar el cupón en el sistema.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado con navegación de regreso */}
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
                Nuevo Cupón
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Registra un código de descuento para tus campañas promocionales.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de creación */}
        <CuponForm
          onSubmit={handleCreate}
          loading={loading}
          error={error}
          buttonText="Crear Cupón"
        />
      </main>
    </div>
  );
};

export default CrearCuponPage;
