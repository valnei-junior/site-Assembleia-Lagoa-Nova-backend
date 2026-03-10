const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const buildPayload = (user) => ({
  sub: user.id,
  role: user.role,
  departmentId: user.departmentId || null,
  refreshTokenVersion: user.refreshTokenVersion || 0,
});

const signAccessToken = (user) => jwt.sign({ ...buildPayload(user), tokenType: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
const signRefreshToken = (user) => jwt.sign({ ...buildPayload(user), tokenType: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

const getCookieOptions = (isRefresh = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: isRefresh ? '/api/auth/refresh' : '/',
  maxAge: isRefresh ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000,
});

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getCookieOptions,
};
