const express = require("express");
const router = express.Router();
const categoriaController = require("../controllers/categoriaController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// --- RUTAS PÚBLICAS (Sin autenticación) ---
// Categorías activas para el catálogo del cliente
router.get("/activas", categoriaController.listarCategoriasActivas);

// --- RUTAS AUTENTICADAS ---
// Listado completo (Admin ve todas, incluyendo inactivas)
router.get("/", verifyToken, categoriaController.listarCategorias);
router.get("/:id", verifyToken, categoriaController.obtenerCategoria);

// --- RUTAS PROTEGIDAS (Solo Administradores) ---
router.post("/", verifyToken, isAdmin, categoriaController.crearCategoria);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  categoriaController.actualizarCategoria
);
router.patch(
  "/:id/toggle",
  verifyToken,
  isAdmin,
  categoriaController.toggleCategoria
);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  categoriaController.eliminarCategoria
);

module.exports = router;
