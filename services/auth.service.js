const bcrypt = require('bcryptjs');
const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const { User, Department } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('admin', 'lider', 'usuario').default('usuario'),
  departmentId: Joi.number().integer().positive().allow(null),
}).required();

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(100).required(),
}).required();

const register = async (payload) => {
  const { error, value } = registerSchema.validate(payload, { abortEarly: false });
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
  });

  return user.toSafeJSON();
};

const login = async (payload) => {
  const { error, value } = loginSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const user = await User.findOne({ where: { email: value.email.toLowerCase(), active: true } });
  if (!user) {
    throw new ApiError(401, 'Credenciais invalidas');
  }

  const passwordOk = await bcrypt.compare(value.password, user.passwordHash);
  if (!passwordOk) {
    throw new ApiError(401, 'Credenciais invalidas');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    accessToken,
    refreshToken,
    user: user.toSafeJSON(),
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token nao fornecido');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, 'Refresh token invalido');
  }

  const user = await User.findByPk(Number(payload.sub));
  if (!user || !user.active) {
    throw new ApiError(401, 'Sessao invalida');
  }

  if (Number(payload.refreshTokenVersion) !== Number(user.refreshTokenVersion)) {
    throw new ApiError(401, 'Sessao revogada');
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
};

const revokeUserSessions = async (userId) => {
  const user = await User.findByPk(Number(userId));
  if (!user) {
    return;
  }

  user.refreshTokenVersion = Number(user.refreshTokenVersion || 0) + 1;
  await user.save();
};

module.exports = {
  register,
  login,
  refresh,
  revokeUserSessions,
};
