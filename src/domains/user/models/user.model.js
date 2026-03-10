const bcrypt = require('bcryptjs');
const validator = require('validator');
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../../config/database');

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  LEADER: 'lider_departamento',
};

const USER_ROLE_VALUES = [USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.LEADER];

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
      validate: {
        notEmpty: true,
        len: [2, 120],
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
      validate: {
        isEmailOrEmpty(value) {
          if (!value) return;
          if (!validator.isEmail(value)) {
            throw new Error('Email inválido.');
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        isPhoneOrEmpty(value) {
          if (!value) return;
          const digits = String(value).replace(/\D/g, '');
          if (digits.length < 10 || digits.length > 15) {
            throw new Error('Celular inválido.');
          }
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLE_VALUES),
      allowNull: false,
      defaultValue: USER_ROLES.USER,
    },
    departmentId: {
      type: DataTypes.STRING(60),
      allowNull: true,
      validate: {
        len: [0, 60],
      },
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = String(user.email).trim().toLowerCase();
        }

        if (user.phone) {
          user.phone = String(user.phone).replace(/\D/g, '');
        }

        if (user.name) {
          user.name = String(user.name).trim();
        }

        if (!user.email && !user.phone) {
          throw new Error('Informe email ou celular para o usuário.');
        }
      },
    },
  },
);

const syncUserModel = async () => {
  await User.sync({ alter: true });
};

const ensureDefaultUsers = async () => {
  const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@adlagoanova.local').trim().toLowerCase();
  const userEmail = (process.env.USER_DEFAULT_EMAIL || 'usuario@adlagoanova.local').trim().toLowerCase();
  const leaderEmail = (process.env.LEADER_DEFAULT_EMAIL || 'lider@adlagoanova.local').trim().toLowerCase();

  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const userPassword = process.env.USER_DEFAULT_PASSWORD || 'usuario123';
  const leaderPassword = process.env.LEADER_DEFAULT_PASSWORD || 'lider123';

  const [admin, adminCreated] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: 'Administrador',
      email: adminEmail,
      phone: null,
      role: USER_ROLES.ADMIN,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      active: true,
    },
  });

  if (!adminCreated && admin.role !== USER_ROLES.ADMIN) {
    admin.role = USER_ROLES.ADMIN;
    await admin.save();
  }

  await User.findOrCreate({
    where: { email: userEmail },
    defaults: {
      name: 'Usuário Padrão',
      email: userEmail,
      phone: null,
      role: USER_ROLES.USER,
      passwordHash: bcrypt.hashSync(userPassword, 10),
      active: true,
    },
  });

  await User.findOrCreate({
    where: { email: leaderEmail },
    defaults: {
      name: 'Líder de Departamento',
      email: leaderEmail,
      phone: null,
      role: USER_ROLES.LEADER,
      departmentId: process.env.LEADER_DEFAULT_DEPARTMENT || 'familia',
      passwordHash: bcrypt.hashSync(leaderPassword, 10),
      active: true,
    },
  });
};

module.exports = {
  User,
  USER_ROLES,
  USER_ROLE_VALUES,
  syncUserModel,
  ensureDefaultUsers,
};
