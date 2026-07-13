const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { createTaskRequestLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/taskRequestController');

// ---------------- SOFT AUTH ----------------
// Same pattern as reports.js: decode the token if present, but never
// block the request if it's missing/invalid. Needed so the public
// search endpoint can apply category-priority sorting for logged-in
// viewers while still working for guests.
function softAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

// ---------------- PUBLIC (soft auth) ----------------
router.get('/', softAuth, controller.searchTaskRequests);

// ---------------- AUTHENTICATED (citizen) ----------------
router.get('/mine', authMiddleware, roleMiddleware('citizen'), controller.getMyTaskRequests);

router.post(
  '/',
  authMiddleware,
  roleMiddleware('citizen'),
  createTaskRequestLimiter,
  controller.createTaskRequest
);

router.patch('/:id/complete', authMiddleware, roleMiddleware('citizen'), controller.markCompleted);
router.patch('/:id/cancel-acceptance', authMiddleware, roleMiddleware('citizen'), controller.cancelAcceptance);

// ---------------- ADMIN ----------------
// No dedicated admin routes here. TaskRequest publishes immediately (no
// PENDING) — moderation is reactive via the Report pipeline. See the
// admin integration notes (Option A) for how suspension/deletion of a
// reported TaskRequest is handled.

// ---------------- PUBLIC DETAIL — must be LAST ----------------
router.get('/:id', controller.getTaskRequestById);

module.exports = router;