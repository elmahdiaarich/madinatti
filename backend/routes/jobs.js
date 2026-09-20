const express = require('express');
const router  = express.Router();
const {
  getJobs,
  getJobById,
  getFiltersCount,
  getJobCategories,
  createJob,
  applyToJob,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications,
  toggleFavorite,
  getMyFavorites,
  getMyJobs,
  updateJob,
  deleteJob,
  getBusinessApplications
} = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { upload } = require('../config/cloudinary');
const { createListingLimiter, applyLimiter } = require('../middlewares/rateLimiter');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/',              getJobs);
router.get('/filters-count', getFiltersCount);
router.get('/categories',    getJobCategories);

// ⚠️ Routes fixes AVANT /:id pour éviter les conflits Express
router.get('/favorites/me',      authMiddleware, getMyFavorites);
router.get('/my',                authMiddleware, roleMiddleware('business'), getMyJobs);

// ── CV download proxy (AVANT /:id) ───────────────────────────────────────────
router.get('/cv/download', authMiddleware, require('../controllers/cvController').downloadCv);
router.get('/applications/my', authMiddleware, roleMiddleware('citizen'), getMyApplications);

router.get('/my-applications', authMiddleware, roleMiddleware('business'), getBusinessApplications);

// ── Candidature (citoyen) ────────────────────────────────────────────────────
router.post('/:id/apply', applyLimiter, authMiddleware, roleMiddleware('citizen'), upload.single('cv'), applyToJob);

// ── Candidatures d'une offre (business) ─────────────────────────────────────
router.get( '/:id/applications', authMiddleware, roleMiddleware('business'), getJobApplications);

// ── Changer statut d'une candidature (business) ──────────────────────────────
router.patch('/applications/:appId/status', authMiddleware, roleMiddleware('business'), updateApplicationStatus);

// ── Détail d'une offre ───────────────────────────────────────────────────────
router.get('/:id', getJobById);

// ── Authentifié (citoyen ou business) ───────────────────────────────────────
router.post('/:id/favorite', authMiddleware, toggleFavorite);

// ── Business only ────────────────────────────────────────────────────────────
router.post('/',    createListingLimiter, authMiddleware, roleMiddleware('business'), createJob);
router.put('/:id',  authMiddleware, roleMiddleware('business'), updateJob);
router.delete('/:id', authMiddleware, deleteJob);

module.exports = router;
