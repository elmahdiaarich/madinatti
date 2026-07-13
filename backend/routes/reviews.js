// backend/routes/reviews.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { reviewLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/reviewController');

// ---------------- PUBLIC ----------------
// GET /api/reviews?targetType=WORKER_PROFILE&targetId=<id>&page=&limit=
router.get('/', controller.getReviewsForTarget);

// ---------------- AUTHENTICATED (citizen) ----------------
// The reviewer is always the client side of a Booking or TaskRequest, both
// of which are citizen-only flows (see decisions 1.1/1.6) — restricting to
// citizen here rather than leaving it open to any authenticated role.
router.post('/', authMiddleware, roleMiddleware('citizen'), reviewLimiter, controller.createReview);

module.exports = router;

// NOTE: already mounted in server.js as:
//   app.use('/api/reviews', require('./routes/reviews'));