import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import CompraForm from "../../../components/admin/CompraForm";
import { createCompra } from "../../../api/compraService";
import { PackagePlus, ArrowLeft } from "lucide-react";

/**
 * Página para el registro de nuevas compras (Abastecimiento).
 */
const CrearCompraPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      await createCompra(formData);

      navigate("/admin/compras", {
        state: {
          successMessage: `La compra ha sido registrada correctamente. El inventario ha sido actualizado.`,
        },
      });
    } catch (err) {
      console.error("Error al registrar la compra:", err);
      setError(
        err.response?.data?.error ||
          "No se pudo registrar la compra en el sistema.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/admin/compras"
            className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-biskoto dark:hover:text-white transition-colors mb-4 group w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
            Volver al historial
          </Link>

          {/* Ajuste responsivo: gap-4 y alineación flexible */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-biskoto/10 rounded-2xl flex-shrink-0">
              <PackagePlus className="h-8 w-8 text-biskoto" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Registrar Compra
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingresa los datos de la factura y desglosa los ingredientes
                recibidos.
              </p>
            </div>
          </div>
        </div>

        <CompraForm
          onSubmit={handleCreate}
          loading={loading}
          error={error}
          buttonText="Finalizar Compra"
          initialData={null} // Claridad para el componente unificado
          isReadOnly={false}
        />
      </main>
    </div>
  );
};

export default CrearCompraPage;
