const supabase = require("../config/supabase");

/**
 * LIMPIEZA AUTOMÁTICA DE PEDIDOS ABANDONADOS
 *
 * Esta función cancela automáticamente pedidos que:
 * - Están en estado "Pendiente de Pago" (estado_id = 1)
 * - Fueron creados hace más de 24 horas
 *
 * Esto evita acumulación de pedidos basura cuando los usuarios
 * abandonan el proceso de checkout sin completar el pago.
 */
const limpiarPedidosAbandonados = async (req, res) => {
  try {
    console.log("🧹 Iniciando limpieza de pedidos abandonados...");

    // 1. Calcular timestamp de hace 24 horas
    const hace24Horas = new Date();
    hace24Horas.setHours(hace24Horas.getHours() - 24);
    const timestamp24h = hace24Horas.toISOString();

    console.log(`🕐 Buscando pedidos anteriores a: ${timestamp24h}`);

    // 2. Buscar pedidos pendientes de pago antiguos
    const { data: pedidosAbandonados, error: errorBuscar } = await supabase
      .from("pedidos")
      .select("id, numero_referencia, created_at, perfiles(nombre)")
      .eq("estado_id", 1) // Pendiente de Pago
      .lt("created_at", timestamp24h) // Creados hace más de 24h
      .order("created_at", { ascending: true });

    if (errorBuscar) throw errorBuscar;

    if (!pedidosAbandonados || pedidosAbandonados.length === 0) {
      console.log("✅ No hay pedidos abandonados para limpiar");
      return res.status(200).json({
        mensaje: "No hay pedidos abandonados",
        cantidad: 0,
        pedidos: [],
      });
    }

    console.log(
      `📦 Se encontraron ${pedidosAbandonados.length} pedidos abandonados`
    );

    // 3. Cambiar estado a "Cancelado" (estado_id = 4)
    const idsACancelar = pedidosAbandonados.map((p) => p.id);

    const { error: errorCancelar } = await supabase
      .from("pedidos")
      .update({
        estado_id: 4, // Cancelado
        updated_at: new Date().toISOString(),
      })
      .in("id", idsACancelar);

    if (errorCancelar) throw errorCancelar;

    // 4. Log de pedidos cancelados
    console.log("🗑️  Pedidos cancelados:");
    pedidosAbandonados.forEach((pedido) => {
      console.log(
        `   - ID: ${pedido.id} | Ref: ${pedido.numero_referencia} | Usuario: ${
          pedido.perfiles?.nombre || "N/A"
        } | Creado: ${pedido.created_at}`
      );
    });

    console.log("✅ Limpieza completada exitosamente");

    // 5. Respuesta
    return res.status(200).json({
      mensaje: `Se cancelaron ${pedidosAbandonados.length} pedidos abandonados`,
      cantidad: pedidosAbandonados.length,
      pedidos: pedidosAbandonados.map((p) => ({
        id: p.id,
        numero_referencia: p.numero_referencia,
        created_at: p.created_at,
        usuario: p.perfiles?.nombre || "N/A",
      })),
    });
  } catch (error) {
    console.error("❌ Error en limpieza de pedidos abandonados:", error);
    return res.status(500).json({
      error: "Error al limpiar pedidos abandonados",
      detalle: error.message,
    });
  }
};

/**
 * VERSIÓN CONFIGURABLE
 * Permite especificar cuántas horas atrás buscar
 */
const limpiarPedidosAbandonadosCustom = async (req, res) => {
  try {
    // Obtener parámetro de horas (default: 24)
    const horas = parseInt(req.query.horas || "24", 10);

    if (horas < 1 || horas > 168) {
      // Máximo 1 semana
      return res.status(400).json({
        error: "El parámetro 'horas' debe estar entre 1 y 168 (1 semana)",
      });
    }

    console.log(`🧹 Limpiando pedidos abandonados de hace ${horas} horas...`);

    const tiempoLimite = new Date();
    tiempoLimite.setHours(tiempoLimite.getHours() - horas);
    const timestamp = tiempoLimite.toISOString();

    // Resto del código igual que limpiarPedidosAbandonados
    const { data: pedidosAbandonados, error: errorBuscar } = await supabase
      .from("pedidos")
      .select("id, numero_referencia, created_at, perfiles(nombre)")
      .eq("estado_id", 1)
      .lt("created_at", timestamp)
      .order("created_at", { ascending: true });

    if (errorBuscar) throw errorBuscar;

    if (!pedidosAbandonados || pedidosAbandonados.length === 0) {
      return res.status(200).json({
        mensaje: `No hay pedidos abandonados de hace ${horas}+ horas`,
        cantidad: 0,
        pedidos: [],
      });
    }

    const idsACancelar = pedidosAbandonados.map((p) => p.id);

    const { error: errorCancelar } = await supabase
      .from("pedidos")
      .update({
        estado_id: 4,
        updated_at: new Date().toISOString(),
      })
      .in("id", idsACancelar);

    if (errorCancelar) throw errorCancelar;

    console.log(`✅ Se cancelaron ${pedidosAbandonados.length} pedidos`);

    return res.status(200).json({
      mensaje: `Se cancelaron ${pedidosAbandonados.length} pedidos de hace ${horas}+ horas`,
      cantidad: pedidosAbandonados.length,
      pedidos: pedidosAbandonados.map((p) => ({
        id: p.id,
        numero_referencia: p.numero_referencia,
        created_at: p.created_at,
        usuario: p.perfiles?.nombre || "N/A",
      })),
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      error: "Error al limpiar pedidos abandonados",
      detalle: error.message,
    });
  }
};

module.exports = {
  limpiarPedidosAbandonados,
  limpiarPedidosAbandonadosCustom,
};
