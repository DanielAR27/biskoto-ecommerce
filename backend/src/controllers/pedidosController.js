const supabase = require("../config/supabase");

/**
 * CREAR PEDIDO (Checkout Inicial)
 * Crea el pedido en estado "Pendiente de Pago" sin descontar stock todavía.
 * El stock se descuenta solo cuando el pago se confirma.
 */
const crearPedido = async (req, res) => {
  const { items, cupon_id, datos_entrega } = req.body;
  const perfil_id = req.user.id; // Del middleware de autenticación

  // 1. Validaciones básicas
  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ error: "El pedido debe contener al menos un producto." });
  }

  if (!datos_entrega || !datos_entrega.metodo_entrega) {
    return res
      .status(400)
      .json({ error: "Debe especificar el método de entrega." });
  }

  // Validaciones específicas según método de entrega
  if (datos_entrega.metodo_entrega === "express") {
    if (!datos_entrega.telefono_contacto || !datos_entrega.direccion_entrega) {
      return res.status(400).json({
        error:
          "Para envío express se requiere teléfono de contacto y dirección de entrega.",
      });
    }
  }

  try {
    // 2. Validar disponibilidad de stock ANTES de crear el pedido
    const productIds = items.map((item) => item.id);

    const { data: recetas, error: errorRecetas } = await supabase
      .from("producto_ingredientes")
      .select(
        `
        producto_id,
        ingrediente_id,
        cantidad_necesaria,
        productos ( id, nombre, stock_actual, precio ),
        ingredientes ( id, stock_actual, es_ilimitado )
      `
      )
      .in("producto_id", productIds);

    if (errorRecetas) throw errorRecetas;

    // 3. Agrupar datos
    const infoIngredientes = {};
    const infoProductos = {};

    recetas.forEach((receta) => {
      infoIngredientes[receta.ingrediente_id] = receta.ingredientes;
      infoProductos[receta.producto_id] = receta.productos;
    });

    // 4. Calcular disponibilidad real y detectar conflictos
    const conflictos = [];
    let subtotal = 0;

    for (const item of items) {
      const producto = infoProductos[item.id];

      if (!producto) {
        conflictos.push({ id: item.id, error: "Producto no encontrado" });
        continue;
      }

      // Calcular máximo fabricable
      let maximoFabricable = producto.stock_actual || 0;

      const recetaDelProducto = recetas.filter(
        (r) => r.producto_id === item.id
      );

      recetaDelProducto.forEach((r) => {
        if (r.ingredientes.es_ilimitado) return;

        const stockDisponible = r.ingredientes.stock_actual || 0;
        const cantidadNecesaria = r.cantidad_necesaria || 1;
        const posibleConEsteIng = Math.floor(
          stockDisponible / cantidadNecesaria
        );

        maximoFabricable = Math.min(maximoFabricable, posibleConEsteIng);
      });

      // Validar cantidad solicitada
      if (item.cantidad > maximoFabricable) {
        conflictos.push({
          id: item.id,
          nombre: producto.nombre,
          cantidadSolicitada: item.cantidad,
          cantidadDisponible: maximoFabricable,
        });
      }

      // Calcular subtotal
      subtotal += producto.precio * item.cantidad;
    }

    // Si hay conflictos, rechazar el pedido
    if (conflictos.length > 0) {
      return res.status(400).json({
        error: "Stock insuficiente para algunos productos",
        conflictos,
      });
    }

    // 5. Aplicar cupón si existe
    let descuento = 0;
    let cuponAplicado = null;

    if (cupon_id) {
      const { data: cupon, error: errorCupon } = await supabase
        .from("cupones")
        .select("*")
        .eq("id", cupon_id)
        .single();

      if (errorCupon || !cupon || !cupon.activo) {
        return res.status(400).json({ error: "Cupón inválido o inactivo" });
      }

      // Verificar fecha de expiración
      if (cupon.fecha_expiracion) {
        const fechaActualCR = new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" })
        );
        fechaActualCR.setHours(0, 0, 0, 0);
        const fechaExpiracion = new Date(cupon.fecha_expiracion + "T00:00:00");
        fechaExpiracion.setHours(0, 0, 0, 0);

        if (fechaActualCR.getTime() > fechaExpiracion.getTime()) {
          return res.status(400).json({ error: "El cupón ha expirado" });
        }
      }

      descuento = (subtotal * cupon.descuento_porcentaje) / 100;
      cuponAplicado = cupon;
    }

    const total = subtotal - descuento;

    // 4.5. Detectar si hay productos que requieren adelanto
    const { data: productosCompletos, error: errorProductos } = await supabase
      .from("productos")
      .select("id, requiere_adelanto, porcentaje_adelanto")
      .in("id", productIds);

    if (errorProductos) throw errorProductos;

    const hayProductosConAdelanto = productosCompletos.some(
      (p) => p.requiere_adelanto
    );

    let requiereAdelanto = false;
    let porcentajeAdelanto = 0;
    let montoAdelanto = 0;

    if (hayProductosConAdelanto) {
      requiereAdelanto = true;

      // Usar el porcentaje más alto de todos los productos con adelanto
      // (si hay múltiples productos con diferentes porcentajes)
      const porcentajes = productosCompletos
        .filter((p) => p.requiere_adelanto)
        .map((p) => p.porcentaje_adelanto || 50);

      porcentajeAdelanto = Math.max(...porcentajes);

      // Calcular monto del adelanto (redondear hacia arriba)
      montoAdelanto = Math.ceil(total * (porcentajeAdelanto / 100));
    }

    // 6. Crear el pedido (estado 1 = "Pendiente de Pago")
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .insert([
        {
          perfil_id,
          total,
          estado_id: requiereAdelanto ? 7 : 1, // 7 = Pago Parcial, 1 = Pendiente de Pago
          cupon_id: cupon_id || null,
          notas: JSON.stringify(datos_entrega),
          // Campos de adelanto
          requiere_adelanto: requiereAdelanto,
          porcentaje_adelanto: porcentajeAdelanto,
          monto_adelanto: montoAdelanto,
          monto_pagado: 0,
          monto_pendiente: requiereAdelanto ? total - montoAdelanto : total,
          pago_completo: false,
        },
      ])
      .select()
      .single();

    if (errorPedido) throw errorPedido;

    // 7. Insertar items del pedido
    const detalleItems = items.map((item) => ({
      pedido_id: pedido.id,
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario_historico: infoProductos[item.id].precio,
    }));

    const { error: errorDetalle } = await supabase
      .from("detalle_pedidos")
      .insert(detalleItems);

    if (errorDetalle) throw errorDetalle;

    // 8. Generar número de referencia para SINPE
    const numeroReferencia = `BISK-${pedido.id.toString().padStart(6, "0")}`;

    // 9. Respuesta exitosa
    res.status(201).json({
      mensaje: "Pedido creado exitosamente",
      pedido: {
        id: pedido.id,
        total,
        subtotal,
        descuento,
        requiere_adelanto: requiereAdelanto,
        monto_adelanto: montoAdelanto,
        monto_pendiente: pedido.monto_pendiente,
        cupon: cuponAplicado
          ? {
              codigo: cuponAplicado.codigo,
              descuento: cuponAplicado.descuento_porcentaje,
            }
          : null,
        numeroReferencia,
        datosPago: {
          telefono: process.env.SINPE_TELEFONO || "8888-8888",
          titular: process.env.SINPE_TITULAR || "Biskoto Repostería",
          cedula: process.env.SINPE_CEDULA || "1-2345-6789",
          monto: requiereAdelanto ? montoAdelanto : total, // Monto a pagar AHORA
        },
      },
    });
  } catch (error) {
    console.error("Error al crear pedido:", error);
    res.status(500).json({ error: "Error interno al procesar el pedido" });
  }
};

