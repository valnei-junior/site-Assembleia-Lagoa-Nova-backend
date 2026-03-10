const requireRole = (...roles) => (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  const allowed = roles.map((item) => String(item).toLowerCase());

  if (!role || !allowed.includes(role)) {
    return res.status(403).json({ message: 'Acesso negado para este perfil' });
  }

  return next();
};

const requireSameDepartmentOrAdmin = (departmentResolver) => (req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin') {
    return next();
  }

  const departmentId = typeof departmentResolver === 'function'
    ? departmentResolver(req)
    : req.params.departmentId;

  if (!departmentId) {
    return res.status(400).json({ message: 'DepartmentId nao informado' });
  }

  if (Number(req.user?.departmentId) !== Number(departmentId)) {
    return res.status(403).json({ message: 'Sem permissao para outro departamento' });
  }

  return next();
};

module.exports = {
  requireRole,
  requireSameDepartmentOrAdmin,
};
