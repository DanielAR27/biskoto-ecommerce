const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * RUTAS DE ANALÍTICAS
 * Solo accesibles para administradores
 */

/**
 * GET /api/analytics/resumen
 * 
 * Obtiene resumen general de analíticas:
 * - Total de ventas
 * - Cantidad de pedidos por estado
 * - Top 5 productos más vendidos
 * - Total de clientes
 * - Pedidos del mes actual
 */
router.get("/resumen", verifyToken, isAdmin, analyticsController.obtenerResumen);

/**
 * GET /api/analytics/ventas
 * 
 * Obtiene datos de ventas por período:
 * 
 * Query params:
 * - periodo: "semana" | "mes" | "año" | "personalizado" (default: "mes")
 * - fecha_inicio: ISO date (requerido si periodo = "personalizado")
 * - fecha_fin: ISO date (requerido si periodo = "personalizado")
 * 
 * Ejemplos:
 * GET /api/analytics/ventas?periodo=semana
 * GET /api/analytics/ventas?periodo=personalizado&fecha_inicio=2025-01-01&fecha_fin=2025-01-31
 */
router.get("/ventas", verifyToken, isAdmin, analyticsController.obtenerVentas);

/**
 * GET /api/analytics/ventas-mensuales
 * 
 * Obtiene ventas agrupadas por mes (últimos 12 meses)
 * Para gráficas de tendencias mensuales
 */
router.get(
  "/ventas-mensuales",
  verifyToken,
  isAdmin,
  analyticsController.obtenerVentasMensuales
);

module.exports = router;
