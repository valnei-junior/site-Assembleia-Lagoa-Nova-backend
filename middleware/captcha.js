const { verifyCaptchaToken } = require('../security/captcha');

const requireCaptcha = async (req, res, next) => {
  const enabled = String(process.env.CAPTCHA_ENABLED || 'false').toLowerCase() === 'true';

  if (!enabled) {
    return next();
  }

  const captchaToken = req.body?.captchaToken;

  if (!captchaToken) {
    return res.status(400).json({ message: 'Captcha obrigatório.' });
  }

  try {
    const ok = await verifyCaptchaToken({ token: captchaToken, ip: req.ip });

    if (!ok) {
      return res.status(403).json({ message: 'Falha na validação do captcha.' });
    }

    return next();
  } catch (error) {
    return res.status(503).json({ message: 'Não foi possível validar o captcha.' });
  }
};

module.exports = {
  requireCaptcha,
};
