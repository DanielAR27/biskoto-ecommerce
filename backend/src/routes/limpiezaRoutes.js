const express = require("express");
const router = express.Router();
const limpiezaController = require("../controllers/limpiezaPedidosController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * RUTAS DE LIMPIEZA DE PEDIDOS ABANDONADOS
 *
 * Estas rutas permiten ejecutar la limpieza de pedidos que quedaron
 * en estado "Pendiente de Pago" por más de 24 horas.
 *
 * IMPORTANTE: Solo accesible para administradores
 */

/**
 * POST /api/limpieza/pedidos-abandonados
 *
 * Cancela automáticamente pedidos pendientes de hace más de 24 horas
 *
 * Respuesta:
 * {
 *   "mensaje": "Se cancelaron 5 pedidos abandonados",
 *   "cantidad": 5,
 *   "pedidos": [...]
 * }
 */
router.post(
  "/pedidos-abandonados",
  verifyToken,
  isAdmin,
  limpiezaController.limpiarPedidosAbandonados
);

/**
 * POST /api/limpieza/pedidos-abandonados-custom
 *
 * Versión configurable que permite especificar cuántas horas atrás buscar
 *
 * Query params:
 * - horas: Número de horas (1-168). Default: 24
 *
 * Ejemplo:
 * POST /api/limpieza/pedidos-abandonados-custom?horas=48
 *
 * Respuesta: Igual que la ruta anterior
 */
router.post(
  "/pedidos-abandonados-custom",
  verifyToken,
  isAdmin,
  limpiezaController.limpiarPedidosAbandonadosCustom
);

module.exports = router;
