const { Router } = require('express');
const autenticacao = require('../../../middleware/autenticacao');
const { autorizarPerfis } = require('../../../middleware/autorizacao');
const { listAuditLogs } = require('../controller/audit.controller');

const auditRoutes = Router();

auditRoutes.get('/', autenticacao, autorizarPerfis('admin'), listAuditLogs);

module.exports = auditRoutes;
