// backend/routes/taskApplications.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const controller = require('../controllers/taskApplicationController');

// All routes require authentication + citizen role (both applying and
// managing applications are citizen-only actions — see decisions doc).

// Worker applies to a specific TaskRequest
router.post(
  '/task-requests/:taskRequestId/apply',
  authMiddleware,
  roleMiddleware('citizen'),
  controller.applyToTaskRequest
);

// Client views all applications received on their own TaskRequest
router.get(
  '/task-requests/:taskRequestId/applications',
  authMiddleware,
  roleMiddleware('citizen'),
  controller.getApplicationsForTaskRequest
);

// Client accepts a specific application
router.patch(
  '/:id/accept',
  authMiddleware,
  roleMiddleware('citizen'),
  controller.acceptApplication
);

module.exports = router;

// NOTE: mounted at /api/task-applications in server.js, so the full paths are:
//   POST   /api/task-applications/task-requests/:taskRequestId/apply
//   GET    /api/task-applications/task-requests/:taskRequestId/applications
//   PATCH  /api/task-applications/:id/accept