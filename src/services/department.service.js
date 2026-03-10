const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const { Department } = require('../models');
const slugify = require('../utils/slugify');

const schema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().min(2).max(140).optional(),
  description: Joi.string().allow('').max(3000).optional(),
  active: Joi.boolean().optional(),
}).required();

const listDepartments = async () => Department.findAll({ order: [['name', 'ASC']] });

const getDepartmentById = async (id) => {
  const department = await Department.findByPk(Number(id));
  if (!department) {
    throw new ApiError(404, 'Departamento nao encontrado');
  }

  return department;
};

const createDepartment = async (payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const slug = value.slug ? slugify(value.slug) : slugify(value.name);
  const existingSlug = await Department.findOne({ where: { slug } });
  if (existingSlug) {
    throw new ApiError(409, 'Slug de departamento ja existe');
  }

  return Department.create({
    name: value.name,
    slug,
    description: value.description || '',
    active: value.active !== undefined ? value.active : true,
  });
};

const updateDepartment = async (id, payload) => {
  const department = await getDepartmentById(id);
  const { error, value } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const nextSlug = value.slug ? slugify(value.slug) : slugify(value.name);
  const existingSlug = await Department.findOne({ where: { slug: nextSlug } });
  if (existingSlug && existingSlug.id !== department.id) {
    throw new ApiError(409, 'Slug de departamento ja existe');
  }

  department.name = value.name;
  department.slug = nextSlug;
  department.description = value.description || '';
  department.active = value.active !== undefined ? value.active : department.active;
  await department.save();

  return department;
};

const deleteDepartment = async (id) => {
  const department = await getDepartmentById(id);
  await department.destroy();
};

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
