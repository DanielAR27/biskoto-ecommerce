const express = require("express");
const router = express.Router();
const productoController = require("../controllers/productoController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// --- RUTAS DE LECTURA (CLIENTE / CATÁLOGO) ---

/**
 * Obtiene el catálogo completo con imágenes asociadas.
 * Se utiliza para la vista principal de compras del cliente.
 */
router.get("/", productoController.listarProductosCatalogo);

/**
 * Obtiene el detalle de un producto específico por su ID.
 */
router.get("/:id", productoController.obtenerProducto);

/**
 * Dado un array de items, pregunta por su disponibilidad y reporta
 * si hay ingredientes o productos suficientes.
 */
router.post(
  "/validar-disponibilidad",
  productoController.validarDisponibilidadMasiva
);

// --- RUTAS DE ADMINISTRACIÓN ---

/**
 * Obtiene el listado optimizado de productos sin imágenes.
 * Exclusivo para la gestión de inventario en el panel administrativo.
 */
router.get(
  "/admin/listado",
  verifyToken,
  isAdmin,
  productoController.listarProductosAdmin
);

/**
 * Registra un nuevo producto y sus referencias de imágenes en la base de datos.
 * La integridad de la imagen principal es gestionada por el trigger de la DB.
 */
router.post("/", verifyToken, isAdmin, productoController.crearProducto);

/**
 * Actualiza los datos de un producto existente.
 */
router.put("/:id", verifyToken, isAdmin, productoController.actualizarProducto);

/**
 * Elimina un producto. La tabla 'producto_imagenes' se limpia por el ON DELETE CASCADE.
 */
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  productoController.eliminarProducto
);

// Agregar ruta POST para verificar adelanto
router.post("/verificar-adelanto", productoController.verificarAdelanto);

module.exports = router;
