import { Link, useLocation } from "react-router-dom";
import {
  User,
  LogIn,
  UserPlus,
  ShoppingCart,
  LayoutGrid,
  Package,
  ClipboardList,
  Ticket,
  Truck,
  PackagePlus,
  Info,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

const MobileMenu = ({ isOpen, setIsOpen, user, logout, isAdmin }) => {
  const location = useLocation();
  const { totalItems, toggleCart } = useCart();

  if (!isOpen) return null;

  const getMobileLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClasses =
      "block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200";

    return isActive
      ? `${baseClasses} bg-biskoto-50 border-biskoto text-biskoto dark:bg-white/10 dark:text-white dark:border-white`
      : `${baseClasses} border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white`;
  };

  return (
    <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
      <div className="pt-2 pb-3 space-y-1">
        <Link
          to="/home"
          className={getMobileLinkClass("/home")}
          onClick={() => setIsOpen(false)}
        >
          Inicio
        </Link>
        <Link
          to="/noticias"
          className={getMobileLinkClass("/noticias")}
          onClick={() => setIsOpen(false)}
        >
          Noticias
        </Link>
        {/* NUEVO: Enlace a Quiénes somos */}
        <Link
          to="/nosotros"
          className={getMobileLinkClass("/nosotros")}
          onClick={() => setIsOpen(false)}
        >
          <div className="flex items-center gap-2">
            <Info size={18} />
            Quiénes somos
          </div>
        </Link>

        {/* Carrito */}
        <button
          onClick={() => {
            setIsOpen(false);
            toggleCart();
          }}
          className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900">
                  <span className="text-[9px] font-bold text-white leading-none">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                </span>
              )}
            </div>
            <span>Mi Carrito</span>
          </div>
        </button>

        {/* Enlaces de Admin */}
        {isAdmin && (
          <div className="space-y-1 mt-4">
            <div className="pl-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Panel Admin
            </div>
            {[
              {
                path: "/admin/categorias",
                label: "Categorías",
                icon: LayoutGrid,
              },
              { path: "/admin/productos", label: "Productos", icon: Package },
              {
                path: "/admin/ingredientes",
                label: "Ingredientes",
                icon: ClipboardList,
              },
              { path: "/admin/cupones", label: "Cupones", icon: Ticket },
              { path: "/admin/usuarios", label: "Usuarios", icon: User },
              { path: "/admin/proveedores", label: "Proveedores", icon: Truck },
              { path: "/admin/compras", label: "Compras", icon: PackagePlus },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getMobileLinkClass(item.path)}
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="opacity-70" />
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 pb-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
        {user ? (
          <>
            <div className="flex items-center px-4">
              <div className="h-10 w-10 rounded-full bg-biskoto/10 flex items-center justify-center text-biskoto dark:bg-white/10 dark:text-white">
                <User size={20} />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {user.nombre}
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                to="/perfil"
                className="block px-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Mi Perfil
              </Link>
              <Link
                to="/mis-pedidos"
                className="block px-4 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
              >
                Mis Pedidos
              </Link>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <div className="px-4 space-y-3">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600"
            >
              <LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión
            </Link>
            <Link
              to="/registro"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-biskoto rounded-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
