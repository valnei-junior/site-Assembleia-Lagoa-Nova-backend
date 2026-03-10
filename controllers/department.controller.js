const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/department.service');

const list = asyncHandler(async (_req, res) => {
  const data = await service.listDepartments();
  res.status(200).json({ data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getDepartmentById(req.params.id);
  res.status(200).json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.createDepartment(req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateDepartment(req.params.id, req.body);
  res.status(200).json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteDepartment(req.params.id);
  res.status(200).json({ message: 'Departamento removido com sucesso' });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
