// backend/controllers/uploadController.js
const { cloudinary } = require('../config/cloudinary'); // adjust path to wherever you saved the file you pasted

// Streams a multer memory buffer to Cloudinary without touching disk.
function streamUpload(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// POST /api/uploads  (field name: "file")
// Used by the admin image-upload button (CategoryImage covers, etc).
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    if (req.file.size > 100 * 1024 * 1024) {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 100 Mo).' });
    }

    const result = await streamUpload(req.file.buffer, {
      folder: 'madinatti/tourism',
      resource_type: 'image',
    });

    res.status(201).json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: "Échec de l'upload de l'image." });
  }
};

// POST /api/uploads/document  (field name: "file")
// Used for the Magazine / Carte Touristique PDF field — same pattern, but
// resource_type "raw" since Cloudinary treats non-image files that way.
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Seuls les fichiers PDF sont acceptés.' });
    }
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ message: 'Fichier trop volumineux (max 20 Mo).' });
    }

    const result = await streamUpload(req.file.buffer, {
      folder: 'madinatti/tourism/documents',
      resource_type: 'raw',
      format: 'pdf',
    });

    res.status(201).json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: "Échec de l'upload du document." });
  }
};

module.exports = { uploadImage, uploadDocument };
