const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  getFiltersCount,
  createJob,
  toggleFavorite,
  getMyFavorites,
} = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/', getJobs);
router.get('/filters-count', getFiltersCount);

// ⚠️ /favorites/me AVANT /:id sinon Express croit que "favorites" est un :id
router.get('/favorites/me', authMiddleware, getMyFavorites);

router.get('/:id', getJobById);

// ── Authentifié (citoyen ou business) ──────────────────────────────────────
router.post('/:id/favorite', authMiddleware, toggleFavorite);

// ── Business only ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('business'), createJob);

module.exports = router;