// backend/routes/workerProfiles.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { createWorkerProfileLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/workerProfileController');

// ---------------- PUBLIC ----------------
router.get('/', controller.searchWorkerProfiles);

// ---------------- AUTHENTICATED (citizen) ----------------
// NOTE: '/mine' must come before '/:id' to avoid the wildcard catching it
router.get('/mine', authMiddleware, roleMiddleware('citizen'), controller.getMyWorkerProfiles);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('citizen'),
  createWorkerProfileLimiter,
  controller.createWorkerProfile
);

router.put('/:id', authMiddleware, roleMiddleware('citizen'), controller.updateWorkerProfile);
router.patch('/:id/active', authMiddleware, roleMiddleware('citizen'), controller.toggleActive);
router.delete('/:id', authMiddleware, roleMiddleware('citizen'), controller.deleteWorkerProfile);

// ---------------- ADMIN ----------------
// Intentionally none here. Moderation (list PENDING / approve / reject /
// suspend / unsuspend) is handled generically via:
//   GET   /api/admin/listings?module=miniJobs&status=PENDING
//   PATCH /api/admin/listings/:id/approve
//   PATCH /api/admin/listings/:id/reject
//   PATCH /api/admin/listings/:id/status   (body: { status, adminNotes, module: 'miniJobs' })
//   DELETE /api/admin/listings/:id
// See adminController.js MODULE_REGISTRY.miniJobs entry.

// ---------------- PUBLIC DETAIL — must be LAST ----------------
router.get('/:id', controller.getWorkerProfileById);

module.exports = router;