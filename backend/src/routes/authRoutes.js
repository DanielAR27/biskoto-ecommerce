const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshSession);
router.post('/logout', authController.logout);
router.post('/recuperar-password', authController.recuperarPassword)
router.post('/actualizar-password', authController.actualizarPassword);

module.exports = router;