const PERFIS_VALIDOS = ['admin', 'user', 'lider_departamento'];

const autorizarPerfis = (...perfisPermitidos) => {
    return (req, res, next) => {
        const role = String(req.usuario?.role || "").toLowerCase();
        const perfisNormalizados = perfisPermitidos.map((perfil) => String(perfil).toLowerCase());

        const perfilInvalido = perfisNormalizados.some((perfil) => !PERFIS_VALIDOS.includes(perfil));
        if (perfilInvalido) {
            return res.status(500).json({
                message: "Configuração de perfis inválida na rota.",
            });
        }

        if (!role || !perfisNormalizados.includes(role)) {
            return res.status(403).json({
                message: "Acesso negado para este perfil.",
            });
        }

        return next();
    };
};

const verificarProprioUsuarioOuAdmin = (req, res, next) => {
    const role = String(req.usuario?.role || "").toLowerCase();
    const usuarioTokenId = Number(req.usuario?.sub);
    const usuarioRotaId = Number(req.params?.id);

    if (role === "admin") {
        return next();
    }

    if (usuarioTokenId && usuarioRotaId && usuarioTokenId === usuarioRotaId) {
        return next();
    }

    return res.status(403).json({
        message: "Acesso negado para este recurso.",
    });
};

const verificarMesmoDepartamentoOuAdmin = (resolverDepartmentId) => {
    return (req, res, next) => {
        const role = String(req.usuario?.role || '').toLowerCase();
        const userDepartmentId = String(req.usuario?.departmentId || '');
        const resourceDepartmentId = String(
            typeof resolverDepartmentId === 'function'
                ? resolverDepartmentId(req)
                : req.params?.departmentId || req.body?.departmentId || ''
        );

        if (role === 'admin') {
            return next();
        }

        if (!resourceDepartmentId) {
            return res.status(400).json({
                message: 'Departamento do recurso não informado.',
            });
        }

        if (role === 'lider_departamento' && userDepartmentId && userDepartmentId === resourceDepartmentId) {
            return next();
        }

        return res.status(403).json({
            message: 'Acesso negado para outro departamento.',
        });
    };
};

module.exports = {
    autorizarPerfis,
    verificarProprioUsuarioOuAdmin,
    verificarMesmoDepartamentoOuAdmin,
};