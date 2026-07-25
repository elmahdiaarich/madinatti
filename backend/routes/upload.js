const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;   // <-- import directly here, not from config
const authMiddleware = require('../middlewares/authMiddleware');

// Configure inline
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  try {
    const uploads = await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'madinatti/temp',
              transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          stream.end(file.buffer);
        });
      })
    );

    return res.json({ success: true, files: uploads });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});
// DELETE /api/upload/images  body: { url }
// Nettoyage best-effort d'une image temp jamais utilisée (ex: formulaire
// abandonné avant soumission). Volontairement restreint à madinatti/temp
// pour ne jamais permettre la suppression d'une image déjà publiée.
router.delete('/images', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('madinatti/temp')) {
      return res.status(400).json({ success: false, message: 'URL invalide ou hors dossier temp' });
    }
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) {
      return res.status(400).json({ success: false, message: 'URL invalide' });
    }
    const withoutVer = urlParts[1].replace(/^v\d+\//, '');
    const publicId = withoutVer.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
    return res.json({ success: true });
  } catch (err) {
    console.error('[upload/delete]', err);
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});
module.exports = router;