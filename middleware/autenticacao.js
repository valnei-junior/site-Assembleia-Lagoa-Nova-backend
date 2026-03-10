const { verifyAccessToken } = require('../security/tokens');

const PERFIS_VALIDOS = ['admin', 'user', 'lider_departamento'];

const autenticar = (req, res, next) => {
	try {
		const authorization = req.headers.authorization;
		const hasBearerToken = authorization?.startsWith('Bearer ');
		const bearer = hasBearerToken ? authorization.split(' ')[1] : null;
		const cookieToken = req.cookies?.access_token;
		const token = bearer || cookieToken;

		if (!token) {
			return res.status(401).json({
				message: 'Token não fornecido.',
			});
		}

		const payload = verifyAccessToken(token);

		if (payload.tokenType !== 'access') {
			return res.status(401).json({
				message: 'Token inválido para este recurso.',
			});
		}

		if (!PERFIS_VALIDOS.includes(String(payload?.role || "").toLowerCase())) {
			return res.status(403).json({
				message: 'Perfil sem permissão de acesso.',
			});
		}

		req.usuario = payload;
		return next();
	} catch (error) {
		return res.status(401).json({
			message: 'Token inválido ou expirado.',
		});
	}
};

module.exports = autenticar;
module.exports.autenticar = autenticar;

