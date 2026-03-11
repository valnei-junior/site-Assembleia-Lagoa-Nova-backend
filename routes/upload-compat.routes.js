const { Router } = require('express');
const autenticacao = require('../middleware/autenticacao');
const { autorizarPerfis } = require('../middleware/autorizacao');
const {
  mediaUploadSingle,
  videoUploadSingle,
  uploadMedia,
  uploadVideoCompat,
  streamVideoByName,
  serveImageByName,
  serveThumbnailByName,
} = require('../domains/media/controller/media-upload.controller');

const routes = Router();

routes.get('/media/video/:name', streamVideoByName);
routes.get('/media/image/:name', serveImageByName);
routes.get('/media/thumbnail/:name', serveThumbnailByName);

routes.post(
  '/media/upload',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  mediaUploadSingle,
  uploadMedia,
);

routes.post(
  '/uploads/video',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  videoUploadSingle,
  uploadVideoCompat,
);

module.exports = routes;
