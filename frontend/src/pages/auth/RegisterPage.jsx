import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { XCircle, X, Eye, EyeOff } from "lucide-react";
import IconBackground from "../../components/IconBackground";

/**
 * Componente de la página de registro de usuarios.
 * Versión mejorada con mensajes de error específicos.
 */
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    direccion: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleChange = (e) => {
    let value = e.target.value;

    // Limpiar espacios y guiones del teléfono
    if (e.target.name === "telefono") {
      value = value.replace(/[\s\-]/g, "");
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowAlert(false);

    // Validación local de campos vacíos (después de trim)
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio");
      setShowAlert(true);
      return;
    }

    if (!formData.apellido.trim()) {
      setError("El apellido es obligatorio");
      setShowAlert(true);
      return;
    }

    // Validación local de teléfono
    const telefonoLimpio = formData.telefono.replace(/[\s\-]/g, "");
    const telefonoRegex = /^[0-9]{8}$/;
    if (!telefonoRegex.test(telefonoLimpio)) {
      setError("El teléfono debe tener exactamente 8 números");
      setShowAlert(true);
      return;
    }

    setLoadingLocal(true);
    try {
      // Enviar con datos limpios
      await register({
        ...formData,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: telefonoLimpio,
        direccion: formData.direccion.trim() || null,
      });

      navigate("/login", {
        state: {
          successMsg:
            "Registro exitoso. Por favor verifica tu correo electrónico.",
        },
      });
    } catch (err) {
      console.error("Error en registro:", err);

      // ========================================
      // MANEJO MEJORADO DE ERRORES
      // ========================================

      // Si el error tiene un mensaje específico del backend
      if (err.error) {
        setError(err.error);
        setShowAlert(true);
        return;
      }

      // Si el error tiene response.data.error (formato de Axios)
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        setShowAlert(true);
        return;
      }

      // Error genérico como fallback
      setError("Error al crear la cuenta. Por favor intenta nuevamente.");
      setShowAlert(true);
    } finally {
      setLoadingLocal(false);
    }
  };

  if (loading && !user) return null;

  return (
    <IconBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* Alerta de Error */}
        {showAlert && (
          <div className="max-w-lg w-full mb-4 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 p-4 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                {error}
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-red-500 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 transition-colors ml-3"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Contenedor del Formulario */}
        <div className="max-w-lg w-full space-y-6 p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 transition-colors duration-300">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-light">
              Únete para gestionar tus pedidos de repostería
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Fila de Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Nombre
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  className="appearance-none rounded-lg block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Apellido
                </label>
                <input
                  name="apellido"
                  type="text"
                  required
                  className="appearance-none rounded-lg block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all"
                  value={formData.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Correo
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-lg block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  type="tel"
                  required
                  placeholder="88887777"
                  maxLength="8"
                  className="appearance-none rounded-lg block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Contraseña con Ojo Mágico */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none rounded-lg block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all"
                  value={formData.password}
                  onChange={handleChange}
                />

                {/* Botón del Ojo */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mínimo 6 caracteres
              </p>
            </div>

            {/* Dirección Opcional */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Dirección{" "}
                <span className="text-gray-400 dark:text-gray-600 lowercase italic">
                  (Opcional)
                </span>
              </label>
              <textarea
                name="direccion"
                rows="2"
                placeholder="Provincia, cantón y señas exactas..."
                className="appearance-none rounded-lg block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-biskoto sm:text-sm transition-all resize-none"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingLocal}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-biskoto hover:bg-biskoto-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto transition-all shadow-md active:scale-[0.98] disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {loadingLocal ? "Registrando..." : "Crear Cuenta"}
              </button>
            </div>
          </form>

          {/* Separador */}
          <div className="relative my-4">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/0">
                <div className="h-1.5 w-1.5 rounded-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"></div>
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-medium text-biskoto dark:text-blue-400 underline decoration-biskoto/30 dark:decoration-blue-400/30 underline-offset-4 hover:text-biskoto-700 dark:hover:text-blue-300 transition-all"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </IconBackground>
  );
};

export default RegisterPage;
