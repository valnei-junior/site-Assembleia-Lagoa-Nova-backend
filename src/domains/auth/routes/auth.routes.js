const { Router } = require('express');
const autenticacao = require('../../../middleware/autenticacao');
const { audit } = require('../../../middleware/audit');
const { loginLimiter } = require('../../../middleware/security');
const { requireCaptcha } = require('../../../middleware/captcha');
const { suspiciousGuard } = require('../../../middleware/suspicious');
const {
  login,
  verifyTwoFactorChallenge,
  refreshSession,
  logout,
  me,
  setup2FA,
  verifyAndEnable2FA,
} = require('../controller/auth.controller');

const authRoutes = Router();

authRoutes.post('/login', suspiciousGuard, loginLimiter, requireCaptcha, audit('auth.login', 'auth', 'medium'), login);
authRoutes.post('/2fa/verify-challenge', loginLimiter, audit('auth.2fa.verify', 'auth', 'medium'), verifyTwoFactorChallenge);
authRoutes.post('/refresh', audit('auth.refresh', 'auth'), refreshSession);
authRoutes.post('/logout', autenticacao, audit('auth.logout', 'auth'), logout);
authRoutes.get('/me', autenticacao, me);
authRoutes.post('/2fa/setup', autenticacao, audit('auth.2fa.setup', 'auth', 'high'), setup2FA);
authRoutes.post('/2fa/enable', autenticacao, audit('auth.2fa.enable', 'auth', 'high'), verifyAndEnable2FA);

module.exports = authRoutes;
