import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Navbar from "../../components/Navbar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Shield,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";

/**
 * Página de Perfil de Usuario.
 * Permite la gestión de datos personales y la configuración de preferencias de tema.
 */
const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();

  // Obtiene el tema actual persistido y la función para actualizarlo
  const { theme: savedTheme, setTheme } = useTheme();

  // Inicializa el estado local para la previsualización del tema
  // Esto permite al usuario ver el cambio instantáneamente sin guardar todavía
  const [isDarkPreview, setIsDarkPreview] = useState(savedTheme === "dark");

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    rol: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Sincroniza el estado del formulario cuando la información del usuario está disponible
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
        telefono: user.telefono || "",
        direccion: user.direccion || "",
        rol: user.rol || "cliente",
      });
    }
  }, [user]);

  // --- LÓGICA DE PREVISUALIZACIÓN DE TEMA ---

  // Aplica visualmente la clase 'dark' al documento HTML cuando cambia el switch local
  useEffect(() => {
    if (isDarkPreview) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Restaura el tema guardado oficialmente si el componente se desmonta sin guardar cambios
    return () => {
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
  }, [isDarkPreview, savedTheme]);

  // Alterna el estado local del tema (Previsualización)
  const handleTogglePreview = () => {
    setIsDarkPreview((prev) => !prev);
  };

  // Maneja los cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpia los mensajes de retroalimentación al editar para mejorar la UX
    if (message.text) setMessage({ type: "", text: "" });
  };

  // Procesa el envío del formulario y guarda preferencias
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Validación local del formato de teléfono
      const telefonoRegex = /^[0-9]{8}$/;
      if (!telefonoRegex.test(formData.telefono)) {
        throw new Error("El teléfono debe tener exactamente 8 números.");
      }

      // 1. Actualiza la información del usuario en el backend
      await updateUserProfile(formData);

      // 2. Persiste la preferencia de tema seleccionada
      setTheme(isDarkPreview ? "dark" : "light");

      setMessage({
        type: "success",
        text: "Datos y preferencias guardados correctamente.",
      });

      // Desplaza la vista hacia arriba para mostrar el mensaje de éxito
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const errorMsg =
        error.error || error.message || "Ocurrió un error al guardar.";
      setMessage({ type: "error", text: errorMsg });

      // CORRECCIÓN: Desplaza la vista hacia arriba también cuando hay un error
      // para asegurar que el usuario vea el banner de notificación.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la Sección */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Mi Perfil
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Administra tu información personal y apariencia.
          </p>
        </div>

        {/* Tarjeta Principal del Formulario */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
          {/* Banner de Mensajes (Éxito / Error) */}
          {message.text && (
            <div
              className={`p-4 flex items-center animate-in slide-in-from-top-2 duration-300 ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-b border-green-100 dark:border-green-900/50"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-b border-red-100 dark:border-red-900/50"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 mr-3" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-3" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* SECCIÓN 1: Información de Cuenta (Solo lectura) */}
              <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-lg border border-gray-100 dark:border-slate-700 transition-colors">
                <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 font-bold mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Información de Cuenta
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rol
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.rol}
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none capitalize"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Datos Personales */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-biskoto" />
                  Datos Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      name="nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-biskoto transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellido
                    </label>
                    <input
                      name="apellido"
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-biskoto transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Información de Envío */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-biskoto" />
                  Información de Envío
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teléfono Móvil
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        name="telefono"
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={handleChange}
                        className="w-full pl-10 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-biskoto transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dirección Exacta
                    </label>
                    <textarea
                      name="direccion"
                      rows="3"
                      value={formData.direccion}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-biskoto focus:border-biskoto resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Guardar */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-biskoto text-white font-bold rounded-lg hover:bg-biskoto-700 transition-all shadow-md active:scale-95 disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50"
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Guardar Todo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
