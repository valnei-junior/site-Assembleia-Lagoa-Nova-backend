const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    actorUserId: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    resource: { type: DataTypes.STRING(120), allowNull: false },
    ip: { type: DataTypes.STRING(80), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    details: { type: DataTypes.JSONB, allowNull: true },
    riskLevel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'low' },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false,
  },
);

const syncAuditLogModel = async () => {
  await AuditLog.sync({ alter: true });
};

const audit = (action, resource, riskLevel = 'low') => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode < 400 || action.includes('failed') || riskLevel !== 'low') {
        try {
          await AuditLog.create({
            actorUserId: req.usuario?.sub || null,
            action,
            resource,
            ip: req.ip,
            userAgent: req.headers['user-agent'] || null,
            details: {
              requestId: req.requestId,
              statusCode: res.statusCode,
            },
            riskLevel,
          });
        } catch (error) {
          // avoid failing request due to logging issues
          console.error('Falha ao registrar auditoria:', error.message);
        }
      }
    });

    next();
  };
};

module.exports = {
  AuditLog,
  syncAuditLogModel,
  audit,
};
