const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  getFiltersCount,
  getJobCategories,
  createJob,
  toggleFavorite,
  getMyFavorites,
  getMyJobs, updateJob, deleteJob
} = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', getJobs);
router.get('/filters-count', getFiltersCount);
router.get('/categories', getJobCategories);

// ⚠️ /favorites/me AVANT /:id sinon Express croit que "favorites" est un :id
router.get('/favorites/me', authMiddleware, getMyFavorites);
router.get('/my', authMiddleware, roleMiddleware('business'), getMyJobs);
router.get('/:id', getJobById);

// ── Authentifié (citoyen ou business) ──────────────────────────────────────
router.post('/:id/favorite', authMiddleware, toggleFavorite);

// ── Business only ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('business'), createJob);
router.put('/:id', authMiddleware, roleMiddleware('business'), updateJob);
router.delete('/:id', authMiddleware, deleteJob);
module.exports = router;