/**
 * CONFIRMAR PAGO
 * Actualiza el estado del pedido a "Confirmado" y descuenta el stock.
 * Esta función se llama cuando el usuario sube el comprobante de SINPE.
 */
const confirmarPago = async (req, res) => {
  const { id } = req.params;
  const { comprobante_url } = req.body; // URL del comprobante subido a Supabase Storage
  const perfil_id = req.user.id;

  try {
    // 1. Verificar que el pedido existe y pertenece al usuario
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        detalle_pedidos (
          producto_id,
          cantidad
        )
      `
      )
      .eq("id", id)
      .eq("perfil_id", perfil_id)
      .single();

    if (errorPedido || !pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // 2. Verificar que el pedido está en estado válido para confirmar pago
    // Estado 1 = Pendiente de Pago (sin adelanto), Estado 7 = Pago Parcial (con adelanto)
    if (![1, 7].includes(pedido.estado_id)) {
      return res.status(400).json({
        error: "Este pedido ya ha sido procesado o cancelado",
      });
    }

    // 3. Validar disponibilidad de stock nuevamente (por si cambió)
    const productIds = pedido.detalle_pedidos.map((item) => item.producto_id);

    const { data: recetas, error: errorRecetas } = await supabase
      .from("producto_ingredientes")
      .select(
        `
        producto_id,
        ingrediente_id,
        cantidad_necesaria,
        productos ( id, nombre, stock_actual ),
        ingredientes ( id, stock_actual, es_ilimitado )
      `
      )
      .in("producto_id", productIds);

    if (errorRecetas) throw errorRecetas;

    // Agrupar datos
    const infoIngredientes = {};
    const infoProductos = {};

    recetas.forEach((receta) => {
      infoIngredientes[receta.ingrediente_id] = receta.ingredientes;
      infoProductos[receta.producto_id] = receta.productos;
    });

    // Validar stock
    const conflictos = [];

    for (const item of pedido.detalle_pedidos) {
      const producto = infoProductos[item.producto_id];
      let maximoFabricable = producto.stock_actual || 0;

      const recetaDelProducto = recetas.filter(
        (r) => r.producto_id === item.producto_id
      );

      recetaDelProducto.forEach((r) => {
        if (r.ingredientes.es_ilimitado) return;

        const stockDisponible = r.ingredientes.stock_actual || 0;
        const cantidadNecesaria = r.cantidad_necesaria || 1;
        const posibleConEsteIng = Math.floor(
          stockDisponible / cantidadNecesaria
        );

        maximoFabricable = Math.min(maximoFabricable, posibleConEsteIng);
      });

      if (item.cantidad > maximoFabricable) {
        conflictos.push({
          id: item.producto_id,
          nombre: producto.nombre,
          cantidadSolicitada: item.cantidad,
          cantidadDisponible: maximoFabricable,
        });
      }
    }

    if (conflictos.length > 0) {
      return res.status(400).json({
        error:
          "Stock insuficiente. El inventario cambió desde que creaste el pedido.",
        conflictos,
      });
    }
    // 4. Actualizar el pedido según tipo de pago
    let nuevoEstado;
    let montoPagado;
    let montoPendiente;
    let pagoCompleto;

    // Parsear notas para agregar comprobante
    let notasActuales = {};
    try {
      notasActuales = pedido.notas ? JSON.parse(pedido.notas) : {};
    } catch (e) {
      notasActuales = {};
    }

    if (pedido.requiere_adelanto && !pedido.pago_completo) {
      // Primer pago (adelanto)
      nuevoEstado = 7; // Pago Parcial
      montoPagado = pedido.monto_adelanto;
      montoPendiente = pedido.total - pedido.monto_adelanto;
      pagoCompleto = false;
      notasActuales.comprobante_adelanto_url = comprobante_url;
    } else {
      // Pago completo normal
      nuevoEstado = 2; // Confirmado
      montoPagado = pedido.total;
      montoPendiente = 0;
      pagoCompleto = true;
      notasActuales.comprobante_url = comprobante_url;
    }

    // Actualizar pedido
    const { error: errorUpdate } = await supabase
      .from("pedidos")
      .update({
        estado_id: nuevoEstado,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,
        pago_completo: pagoCompleto,
        notas: JSON.stringify(notasActuales),
      })
      .eq("id", id);

    if (errorUpdate) throw errorUpdate;
    // 4. Descontar stock de productos terminados e ingredientes
    // Solo descontar stock cuando el pago esté completo
    if (pagoCompleto) {
      for (const item of pedido.detalle_pedidos) {
        const producto = infoProductos[item.producto_id];

        // Descontar producto terminado
        const nuevoStockProducto = producto.stock_actual - item.cantidad;

        await supabase
          .from("productos")
          .update({ stock_actual: nuevoStockProducto })
          .eq("id", item.producto_id);

        // Descontar ingredientes
        const recetaDelProducto = recetas.filter(
          (r) => r.producto_id === item.producto_id
        );

        for (const r of recetaDelProducto) {
          if (r.ingredientes.es_ilimitado) continue;

          const cantidadADescontar = r.cantidad_necesaria * item.cantidad;
          const nuevoStockIngrediente =
            r.ingredientes.stock_actual - cantidadADescontar;

          await supabase
            .from("ingredientes")
            .update({ stock_actual: nuevoStockIngrediente })
            .eq("id", r.ingrediente_id);
        }
      }
    }

    res.status(200).json({
      mensaje: pagoCompleto
        ? "Pago confirmado exitosamente. Tu pedido está siendo procesado."
        : "Adelanto confirmado. Tu pedido está en Pago Parcial. El resto se paga al recoger.",
      pedido_id: id,
      estado: pagoCompleto ? "Confirmado" : "Pago Parcial",
      pago_completo: pagoCompleto,
      monto_pagado: montoPagado,
      monto_pendiente: montoPendiente,
    });
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    res.status(500).json({ error: "Error al confirmar el pago" });
  }
};

/**
 * LISTAR PEDIDOS DEL USUARIO
 * Obtiene el historial de pedidos del usuario autenticado.
 */
const listarMisPedidos = async (req, res) => {
  const perfil_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        estados_pedido (nombre),
        cupones (codigo, descuento_porcentaje),
        detalle_pedidos (
          cantidad,
          precio_unitario_historico,
          productos (nombre, producto_imagenes (url, es_principal))
        )
      `
      )
      .eq("perfil_id", perfil_id)
      .order("fecha", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al listar pedidos:", error);
    res.status(500).json({ error: "Error al obtener tus pedidos" });
  }
};

