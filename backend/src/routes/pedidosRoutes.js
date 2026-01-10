const express = require("express");
const router = express.Router();
const pedidosController = require("../controllers/pedidosController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// --- RUTAS DE CLIENTE (Requieren autenticación) ---

/**
 * Crea un nuevo pedido en estado "Pendiente de Pago"
 * Body: { items: [...], cupon_id: number (opcional), datos_entrega: {...} }
 */
router.post("/", verifyToken, pedidosController.crearPedido);

/**
 * Confirma el pago de un pedido y descuenta el stock
 * Body: { comprobante_url: string }
 */
router.post(
  "/:id/confirmar-pago",
  verifyToken,
  pedidosController.confirmarPago
);

/**
 * Obtiene el historial de pedidos del usuario autenticado
 */
router.get("/mis-pedidos", verifyToken, pedidosController.listarMisPedidos);

/**
 * Obtiene el detalle completo de un pedido específico del usuario
 */
router.get("/:id", verifyToken, pedidosController.obtenerPedido);

/**
 * Cancela un pedido (solo si está en estado "Pendiente de Pago")
 */
router.delete("/:id/cancelar", verifyToken, pedidosController.cancelarPedido);

// --- RUTAS DE ADMINISTRACIÓN ---

/**
 * Lista todos los pedidos del sistema (Vista Admin)
 */
router.get(
  "/admin/todos",
  verifyToken,
  isAdmin,
  pedidosController.listarTodosPedidos
);

/**
 * Actualiza el estado de un pedido (Admin)
 * Body: { estado_id: number }
 */
router.put(
  "/:id/estado",
  verifyToken,
  isAdmin,
  pedidosController.actualizarEstadoPedido
);

/**
 * Actualiza datos del pedido completo (Admin)
 * Body: { total: number, cupon_id: number, notas: object }
 */
router.put("/:id", verifyToken, isAdmin, pedidosController.actualizarPedido);

/**
 * Elimina un pedido (Admin)
 * Solo permite eliminar pedidos en estado Pendiente de Pago o Cancelado
 */
router.delete("/:id", verifyToken, isAdmin, pedidosController.eliminarPedido);

/**
 * Completa el pago restante de un pedido con adelanto (Admin)
 * Body: { comprobante_url: string (opcional) }
 */
router.post(
  "/:id/completar-pago",
  verifyToken,
  isAdmin,
  pedidosController.completarPagoRestante
);

module.exports = router;
