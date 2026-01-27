import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown, Package } from "lucide-react";

const UserMenu = ({ user, logout }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-biskoto p-1 pr-3 border transition-all duration-200 ${
          location.pathname === "/perfil"
            ? "bg-biskoto/10 border-biskoto/30 text-biskoto dark:bg-white/10 dark:text-white dark:border-white/30 shadow-sm"
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
        }`}
      >
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center shadow-inner ${
            location.pathname === "/perfil"
              ? "bg-biskoto/10 text-biskoto dark:bg-white/20 dark:text-white"
              : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"
          }`}
        >
          <User size={18} />
        </div>
        <span className="ml-3 font-medium hidden lg:block">{user?.nombre}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-slate-700 focus:outline-none animate-in fade-in zoom-in-95 duration-200 z-50 border border-gray-100 dark:border-slate-700">
          <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-700 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Mi Cuenta
            </p>
            <p className="text-xs text-gray-900 dark:text-white font-medium truncate">
              {user?.email}
            </p>
          </div>

          <Link
            to="/perfil"
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="mr-3 h-4 w-4 text-gray-400" />
            Mi Perfil
          </Link>

          <Link
            to="/mis-pedidos"
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Package className="mr-3 h-4 w-4 text-gray-400" />
            Mis Pedidos
          </Link>

          <button
            onClick={() => {
              logout(); // 1. Cierra la sesión (borra tokens)
              navigate("/home");
            }}
            className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
