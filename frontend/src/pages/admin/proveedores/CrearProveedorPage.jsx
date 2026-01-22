import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import ProveedorForm from "../../../components/admin/ProveedorForm";
import * as proveedorService from "../../../api/proveedorService";
import { Store, ArrowLeft } from "lucide-react";

const CrearProveedorPage = () => {
  const navigate = useNavigate();

  // Solo necesitamos estado para guardar y errores (no hay carga inicial)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      // Llamada al endpoint POST
      await proveedorService.createProveedor(formData);

      // Redirección con mensaje de éxito
      navigate("/admin/proveedores", {
        state: {
          successMessage: `El proveedor "${formData.nombre}" ha sido registrado exitosamente.`,
        },
      });
    } catch (err) {
      console.error("Error create:", err);
      // Manejo de errores (ej: Nombre ya existe)
      const msg =
        err.response?.data?.error || "No se pudo registrar el proveedor.";
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
              <Store className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Nuevo Proveedor
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Registra una nueva empresa para gestionar tus compras e
                inventario.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario (Modo Creación) */}
        {/* Al no pasar initialData, el formulario asume modo "Crear" */}
        <ProveedorForm
          onSubmit={handleCreate}
          loading={saving}
          error={error}
          buttonText="Registrar Proveedor"
        />
      </main>
    </div>
  );
};

export default CrearProveedorPage;