/**
 * OBTENER DETALLE DE UN PEDIDO
 * Muestra toda la información de un pedido específico.
 */
const obtenerPedido = async (req, res) => {
  const { id } = req.params;
  const perfil_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        estados_pedido (nombre),
        cupones (codigo, descuento_porcentaje),
        detalle_pedidos (
          cantidad,
          precio_unitario_historico,
          productos (
            nombre,
            descripcion,
            producto_imagenes (url, es_principal)
          )
        )
      `
      )
      .eq("id", id)
      .eq("perfil_id", perfil_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener pedido:", error);
    res.status(500).json({ error: "Error al obtener el detalle del pedido" });
  }
};

/**
 * LISTAR TODOS LOS PEDIDOS (Admin)
 * Vista administrativa de todos los pedidos del sistema.
 */
const listarTodosPedidos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        perfiles (nombre, apellido, email, telefono),
        estados_pedido (nombre),
        cupones (codigo),
        detalle_pedidos (cantidad, producto_id)
      `
      )
      .order("fecha", { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al listar todos los pedidos:", error);
    res.status(500).json({ error: "Error al obtener el listado de pedidos" });
  }
};

/**
 * ACTUALIZAR ESTADO DE PEDIDO (Admin)
 * Permite al administrador cambiar el estado del pedido (ej: En Producción, Listo para Retiro, Entregado).
 */
