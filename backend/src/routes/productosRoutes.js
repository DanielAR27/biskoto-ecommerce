const express = require("express");
const router = express.Router();
const productoController = require("../controllers/productoController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// --- RUTAS ESPECÍFICAS (SIN :id) ---

/**
 * 1. Obtiene el catálogo completo con imágenes asociadas.
 * Se utiliza para la vista principal de compras del cliente.
 */
router.get("/", productoController.listarProductosCatalogo);

/**
 * 2. Obtiene el listado optimizado de productos sin imágenes.
 * Exclusivo para la gestión de inventario en el panel administrativo.
 */
router.get(
  "/admin/listado",
  verifyToken,
  isAdmin,
  productoController.listarProductosAdmin
);

/**
 * 3. Dado un array de items, pregunta por su disponibilidad y reporta
 * si hay ingredientes o productos suficientes.
 */
router.post(
  "/validar-disponibilidad",
  productoController.validarDisponibilidadMasiva
);

/**
 * 4. Verificar adelanto de un producto
 */
router.post("/verificar-adelanto", productoController.verificarAdelanto);

/**
 * 5. Registra un nuevo producto y sus referencias de imágenes en la base de datos.
 * La integridad de la imagen principal es gestionada por el trigger de la DB.
 */
router.post("/", verifyToken, isAdmin, productoController.crearProducto);

// --- RUTAS CON :id PERO SEGMENTOS ADICIONALES (Antes de rutas genéricas :id) ---

/**
 * 6. Toggle de visibilidad del producto
 */

router.patch(
  "/:id/toggle-activo",
  verifyToken,
  isAdmin,
  productoController.toggleActivo
);

// --- RUTAS GENÉRICAS CON :id (AL FINAL) ---

/**
 * 7. Obtiene el detalle de un producto específico por su ID.
 */
router.get("/:id", productoController.obtenerProducto);

/**
 * 8. Actualiza los datos de un producto existente.
 */
router.put("/:id", verifyToken, isAdmin, productoController.actualizarProducto);

/**
 * 9. Elimina un producto. La tabla 'producto_imagenes' se limpia por el ON DELETE CASCADE.
 */
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  productoController.eliminarProducto
);

module.exports = router;
