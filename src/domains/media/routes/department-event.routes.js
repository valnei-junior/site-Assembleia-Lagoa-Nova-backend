const { Router } = require('express');
const autenticacao = require('../../../middleware/autenticacao');
const { autorizarPerfis, verificarMesmoDepartamentoOuAdmin } = require('../../../middleware/autorizacao');
const {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addPhotos,
  removePhoto,
  addVideo,
  removeVideo,
} = require('../controller/department-event.controller');

const routes = Router();

routes.get('/departments/:departmentId/events', listEvents);

routes.post(
  '/departments/:departmentId/events',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  createEvent,
);

routes.put(
  '/departments/:departmentId/events/:eventId',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  updateEvent,
);

routes.delete(
  '/departments/:departmentId/events/:eventId',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  deleteEvent,
);

routes.post(
  '/departments/:departmentId/events/:eventId/photos',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  addPhotos,
);

routes.delete(
  '/departments/:departmentId/events/:eventId/photos/:photoId',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  removePhoto,
);

routes.post(
  '/departments/:departmentId/events/:eventId/videos',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  addVideo,
);

routes.delete(
  '/departments/:departmentId/events/:eventId/videos/:videoId',
  autenticacao,
  autorizarPerfis('admin', 'lider_departamento'),
  verificarMesmoDepartamentoOuAdmin((req) => req.params.departmentId),
  removeVideo,
);

module.exports = routes;
