const Joi = require('joi');
const { DepartmentEvent } = require('../models/department-event.model');

const eventSchema = Joi.object({
  title: Joi.string().trim().min(2).max(180).required(),
  theme: Joi.string().allow('').max(180).optional(),
  date: Joi.string().required(),
  description: Joi.string().allow('').max(10000).optional(),
}).required();

const photoSchema = Joi.object({
  photos: Joi.array()
    .items(
      Joi.object({
        src: Joi.string().required(),
        caption: Joi.string().allow('').max(300).optional(),
        format: Joi.string().valid('original', 'rounded').optional(),
      }),
    )
    .min(1)
    .required(),
}).required();

const videoSchema = Joi.object({
  title: Joi.string().trim().min(2).max(180).required(),
  description: Joi.string().allow('').max(2000).optional(),
  date: Joi.string().required(),
  src: Joi.string().required(),
  type: Joi.string().valid('upload', 'external').required(),
}).required();

const toResponse = (event) => ({
  id: event.id,
  title: event.title,
  theme: event.theme,
  date: event.eventDate,
  departmentId: event.departmentId,
  description: event.description,
  photos: Array.isArray(event.photos) ? event.photos : [],
  videos: Array.isArray(event.videos) ? event.videos : [],
  createdBy: String(event.createdBy || ''),
  createdAt: new Date(event.createdAt).getTime(),
  updatedAt: new Date(event.updatedAt).getTime(),
});

const listEvents = async (req, res) => {
  const { departmentId } = req.params;
  const rows = await DepartmentEvent.findAll({
    where: { departmentId },
    order: [['eventDate', 'DESC'], ['createdAt', 'DESC']],
  });

  return res.status(200).json({
    data: rows.map(toResponse),
  });
};

const createEvent = async (req, res) => {
  const { departmentId } = req.params;
  const { error, value } = eventSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Payload inválido.',
      details: error.details.map((d) => d.message),
    });
  }

  const created = await DepartmentEvent.create({
    departmentId,
    title: value.title,
    theme: value.theme || '',
    eventDate: value.date,
    description: value.description || '',
    photos: [],
    videos: [],
    createdBy: Number(req.usuario?.sub) || null,
  });

  return res.status(201).json({ data: toResponse(created) });
};

const updateEvent = async (req, res) => {
  const { departmentId, eventId } = req.params;
  const { error, value } = eventSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Payload inválido.',
      details: error.details.map((d) => d.message),
    });
  }

  const event = await DepartmentEvent.findOne({ where: { id: eventId, departmentId } });
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  event.title = value.title;
  event.theme = value.theme || '';
  event.eventDate = value.date;
  event.description = value.description || '';
  await event.save();

  return res.status(200).json({ data: toResponse(event) });
};

const deleteEvent = async (req, res) => {
  const { departmentId, eventId } = req.params;
  const removed = await DepartmentEvent.destroy({ where: { id: eventId, departmentId } });

  if (!removed) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  return res.status(200).json({ message: 'Evento removido com sucesso.' });
};

const addPhotos = async (req, res) => {
  const { departmentId, eventId } = req.params;
  const { error, value } = photoSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Payload inválido.',
      details: error.details.map((d) => d.message),
    });
  }

  const event = await DepartmentEvent.findOne({ where: { id: eventId, departmentId } });
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  const currentPhotos = Array.isArray(event.photos) ? event.photos : [];
  const incoming = value.photos.map((photo) => ({
    id: crypto.randomUUID(),
    eventId,
    src: photo.src,
    caption: photo.caption || 'Foto do evento',
    format: photo.format || 'original',
    createdAt: Date.now(),
  }));

  event.photos = [...currentPhotos, ...incoming];
  await event.save();

  return res.status(200).json({ data: toResponse(event) });
};

const removePhoto = async (req, res) => {
  const { departmentId, eventId, photoId } = req.params;
  const event = await DepartmentEvent.findOne({ where: { id: eventId, departmentId } });
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  const currentPhotos = Array.isArray(event.photos) ? event.photos : [];
  event.photos = currentPhotos.filter((photo) => photo.id !== photoId);
  await event.save();

  return res.status(200).json({ data: toResponse(event) });
};

const addVideo = async (req, res) => {
  const { departmentId, eventId } = req.params;
  const { error, value } = videoSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Payload inválido.',
      details: error.details.map((d) => d.message),
    });
  }

  const event = await DepartmentEvent.findOne({ where: { id: eventId, departmentId } });
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  const currentVideos = Array.isArray(event.videos) ? event.videos : [];
  const video = {
    id: crypto.randomUUID(),
    eventId,
    title: value.title,
    description: value.description || '',
    date: value.date,
    departmentId,
    type: value.type,
    src: value.src,
    createdAt: Date.now(),
  };

  event.videos = [video, ...currentVideos];
  await event.save();

  return res.status(200).json({ data: toResponse(event) });
};

const removeVideo = async (req, res) => {
  const { departmentId, eventId, videoId } = req.params;
  const event = await DepartmentEvent.findOne({ where: { id: eventId, departmentId } });
  if (!event) {
    return res.status(404).json({ message: 'Evento não encontrado.' });
  }

  const currentVideos = Array.isArray(event.videos) ? event.videos : [];
  event.videos = currentVideos.filter((video) => video.id !== videoId);
  await event.save();

  return res.status(200).json({ data: toResponse(event) });
};

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addPhotos,
  removePhoto,
  addVideo,
  removeVideo,
};
