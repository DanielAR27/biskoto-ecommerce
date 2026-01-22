const supabase = require("../config/supabase");

/**
 * CONTROLADOR DE ANALÍTICAS
 * Proporciona endpoints para obtener métricas y estadísticas de ventas
 *
 * IMPORTANTE:
 * - La columna de fecha en pedidos se llama 'fecha' (no 'created_at')
 * - La tabla de items se llama 'detalle_pedidos'
 *
 * ESTADOS DE PEDIDOS:
 * 1 - Pendiente de Pago (NO contar como venta)
 * 2 - Confirmado (✅ venta)
 * 3 - En Producción (✅ venta)
 * 4 - Listo para Retiro (✅ venta)
 * 5 - Entregado (✅ venta)
 * 6 - Cancelado (NO contar como venta)
 * 7 - Pago Parcial (opcional)
 */

// Estados que cuentan como ventas
const ESTADOS_VENTAS = [2, 3, 4, 5, 7]; // Confirmado, En Producción, Listo, Entregado, Pago Parcial

/**
 * OBTENER RESUMEN GENERAL
 * Métricas clave del negocio
 */
const obtenerResumen = async (req, res) => {
  try {
    console.log("📊 Obteniendo resumen de analíticas...");

    // 1. Total de ventas (pedidos confirmados, en producción, listos y entregados)
    const { data: pedidosConfirmados, error: errorVentas } = await supabase
      .from("pedidos")
      .select("total")
      .in("estado_id", ESTADOS_VENTAS);

    if (errorVentas) throw errorVentas;

    const totalVentas = pedidosConfirmados.reduce(
      (sum, p) => sum + parseFloat(p.total || 0),
      0,
    );

    // 2. Conteo de pedidos por estado
    const { data: pedidosPorEstado, error: errorEstados } = await supabase
      .from("pedidos")
      .select("estado_id, estados_pedido(nombre)")
      .order("estado_id");

    if (errorEstados) throw errorEstados;

    const estadisticasEstados = {};
    pedidosPorEstado.forEach((pedido) => {
      const estadoId = pedido.estado_id;
      const estadoNombre = pedido.estados_pedido?.nombre || "Desconocido";

      if (!estadisticasEstados[estadoId]) {
        estadisticasEstados[estadoId] = {
          estado_id: estadoId,
          nombre: estadoNombre,
          cantidad: 0,
        };
      }
      estadisticasEstados[estadoId].cantidad++;
    });

    const estadosCantidad = Object.values(estadisticasEstados);

    // 3. Productos más vendidos (top 5)
    // CAMBIO: Usar nombre correcto de tabla
    const { data: productosVendidos, error: errorProductos } = await supabase
      .from("detalle_pedidos") // ← CAMBIO: era "pedido_items"
      .select(
        `
        producto_id,
        cantidad,
        productos ( nombre )
      `,
      )
      .order("cantidad", { ascending: false })
      .limit(100);

    if (errorProductos) throw errorProductos;

    // Agrupar por producto
    const ventasPorProducto = {};
    productosVendidos.forEach((item) => {
      const id = item.producto_id;
      const nombre = item.productos?.nombre || "Producto desconocido";

      if (!ventasPorProducto[id]) {
        ventasPorProducto[id] = {
          producto_id: id,
          nombre: nombre,
          total_vendido: 0,
        };
      }
      ventasPorProducto[id].total_vendido += item.cantidad;
    });

    const topProductos = Object.values(ventasPorProducto)
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, 5);

    // 4. Total de clientes únicos
    const { count: totalClientes, error: errorClientes } = await supabase
      .from("perfiles")
      .select("*", { count: "exact", head: true })
      .eq("rol", "cliente");

    if (errorClientes) throw errorClientes;

    // 5. Pedidos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: pedidosMesActual, error: errorMes } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .gte("fecha", inicioMes.toISOString()); // ← CAMBIO: era "created_at"

    if (errorMes) throw errorMes;

    console.log("✅ Resumen obtenido exitosamente");

    res.status(200).json({
      totalVentas,
      estadosCantidad,
      topProductos,
      totalClientes: totalClientes || 0,
      pedidosMesActual: pedidosMesActual || 0,
    });
  } catch (error) {
    console.error("❌ Error al obtener resumen:", error);
    res.status(500).json({ error: "Error al obtener resumen de analíticas" });
  }
};

/**
 * OBTENER VENTAS POR PERÍODO
 * Permite filtrar por: semana, mes, año, rango personalizado
 */
