const crypto = require('crypto');
const speakeasy = require('speakeasy');

const issueTwoFactorSecret = (label) => {
  const secret = speakeasy.generateSecret({
    name: label || 'AD Lagoa Nova',
    length: 20,
  });

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

const verifyTwoFactorToken = (base32Secret, token) => {
  if (!base32Secret || !token) return false;

  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: 'base32',
    token: String(token).replace(/\s+/g, ''),
    window: 1,
  });
};

const makeChallengeToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  issueTwoFactorSecret,
  verifyTwoFactorToken,
  makeChallengeToken,
};
