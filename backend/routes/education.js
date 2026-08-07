const express = require('express');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const educationController = require('../controllers/educationController');

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get('/options', educationController.getOptions);
router.get('/institutions', educationController.getInstitutions);
router.get('/institutions/:slug', educationController.getInstitutionBySlug);

router.get('/admin/institutions', authMiddleware, roleMiddleware('admin'), educationController.listAdminInstitutions);
router.get('/admin/import-template', authMiddleware, roleMiddleware('admin'), educationController.downloadImportTemplate);
router.post('/admin/import/preview', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), educationController.previewImport);
router.post('/admin/import', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), educationController.importInstitutions);
router.post('/admin/institutions', authMiddleware, roleMiddleware('admin'), educationController.createInstitution);
router.put('/admin/institutions/:id', authMiddleware, roleMiddleware('admin'), educationController.updateInstitution);
router.delete('/admin/institutions/:id', authMiddleware, roleMiddleware('admin'), educationController.deleteInstitution);
router.patch('/admin/institutions/:id/publish', authMiddleware, roleMiddleware('admin'), educationController.publishInstitution);

module.exports = router;
