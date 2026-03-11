const {
  mediaUploadSingle,
  videoUploadSingle,
  optimizeImage,
  normalizeVideoToMp4H264,
  generateVideoThumbnail,
  buildAbsoluteUrl,
  streamVideo,
  sendImageFile,
  sendThumbnailFile,
} = require('../service/media-storage.service');

const parseDepartment = (req) => String(req.body?.department || req.body?.departmentId || 'geral').trim().toLowerCase();

const uploadMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Arquivo nao enviado.' });
  }

  const department = parseDepartment(req);
  const isImage = req.file.mimetype.startsWith('image/');
  const isVideo = req.file.mimetype.startsWith('video/');

  let optimizedImageUrl = null;
  let thumbnailUrl = null;

  if (isImage) {
    const { optimizedName } = await optimizeImage(req.file.path, req.file.filename);
    optimizedImageUrl = buildAbsoluteUrl(req, `/api/v1/media/image/${optimizedName}`);
  }

  let finalVideoName = req.file.filename;
  let finalVideoPath = req.file.path;

  if (isVideo) {
    const normalizedVideo = await normalizeVideoToMp4H264(req.file.path, req.file.filename);
    finalVideoName = normalizedVideo.finalName;
    finalVideoPath = normalizedVideo.finalPath;

    const thumbName = await generateVideoThumbnail(finalVideoPath, finalVideoName);
    if (thumbName) {
      thumbnailUrl = buildAbsoluteUrl(req, `/api/v1/media/thumbnail/${thumbName}`);
    }
  }

  const resourceType = isImage ? 'image' : 'video';
  const canonicalUrl = buildAbsoluteUrl(req, `/api/v1/media/${resourceType}/${isVideo ? finalVideoName : req.file.filename}`);

  return res.status(201).json({
    message: 'Upload realizado com sucesso.',
    data: {
      filename: req.file.filename,
      storedFilename: isVideo ? finalVideoName : req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      department,
      type: resourceType,
      url: canonicalUrl,
      streamUrl: isVideo ? canonicalUrl : null,
      optimizedUrl: isImage ? optimizedImageUrl : null,
      thumbnail: thumbnailUrl,
      createdAt: new Date().toISOString(),
    },
  });
};

const uploadVideoCompat = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Arquivo de video nao enviado.' });
  }

  const normalizedVideo = await normalizeVideoToMp4H264(req.file.path, req.file.filename);
  const thumbnailName = await generateVideoThumbnail(normalizedVideo.finalPath, normalizedVideo.finalName);
  const streamUrl = buildAbsoluteUrl(req, `/api/v1/media/video/${normalizedVideo.finalName}`);

  return res.status(201).json({
    data: {
      filename: normalizedVideo.finalName,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: streamUrl,
      streamUrl,
      thumbnail: thumbnailName ? buildAbsoluteUrl(req, `/api/v1/media/thumbnail/${thumbnailName}`) : null,
    },
  });
};

const streamVideoByName = (req, res) => streamVideo(req, res, req.params.name);
const serveImageByName = (req, res) => sendImageFile(req, res, req.params.name);
const serveThumbnailByName = (req, res) => sendThumbnailFile(req, res, req.params.name);

module.exports = {
  mediaUploadSingle,
  videoUploadSingle,
  uploadMedia,
  uploadVideoCompat,
  streamVideoByName,
  serveImageByName,
  serveThumbnailByName,
};
