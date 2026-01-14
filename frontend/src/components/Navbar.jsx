import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import { useCart } from "../context/CartContext";

// Importación de Subcomponentes
import GuestMenu from "./navbar/GuestMenu";
import UserMenu from "./navbar/UserMenu";
import AdminMenu from "./navbar/AdminMenu";
import MobileMenu from "./navbar/MobileMenu";
import CartWidget from "./navbar/CartWidget";
import ThemeToggleBtn from "./ThemeToggleBtn";

// Assets
import logoLight from "../assets/logo_biskoto_transparente_lm.png";
import logoDark from "../assets/logo_biskoto_transparente_dm.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toggleCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isAdmin = user?.rol === "admin";

  // Helper para estilos del link activo (Escritorio)
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClasses =
      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 h-full";
    const activeClasses =
      "border-biskoto text-biskoto dark:text-white dark:border-white";
    const inactiveClasses =
      "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* --- LADO IZQUIERDO: Logo y Links --- */}
          <div className="flex items-center">
            <Link to="/home" className="flex-shrink-0 flex items-center group">
              <img
                src={logoLight}
                alt="Biskoto Logo"
                className="h-26 w-auto object-contain transition-transform group-hover:scale-105 dark:hidden"
              />
              <img
                src={logoDark}
                alt="Biskoto Logo"
                className="h-26 w-auto object-contain transition-transform group-hover:scale-105 hidden dark:block"
              />
            </Link>

            <div className="hidden md:ml-8 md:flex md:space-x-8 h-full">
              <Link to="/home" className={getLinkClass("/home")}>
                Inicio
              </Link>
              <Link to="/noticias" className={getLinkClass("/noticias")}>
                Noticias
              </Link>
              {/* Enlace a Quiénes somos */}
              <Link to="/nosotros" className={getLinkClass("/nosotros")}>
                Quiénes somos
              </Link>
              <Link to="/contacto" className={getLinkClass("/contacto")}>
                Contáctanos
              </Link>
            </div>
          </div>

          {/* --- LADO DERECHO (Escritorio) --- */}
          <div className="hidden md:flex items-center gap-4">
            {/* 1. Botón de Tema (Siempre visible) */}
            <ThemeToggleBtn />

            {/* 2. Widget del Carrito (Siempre visible) */}
            <div
              onClick={toggleCart}
              className="focus:outline-none cursor-pointer"
            >
              <CartWidget />
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

            {/* 3. Menús Condicionales (Auth) */}
            {!user ? (
              <GuestMenu />
            ) : (
              <>
                {isAdmin && (
                  <>
                    <AdminMenu />
                    <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
                  </>
                )}
                <UserMenu user={user} logout={logout} />
              </>
            )}
          </div>

          {/* --- CONTROLES MÓVIL --- */}
          <div className="-mr-2 flex items-center md:hidden gap-3">
            <ThemeToggleBtn />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
      <MobileMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        user={user}
        logout={logout}
        isAdmin={isAdmin}
      />
    </nav>
  );
};

export default Navbar;
