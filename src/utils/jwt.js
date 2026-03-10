const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'change_me_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change_me_refresh';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const signAccessToken = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
    departmentId: user.departmentId || null,
    tokenType: 'access',
  },
  ACCESS_SECRET,
  { expiresIn: ACCESS_EXPIRES_IN },
);

const signRefreshToken = (user) => jwt.sign(
  {
    sub: user.id,
    role: user.role,
    tokenType: 'refresh',
    refreshTokenVersion: user.refreshTokenVersion || 0,
  },
  REFRESH_SECRET,
  { expiresIn: REFRESH_EXPIRES_IN },
);

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
