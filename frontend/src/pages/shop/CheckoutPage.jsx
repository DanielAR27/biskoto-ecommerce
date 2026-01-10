import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  ShoppingBag,
  Tag,
  AlertCircle,
  CheckCircle,
  Phone,
  MapPin,
  User,
  Upload,
  Loader2,
  ArrowLeft,
  X,
  Store,
  Truck,
  Info,
} from "lucide-react";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { validarCupon } from "../../api/cuponService";
import {
  crearPedido,
  confirmarPago,
  cancelarPedido,
  getPedido,
} from "../../api/pedidoService";
import Navbar from "../../components/Navbar";

/**
 * Página de Checkout con integración de SINPE Móvil
 * Flujo: Validar carrito → Aplicar cupón → Crear pedido → Mostrar datos SINPE → Subir comprobante
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoIdFromURL = searchParams.get("pedidoId");
  const { user } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();

  // Estados del flujo de checkout
  const [paso, setPaso] = useState(pedidoIdFromURL ? 2 : 1); // Si viene pedidoId, saltar a paso 2

  // Estados de datos del pedido
  const [datosEntrega, setDatosEntrega] = useState({
    metodo_entrega: "local", // "local" o "express"
    telefono_contacto: "", // Solo para express
    direccion_entrega: "", // Solo para express
    notas: "",
  });

  // Estado para productos con adelanto
  const [requiereAdelanto, setRequiereAdelanto] = useState(false);
  const [porcentajeAdelanto, setPorcentajeAdelanto] = useState(50); // ← AGREGAR
  const [montoAdelanto, setMontoAdelanto] = useState(0);
  const [montoPendiente, setMontoPendiente] = useState(0);

  // Estados de cupón
  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [errorCupon, setErrorCupon] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);

  // Estados de procesamiento
  const [creandoPedido, setCreandoPedido] = useState(false);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [errorCheckout, setErrorCheckout] = useState("");

  // Estados de pedido creado
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [archivoComprobante, setArchivoComprobante] = useState(null);

  // Cálculos de precios
  const subtotal = totalPrice;
  const descuento = cuponAplicado
    ? (subtotal * cuponAplicado.descuento) / 100
    : 0;
  const total = subtotal - descuento;

  /**
   * Cargar pedido existente si viene pedidoId en la URL
   */
  useEffect(() => {
    const cargarPedidoExistente = async () => {
      if (pedidoIdFromURL) {
        try {
          const pedido = await getPedido(pedidoIdFromURL);

          // Verificar que el pedido esté en estado "Pendiente de Pago"
          if (pedido.estado_id !== 1) {
            setErrorCheckout("Este pedido ya no está pendiente de pago.");
            navigate("/mis-pedidos");
            return;
          }

          // Configurar pedido creado para mostrar pantalla de SINPE
          setPedidoCreado({
            id: pedido.id,
            total: pedido.total,
            numeroReferencia: `BISK-${pedido.id.toString().padStart(6, "0")}`,
            datosPago: {
              telefono: import.meta.env.VITE_SINPE_TELEFONO || "8888-8888",
              titular:
                import.meta.env.VITE_SINPE_TITULAR || "Biskoto Repostería",
              cedula: import.meta.env.VITE_SINPE_CEDULA || "1-2345-6789",
              monto: pedido.total,
            },
          });

          setPaso(2); // Ir directo al paso de pago
        } catch (error) {
          console.error("Error cargando pedido:", error);
          setErrorCheckout("No se pudo cargar el pedido.");
          navigate("/mis-pedidos");
        }
      }
    };

    cargarPedidoExistente();
  }, [pedidoIdFromURL, navigate]);

  /**
   * Detectar si hay productos que requieren adelanto
   */
  useEffect(() => {
    const verificarAdelanto = async () => {
      if (cart.length === 0) return;

      try {
        const productIds = cart.map((item) => item.id);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/productos/verificar-adelanto`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product_ids: productIds }),
          }
        );

        const data = await response.json();

        if (data.requiere_adelanto) {
          setRequiereAdelanto(true);
          setPorcentajeAdelanto(data.porcentaje_adelanto); // ← USAR PORCENTAJE DEL BACKEND
          const totalConDescuento = total;
          const adelanto = Math.ceil(
            totalConDescuento * (data.porcentaje_adelanto / 100)
          ); // ← USAR PORCENTAJE DINÁMICO
          setMontoAdelanto(adelanto);
          setMontoPendiente(totalConDescuento - adelanto);
        } else {
          setRequiereAdelanto(false);
          setPorcentajeAdelanto(50);
          setMontoAdelanto(0);
          setMontoPendiente(0);
        }
      } catch (error) {
        console.error("Error verificando adelanto:", error);
      }
    };

    verificarAdelanto();
  }, [cart, total]);

  // Validación inicial: si no hay items, redirigir
  useEffect(() => {
    if (cart.length === 0 && !pedidoCreado && !pedidoIdFromURL) {
      navigate("/home");
    }
  }, [cart, pedidoCreado, pedidoIdFromURL, navigate]);

  /**
   * Validar cupón
   */
  const handleValidarCupon = async () => {
    if (!codigoCupon.trim()) return;

    setValidandoCupon(true);
    setErrorCupon("");

    try {
      const respuesta = await validarCupon(codigoCupon);
      setCuponAplicado(respuesta);
      setErrorCupon("");
    } catch (error) {
      setErrorCupon(error.response?.data?.error || "Cupón inválido");
      setCuponAplicado(null);
    } finally {
      setValidandoCupon(false);
    }
  };

  /**
   * Remover cupón aplicado
   */
  const handleRemoverCupon = () => {
    setCuponAplicado(null);
    setCodigoCupon("");
    setErrorCupon("");
  };

  /**
   * Crear pedido (Paso 1 → Paso 2)
   */
  const handleCrearPedido = async (e) => {
    e.preventDefault();
    setErrorCheckout("");

    // Validaciones según el método de entrega
    if (datosEntrega.metodo_entrega === "express") {
      if (!datosEntrega.telefono_contacto || !datosEntrega.direccion_entrega) {
        setErrorCheckout(
          "Por favor completa el teléfono y dirección para el envío express"
        );
        return;
      }

      const telefonoRegex = /^[0-9]{8}$/;
      if (!telefonoRegex.test(datosEntrega.telefono_contacto)) {
        setErrorCheckout("El teléfono debe tener 8 dígitos");
        return;
      }
    }

    setCreandoPedido(true);

    try {
      // Preparar items para el backend
      const items = cart.map((item) => ({
        id: item.id,
        cantidad: item.quantity,
      }));

      // Crear pedido
      const respuesta = await crearPedido({
        items,
        cupon_id: cuponAplicado?.id || null,
        datos_entrega: datosEntrega,
      });

      setPedidoCreado(respuesta.pedido);
      setPaso(2); // Avanzar a pantalla de SINPE
    } catch (error) {
      console.error("Error al crear pedido:", error);

      // Manejar conflictos de stock
      if (error.response?.data?.conflictos) {
        setErrorCheckout(
          "Algunos productos no tienen suficiente stock. Por favor actualiza tu carrito."
        );
      } else {
        setErrorCheckout(
          error.response?.data?.error || "Error al procesar el pedido"
        );
      }
    } finally {
      setCreandoPedido(false);
    }
  };

  /**
   * Manejar selección de archivo de comprobante
   */
  const handleSeleccionarComprobante = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) return;

    // Validar tipo de archivo
    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!tiposPermitidos.includes(archivo.type)) {
      setErrorCheckout("Solo se permiten imágenes (JPG, PNG, WebP) o PDF");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      setErrorCheckout("El archivo no debe superar 5MB");
      return;
    }

    setArchivoComprobante(archivo);
    setErrorCheckout("");
  };

  /**
   * Subir comprobante y confirmar pago (Paso 2 → Paso 3)
   */
  const handleConfirmarPago = async () => {
    if (!archivoComprobante) {
      setErrorCheckout("Por favor selecciona el comprobante de pago");
      return;
    }

    setSubiendoComprobante(true);
    setErrorCheckout("");

    try {
      // 1. Generar nombre único para el archivo
      const extension = archivoComprobante.name.split(".").pop();
      const nombreArchivo = `comprobante-${
        pedidoCreado.id
      }-${Date.now()}.${extension}`;

      // 2. Solicitar URL firmada para subir el archivo
      const responseUrl = await fetch(
        `${import.meta.env.VITE_API_URL}/storage/signed-upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ fileName: nombreArchivo }),
        }
      );

      if (!responseUrl.ok) {
        throw new Error("Error al obtener autorización de subida");
      }

      const { signedUrl, path, bucket } = await responseUrl.json();

      // 3. Subir archivo directamente a Supabase Storage
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: archivoComprobante,
        headers: {
          "Content-Type": archivoComprobante.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el archivo");
      }

      // 4. Construir URL pública del comprobante
      const comprobanteUrl = `${
        import.meta.env.VITE_SUPABASE_URL
      }/storage/v1/object/public/${bucket}/${path}`;

      // 5. Confirmar pago en el backend
      await confirmarPago(pedidoCreado.id, comprobanteUrl);

      // 6. Limpiar carrito y avanzar a confirmación
      clearCart();
      setPaso(3);
    } catch (error) {
      console.error("Error al confirmar pago:", error);
      setErrorCheckout(
        error.response?.data?.error ||
          "Error al procesar el comprobante. Por favor intenta nuevamente."
      );
    } finally {
      setSubiendoComprobante(false);
    }
  };

  /**
   * Cancelar el pedido actual
   */
  const handleCancelarPedido = async () => {
    // Confirmación
    if (!window.confirm("¿Estás seguro que querés cancelar este pedido?")) {
      return;
    }

    setCancelando(true);
    setErrorCheckout("");

    try {
      await cancelarPedido(pedidoCreado.id);

      // Limpiar carrito y redirigir
      clearCart();
      navigate("/home");
    } catch (error) {
      console.error("Error al cancelar pedido:", error);
      setErrorCheckout(
        "Error al cancelar el pedido. Por favor intenta nuevamente."
      );
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => (paso === 1 ? navigate(-1) : setPaso(paso - 1))}
            className="flex items-center gap-2 text-gray-500 hover:text-biskoto transition-colors mb-4 font-medium"
          >
            <ArrowLeft size={20} />{" "}
            {paso === 1 ? "Volver al carrito" : "Paso anterior"}
          </button>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Finalizar Compra
          </h1>

          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    paso >= num
                      ? "bg-biskoto text-white"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-400"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-12 h-1 mx-1 ${
                      paso > num
                        ? "bg-biskoto"
                        : "bg-gray-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes de error globales */}
        {errorCheckout && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle
              className="text-red-500 flex-shrink-0 mt-0.5"
              size={20}
            />
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorCheckout}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* PASO 1: Método de entrega y datos */}
            {paso === 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Truck size={24} className="text-biskoto" />
                  Método de Entrega
                </h2>

                {/* AGREGAR ESTE BLOQUE */}
                {requiereAdelanto && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Info
                        className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-1">
                          Este pedido requiere adelanto del {porcentajeAdelanto}
                          %
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          Algunos productos de tu carrito requieren un pago
                          adelantado del {porcentajeAdelanto}% para comenzar la
                          preparación.
                        </p>
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Pagarás ahora:{" "}
                          {new Intl.NumberFormat("es-CR", {
                            style: "currency",
                            currency: "CRC",
                          }).format(montoAdelanto)}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          El resto (
                          {new Intl.NumberFormat("es-CR", {
                            style: "currency",
                            currency: "CRC",
                          }).format(montoPendiente)}
                          ) se paga al recoger el pedido.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCrearPedido} className="space-y-6">
                  {/* Selección de método de entrega */}
                  <div className="space-y-3">
                    {/* Opción: Recoger en el local */}
                    <label
                      className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        datosEntrega.metodo_entrega === "local"
                          ? "border-biskoto bg-biskoto/5 dark:bg-biskoto/10"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodo_entrega"
                        value="local"
                        checked={datosEntrega.metodo_entrega === "local"}
                        onChange={(e) =>
                          setDatosEntrega({
                            ...datosEntrega,
                            metodo_entrega: e.target.value,
                            telefono_contacto: "",
                            direccion_entrega: "",
                          })
                        }
                        className="mt-1 w-4 h-4 text-biskoto focus:ring-biskoto"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Store size={20} className="text-biskoto" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            Recoger en el local
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pasá a retirar tu pedido cuando esté listo. Te
                          notificaremos por WhatsApp.
                        </p>
                      </div>
                    </label>

                    {/* Opción: Envío Express */}
                    <label
                      className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        datosEntrega.metodo_entrega === "express"
                          ? "border-biskoto bg-biskoto/5 dark:bg-biskoto/10"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodo_entrega"
                        value="express"
                        checked={datosEntrega.metodo_entrega === "express"}
                        onChange={(e) =>
                          setDatosEntrega({
                            ...datosEntrega,
                            metodo_entrega: e.target.value,
                          })
                        }
                        className="mt-1 w-4 h-4 text-biskoto focus:ring-biskoto"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck size={20} className="text-biskoto" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            Envío Express
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Entrega a domicilio el mismo día. El servicio de
                          mensajería se coordina directamente con vos.
                        </p>
                        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <Info
                            size={16}
                            className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            <strong>Importante:</strong> El costo del envío
                            express NO está incluido en este total. Se paga
                            directamente al mensajero contra entrega.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Campos condicionales para Envío Express */}
                  {datosEntrega.metodo_entrega === "express" && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={18} className="text-biskoto" />
                        Datos de Contacto y Entrega
                      </h3>

                      {/* Teléfono de contacto */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <Phone size={16} className="inline mr-2" />
                          Teléfono de Contacto *
                        </label>
                        <input
                          type="tel"
                          value={datosEntrega.telefono_contacto}
                          onChange={(e) =>
                            setDatosEntrega({
                              ...datosEntrega,
                              telefono_contacto: e.target.value,
                            })
                          }
                          placeholder="8888-8888"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-biskoto focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                          required={datosEntrega.metodo_entrega === "express"}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          El mensajero te contactará a este número para
                          coordinar la entrega
                        </p>
                      </div>

                      {/* Dirección de entrega */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <MapPin size={16} className="inline mr-2" />
                          Dirección de Entrega *
                        </label>
                        <textarea
                          value={datosEntrega.direccion_entrega}
                          onChange={(e) =>
                            setDatosEntrega({
                              ...datosEntrega,
                              direccion_entrega: e.target.value,
                            })
                          }
                          placeholder="Calle, número, referencias, puntos de referencia..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-biskoto focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                          required={datosEntrega.metodo_entrega === "express"}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Incluí referencias claras para facilitar la entrega
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notas adicionales (siempre visible) */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notas Adicionales (Opcional)
                    </label>
                    <textarea
                      value={datosEntrega.notas}
                      onChange={(e) =>
                        setDatosEntrega({
                          ...datosEntrega,
                          notas: e.target.value,
                        })
                      }
                      placeholder="Instrucciones especiales, alergias, preferencias, etc."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-biskoto focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  {/* Botón continuar */}
                  <button
                    type="submit"
                    disabled={creandoPedido}
                    className="w-full py-4 bg-biskoto hover:bg-biskoto-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {creandoPedido ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando...
                      </>
                    ) : (
                      <>
                        Continuar al Pago
                        <CreditCard size={20} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* PASO 2: Datos de SINPE Móvil */}
            {paso === 2 && pedidoCreado && (
              <div className="space-y-6">
                {/* Instrucciones de pago */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard size={24} className="text-biskoto" />
                    Datos para SINPE Móvil
                  </h2>

                  <div className="bg-biskoto/10 dark:bg-biskoto/20 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Realiza la transferencia SINPE Móvil con los siguientes
                      datos:
                    </p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-lg p-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Teléfono:
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {pedidoCreado.datosPago.telefono}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-lg p-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Titular:
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {pedidoCreado.datosPago.titular}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-lg p-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Cédula:
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {pedidoCreado.datosPago.cedula}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-green-100 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-500 dark:border-green-600">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Monto a transferir:
                        </span>
                        <span className="text-2xl font-black text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat("es-CR", {
                            style: "currency",
                            currency: "CRC",
                          }).format(pedidoCreado.datosPago.monto)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-3">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          Referencia:
                        </span>
                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                          {pedidoCreado.numeroReferencia}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Instrucciones */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Pasos para completar tu pago:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Abrí tu app bancaria</li>
                      <li>Seleccioná SINPE Móvil</li>
                      <li>Ingresá el número de teléfono y el monto exacto</li>
                      <li>Incluí la referencia en el campo de descripción</li>
                      <li>Confirmá la transferencia</li>
                      <li>Subí el comprobante abajo</li>
                    </ol>
                  </div>
                </div>

                {/* Subir comprobante */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-biskoto" />
                    Subir Comprobante
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleSeleccionarComprobante}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-biskoto file:text-white
                            hover:file:bg-biskoto-700
                            file:cursor-pointer file:transition-all"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Formatos permitidos: JPG, PNG, WebP, PDF (máx. 5MB)
                      </p>
                    </div>

                    {archivoComprobante && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle
                            className="text-green-600 dark:text-green-400"
                            size={20}
                          />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {archivoComprobante.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setArchivoComprobante(null)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 space-y-4">
                    <button
                      onClick={handleConfirmarPago}
                      disabled={!archivoComprobante || subiendoComprobante}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {subiendoComprobante ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Confirmando Pago...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Confirmar Pago
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelarPedido}
                      disabled={cancelando || subiendoComprobante}
                      className="w-full py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:bg-gray-100 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {cancelando ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Cancelando...
                        </>
                      ) : (
                        <>
                          <X size={18} />
                          Cancelar Pedido
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Confirmación */}
            {paso === 3 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle
                    className="text-green-600 dark:text-green-400"
                    size={40}
                  />
                </div>

                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                  ¡Pedido Confirmado!
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Tu pedido{" "}
                  <span className="font-bold text-biskoto">
                    #{pedidoCreado.numeroReferencia}
                  </span>{" "}
                  ha sido procesado exitosamente. Te notificaremos cuando esté
                  listo.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/mis-pedidos")}
                    className="px-6 py-3 bg-biskoto hover:bg-biskoto-700 text-white rounded-xl font-bold transition-all"
                  >
                    Ver Mis Pedidos
                  </button>
                  <button
                    onClick={() => navigate("/home")}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
                  >
                    Seguir Comprando
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="text-biskoto" />
                Resumen del Pedido
              </h3>

              {/* Lista de productos */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity} x{" "}
                        {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: "CRC",
                        }).format(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón */}
              {paso === 1 && (
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-slate-700">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag size={16} className="inline mr-2" />
                    Cupón de Descuento
                  </label>

                  {cuponAplicado ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {cuponAplicado.codigo}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {cuponAplicado.descuento}% de descuento
                        </p>
                      </div>
                      <button
                        onClick={handleRemoverCupon}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={(e) =>
                          setCodigoCupon(e.target.value.toUpperCase())
                        }
                        placeholder="Código"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-biskoto focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={handleValidarCupon}
                        disabled={validandoCupon || !codigoCupon.trim()}
                        className="px-4 py-2 bg-biskoto hover:bg-biskoto-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-sm transition-all"
                      >
                        {validandoCupon ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          "Aplicar"
                        )}
                      </button>
                    </div>
                  )}

                  {errorCupon && (
                    <p className="text-xs text-red-500 mt-2">{errorCupon}</p>
                  )}
                </div>
              )}

              {/* Totales */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat("es-CR", {
                      style: "currency",
                      currency: "CRC",
                    }).format(subtotal)}
                  </span>
                </div>

                {cuponAplicado && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                    <span>Descuento ({cuponAplicado.descuento}%):</span>
                    <span>
                      -
                      {new Intl.NumberFormat("es-CR", {
                        style: "currency",
                        currency: "CRC",
                      }).format(descuento)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2">
                  {requiereAdelanto ? (
                    <>
                      {/* Mostrar adelanto y pendiente */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">
                            Total del pedido:
                          </span>
                          <span className="text-lg font-bold">
                            {new Intl.NumberFormat("es-CR", {
                              style: "currency",
                              currency: "CRC",
                            }).format(total)}
                          </span>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              Adelanto ({porcentajeAdelanto}%):
                            </span>
                            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                              {new Intl.NumberFormat("es-CR", {
                                style: "currency",
                                currency: "CRC",
                              }).format(montoAdelanto)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              Pendiente al recoger:
                            </span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {new Intl.NumberFormat("es-CR", {
                                style: "currency",
                                currency: "CRC",
                              }).format(montoPendiente)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <Info
                            size={16}
                            className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                          />
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            Este pedido requiere un adelanto del{" "}
                            {porcentajeAdelanto}%. El resto se paga al momento
                            de recoger.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Total:
                      </span>
                      <span className="text-2xl font-black text-biskoto">
                        {new Intl.NumberFormat("es-CR", {
                          style: "currency",
                          currency: "CRC",
                        }).format(total)}
                      </span>
                    </div>
                  )}
                </div>

                {paso === 1 && datosEntrega.metodo_entrega === "express" && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 italic pt-2">
                    * Costo de envío express NO incluido (se paga contra
                    entrega)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
