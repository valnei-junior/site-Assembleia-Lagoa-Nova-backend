const verifyTurnstile = async (token, ip) => {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.CAPTCHA_SECRET_KEY;
  if (!secret) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip || '',
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  const data = await response.json();
  return !!data.success;
};

const verifyRecaptcha = async (token, ip) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY || process.env.CAPTCHA_SECRET_KEY;
  if (!secret) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip || '',
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body,
  });

  const data = await response.json();
  return !!data.success;
};

const verifyCaptchaToken = async ({ token, ip }) => {
  const provider = (process.env.CAPTCHA_PROVIDER || 'turnstile').toLowerCase();

  if (provider === 'recaptcha') {
    return verifyRecaptcha(token, ip);
  }

  return verifyTurnstile(token, ip);
};

module.exports = {
  verifyCaptchaToken,
};
