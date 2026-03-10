const blockedIps = new Map();
const failedAttemptsByIp = new Map();

const MAX_FAILED_BY_IP = Number(process.env.AUTH_MAX_FAILED_PER_IP || 10);
const BLOCK_MINUTES = Number(process.env.AUTH_BLOCK_IP_MINUTES || 30);

const isIpBlocked = (ip) => {
  const block = blockedIps.get(ip);
  if (!block) return false;

  if (block.expiresAt <= Date.now()) {
    blockedIps.delete(ip);
    return false;
  }

  return true;
};

const recordFailedLoginForIp = (ip) => {
  const current = failedAttemptsByIp.get(ip) || 0;
  const next = current + 1;
  failedAttemptsByIp.set(ip, next);

  if (next >= MAX_FAILED_BY_IP) {
    blockedIps.set(ip, {
      expiresAt: Date.now() + BLOCK_MINUTES * 60 * 1000,
      reason: 'too_many_failed_logins',
    });
    failedAttemptsByIp.set(ip, 0);
  }
};

const clearFailedLoginForIp = (ip) => {
  failedAttemptsByIp.delete(ip);
};

const suspiciousGuard = (req, res, next) => {
  if (isIpBlocked(req.ip)) {
    return res.status(429).json({ message: 'IP temporariamente bloqueado por atividade suspeita.' });
  }

  return next();
};

module.exports = {
  suspiciousGuard,
  recordFailedLoginForIp,
  clearFailedLoginForIp,
};
