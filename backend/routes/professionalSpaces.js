const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  getAllListings,
  getListingById,
  createProfessionalSpaceListing,
  updateProfessionalSpaceListing,
  deleteProfessionalSpaceListing,
  downloadImportTemplate,
  listAdminListings,
  importListings
} = require('../controllers/professionalSpaceController');
const favoriteController = require('../controllers/favoriteController');
const multer = require('multer');

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post('/favorites/:id/toggle', authMiddleware, favoriteController.toggleFavorite('PROFESSIONAL_SPACE'));
router.get('/favorites/me', authMiddleware, favoriteController.getUserFavorites('PROFESSIONAL_SPACE'));
router.get('/', getAllListings);
router.get('/admin/import-template', authMiddleware, roleMiddleware('admin'), downloadImportTemplate);
router.get('/admin/places', authMiddleware, roleMiddleware('admin'), listAdminListings);
router.post('/admin/import', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), importListings);
router.get('/:id', getListingById);
router.post('/', authMiddleware, createProfessionalSpaceListing);
router.put('/:id', authMiddleware, updateProfessionalSpaceListing);
router.delete('/:id', authMiddleware, deleteProfessionalSpaceListing);

module.exports = router;