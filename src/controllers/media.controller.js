const Joi = require('joi');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const service = require('../services/media.service');

const updateSchema = Joi.object({
  altText: Joi.string().max(200).allow('').optional(),
  thumbnailUrl: Joi.string().uri().allow('').optional(),
}).required();

const list = asyncHandler(async (req, res) => {
  const data = await service.listMedia(req.query.postId);
  res.status(200).json({ data });
});

const uploadMany = asyncHandler(async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const data = await service.createMediaFromFiles({
    files: req.files,
    postId: req.body.postId,
    userId: req.user.id,
    baseUrl,
  });

  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    throw new ApiError(400, 'Dados invalidos', error.details.map((item) => item.message));
  }

  const data = await service.updateMedia(req.params.id, value);
  res.status(200).json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteMedia(req.params.id);
  res.status(200).json({ message: 'Midia removida com sucesso' });
});

const download = asyncHandler(async (req, res) => {
  const { media, filePath } = await service.getMediaForDownload(req.params.id);
  res.download(filePath, media.originalName);
});

module.exports = {
  list,
  uploadMany,
  update,
  remove,
  download,
};
