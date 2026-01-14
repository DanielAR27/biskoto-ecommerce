const express = require("express");
const router = express.Router();
const storageController = require("../controllers/storageController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * Generar URL firmada para subir archivos.
 * Solo usuarios autenticados pueden pedir firmas de subida.
 */
router.post("/sign-upload", verifyToken, storageController.generarUrlSubida); // ← QUITAR la "d"

module.exports = router;
