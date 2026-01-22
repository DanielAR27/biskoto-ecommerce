import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import UsuarioForm from "../../../components/admin/UsuarioForm";
import * as usuarioService from "../../../api/usuarioService";
import { User, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

const EditarUsuarioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
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
      const data = await usuarioService.obtenerUsuario(id);

      // --- DEBUG PADRE ---
      console.log("📢 DATOS RECIBIDOS EN EL PADRE:", data);
      // -------------------

      setUsuario(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información del usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      await usuarioService.updateUsuario(id, formData);
      const accion = formData.activo === false ? "desactivado" : "actualizado";

      navigate("/admin/usuarios", {
        state: {
          successMessage: `El usuario ha sido ${accion} correctamente.`,
        },
      });
    } catch (err) {
      console.error("Error update:", err);
      const msg =
        err.response?.data?.error || "Error al actualizar el usuario.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Navegación */}
        <div className="mb-8">
          <Link
            to="/admin/usuarios"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl border border-biskoto/20">
              <User className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Editar Usuario
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Gestión de roles, permisos y reactivación de cuentas.
              </p>
            </div>
          </div>
        </div>

        {/* Estados de Carga/Error */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cargando perfil...
            </p>
          </div>
        ) : error && !usuario ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50">
            <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Usuario no encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <Link to="/admin/usuarios" className="text-biskoto hover:underline">
              Volver al directorio
            </Link>
          </div>
        ) : (
          /* Renderizamos el Formulario */
          <UsuarioForm
            initialData={usuario}
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

export default EditarUsuarioPage;
