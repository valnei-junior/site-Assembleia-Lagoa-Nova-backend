const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const ROOT_UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads');
const IMAGES_DIR = path.join(ROOT_UPLOAD_DIR, 'images');
const VIDEOS_DIR = path.join(ROOT_UPLOAD_DIR, 'videos');
const THUMBNAILS_DIR = path.join(ROOT_UPLOAD_DIR, 'thumbnails');

const ensureDirectories = () => {
  [ROOT_UPLOAD_DIR, IMAGES_DIR, VIDEOS_DIR, THUMBNAILS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureDirectories();

const sanitizeFileBase = (name) =>
  String(name || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'arquivo';

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, IMAGES_DIR);
      return;
    }

    cb(null, VIDEOS_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeBase = sanitizeFileBase(path.basename(file.originalname || 'arquivo', extension));
    cb(null, `${Date.now()}-${safeBase}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error(`Tipo de arquivo nao suportado: ${file.mimetype}`));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 80 * 1024 * 1024,
    files: 1,
  },
});

const mediaUploadSingle = upload.single('file');
const videoUploadSingle = upload.single('video');

const optimizeImage = async (imagePath, filename) => {
  const optimizedName = `optimized-${path.parse(filename).name}.webp`;
  const optimizedPath = path.join(IMAGES_DIR, optimizedName);

  await sharp(imagePath)
    .rotate()
    .resize({
      width: 1600,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: 82 })
    .toFile(optimizedPath);

  return {
    optimizedName,
    optimizedPath,
  };
};

const normalizeVideoToMp4H264 = (videoPath, filename) =>
  new Promise((resolve) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.mp4') {
      resolve({
        finalPath: videoPath,
        finalName: filename,
        converted: false,
      });
      return;
    }

    const outputName = `${path.parse(filename).name}-h264.mp4`;
    const outputPath = path.join(VIDEOS_DIR, outputName);

    ffmpeg(videoPath)
      .outputOptions([
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-c:a aac',
        '-b:a 128k',
      ])
      .format('mp4')
      .on('end', () => {
        try {
          fs.unlinkSync(videoPath);
        } catch {
          // noop
        }

        resolve({
          finalPath: outputPath,
          finalName: outputName,
          converted: true,
        });
      })
      .on('error', () => {
        resolve({
          finalPath: videoPath,
          finalName: filename,
          converted: false,
        });
      })
      .save(outputPath);
  });

const generateVideoThumbnail = (videoPath, filename) =>
  new Promise((resolve) => {
    const thumbName = `${path.parse(filename).name}.jpg`;

    ffmpeg(videoPath)
      .on('end', () => resolve(thumbName))
      .on('error', () => resolve(null))
      .screenshots({
        count: 1,
        folder: THUMBNAILS_DIR,
        filename: thumbName,
        timemarks: ['2'],
      });
  });

const isSafeFileName = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  if (normalized.includes('..')) return false;
  return normalized === path.basename(normalized);
};

const buildAbsoluteUrl = (req, routePath) => `${req.protocol}://${req.get('host')}${routePath}`;

const streamVideo = (req, res, fileName) => {
  if (!isSafeFileName(fileName)) {
    return res.status(400).json({ message: 'Nome de arquivo invalido.' });
  }

  const filePath = path.join(VIDEOS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Video nao encontrado.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = path.extname(fileName).toLowerCase() === '.webm' ? 'video/webm' : 'video/mp4';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      return res.status(416).json({ message: 'Range invalido.' });
    }

    const chunkSize = (end - start) + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    stream.pipe(res);
    return undefined;
  }

  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  fs.createReadStream(filePath).pipe(res);
  return undefined;
};

const sendImageFile = (req, res, fileName) => {
  if (!isSafeFileName(fileName)) {
    return res.status(400).json({ message: 'Nome de arquivo invalido.' });
  }

  const filePath = path.join(IMAGES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Imagem nao encontrada.' });
  }

  return res.sendFile(filePath);
};

const sendThumbnailFile = (req, res, fileName) => {
  if (!isSafeFileName(fileName)) {
    return res.status(400).json({ message: 'Nome de arquivo invalido.' });
  }

  const filePath = path.join(THUMBNAILS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Thumbnail nao encontrada.' });
  }

  return res.sendFile(filePath);
};

module.exports = {
  IMAGES_DIR,
  VIDEOS_DIR,
  THUMBNAILS_DIR,
  mediaUploadSingle,
  videoUploadSingle,
  optimizeImage,
  normalizeVideoToMp4H264,
  generateVideoThumbnail,
  buildAbsoluteUrl,
  streamVideo,
  sendImageFile,
  sendThumbnailFile,
};
