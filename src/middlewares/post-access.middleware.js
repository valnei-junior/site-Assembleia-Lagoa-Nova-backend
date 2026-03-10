const { Post } = require('../models');

const requirePostDepartmentOrAdmin = async (req, res, next) => {
  const role = req.user?.role;
  if (role === 'admin') {
    return next();
  }

  const postId = Number(req.params.postId || req.params.id || req.body.postId);
  if (!postId) {
    return res.status(400).json({ message: 'PostId nao informado' });
  }

  const post = await Post.findByPk(postId);
  if (!post) {
    return res.status(404).json({ message: 'Postagem nao encontrada' });
  }

  if (Number(post.departmentId) !== Number(req.user?.departmentId)) {
    return res.status(403).json({ message: 'Sem permissao para outro departamento' });
  }

  return next();
};

module.exports = {
  requirePostDepartmentOrAdmin,
};
