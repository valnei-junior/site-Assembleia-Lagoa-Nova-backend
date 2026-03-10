const { Router } = require('express');
const autenticacao = require('../middleware/autenticacao');
const { autorizarPerfis } = require('../middleware/autorizacao');
const upload = require('../middlewares/upload.middleware');

const routes = Router();

routes.post(
  '/uploads/video',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  upload.single('video'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo de video nao enviado.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;

    return res.status(201).json({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
      },
    });
  },
);

module.exports = routes;
