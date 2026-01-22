import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import * as usuarioService from "../../../api/usuarioService";
import { useAuth } from "../../../context/AuthContext";

// Componentes Reutilizables
import ToastNotification from "../../../components/ToastNotification";
import ConfirmModal from "../../../components/ConfirmModal";
import TableSearch from "../../../components/TableSearch";
import StatusBadge from "../../../components/StatusBadge";
// Nota: Usaremos StatusBadge para los estados visuales

// Iconos
import {
  User,
  Shield,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  Phone,
} from "lucide-react";

const UsuariosPage = () => {
  // LOGIC: Extraemos el usuario actual para evitar auto-eliminación
  const { user: currentUser } = useAuth();

  const location = useLocation();

  // Estados de datos
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Estados del Modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (location.state?.successMessage) {
      showNotification("success", location.state.successMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios del sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await usuarioService.deleteUsuario(userToDelete.id);
      setUsuarios((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showNotification(
        "success",
        `El usuario ${userToDelete.email} ha sido desactivado.`,
      );
      setUserToDelete(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "No se pudo desactivar el usuario.";
      showNotification("error", msg);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      (u.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Encabezado Responsivo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl flex items-center gap-2">
              <User className="h-8 w-8 text-biskoto dark:text-white" />
              Gestión de Usuarios
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra perfiles, roles y permisos de acceso.
            </p>
          </div>
          {/* En usuarios no suele haber botón de "Crear" directo si es registro público, 
              pero si lo tuvieras, iría aquí igual que en las otras páginas */}
        </div>

        {/* Notificación Toast Reutilizable */}
        {notification && (
          <ToastNotification
            type={notification.type}
            message={notification.text}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Barra de Búsqueda Reutilizable */}
        <TableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          resultCount={usuariosFiltrados.length}
          placeholder="Buscar por nombre o correo..."
        />

        {/* Tabla */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-slate-700 sm:rounded-b-xl bg-white dark:bg-slate-800 transition-colors duration-300">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-biskoto animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Cargando directorio...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-10 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                    <p>{error}</p>
                    <button
                      onClick={cargarUsuarios}
                      className="mt-4 text-biskoto hover:underline font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <p>
                      {searchTerm
                        ? `No se encontraron usuarios que coincidan con "${searchTerm}".`
                        : "No hay usuarios activos registrados."}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-900/50">
                      <tr>
                        {/* Padding reducido en móvil */}
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Usuario
                        </th>
                        {/* Columnas ocultas en móvil para ahorrar espacio */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                          Estado
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {usuariosFiltrados.map((user) => {
                        const isAdmin = user.rol === "admin";

                        // LOGIC: Verificación de identidad para proteger el borrado
                        const isSelf =
                          currentUser &&
                          String(user.id) === String(currentUser.id);

                        return (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {/* Avatar responsivo */}
                                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-biskoto/10 dark:bg-white/10 rounded-full flex items-center justify-center text-biskoto dark:text-white border border-biskoto/20 dark:border-white/20">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <div className="text-sm font-bold text-gray-900 dark:text-white max-w-[140px] sm:max-w-none truncate">
                                    {user.nombre} {user.apellido}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Mail
                                      size={12}
                                      className="hidden sm:inline"
                                    />
                                    <span className="truncate max-w-[140px] sm:max-w-none">
                                      {user.email}
                                    </span>
                                  </div>

                                  {/* INFO MÓVIL: Rol y Estado se muestran aquí en pantallas pequeñas */}
                                  <div className="lg:hidden mt-1 flex items-center gap-2 text-xs">
                                    <span
                                      className={
                                        isAdmin
                                          ? "text-yellow-600 dark:text-yellow-400 font-medium"
                                          : "text-blue-600 dark:text-blue-400"
                                      }
                                    >
                                      {isAdmin ? "Admin" : "Cliente"}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">
                                      •
                                    </span>
                                    <span
                                      className={
                                        user.activo
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-gray-500"
                                      }
                                    >
                                      {user.activo ? "Activo" : "Inactivo"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Columna Contacto (Oculta en Móvil) */}
                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                              <div className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                {user.telefono ? (
                                  <>
                                    <Phone
                                      size={14}
                                      className="text-gray-400"
                                    />
                                    {user.telefono}
                                  </>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">
                                    Sin teléfono
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Columna Rol (Oculta en Móvil/Tablet) */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                              <StatusBadge
                                variant={isAdmin ? "warning" : "info"}
                              >
                                {isAdmin ? (
                                  <>
                                    <Shield size={12} className="mr-1" /> Admin
                                  </>
                                ) : (
                                  "Cliente"
                                )}
                              </StatusBadge>
                            </td>

                            {/* Columna Estado (Oculta en Móvil/Tablet) */}
                            <td className="px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                              <StatusBadge
                                variant={user.activo ? "success" : "default"}
                              >
                                {user.activo ? "Activo" : "Inactivo"}
                              </StatusBadge>
                            </td>

                            {/* Columna Acciones (Manual para preservar lógica isSelf) */}
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Link
                                  to={`/admin/usuarios/editar/${user.id}`}
                                  className="p-2 text-biskoto bg-biskoto-50 dark:text-white dark:bg-white/10 rounded-lg transition-colors hover:bg-biskoto/10 dark:hover:bg-white/20"
                                  title="Editar permisos o datos"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Link>

                                <button
                                  onClick={() =>
                                    !isSelf && handleDeleteClick(user)
                                  }
                                  disabled={isSelf}
                                  className={`p-2 rounded-lg transition-colors ${
                                    isSelf
                                      ? "text-gray-400 bg-gray-100 dark:bg-slate-700 cursor-not-allowed opacity-50"
                                      : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40"
                                  }`}
                                  title={
                                    isSelf
                                      ? "No puedes eliminar tu propia cuenta"
                                      : "Desactivar usuario"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Reutilizable */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="¿Desactivar usuario?"
        message={
          userToDelete && (
            <>
              Estás a punto de desactivar la cuenta de{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {userToDelete.email}
              </span>
              .
              <br className="hidden sm:block" />
              El usuario perderá el acceso inmediatamente, pero sus datos se
              conservarán.
            </>
          )
        }
      />
    </div>
  );
};

export default UsuariosPage;
