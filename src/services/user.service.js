const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const { User, Department } = require('../models');

const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('admin', 'lider', 'usuario').default('usuario'),
  departmentId: Joi.number().integer().positive().allow(null),
  active: Joi.boolean().optional(),
}).required();

const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  role: Joi.string().valid('admin', 'lider', 'usuario').optional(),
  departmentId: Joi.number().integer().positive().allow(null).optional(),
  active: Joi.boolean().optional(),
  password: Joi.string().min(8).max(100).optional(),
}).required();

const listUsers = async () => {
  const users = await User.findAll({ include: [{ model: Department, as: 'department' }] });
  return users.map((user) => user.toSafeJSON());
};

const getUserById = async (id) => {
  const user = await User.findByPk(Number(id), { include: [{ model: Department, as: 'department' }] });
  if (!user) {
    throw new ApiError(404, 'Usuario nao encontrado');
  }

  return user;
};

const createUser = async (payload) => {
  const { error, value } = createSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const existing = await User.findOne({ where: { email: value.email.toLowerCase() } });
  if (existing) {
    throw new ApiError(409, 'Email ja cadastrado');
  }

  if (value.departmentId) {
    const department = await Department.findByPk(value.departmentId);
    if (!department) {
      throw new ApiError(404, 'Departamento nao encontrado');
    }
  }

  const user = await User.create({
    name: value.name,
    email: value.email,
    passwordHash: value.password,
    role: value.role,
    departmentId: value.departmentId || null,
    active: value.active !== undefined ? value.active : true,
  });

  return user.toSafeJSON();
};

const updateUser = async (id, payload) => {
  const { error, value } = updateSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const user = await getUserById(id);

  if (value.departmentId) {
    const department = await Department.findByPk(value.departmentId);
    if (!department) {
      throw new ApiError(404, 'Departamento nao encontrado');
    }
  }

  if (value.name !== undefined) user.name = value.name;
  if (value.role !== undefined) user.role = value.role;
  if (value.departmentId !== undefined) user.departmentId = value.departmentId;
  if (value.active !== undefined) user.active = value.active;
  if (value.password) user.passwordHash = value.password;

  await user.save();

  return user.toSafeJSON();
};

const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
