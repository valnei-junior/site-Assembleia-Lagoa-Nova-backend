const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models');
const authService = require('../services/auth.service');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ data: user });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  res.cookie('access_token', data.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', data.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth/refresh' });

  res.status(200).json(data);
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  const tokens = await authService.refresh(refreshToken);

  res.cookie('access_token', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth/refresh' });

  res.status(200).json(tokens);
});

const logout = asyncHandler(async (req, res) => {
  await authService.revokeUserSessions(req.user.id);

  res.clearCookie('access_token', { ...cookieOptions, path: '/' });
  res.clearCookie('refresh_token', { ...cookieOptions, path: '/api/v1/auth/refresh' });

  res.status(200).json({ message: 'Logout realizado com sucesso' });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  res.status(200).json({ data: user ? user.toSafeJSON() : null });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
