import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Phone,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  Store,
} from "lucide-react";
import { getPedido } from "../../api/pedidoService";
import Navbar from "../../components/Navbar";

/**
 * Página de Detalle de un Pedido Específico
 * Muestra toda la información: productos, estado, datos de entrega, comprobante
 */
const DetallePedidoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar pedido al montar
   */
  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setLoading(true);
        const data = await getPedido(id);
        setPedido(data);
      } catch (err) {
        console.error("Error al cargar pedido:", err);
        setError("No se pudo cargar el detalle del pedido.");
      } finally {
        setLoading(false);
      }
    };

    cargarPedido();
  }, [id]);

  /**
   * Configuración de estados
   */
  const estadoConfig = {
    "Pendiente de Pago": {
      color:
        "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400",
      icon: Clock,
    },
    Confirmado: {
      color:
        "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400",
      icon: CheckCircle,
    },
    "En Producción": {
      color:
        "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400",
      icon: ChefHat,
    },
    "Listo para Retiro": {
      color:
        "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400",
      icon: Package,
    },
    Entregado: {
      color:
        "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400",
      icon: Truck,
    },
    Cancelado: {
      color:
        "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400",
      icon: XCircle,
    },
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-CR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-10 w-10 text-biskoto animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="max-w-3xl mx-auto py-10 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No se pudo cargar el pedido
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "El pedido no existe o no tenés acceso a él."}
            </p>
            <button
              onClick={() => navigate("/mis-pedidos")}
              className="px-6 py-3 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold"
            >
              Volver a Mis Pedidos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estado = pedido.estados_pedido?.nombre || "Desconocido";
  const config = estadoConfig[estado] || estadoConfig["Pendiente de Pago"];
  const IconoEstado = config.icon;

  // Parsear notas (JSON)
  let datosEntrega = {};
  try {
    datosEntrega = pedido.notas ? JSON.parse(pedido.notas) : {};
  } catch (e) {
    console.error("Error al parsear notas:", e);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/mis-pedidos")}
            className="flex items-center gap-2 text-gray-500 hover:text-biskoto transition-colors mb-4 font-medium"
          >
            <ArrowLeft size={20} /> Volver a Mis Pedidos
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                Pedido #{pedido.id.toString().padStart(6, "0")}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar size={16} />
                {formatearFecha(pedido.fecha)}
              </div>
            </div>

            <div
              className={`flex items-center gap-2 px-6 py-3 rounded-full border ${config.color} font-bold`}
            >
              <IconoEstado size={20} />
              {estado}
            </div>
          </div>

          {/* 👇 AGREGAR ESTO AQUÍ */}
          {pedido.estado_id === 1 && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                    Pago Pendiente
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Este pedido está esperando la confirmación del pago.
                    Completá el proceso para confirmar tu pedido.
                  </p>
                  <button
                    onClick={() => navigate(`/checkout?pedidoId=${pedido.id}`)}
                    className="px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-md"
                  >
                    <CreditCard size={18} />
                    Completar Pago
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Productos del pedido */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Package size={24} className="text-biskoto" />
              Productos
            </h2>

            <div className="space-y-4">
              {pedido.detalle_pedidos?.map((item, index) => {
                const imagenPrincipal =
                  item.productos?.producto_imagenes?.find(
                    (img) => img.es_principal
                  )?.url || item.productos?.producto_imagenes?.[0]?.url;

                return (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0"
                  >
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden flex-shrink-0">
                      {imagenPrincipal ? (
                        <img
                          src={imagenPrincipal}
                          alt={item.productos?.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="text-gray-300" size={32} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {item.productos?.nombre || "Producto"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cantidad: {item.cantidad}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Precio unitario:{" "}
                        {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: "CRC",
                        }).format(item.precio_unitario_historico)}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: "CRC",
                        }).format(
                          item.precio_unitario_historico * item.cantidad
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Información de entrega */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Truck size={24} className="text-biskoto" />
              Información de Entrega
            </h2>

            <div className="space-y-3">
              {/* Método de entrega */}
              {datosEntrega.metodo_entrega && (
                <div className="flex items-start gap-3">
                  {datosEntrega.metodo_entrega === "express" ? (
                    <Truck size={18} className="text-gray-400 mt-1" />
                  ) : (
                    <Store size={18} className="text-gray-400 mt-1" />
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Método de Entrega
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.metodo_entrega === "express"
                        ? "Envío Express"
                        : "Recoger en el local"}
                    </p>
                    {datosEntrega.metodo_entrega === "express" && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Costo de envío se paga contra entrega
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Teléfono de contacto (nuevo formato) */}
              {datosEntrega.telefono_contacto && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Teléfono de Contacto
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.telefono_contacto}
                    </p>
                  </div>
                </div>
              )}

              {/* Teléfono (formato antiguo - retrocompatibilidad) */}
              {!datosEntrega.telefono_contacto && datosEntrega.telefono && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Teléfono
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.telefono}
                    </p>
                  </div>
                </div>
              )}

              {/* Dirección de entrega (nuevo formato) */}
              {datosEntrega.direccion_entrega && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dirección de Entrega
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.direccion_entrega}
                    </p>
                  </div>
                </div>
              )}

              {/* Dirección (formato antiguo - retrocompatibilidad) */}
              {!datosEntrega.direccion_entrega && datosEntrega.direccion && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Dirección
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.direccion}
                    </p>
                  </div>
                </div>
              )}

              {/* Notas adicionales */}
              {datosEntrega.notas && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Notas adicionales
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {datosEntrega.notas}
                    </p>
                  </div>
                </div>
              )}

              {/* Mensaje si no hay información de entrega */}
              {!datosEntrega.metodo_entrega &&
                !datosEntrega.telefono &&
                !datosEntrega.telefono_contacto &&
                !datosEntrega.direccion &&
                !datosEntrega.direccion_entrega &&
                !datosEntrega.notas && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No se registró información de entrega para este pedido.
                  </p>
                )}
            </div>
          </div>

          {/* Resumen de pago */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-biskoto" />
              Resumen de Pago
            </h2>

            <div className="space-y-3">
              {pedido.cupones && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cupón aplicado:
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {pedido.cupones.codigo} (-
                    {pedido.cupones.descuento_porcentaje}%)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Total:
                </span>
                <span className="text-3xl font-black text-biskoto">
                  {new Intl.NumberFormat("es-CR", {
                    style: "currency",
                    currency: "CRC",
                  }).format(pedido.total)}
                </span>
              </div>
            </div>
          </div>
          {/* Comprobante (si existe) */}
          {datosEntrega.comprobante_url && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Comprobante de Pago
              </h2>

              <a
                href={datosEntrega.comprobante_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <img
                  src={datosEntrega.comprobante_url}
                  alt="Comprobante de pago"
                  className="w-full max-w-md mx-auto rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                />
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DetallePedidoPage;
