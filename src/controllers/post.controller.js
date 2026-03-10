const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const service = require('../services/post.service');

const canAccessDepartment = (user, departmentId) => (
  user.role === 'admin' || Number(user.departmentId) === Number(departmentId)
);

const list = asyncHandler(async (req, res) => {
  const data = await service.listPosts({
    departmentId: req.query.departmentId,
    status: req.query.status,
  });

  res.status(200).json({ data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getPostById(req.params.id);
  res.status(200).json({ data });
});

const create = asyncHandler(async (req, res) => {
  if (!canAccessDepartment(req.user, req.body.departmentId)) {
    throw new ApiError(403, 'Sem permissao para criar post em outro departamento');
  }

  const data = await service.createPost(req.body, req.user.id);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const current = await service.getPostById(req.params.id);
  if (!canAccessDepartment(req.user, current.departmentId)) {
    throw new ApiError(403, 'Sem permissao para alterar este post');
  }

  const data = await service.updatePost(req.params.id, req.body);
  res.status(200).json({ data });
});

const remove = asyncHandler(async (req, res) => {
  const current = await service.getPostById(req.params.id);
  if (!canAccessDepartment(req.user, current.departmentId)) {
    throw new ApiError(403, 'Sem permissao para remover este post');
  }

  await service.deletePost(req.params.id);
  res.status(200).json({ message: 'Postagem removida com sucesso' });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
