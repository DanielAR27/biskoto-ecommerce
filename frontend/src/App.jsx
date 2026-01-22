import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";

// Páginas de Autenticación
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage";

// Páginas de Usuario y General
import HomePage from "./pages/home/HomePage";
import ProfilePage from "./pages/user/ProfilePage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CheckoutPage from "./pages/shop/CheckoutPage";
import MisPedidosPage from "./pages/user/MisPedidosPage";
import DetallePedidoPage from "./pages/user/DetallePedidoPage";

// Páginas de Administración
// Categorias
import CategoriasPage from "./pages/admin/categorias/CategoriasPage";
import CrearCategoriaPage from "./pages/admin/categorias/CrearCategoriaPage";
import EditarCategoriaPage from "./pages/admin/categorias/EditarCategoriaPage";

//Pedidos
import PedidosAdminPage from "./pages/admin/pedidos/PedidosAdminPage";

// Productos
import ProductosPage from "./pages/admin/productos/ProductosPage";
import CrearProductoPage from "./pages/admin/productos/CrearProductoPage";
import EditarProductoPage from "./pages/admin/productos/EditarProductoPage";

// Ingredientes
import IngredientesPage from "./pages/admin/ingredientes/IngredientesPage";
import CrearIngredientePage from "./pages/admin/ingredientes/CrearIngredientePage";
import EditarIngredientePage from "./pages/admin/ingredientes/EditarIngredientePage";

// Cupones
import CuponesPage from "./pages/admin/cupones/CuponesPage";
import CrearCuponPage from "./pages/admin/cupones/CrearCuponPage";
import EditarCuponPage from "./pages/admin/cupones/EditarCuponPage";

// Usuarios
import UsuariosPage from "./pages/admin/usuarios/UsuariosPage";
import EditarUsuarioPage from "./pages/admin/usuarios/EditarUsuarioPage";

// Proveedores
import ProveedoresPage from "./pages/admin/proveedores/ProveedoresPage";
import CrearProveedorPage from "./pages/admin/proveedores/CrearProveedorPage";
import EditarProveedorPage from "./pages/admin/proveedores/EditarProveedorPage";

// Compras (Inventario de Ingredientes)
import ComprasPage from "./pages/admin/compras/ComprasPage";
import CrearCompraPage from "./pages/admin/compras/CrearCompraPage";
import ConsultarCompraPage from "./pages/admin/compras/ConsultarCompraPage";
import EditarCompraPage from "./pages/admin/compras/EditarCompraPage";

//Comentarios, Noticias y Dashboard
import NoticiasPage from "./pages/NoticiasPage";
import NoticiaDetailPage from "./pages/NoticiaDetailPage";
import NoticiasAdminPage from "./pages/admin/noticias/NoticiasAdminPage";
import ComentariosAdminPage from "./pages/admin/comentarios/ComentariosAdminPage";
import DashboardPage from "./pages/admin/dashboard/DashboardPage";

//Nuevas secciones del navbar
import NosotrosPage from "./pages/NosotrosPage";
import ContactoPage from "./pages/ContactoPage";

/**
 * Componente para la protección de rutas privadas de usuario (ej: Perfil).
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-biskoto"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-biskoto"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Layout global: Navbar + Footer + CartDrawer en todas las páginas */}
        <Route element={<Layout />}>
          {/* Rutas Públicas de Autenticación (Redirigen a Home si ya hay sesión) */}
          <Route
            path="/login"
            element={user ? <Navigate to="/home" /> : <LoginPage />}
          />
          <Route
            path="/registro"
            element={user ? <Navigate to="/home" /> : <RegisterPage />}
          />
          <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
          <Route path="/actualizar-password" element={<UpdatePasswordPage />} />

          {/* Rutas Públicas */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/producto/:id" element={<ProductDetailPage />} />
          <Route path="/noticias" element={<NoticiasPage />} />
          <Route path="/noticias/:id" element={<NoticiaDetailPage />} />
          <Route path="/nosotros" element={<NosotrosPage />} />
          <Route path="/contacto" element={<ContactoPage />} />

          {/* Rutas Privadas de Usuario (Requieren Login) */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MisPedidosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pedido/:id"
            element={
              <ProtectedRoute>
                <DetallePedidoPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas de Administración Protegidas por AdminRoute */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/categorias" element={<CategoriasPage />} />
            <Route
              path="/admin/categorias/nueva"
              element={<CrearCategoriaPage />}
            />
            <Route
              path="/admin/categorias/editar/:id"
              element={<EditarCategoriaPage />}
            />

            <Route path="/admin/productos" element={<ProductosPage />} />
            <Route
              path="/admin/productos/nuevo"
              element={<CrearProductoPage />}
            />
            <Route
              path="/admin/productos/editar/:id"
              element={<EditarProductoPage />}
            />

            <Route path="/admin/ingredientes" element={<IngredientesPage />} />
            <Route
              path="/admin/ingredientes/nuevo"
              element={<CrearIngredientePage />}
            />
            <Route
              path="/admin/ingredientes/editar/:id"
              element={<EditarIngredientePage />}
            />

            <Route path="/admin/cupones" element={<CuponesPage />} />
            <Route path="/admin/cupones/nuevo" element={<CrearCuponPage />} />
            <Route
              path="/admin/cupones/editar/:id"
              element={<EditarCuponPage />}
            />

            <Route path="/admin/usuarios" element={<UsuariosPage />} />
            <Route
              path="/admin/usuarios/editar/:id"
              element={<EditarUsuarioPage />}
            />

            <Route path="/admin/proveedores" element={<ProveedoresPage />} />
            <Route
              path="/admin/proveedores/nuevo"
              element={<CrearProveedorPage />}
            />
            <Route
              path="/admin/proveedores/editar/:id"
              element={<EditarProveedorPage />}
            />

            {/* OJO: ya estás dentro de AdminRoute, no hace falta envolver de nuevo */}
            <Route path="/admin/pedidos" element={<PedidosAdminPage />} />
            <Route path="/admin/noticias" element={<NoticiasAdminPage />} />
            <Route
              path="/admin/comentarios"
              element={<ComentariosAdminPage />}
            />

            {/* Si DashboardPage solo es admin, AdminRoute ya lo cubre */}
            <Route path="/admin/dashboard" element={<DashboardPage />} />

            <Route path="/admin/compras" element={<ComprasPage />} />
            <Route path="/admin/compras/nueva" element={<CrearCompraPage />} />
            <Route
              path="/admin/compras/editar/:id"
              element={<EditarCompraPage />}
            />
            <Route
              path="/admin/compras/:id"
              element={<ConsultarCompraPage />}
            />
          </Route>

          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
