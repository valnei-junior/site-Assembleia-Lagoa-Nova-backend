const Joi = require('joi');
const { Op } = require('sequelize');
const { AuditLog } = require('../../../middleware/audit');

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(50),
  action: Joi.string().max(120).optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  ip: Joi.string().max(80).optional(),
  actorUserId: Joi.number().integer().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
}).required();

const listAuditLogs = async (req, res) => {
  const { error, value } = querySchema.validate(req.query || {}, { stripUnknown: true });
  if (error) {
    return res.status(400).json({ message: 'Parâmetros de consulta inválidos.' });
  }

  const where = {};

  if (value.action) where.action = value.action;
  if (value.riskLevel) where.riskLevel = value.riskLevel;
  if (value.ip) where.ip = value.ip;
  if (value.actorUserId) where.actorUserId = value.actorUserId;

  if (value.from || value.to) {
    where.createdAt = {};
    if (value.from) where.createdAt[Op.gte] = new Date(value.from);
    if (value.to) where.createdAt[Op.lte] = new Date(value.to);
  }

  const offset = (value.page - 1) * value.pageSize;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: value.pageSize,
    offset,
  });

  return res.status(200).json({
    data: rows,
    pagination: {
      page: value.page,
      pageSize: value.pageSize,
      total: count,
      totalPages: Math.ceil(count / value.pageSize) || 1,
    },
  });
};

module.exports = {
  listAuditLogs,
};
