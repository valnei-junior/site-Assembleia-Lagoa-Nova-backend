const bcrypt = require('bcryptjs');
const validator = require('validator');
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const ROLES = {
  ADMIN: 'admin',
  LIDER: 'lider',
  USUARIO: 'usuario',
};

class User extends Model {
  toSafeJSON() {
    const values = this.toJSON();
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isValidEmail(value) {
          if (!validator.isEmail(value)) {
            throw new Error('Email invalido');
          }
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(ROLES.ADMIN, ROLES.LIDER, ROLES.USUARIO),
      allowNull: false,
      defaultValue: ROLES.USUARIO,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    refreshTokenVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'core_users',
    timestamps: true,
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = String(user.email).trim().toLowerCase();
        }

        if (user.name) {
          user.name = String(user.name).trim();
        }
      },
      beforeCreate: async (user) => {
        if (user.passwordHash && !user.passwordHash.startsWith('$2')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash') && user.passwordHash && !user.passwordHash.startsWith('$2')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
        }
      },
    },
  },
);

User.ROLES = ROLES;

module.exports = User;
