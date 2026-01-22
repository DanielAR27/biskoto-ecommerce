const express = require("express");
const router = express.Router();
const comprasController = require("../controllers/comprasController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * Obtiene el historial de todas las compras realizadas.
 */
router.get("/", verifyToken, isAdmin, comprasController.getCompras);

/**
 * Obtiene el detalle técnico de una compra (incluye sus ítems e ingredientes).
 */
router.get("/:id", verifyToken, isAdmin, comprasController.getCompraById);

/**
 * Registra una nueva transacción de compra.
 * El stock de los ingredientes se incrementa automáticamente vía Trigger.
 */
router.post("/", verifyToken, isAdmin, comprasController.createCompra);

/**
 * Actualiza una compra existente.
 * El stock se ajusta automáticamente: se borran los items antiguos (resta stock)
 * y se insertan los nuevos (suma stock).
 */
router.put("/:id", verifyToken, isAdmin, comprasController.updateCompra);

/**
 * Elimina un registro de compra.
 * El stock se revierte automáticamente gracias al Trigger (evento DELETE).
 */
router.delete("/:id", verifyToken, isAdmin, comprasController.deleteCompra);

module.exports = router;
