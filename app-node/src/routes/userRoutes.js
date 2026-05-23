// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/userControl.js');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define as rotas e associa aos métodos do controller
router.post('/perfil/completar', upload.single('file'), usuarioController.cadastrar);
router.get('/admin/usuarios', usuarioController.listar);
router.put('/admin/usuarios', usuarioController.atualizarStatus);
router.delete('/admin/usuarios', usuarioController.deleteUser);
router.post('/auth/login', usuarioController.logar);


module.exports = router;