import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  Calendar,
  CreditCard,
  ArrowLeft,
  Eye,
  Loader2,
} from "lucide-react";

import { getMisPedidos } from "../../api/pedidoService";
import Navbar from "../../components/Navbar";

/**
 * Página de Historial de Pedidos del Usuario
 * Muestra todos los pedidos realizados con su estado actual
 */
const MisPedidosPage = () => {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar pedidos al montar el componente
   */
  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setLoading(true);
        const data = await getMisPedidos();
        setPedidos(data);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
        setError("No se pudieron cargar tus pedidos. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  /**
   * Configuración de colores y iconos por estado
   */
  const estadoConfig = {
    "Pendiente de Pago": {
      color:
        "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400",
      icon: Clock,
      badge: "bg-yellow-500",
    },
    Confirmado: {
      color:
        "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400",
      icon: CheckCircle,
      badge: "bg-blue-500",
    },
    "En Producción": {
      color:
        "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400",
      icon: ChefHat,
      badge: "bg-purple-500",
    },
    "Listo para Retiro": {
      color:
        "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400",
      icon: Package,
      badge: "bg-orange-500",
    },
    Entregado: {
      color:
        "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400",
      icon: Truck,
      badge: "bg-green-500",
    },
    Cancelado: {
      color:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400",
      icon: XCircle,
      badge: "bg-red-500",
    },
  };

  /**
   * Formatear fecha
   */
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Ver detalle del pedido
   */
  const verDetalle = (pedidoId) => {
    navigate(`/pedido/${pedidoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-biskoto transition-colors mb-4 font-medium"
          >
            <ArrowLeft size={20} /> Volver
          </button>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Mis Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Historial completo de tus pedidos en Biskoto
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Lista de pedidos */}
        {pedidos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
            <Package
              className="mx-auto mb-4 text-gray-300 dark:text-slate-600"
              size={64}
            />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No tenés pedidos todavía
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Explorá nuestro catálogo y hacé tu primer pedido
            </p>
            <button
              onClick={() => navigate("/home")}
              className="px-6 py-3 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold transition-all"
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const estado = pedido.estados_pedido?.nombre || "Desconocido";
              const config =
                estadoConfig[estado] || estadoConfig["Pendiente de Pago"];
              const IconoEstado = config.icon;

              // Obtener primera imagen del primer producto
              const primeraImagen =
                pedido.detalle_pedidos?.[0]?.productos?.producto_imagenes?.find(
                  (img) => img.es_principal,
                )?.url ||
                pedido.detalle_pedidos?.[0]?.productos?.producto_imagenes?.[0]
                  ?.url;

              // Calcular cantidad total de items
              const totalItems =
                pedido.detalle_pedidos?.reduce(
                  (sum, item) => sum + item.cantidad,
                  0,
                ) || 0;

              return (
                <div
                  key={pedido.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Imagen del primer producto */}
                      <div className="flex-shrink-0">
                        <div className="w-full sm:w-32 h-32 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                          {primeraImagen ? (
                            <img
                              src={primeraImagen}
                              alt="Producto"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package
                                className="text-gray-300 dark:text-slate-600"
                                size={48}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información del pedido */}
                      <div className="flex-1 min-w-0">
                        {/* Header con número y estado */}
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                              Pedido #{pedido.id.toString().padStart(6, "0")}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar size={14} />
                              {formatearFecha(pedido.fecha)}
                            </div>
                          </div>

                          {/* Badge de estado */}
                          <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${config.color} font-bold text-sm`}
                          >
                            <IconoEstado size={16} />
                            {estado}
                          </div>
                        </div>

                        {/* Detalles del pedido */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Package size={16} className="text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {totalItems}{" "}
                              {totalItems === 1 ? "producto" : "productos"}
                            </span>
                          </div>

                          {pedido.cupones && (
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard
                                size={16}
                                className="text-green-500"
                              />
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                Cupón: {pedido.cupones.codigo} (-
                                {pedido.cupones.descuento_porcentaje}%)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Total y acciones */}
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                              Total:
                            </span>
                            <span className="text-2xl font-black text-biskoto">
                              {new Intl.NumberFormat("es-CR", {
                                style: "currency",
                                currency: "CRC",
                              }).format(pedido.total)}
                            </span>
                          </div>

                          <button
                            onClick={() => verDetalle(pedido.id)}
                            className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all flex items-center gap-2"
                          >
                            <Eye size={18} />
                            Ver Detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MisPedidosPage;
