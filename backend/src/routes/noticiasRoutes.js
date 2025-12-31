const express = require("express");
const router = express.Router();
const noticiasController = require("../controllers/noticiasController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * RUTAS PÚBLICAS
 */

/**
 * Listar todas las noticias
 * GET /api/noticias
 * Público: Solo activas
 * Admin: Todas
 */
router.get("/", noticiasController.listarNoticias);

/**
 * Obtener una noticia por ID
 * GET /api/noticias/:id
 * Público: Solo activas
 * Admin: Todas
 */
router.get("/:id", noticiasController.obtenerNoticia);

/**
 * RUTAS PROTEGIDAS (Solo Admin)
 */

/**
 * Crear una nueva noticia
 * POST /api/noticias
 * Body: { titulo, extracto, contenido, categoria, imagen_url, activo }
 */
router.post("/", verifyToken, isAdmin, noticiasController.crearNoticia);

/**
 * Actualizar una noticia
 * PUT /api/noticias/:id
 * Body: { titulo, extracto, contenido, categoria, imagen_url, activo }
 */
router.put("/:id", verifyToken, isAdmin, noticiasController.actualizarNoticia);

/**
 * Eliminar una noticia
 * DELETE /api/noticias/:id
 */
router.delete("/:id", verifyToken, isAdmin, noticiasController.eliminarNoticia);

module.exports = router;
