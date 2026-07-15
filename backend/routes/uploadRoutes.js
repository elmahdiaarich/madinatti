// backend/routes/uploadRoutes.js
const express = require('express');
const { upload } = require('../config/cloudinary'); // same file you pasted
const { uploadImage, uploadDocument, deleteUpload } = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Both routes require an authenticated admin — swap `protect` for whatever
// your other admin routes use (e.g. `verifyToken`, `isAdmin`, etc.)
router.post('/', authMiddleware, upload.single('file'), uploadImage);
router.post('/document', authMiddleware, upload.single('file'), uploadDocument);
router.delete('/', authMiddleware, deleteUpload);
module.exports = router;