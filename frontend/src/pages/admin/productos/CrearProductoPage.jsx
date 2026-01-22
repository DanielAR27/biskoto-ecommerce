import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import ProductoForm from "../../../components/admin/ProductoForm";
import { createProducto } from "../../../api/productoService";
import { Package, ArrowLeft } from "lucide-react";

/**
 * Página para el registro de nuevos productos.
 * Coordina el envío de los datos procesados (incluyendo URLs de imágenes) al backend.
 */
const CrearProductoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Maneja la creación del producto.
   * Recibe el objeto formData que ya contiene el array de imágenes subidas al bucket.
   */
  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // Enviamos la petición al endpoint de creación
      await createProducto(formData);

      // Redirección con mensaje de éxito para que ProductosPage lo muestre
      navigate("/admin/productos", {
        state: {
          successMessage: `El producto "${formData.nombre}" ha sido creado exitosamente.`,
        },
      });
    } catch (err) {
      console.error("Error al crear el producto:", err);
      setError(
        err.response?.data?.error ||
          "No se pudo registrar el producto en la base de datos.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Navegación de regreso */}
        <div className="mb-8">
          <Link
            to="/admin/productos"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al listado
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl">
              <Package className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Nuevo Producto
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Completa la información técnica y sube las fotos para el
                catálogo.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario con lógica de imágenes integrada */}
        <ProductoForm
          onSubmit={handleCreate}
          loading={loading}
          error={error}
          buttonText="Crear Producto"
        />
      </main>
    </div>
  );
};

export default CrearProductoPage;
