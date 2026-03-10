const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { Op } = require('sequelize');
const { User } = require('../../user/models/user.model');
const { recordFailedLoginForIp, clearFailedLoginForIp } = require('../../../middleware/suspicious');
const { issueTwoFactorSecret, verifyTwoFactorToken, makeChallengeToken } = require('../../../security/otp');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getCookieOptions,
} = require('../../../security/tokens');

const MAX_FAILED_ATTEMPTS = Number(process.env.AUTH_MAX_FAILED_ATTEMPTS || 5);
const LOCK_MINUTES = Number(process.env.AUTH_LOCK_MINUTES || 15);

const challengeStore = new Map();

const loginSchema = Joi.object({
  identifier: Joi.string().trim().required(),
  password: Joi.string().min(8).required(),
  otp: Joi.string().optional(),
}).required();

const toSafeUser = (user) => {
  const values = user.toSafeJSON ? user.toSafeJSON() : user.toJSON();
  delete values.twoFactorSecret;
  return values;
};

const setSessionCookies = (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie('access_token', accessToken, getCookieOptions(false));
  res.cookie('refresh_token', refreshToken, getCookieOptions(true));

  return { accessToken, refreshToken };
};

const clearSessionCookies = (res) => {
  res.clearCookie('access_token', getCookieOptions(false));
  res.clearCookie('refresh_token', getCookieOptions(true));
};

const normalizeIdentifier = (identifier) => String(identifier || '').trim().toLowerCase();
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const findUserByIdentifier = async (identifier) => {
  const normalized = normalizeIdentifier(identifier);
  const normalizedPhone = normalizePhone(identifier);

  return User.findOne({
    where: {
      active: true,
      [Op.or]: [
        { email: normalized },
        { phone: normalizedPhone || '__none__' },
      ],
    },
  });
};

const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Payload inválido', details: error.details.map((d) => d.message) });
  }

  const user = await findUserByIdentifier(value.identifier);

  if (!user) {
    recordFailedLoginForIp(req.ip);
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    recordFailedLoginForIp(req.ip);
    return res.status(423).json({ message: 'Conta temporariamente bloqueada por tentativas falhas.' });
  }

  const passwordOk = await bcrypt.compare(value.password, user.passwordHash);
  if (!passwordOk) {
    recordFailedLoginForIp(req.ip);
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.lockedUntil = lockUntil;
    }

    await user.save();
    return res.status(401).json({ message: 'Credenciais inválidas.' });
  }

  if (user.twoFactorEnabled) {
    if (!value.otp) {
      const challenge = makeChallengeToken();
      challengeStore.set(challenge, {
        userId: user.id,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return res.status(202).json({
        message: '2FA necessário',
        requires2FA: true,
        challenge,
      });
    }

    const otpOk = verifyTwoFactorToken(user.twoFactorSecret, value.otp);
    if (!otpOk) {
      recordFailedLoginForIp(req.ip);
      return res.status(401).json({ message: 'Código 2FA inválido.' });
    }
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();
  clearFailedLoginForIp(req.ip);

  const { accessToken } = setSessionCookies(res, user);

  return res.status(200).json({
    message: 'Login realizado com sucesso',
    accessToken,
    user: toSafeUser(user),
  });
};

const verifyTwoFactorChallenge = async (req, res) => {
  const schema = Joi.object({
    challenge: Joi.string().required(),
    otp: Joi.string().required(),
  }).required();

  const { error, value } = schema.validate(req.body || {});
  if (error) {
    return res.status(400).json({ message: 'Payload inválido.' });
  }

  const challengeData = challengeStore.get(value.challenge);
  if (!challengeData || challengeData.expiresAt < Date.now()) {
    challengeStore.delete(value.challenge);
    return res.status(401).json({ message: 'Challenge de autenticação inválido ou expirado.' });
  }

  const user = await User.findByPk(challengeData.userId);
  if (!user || !user.active) {
    challengeStore.delete(value.challenge);
    return res.status(401).json({ message: 'Usuário não disponível para autenticação.' });
  }

  const otpOk = verifyTwoFactorToken(user.twoFactorSecret, value.otp);
  if (!otpOk) {
    return res.status(401).json({ message: 'Código 2FA inválido.' });
  }

  challengeStore.delete(value.challenge);

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken } = setSessionCookies(res, user);

  return res.status(200).json({
    message: '2FA validado com sucesso',
    accessToken,
    user: toSafeUser(user),
  });
};

const refreshSession = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token não fornecido.' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(Number(payload.sub));

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Sessão inválida.' });
    }

    if (Number(payload.refreshTokenVersion) !== Number(user.refreshTokenVersion)) {
      return res.status(401).json({ message: 'Sessão revogada.' });
    }

    const { accessToken } = setSessionCookies(res, user);
    return res.status(200).json({ message: 'Sessão renovada.', accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token inválido ou expirado.' });
  }
};

const logout = async (req, res) => {
  if (req.usuario?.sub) {
    const user = await User.findByPk(Number(req.usuario.sub));
    if (user) {
      user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
      await user.save();
    }
  }

  clearSessionCookies(res);
  return res.status(200).json({ message: 'Logout realizado com sucesso.' });
};

const me = async (req, res) => {
  const user = await User.findByPk(Number(req.usuario?.sub));
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  return res.status(200).json({ data: toSafeUser(user) });
};

const setup2FA = async (req, res) => {
  const user = await User.findByPk(Number(req.usuario?.sub));
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const { base32, otpauthUrl } = issueTwoFactorSecret(`${user.name} (${user.email || user.phone})`);
  user.twoFactorSecret = base32;
  user.twoFactorEnabled = false;
  await user.save();

  return res.status(200).json({
    message: 'Segredo 2FA gerado. Confirme com um código antes de ativar.',
    otpauthUrl,
    manualEntryKey: base32,
  });
};

const verifyAndEnable2FA = async (req, res) => {
  const schema = Joi.object({ otp: Joi.string().required() }).required();
  const { error, value } = schema.validate(req.body || {});
  if (error) {
    return res.status(400).json({ message: 'Payload inválido.' });
  }

  const user = await User.findByPk(Number(req.usuario?.sub));
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ message: '2FA ainda não configurado para este usuário.' });
  }

  const otpOk = verifyTwoFactorToken(user.twoFactorSecret, value.otp);
  if (!otpOk) {
    return res.status(401).json({ message: 'Código inválido.' });
  }

  user.twoFactorEnabled = true;
  await user.save();

  return res.status(200).json({ message: '2FA ativado com sucesso.' });
};

module.exports = {
  login,
  verifyTwoFactorChallenge,
  refreshSession,
  logout,
  me,
  setup2FA,
  verifyAndEnable2FA,
};