const obtenerVentas = async (req, res) => {
  try {
    const { periodo = "mes", fecha_inicio, fecha_fin } = req.query;

    console.log(`📊 Obteniendo ventas por período: ${periodo}`);

    let fechaInicio, fechaFin;

    // Determinar rango de fechas según el período
    switch (periodo) {
      case "semana":
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;

      case "mes":
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;

      case "año":
      case "anio":
        fechaFin = new Date();
        fechaInicio = new Date();
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
        break;

      case "personalizado":
        if (!fecha_inicio || !fecha_fin) {
          return res
            .status(400)
            .json({ error: "Se requieren fecha_inicio y fecha_fin" });
        }
        fechaInicio = new Date(fecha_inicio);
        fechaFin = new Date(fecha_fin);
        break;

      default:
        return res.status(400).json({ error: "Período inválido" });
    }

    // Obtener pedidos en el rango de fechas
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select(
        `
        id,
        total,
        fecha,
        estado_id,
        estados_pedido ( nombre )
      `,
      )
      .gte("fecha", fechaInicio.toISOString()) // ← CAMBIO: era "created_at"
      .lte("fecha", fechaFin.toISOString()) // ← CAMBIO: era "created_at"
      .in("estado_id", ESTADOS_VENTAS)
      .order("fecha", { ascending: true }); // ← CAMBIO: era "created_at"

    if (error) throw error;

    // Agrupar ventas por día
    const ventasPorDia = {};

    pedidos.forEach((pedido) => {
      const fechaPedido = new Date(pedido.fecha).toISOString().split("T")[0]; // ← CAMBIO: era "created_at"

      if (!ventasPorDia[fechaPedido]) {
        ventasPorDia[fechaPedido] = {
          fecha: fechaPedido,
          total: 0,
          cantidad: 0,
        };
      }

      ventasPorDia[fechaPedido].total += parseFloat(pedido.total || 0);
      ventasPorDia[fechaPedido].cantidad++;
    });

    // Convertir a array y ordenar por fecha
    const datosGrafica = Object.values(ventasPorDia).sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );

    // Calcular totales
    const totalVentas = pedidos.reduce(
      (sum, p) => sum + parseFloat(p.total || 0),
      0,
    );
    const totalPedidos = pedidos.length;
    const promedioVenta = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

    console.log(`✅ Ventas obtenidas: ${totalPedidos} pedidos`);

    res.status(200).json({
      periodo,
      fecha_inicio: fechaInicio.toISOString().split("T")[0],
      fecha_fin: fechaFin.toISOString().split("T")[0],
      totalVentas,
      totalPedidos,
      promedioVenta,
      datosGrafica,
    });
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener datos de ventas" });
  }
};

/**
 * OBTENER VENTAS POR MES (últimos 12 meses)
 * Para gráfica de tendencias mensuales
 */
const obtenerVentasMensuales = async (req, res) => {
  try {
    console.log("📊 Obteniendo ventas mensuales (últimos 12 meses)...");

    // Fecha de hace 12 meses
    const hace12Meses = new Date();
    hace12Meses.setMonth(hace12Meses.getMonth() - 12);

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("total, fecha") // ← CAMBIO: era "created_at"
      .gte("fecha", hace12Meses.toISOString()) // ← CAMBIO: era "created_at"
      .in("estado_id", ESTADOS_VENTAS)
      .order("fecha", { ascending: true }); // ← CAMBIO: era "created_at"

    if (error) throw error;

    // Agrupar por mes
    const ventasPorMes = {};

    pedidos.forEach((pedido) => {
      const fechaPedido = new Date(pedido.fecha); // ← CAMBIO: era "created_at"
      const mesAño = `${fechaPedido.getFullYear()}-${String(
        fechaPedido.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!ventasPorMes[mesAño]) {
        ventasPorMes[mesAño] = {
          mes: mesAño,
          total: 0,
          cantidad: 0,
        };
      }

      ventasPorMes[mesAño].total += parseFloat(pedido.total || 0);
      ventasPorMes[mesAño].cantidad++;
    });

    const datosGrafica = Object.values(ventasPorMes).sort((a, b) =>
      a.mes.localeCompare(b.mes),
    );

    console.log(`✅ Datos mensuales obtenidos: ${datosGrafica.length} meses`);

    res.status(200).json({ datosGrafica });
  } catch (error) {
    console.error("❌ Error al obtener ventas mensuales:", error);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
};

module.exports = {
  obtenerResumen,
  obtenerVentas,
  obtenerVentasMensuales,
};
