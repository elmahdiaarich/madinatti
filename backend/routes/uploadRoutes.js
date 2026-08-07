// backend/routes/uploadRoutes.js
const express = require('express');
const { upload } = require('../config/cloudinary');
const { uploadImage, uploadDocument, uploadVideo, deleteUpload } = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware'); // Import role checks

const router = express.Router();

// Accessible to citizens/businesses for attaching Event images
router.post('/', authMiddleware, upload.single('file'), uploadImage);

// Restricted to Admins only (tourism documents and press videos)
router.post('/document', authMiddleware, roleMiddleware('admin'), upload.single('file'), uploadDocument);
router.post('/video', authMiddleware, roleMiddleware('admin'), upload.single('file'), uploadVideo);

// RESTRICTED TO ADMINS ONLY (prevents BOLA vulnerability)
router.delete('/', authMiddleware, roleMiddleware('admin'), deleteUpload);

module.exports = router;