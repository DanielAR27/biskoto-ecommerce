import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  ChevronDown,
  LayoutGrid,
  Package,
  ClipboardList,
  Ticket,
  User,
  Truck,
  PackagePlus,
  ShoppingBag,
  Newspaper,
  MessageSquare,
  BarChart3, // ← NUEVO: Ícono para Dashboard
} from "lucide-react";

const AdminMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    // ========================================
    // NUEVO: Dashboard de Analíticas
    // ========================================
    { to: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
    // ========================================

    { to: "/admin/categorias", icon: LayoutGrid, label: "Categorías" },
    { to: "/admin/productos", icon: Package, label: "Productos" },
    { to: "/admin/ingredientes", icon: ClipboardList, label: "Ingredientes" },
    { to: "/admin/cupones", icon: Ticket, label: "Cupones" },
    { to: "/admin/usuarios", icon: User, label: "Usuarios" },
    { to: "/admin/proveedores", icon: Truck, label: "Proveedores" },
    { to: "/admin/compras", icon: PackagePlus, label: "Compras" },
    { to: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos" },
    { to: "/admin/noticias", icon: Newspaper, label: "Noticias" },
    { to: "/admin/comentarios", icon: MessageSquare, label: "Comentarios" },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isAdminRoute
            ? "bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white shadow-inner"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
        }`}
      >
        <Settings
          className={`h-5 w-5 transition-transform duration-500 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
        <span>Admin</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-slate-700 focus:outline-none animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="px-4 py-2 border-b border-gray-50 dark:border-slate-700 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Gestión
            </p>
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                location.pathname === item.to
                  ? "bg-biskoto/10 text-biskoto dark:bg-white/10 dark:text-white font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon
                className={`mr-3 h-4 w-4 ${
                  location.pathname === item.to
                    ? "text-biskoto dark:text-white"
                    : "text-gray-400"
                }`}
              />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