const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado_id } = req.body;

  if (!estado_id) {
    return res.status(400).json({ error: "El estado es obligatorio" });
  }

  try {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado_id })
      .eq("id", id);

    if (error) throw error;

    res
      .status(200)
      .json({ mensaje: "Estado del pedido actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al actualizar el estado del pedido" });
  }
};

/**
 * CANCELAR PEDIDO
 * Permite al usuario cancelar un pedido que aún no ha sido confirmado.
 */
const cancelarPedido = async (req, res) => {
  const { id } = req.params;
  const perfil_id = req.user.id;

  try {
    // Verificar que el pedido existe y pertenece al usuario
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .select("estado_id")
      .eq("id", id)
      .eq("perfil_id", perfil_id)
      .single();

    if (errorPedido || !pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Solo se pueden cancelar pedidos pendientes de pago
    if (pedido.estado_id !== 1) {
      return res.status(400).json({
        error: "Solo puedes cancelar pedidos que estén pendientes de pago",
      });
    }

    // Actualizar a estado "Cancelado" (estado_id = 6)
    const { error } = await supabase
      .from("pedidos")
      .update({ estado_id: 6 })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ mensaje: "Pedido cancelado exitosamente" });
  } catch (error) {
    console.error("Error al cancelar pedido:", error);
    res.status(500).json({ error: "Error al cancelar el pedido" });
  }
};

/**
 * ELIMINAR PEDIDO (Admin)
 * Elimina físicamente un pedido del sistema.
 * Solo permite eliminar pedidos en estado Pendiente de Pago o Cancelado.
 */
