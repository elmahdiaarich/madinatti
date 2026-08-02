const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;   // <-- import directly here, not from config
const authMiddleware = require('../middlewares/authMiddleware');
const journalistMiddleware = require('../middlewares/journalistMiddleware');

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

// GET /api/upload/videos/signature
// Ne reçoit jamais le fichier — génère juste une signature pour un upload
// direct (navigateur -> Cloudinary), après vérification du droit de publier.
// Réservé aux journalistes actifs (canPublish: true), comme les articles.
router.get('/videos/signature', authMiddleware, journalistMiddleware, (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'madinatti/temp';

    // Uniquement les paramètres inclus dans la signature doivent être
    // renvoyés au frontend et réutilisés à l'identique dans l'upload direct,
    // sinon Cloudinary rejette la requête (signature mismatch).
    const paramsToSign = { timestamp, folder };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.json({
      success: true,
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error('[upload/videos/signature]', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la génération de la signature' });
  }
});

// DELETE /api/upload/videos  body: { publicId }
// Nettoyage best-effort d'une vidéo temp jamais utilisée (formulaire abandonné
// avant soumission). Contrairement à DELETE /images (qui parse l'URL), on
// utilise directement le public_id retourné par l'upload direct Cloudinary,
// puisque l'URL seule ne suffit pas à reconstituer un public_id vidéo fiable.
// resource_type: 'video' est obligatoire ici — cloudinary.uploader.destroy()
// cible les images par défaut et échouerait silencieusement sur une vidéo.
router.delete('/videos', authMiddleware, journalistMiddleware, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId || !publicId.includes('madinatti/temp')) {
      return res.status(400).json({ success: false, message: 'publicId invalide ou hors dossier temp' });
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    return res.json({ success: true });
  } catch (err) {
    console.error('[upload/videos/delete]', err);
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

module.exports = router;