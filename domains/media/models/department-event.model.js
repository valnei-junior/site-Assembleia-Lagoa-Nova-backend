const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../../config/database');

class DepartmentEvent extends Model {}

DepartmentEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    theme: {
      type: DataTypes.STRING(180),
      allowNull: true,
      defaultValue: '',
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    photos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    videos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'DepartmentEvent',
    tableName: 'department_events',
    timestamps: true,
  },
);

const syncDepartmentEventModel = async () => {
  await DepartmentEvent.sync({ alter: true });
};

module.exports = {
  DepartmentEvent,
  syncDepartmentEventModel,
};