const eliminarPedido = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el pedido existe
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .select("id, estado_id")
      .eq("id", parseInt(id))
      .single();

    if (errorPedido || !pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Solo permitir eliminar pedidos Pendientes de Pago (1) o Cancelados (6)
    if (![1, 6].includes(pedido.estado_id)) {
      return res.status(400).json({
        error:
          "Solo se pueden eliminar pedidos Pendientes de Pago o Cancelados",
      });
    }

    // Eliminar el pedido (los detalles se eliminan en cascada si está configurado)
    const { error } = await supabase
      .from("pedidos")
      .delete()
      .eq("id", parseInt(id));

    if (error) throw error;

    res.status(200).json({
      mensaje: "Pedido eliminado exitosamente",
      id: parseInt(id),
    });
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    res.status(500).json({ error: "Error al eliminar el pedido" });
  }
};

/**
 * ACTUALIZAR DATOS DEL PEDIDO (Admin)
 * Permite al admin modificar el total del pedido y agregar notas administrativas.
 */
const actualizarPedido = async (req, res) => {
  const { id } = req.params;
  const { total, cupon_id, notas } = req.body;

  try {
    // Construir objeto de actualización
    const updates = {};
    if (total !== undefined) updates.total = parseFloat(total);
    if (cupon_id !== undefined) updates.cupon_id = cupon_id;

    // Si vienen notas nuevas, combinarlas con las existentes
    if (notas !== undefined) {
      // Primero obtener las notas actuales
      const { data: pedidoActual } = await supabase
        .from("pedidos")
        .select("notas")
        .eq("id", parseInt(id))
        .single();

      const notasActuales = pedidoActual?.notas
        ? typeof pedidoActual.notas === "string"
          ? JSON.parse(pedidoActual.notas)
          : pedidoActual.notas
        : {};

      // Combinar notas existentes con las nuevas
      updates.notas = JSON.stringify({
        ...notasActuales,
        ...notas,
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    // Actualizar el pedido
    const { data, error } = await supabase
      .from("pedidos")
      .update(updates)
      .eq("id", parseInt(id))
      .select(
        `
        *,
        perfiles (nombre, apellido, email),
        estados_pedido (nombre),
        cupones (codigo, descuento_porcentaje)
      `
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }
      throw error;
    }

    res.status(200).json({
      mensaje: "Pedido actualizado exitosamente",
      pedido: data,
    });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ error: "Error al actualizar el pedido" });
  }
};

/**
 * COMPLETAR PAGO RESTANTE (Admin)
 * Marca un pedido con pago parcial como totalmente pagado.
 */
const completarPagoRestante = async (req, res) => {
  const { id } = req.params;
  const { comprobante_url } = req.body; // URL del comprobante del segundo pago

  try {
    // Verificar que el pedido existe y está en Pago Parcial
    const { data: pedido, error: errorPedido } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();

    if (errorPedido || !pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (!pedido.requiere_adelanto) {
      return res.status(400).json({
        error: "Este pedido no requiere adelanto",
      });
    }

    if (pedido.pago_completo) {
      return res.status(400).json({
        error: "El pago de este pedido ya está completo",
      });
    }

    // Parsear notas para agregar comprobante del segundo pago
    let notasActuales = {};
    try {
      notasActuales = pedido.notas ? JSON.parse(pedido.notas) : {};
    } catch (e) {
      notasActuales = {};
    }

    if (comprobante_url) {
      notasActuales.comprobante_restante_url = comprobante_url;
    }

    // Actualizar pedido a Confirmado
    const { error: errorUpdate } = await supabase
      .from("pedidos")
      .update({
        estado_id: 2, // Confirmado
        monto_pagado: pedido.total,
        monto_pendiente: 0,
        pago_completo: true,
        notas: JSON.stringify(notasActuales),
      })
      .eq("id", id);

    if (errorUpdate) throw errorUpdate;

    res.status(200).json({
      mensaje: "Pago completado exitosamente",
      pedido: {
        id: pedido.id,
        total: pedido.total,
        monto_pagado: pedido.total,
        pago_completo: true,
      },
    });
  } catch (error) {
    console.error("Error al completar pago:", error);
    res.status(500).json({ error: "Error al procesar el pago restante" });
  }
};

module.exports = {
  crearPedido,
  confirmarPago,
  listarMisPedidos,
  obtenerPedido,
  listarTodosPedidos,
  actualizarEstadoPedido,
  cancelarPedido,
  eliminarPedido,
  actualizarPedido,
  completarPagoRestante,
};
