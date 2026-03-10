const Joi = require('joi');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { Department, Post, Media } = require('../models');
const slugify = require('../utils/slugify');

const schema = Joi.object({
  departmentId: Joi.number().integer().positive().required(),
  title: Joi.string().trim().min(3).max(180).required(),
  content: Joi.string().trim().min(5).required(),
  status: Joi.string().valid('draft', 'published').default('draft'),
  socialTitle: Joi.string().trim().max(180).allow('').optional(),
  socialDescription: Joi.string().trim().max(300).allow('').optional(),
  socialImageUrl: Joi.string().trim().uri().allow('').optional(),
}).required();

const updateSchema = Joi.object({
  title: Joi.string().trim().min(3).max(180).optional(),
  content: Joi.string().trim().min(5).optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  socialTitle: Joi.string().trim().max(180).allow('').optional(),
  socialDescription: Joi.string().trim().max(300).allow('').optional(),
  socialImageUrl: Joi.string().trim().uri().allow('').optional(),
  coverMediaId: Joi.number().integer().positive().allow(null).optional(),
}).required();

const ensureDepartmentExists = async (departmentId) => {
  const department = await Department.findByPk(Number(departmentId));
  if (!department) {
    throw new ApiError(404, 'Departamento nao encontrado');
  }
};

const createUniqueSlug = async (title) => {
  const base = slugify(title);
  const likePattern = `${base}%`;
  const count = await Post.count({ where: { slug: { [Op.like]: likePattern } } });
  return count === 0 ? base : `${base}-${count + 1}`;
};

const listPosts = async ({ departmentId, status }) => {
  const where = {};
  if (departmentId) where.departmentId = Number(departmentId);
  if (status) where.status = status;

  return Post.findAll({
    where,
    include: [{ model: Media, as: 'media' }],
    order: [['createdAt', 'DESC']],
  });
};

const getPostById = async (id) => {
  const post = await Post.findByPk(Number(id), {
    include: [{ model: Media, as: 'media' }],
  });

  if (!post) {
    throw new ApiError(404, 'Postagem nao encontrada');
  }

  return post;
};

const createPost = async (payload, authorId) => {
  const { error, value } = schema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  await ensureDepartmentExists(value.departmentId);

  const slug = await createUniqueSlug(value.title);

  return Post.create({
    departmentId: value.departmentId,
    authorId,
    title: value.title,
    slug,
    content: value.content,
    status: value.status,
    publishedAt: value.status === 'published' ? new Date() : null,
    socialTitle: value.socialTitle || value.title,
    socialDescription: value.socialDescription || String(value.content).slice(0, 200),
    socialImageUrl: value.socialImageUrl || null,
  });
};

const updatePost = async (id, payload) => {
  const { error, value } = updateSchema.validate(payload, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const post = await getPostById(id);

  if (value.title !== undefined) {
    post.title = value.title;
    post.slug = await createUniqueSlug(value.title);
  }

  if (value.content !== undefined) post.content = value.content;
  if (value.status !== undefined) {
    post.status = value.status;
    post.publishedAt = value.status === 'published' ? (post.publishedAt || new Date()) : null;
  }
  if (value.socialTitle !== undefined) post.socialTitle = value.socialTitle || post.title;
  if (value.socialDescription !== undefined) post.socialDescription = value.socialDescription;
  if (value.socialImageUrl !== undefined) post.socialImageUrl = value.socialImageUrl || null;
  if (value.coverMediaId !== undefined) post.coverMediaId = value.coverMediaId;

  await post.save();

  return post;
};

const deletePost = async (id) => {
  const post = await getPostById(id);
  await post.destroy();
};

module.exports = {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
