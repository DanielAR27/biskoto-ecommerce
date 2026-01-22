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
 * 2 - Confirmado (venta)
 * 3 - En Producción (venta)
 * 4 - Listo para Retiro (venta)
 * 5 - Entregado (venta)
 * 6 - Cancelado (NO contar como venta)
 * 7 - Pago Parcial (opcional)
 */

// Estados que cuentan como ventas
const ESTADOS_VENTAS = [2, 3, 4, 5, 7];

// Helper: calcular rango de fechas según período
const calcularRangoFechas = (periodo, fecha_inicio, fecha_fin) => {
  let fechaInicio, fechaFin;

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
        const err = new Error("Se requieren fecha_inicio y fecha_fin");
        err.statusCode = 400;
        throw err;
      }
      fechaInicio = new Date(fecha_inicio);
      fechaFin = new Date(fecha_fin);
      break;

    default: {
      const err = new Error("Período inválido");
      err.statusCode = 400;
      throw err;
    }
  }

  return { fechaInicio, fechaFin };
};

/**
 * OBTENER RESUMEN (FILTRABLE POR PERÍODO)
 * Query params:
 * - periodo: "semana" | "mes" | "año" | "personalizado" (default: "mes")
 * - fecha_inicio y fecha_fin si periodo = "personalizado"
 *
 * Devuelve:
 * - totalVentas (en el período, solo estados de venta)
 * - estadosCantidad (en el período, todos los estados)
 * - topProductos (en el período, solo estados de venta)
 * - totalClientes (global)
 * - pedidosPeriodo (en el período, todos los estados)
 */
