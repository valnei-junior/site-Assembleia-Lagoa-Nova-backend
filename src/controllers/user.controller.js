const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/user.service');

const list = asyncHandler(async (_req, res) => {
  const data = await service.listUsers();
  res.status(200).json({ data });
});

const getById = asyncHandler(async (req, res) => {
  const user = await service.getUserById(req.params.id);
  res.status(200).json({ data: user.toSafeJSON() });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.createUser(req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body);
  res.status(200).json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id);
  res.status(200).json({ message: 'Usuario removido com sucesso' });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
