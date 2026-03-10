const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');
const { Media, Post } = require('../models');

const detectType = (mimeType) => (mimeType.startsWith('video/') ? 'video' : 'image');

const ensurePostExists = async (postId) => {
  const post = await Post.findByPk(Number(postId));
  if (!post) {
    throw new ApiError(404, 'Postagem nao encontrada');
  }

  return post;
};

const listMedia = async (postId) => {
  const where = postId ? { postId: Number(postId) } : undefined;
  return Media.findAll({ where, order: [['createdAt', 'DESC']] });
};

const createMediaFromFiles = async ({ files, postId, userId, baseUrl }) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, 'Nenhum arquivo enviado');
  }

  await ensurePostExists(postId);

  const records = files.map((file) => ({
    postId: Number(postId),
    uploadedById: userId || null,
    type: detectType(file.mimetype),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `${baseUrl}/uploads/${file.filename}`,
  }));

  return Media.bulkCreate(records, { returning: true });
};

const updateMedia = async (id, payload) => {
  const media = await Media.findByPk(Number(id));
  if (!media) {
    throw new ApiError(404, 'Midia nao encontrada');
  }

  if (payload.altText !== undefined) media.altText = payload.altText;
  if (payload.thumbnailUrl !== undefined) media.thumbnailUrl = payload.thumbnailUrl;

  await media.save();

  return media;
};

const deleteMedia = async (id) => {
  const media = await Media.findByPk(Number(id));
  if (!media) {
    throw new ApiError(404, 'Midia nao encontrada');
  }

  const filePath = path.resolve(__dirname, '../../uploads', media.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await media.destroy();
};

const getMediaForDownload = async (id) => {
  const media = await Media.findByPk(Number(id));
  if (!media) {
    throw new ApiError(404, 'Midia nao encontrada');
  }

  const filePath = path.resolve(__dirname, '../../uploads', media.filename);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Arquivo nao encontrado no servidor');
  }

  return {
    media,
    filePath,
  };
};

module.exports = {
  listMedia,
  createMediaFromFiles,
  updateMedia,
  deleteMedia,
  getMediaForDownload,
};
