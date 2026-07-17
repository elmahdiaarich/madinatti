const express = require('express');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { createListingLimiter, healthSearchLimiter } = require('../middlewares/rateLimiter');
const healthController = require('../controllers/healthController');
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/subcategories', healthController.getSubcategories);
router.get('/admin/import-template', authMiddleware, roleMiddleware('admin'), healthController.downloadImportTemplate);
router.get('/admin/places', authMiddleware, roleMiddleware('admin'), healthController.listAdminPlaces);
router.post('/admin/import', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), healthController.importPlaces);
router.get('/places', healthSearchLimiter, healthController.getPlaces);
router.get('/places/:id', healthController.getPlaceById);

router.post('/places', authMiddleware, roleMiddleware('citizen', 'business', 'admin'), createListingLimiter, healthController.createPlace);
router.put('/places/:id', authMiddleware, roleMiddleware('citizen', 'business', 'admin'), healthController.updatePlace);
router.delete('/places/:id', authMiddleware, roleMiddleware('admin'), healthController.deletePlace);
router.post('/places/:id/claim', authMiddleware, roleMiddleware('business', 'admin'), healthController.claimPlace);
router.patch('/places/:id/moderate', authMiddleware, roleMiddleware('admin'), healthController.moderatePlace);

module.exports = router;