const obtenerResumen = async (req, res) => {
  try {
    const { periodo = "mes", fecha_inicio, fecha_fin } = req.query;

    const { fechaInicio, fechaFin } = calcularRangoFechas(
      periodo,
      fecha_inicio,
      fecha_fin,
    );

    // 1. Total de ventas en el período (solo pedidos que cuentan como venta)
    const { data: pedidosConfirmados, error: errorVentas } = await supabase
      .from("pedidos")
      .select("total")
      .gte("fecha", fechaInicio.toISOString())
      .lte("fecha", fechaFin.toISOString())
      .in("estado_id", ESTADOS_VENTAS);

    if (errorVentas) throw errorVentas;

    const totalVentas = (pedidosConfirmados || []).reduce(
      (sum, p) => sum + parseFloat(p.total || 0),
      0,
    );

    // 2. Pedidos por estado en el período (incluye todos los estados)
    const { data: pedidosPorEstado, error: errorEstados } = await supabase
      .from("pedidos")
      .select("estado_id, estados_pedido(nombre)")
      .gte("fecha", fechaInicio.toISOString())
      .lte("fecha", fechaFin.toISOString())
      .order("estado_id");

    if (errorEstados) throw errorEstados;

    const estadisticasEstados = {};
    (pedidosPorEstado || []).forEach((pedido) => {
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

    // 3. Top productos en el período (solo pedidos que cuentan como venta)
    // Requiere relación detalle_pedidos -> pedidos (pedido_id) configurada en Supabase
    // Si tu relación no se llama "pedidos", hay que ajustar el nombre del join.
    const { data: productosVendidos, error: errorProductos } = await supabase
      .from("detalle_pedidos")
      .select(
        `
        producto_id,
        cantidad,
        productos ( nombre ),
        pedidos!inner ( fecha, estado_id )
      `,
      )
      .gte("pedidos.fecha", fechaInicio.toISOString())
      .lte("pedidos.fecha", fechaFin.toISOString())
      .in("pedidos.estado_id", ESTADOS_VENTAS)
      .limit(5000);

    if (errorProductos) throw errorProductos;

    const ventasPorProducto = {};
    (productosVendidos || []).forEach((item) => {
      const id = item.producto_id;
      const nombre = item.productos?.nombre || "Producto desconocido";

      if (!ventasPorProducto[id]) {
        ventasPorProducto[id] = {
          producto_id: id,
          nombre,
          total_vendido: 0,
        };
      }
      ventasPorProducto[id].total_vendido += Number(item.cantidad || 0);
    });

    const topProductos = Object.values(ventasPorProducto)
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, 5);

    // 4. Total de clientes (global)
    const { count: totalClientes, error: errorClientes } = await supabase
      .from("perfiles")
      .select("*", { count: "exact", head: true })
      .eq("rol", "cliente");

    if (errorClientes) throw errorClientes;

    // 5. Pedidos del período (todos los estados)
    const { count: pedidosPeriodo, error: errorPedidosPeriodo } = await supabase
      .from("pedidos")
      .select("*", { count: "exact", head: true })
      .gte("fecha", fechaInicio.toISOString())
      .lte("fecha", fechaFin.toISOString());

    if (errorPedidosPeriodo) throw errorPedidosPeriodo;

    res.status(200).json({
      periodo,
      fecha_inicio: fechaInicio.toISOString().split("T")[0],
      fecha_fin: fechaFin.toISOString().split("T")[0],
      totalVentas,
      estadosCantidad,
      topProductos,
      totalClientes: totalClientes || 0,
      pedidosPeriodo: pedidosPeriodo || 0,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error("Error al obtener resumen:", error);
    res.status(status).json({
      error:
        status === 400
          ? error.message
          : "Error al obtener resumen de analíticas",
    });
  }
};

/**
 * OBTENER VENTAS POR PERÍODO
 * Permite filtrar por: semana, mes, año, rango personalizado
 */
const obtenerVentas = async (req, res) => {
  try {
    const { periodo = "mes", fecha_inicio, fecha_fin } = req.query;

    let fechaInicio, fechaFin;
    try {
      const rango = calcularRangoFechas(periodo, fecha_inicio, fecha_fin);
      fechaInicio = rango.fechaInicio;
      fechaFin = rango.fechaFin;
    } catch (e) {
      return res.status(e.statusCode || 400).json({ error: e.message });
    }

    // Obtener pedidos en el rango de fechas (solo ventas)
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
      .gte("fecha", fechaInicio.toISOString())
      .lte("fecha", fechaFin.toISOString())
      .in("estado_id", ESTADOS_VENTAS)
      .order("fecha", { ascending: true });

    if (error) throw error;

    // Agrupar ventas por día
    const ventasPorDia = {};
    (pedidos || []).forEach((pedido) => {
      const fechaPedido = new Date(pedido.fecha).toISOString().split("T")[0];

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

    const datosGrafica = Object.values(ventasPorDia).sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );

    const totalVentas = (pedidos || []).reduce(
      (sum, p) => sum + parseFloat(p.total || 0),
      0,
    );
    const totalPedidos = (pedidos || []).length;
    const promedioVenta = totalPedidos > 0 ? totalVentas / totalPedidos : 0;

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
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener datos de ventas" });
  }
};

/**
 * OBTENER VENTAS POR MES (últimos 12 meses)
 * Para gráfica de tendencias mensuales
 * Devuelve SIEMPRE 12 puntos (meses), aunque no haya ventas (total=0, cantidad=0)
 */
const obtenerVentasMensuales = async (req, res) => {
  try {
    const ahora = new Date();

    // Inicio: primer día del mes, hace 11 meses (incluye mes actual => 12 meses)
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1);
    inicio.setHours(0, 0, 0, 0);

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("total, fecha, estado_id")
      .gte("fecha", inicio.toISOString())
      .in("estado_id", ESTADOS_VENTAS)
      .order("fecha", { ascending: true });

    if (error) throw error;

    // Agrupar por mes (solo los meses que existan en data)
    const ventasPorMes = {};
    (pedidos || []).forEach((pedido) => {
      const fechaPedido = new Date(pedido.fecha);
      const mesAño = `${fechaPedido.getFullYear()}-${String(
        fechaPedido.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!ventasPorMes[mesAño]) {
        ventasPorMes[mesAño] = { mes: mesAño, total: 0, cantidad: 0 };
      }

      ventasPorMes[mesAño].total += parseFloat(pedido.total || 0);
      ventasPorMes[mesAño].cantidad += 1;
    });

    // Construir lista de 12 meses consecutivos, incluyendo los faltantes
    const ultimos12 = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const mesAño = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      ultimos12.push(mesAño);
    }

    // Rellenar faltantes con 0
    const datosGrafica = ultimos12.map((mes) => {
      return ventasPorMes[mes] || { mes, total: 0, cantidad: 0 };
    });

    res.status(200).json({ datosGrafica });
  } catch (error) {
    console.error("Error al obtener ventas mensuales:", error);
    res.status(500).json({ error: "Error al obtener ventas mensuales" });
  }
};

module.exports = {
  obtenerResumen,
  obtenerVentas,
  obtenerVentasMensuales,
};
