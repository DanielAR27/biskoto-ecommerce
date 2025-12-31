const express = require("express");
const router = express.Router();
const comentariosController = require("../controllers/comentariosController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

/**
 * RUTAS PÚBLICAS / USUARIO
 */

/**
 * Listar comentarios de una noticia
 * GET /api/comentarios/noticia/:noticiaId
 * Público: Solo aprobados
 * Admin: Todos
 */
router.get(
  "/noticia/:noticiaId",
  comentariosController.listarComentariosPorNoticia
);

/**
 * Crear un comentario (Requiere autenticación)
 * POST /api/comentarios
 * Body: { noticia_id, contenido }
 */
router.post("/", verifyToken, comentariosController.crearComentario);

/**
 * Actualizar propio comentario (Requiere autenticación)
 * PUT /api/comentarios/:id
 * Body: { contenido }
 */
router.put("/:id", verifyToken, comentariosController.actualizarComentario);

/**
 * Eliminar propio comentario (Requiere autenticación)
 * DELETE /api/comentarios/:id
 */
router.delete("/:id", verifyToken, comentariosController.eliminarComentario);

/**
 * RUTAS ADMIN
 */

/**
 * Listar todos los comentarios (Solo Admin)
 * GET /api/comentarios
 */
router.get(
  "/",
  verifyToken,
  isAdmin,
  comentariosController.listarTodosComentarios
);

/**
 * Aprobar un comentario (Solo Admin)
 * PUT /api/comentarios/:id/aprobar
 */
router.put(
  "/:id/aprobar",
  verifyToken,
  isAdmin,
  comentariosController.aprobarComentario
);

/**
 * Rechazar un comentario (Solo Admin)
 * PUT /api/comentarios/:id/rechazar
 */
router.put(
  "/:id/rechazar",
  verifyToken,
  isAdmin,
  comentariosController.rechazarComentario
);

module.exports = router;
