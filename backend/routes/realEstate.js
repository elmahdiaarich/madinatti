const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ctrl           = require('../controllers/realEstate');

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.get('/',     ctrl.getListings);
router.get('/:id',  ctrl.getListingById);

// ── AUTHENTICATED (any role) ──────────────────────────────────────────────────
router.post('/inquiries',             authMiddleware, ctrl.createInquiry);
router.get('/favorites/me',           authMiddleware, ctrl.getUserFavorites);
router.post('/favorites/:id/toggle',  authMiddleware, ctrl.toggleFavorite);

// ── BUSINESS ONLY ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('business'), ctrl.createListing);

// ── ADMIN ONLY ────────────────────────────────────────────────────────────────
router.get('/admin/pending',          authMiddleware, roleMiddleware('admin'), ctrl.getPendingListings);
router.patch('/admin/:id/moderate',   authMiddleware, roleMiddleware('admin'), ctrl.moderateListing);

module.exports = router;