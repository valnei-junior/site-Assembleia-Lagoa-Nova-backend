const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { Op } = require('sequelize');
const {
  User,
  USER_ROLES,
  USER_ROLE_VALUES,
} = require('../models/user.model');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().pattern(/^[0-9+\-()\s]{10,20}$/).optional().allow(null, ''),
  password: Joi.string().min(8).max(120).required(),
  role: Joi.string().valid(...USER_ROLE_VALUES).required(),
  departmentId: Joi.string().max(60).allow(null, '').optional(),
  active: Joi.boolean().optional(),
}).required();

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  email: Joi.string().email().optional().allow(null, ''),
  phone: Joi.string().pattern(/^[0-9+\-()\s]{10,20}$/).optional().allow(null, ''),
  password: Joi.string().min(8).max(120).optional(),
  role: Joi.string().valid(...USER_ROLE_VALUES).optional(),
  departmentId: Joi.string().max(60).allow(null, '').optional(),
  active: Joi.boolean().optional(),
}).required();

const normalizeEmail = (email) => {
  if (!email) return null;
  return String(email).trim().toLowerCase();
};

const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  return digits || null;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const values = user.toSafeJSON ? user.toSafeJSON() : user.toJSON();
  delete values.twoFactorSecret;
  return values;
};

const ensureDepartmentRule = (role, departmentId) => {
  if (role === USER_ROLES.LEADER && !departmentId) {
    throw new Error('Lider de departamento deve possuir departmentId.');
  }
};

const listUsers = async (_req, res) => {
  const users = await User.findAll({ order: [['id', 'ASC']] });

  return res.status(200).json({
    message: 'Listagem de usuarios',
    data: users.map((user) => sanitizeUser(user)),
  });
};

const getUserById = async (req, res) => {
  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  return res.status(200).json({
    message: 'Usuario encontrado',
    data: sanitizeUser(user),
  });
};

const createUser = async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Payload invalido', details: error.details.map((d) => d.message) });
  }

  const email = normalizeEmail(value.email);
  const phone = normalizePhone(value.phone);

  if (!email && !phone) {
    return res.status(400).json({ message: 'Informe email ou celular.' });
  }

  try {
    ensureDepartmentRule(value.role, value.departmentId);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  const duplicated = await User.findOne({
    where: {
      [Op.or]: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean),
    },
  });

  if (duplicated) {
    return res.status(409).json({ message: 'Ja existe usuario com este email ou celular.' });
  }

  const user = await User.create({
    name: value.name,
    email,
    phone,
    role: value.role,
    departmentId: value.departmentId || null,
    active: typeof value.active === 'boolean' ? value.active : true,
    passwordHash: await bcrypt.hash(value.password, 12),
  });

  return res.status(201).json({
    message: 'Usuario criado com sucesso',
    data: sanitizeUser(user),
  });
};

const updateUser = async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Payload invalido', details: error.details.map((d) => d.message) });
  }

  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  const nextEmail = Object.prototype.hasOwnProperty.call(value, 'email') ? normalizeEmail(value.email) : user.email;
  const nextPhone = Object.prototype.hasOwnProperty.call(value, 'phone') ? normalizePhone(value.phone) : user.phone;

  if (!nextEmail && !nextPhone) {
    return res.status(400).json({ message: 'Usuario deve manter email ou celular valido.' });
  }

  if (Object.prototype.hasOwnProperty.call(value, 'email') || Object.prototype.hasOwnProperty.call(value, 'phone')) {
    const duplicate = await User.findOne({
      where: {
        id: { [Op.ne]: user.id },
        [Op.or]: [
          nextEmail ? { email: nextEmail } : null,
          nextPhone ? { phone: nextPhone } : null,
        ].filter(Boolean),
      },
    });

    if (duplicate) {
      return res.status(409).json({ message: 'Email ou celular ja estao em uso.' });
    }
  }

  const nextRole = value.role || user.role;
  const nextDepartmentId = Object.prototype.hasOwnProperty.call(value, 'departmentId')
    ? (value.departmentId || null)
    : user.departmentId;

  try {
    ensureDepartmentRule(nextRole, nextDepartmentId);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  if (value.name) user.name = value.name;
  user.email = nextEmail;
  user.phone = nextPhone;
  user.role = nextRole;
  user.departmentId = nextDepartmentId;

  if (typeof value.active === 'boolean') {
    user.active = value.active;
  }

  if (value.password) {
    user.passwordHash = await bcrypt.hash(value.password, 12);
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  }

  await user.save();

  return res.status(200).json({
    message: 'Usuario atualizado com sucesso',
    data: sanitizeUser(user),
  });
};

const deleteUser = async (req, res) => {
  const user = await User.findByPk(Number(req.params.id));
  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  const data = sanitizeUser(user);
  await user.destroy();

  return res.status(200).json({ message: 'Usuario removido com sucesso', data });
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
