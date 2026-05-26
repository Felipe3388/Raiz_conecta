const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/userControl.js');
const multer = require('multer');

// Multer em memória — compatível com Cloudinary (sem salvar em disco)
const upload = multer({ storage: multer.memoryStorage() });

router.post('/perfil/completar', upload.single('file'), usuarioController.cadastrar);
router.get('/admin/usuarios',  usuarioController.listar);
router.put('/admin/usuarios',  usuarioController.atualizarStatus);
router.delete('/admin/usuarios', usuarioController.deleteUser);
router.post('/auth/login',     usuarioController.logar);

module.exports = router;
