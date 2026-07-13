// backend/routes/bookings.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { createBookingLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/bookingController');

// All booking routes require authentication (no public routes here)
router.post('/', authMiddleware, createBookingLimiter, controller.createBooking);
router.get('/mine/as-client', authMiddleware, controller.getMyBookingsAsClient);
router.get('/mine/as-worker', authMiddleware, controller.getMyBookingsAsWorker);
router.patch('/:id/respond', authMiddleware, controller.respondToBooking); // body: { accept: bool, workerNote? }
router.patch('/:id/complete', authMiddleware, controller.markBookingCompleted);

module.exports = router;