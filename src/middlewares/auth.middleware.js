const { User } = require('../models');
const { verifyAccessToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    const bearer = authorization && authorization.startsWith('Bearer ') ? authorization.split(' ')[1] : null;
    const token = bearer || req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ message: 'Token nao fornecido' });
    }

    const payload = verifyAccessToken(token);
    if (payload.tokenType !== 'access') {
      return res.status(401).json({ message: 'Token invalido' });
    }

    const user = await User.findByPk(Number(payload.sub));
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario nao autorizado' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      departmentId: user.departmentId,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido ou expirado' });
  }
};

module.exports = authMiddleware;
