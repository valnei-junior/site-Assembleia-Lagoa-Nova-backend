const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Taxa de requisições excedida.' },
});

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [k, v]) => {
      acc[k] = sanitizeValue(v);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeInputs = (req, _res, next) => {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
};

const attachRequestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

const enforceCsrfForStateChange = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'Falha na verificação CSRF.' });
  }

  return next();
};

const setCsrfCookie = (req, res, next) => {
  if (!req.cookies?.csrf_token) {
    res.cookie('csrf_token', crypto.randomBytes(24).toString('hex'), {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  next();
};

module.exports = {
  loginLimiter,
  strictLimiter,
  sanitizeInputs,
  attachRequestId,
  enforceCsrfForStateChange,
  setCsrfCookie,
};
