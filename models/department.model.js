const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 120],
        notEmpty: true,
      },
    },
    slug: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 140],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'core_departments',
    timestamps: true,
  },
);

module.exports = Department;
