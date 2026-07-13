const bookingService = require('../services/bookings');
const { createNotification } = require('./notificationController');
const prisma = require('../config/db');

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.user.userId, req.body);

    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: booking.workerProfileId },
    });

    await createNotification(
      workerProfile.userId,
      'BOOKING_REQUESTED',
      'Nouvelle demande de réservation 📅',
      `Vous avez reçu une nouvelle demande de réservation pour "${workerProfile.headline}".`,
      `/my-space/bookings?tab=worker&highlight=${booking.id}`
    );

    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    if (['WORKER_PROFILE_UNAVAILABLE', 'SELF_BOOKING_FORBIDDEN'].includes(err.code)) {
      return res.status(400).json({ success: false, message: err.message });
    }
    console.error('[bookingController.createBooking]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyBookingsAsClient = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookingsAsClient(req.user.userId);
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[bookingController.getMyBookingsAsClient]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyBookingsAsWorker = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookingsAsWorker(req.user.userId);
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('[bookingController.getMyBookingsAsWorker]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const respondToBooking = async (req, res) => {
  try {
    const booking = await bookingService.respondToBooking(req.params.id, req.user.userId, req.body);

    await createNotification(
      booking.clientId,
      booking.status === 'ACCEPTED' ? 'BOOKING_ACCEPTED' : 'BOOKING_DECLINED',
      booking.status === 'ACCEPTED' ? 'Réservation acceptée ✅' : 'Réservation déclinée',
      booking.status === 'ACCEPTED'
        ? 'Votre demande de réservation a été acceptée.'
        : 'Votre demande de réservation a été déclinée.',
      `/my-space/bookings?tab=client&highlight=${booking.id}`
    );
    return res.json({ success: true, data: booking });
  } catch (err) {
    if (['NOT_FOUND', 'INVALID_STATE'].includes(err.code)) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
    console.error('[bookingController.respondToBooking]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const markBookingCompleted = async (req, res) => {
  try {
    const booking = await bookingService.markBookingCompleted(req.params.id, req.user.userId);
    return res.json({ success: true, data: booking });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message });
    if (err.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: err.message });
    if (err.code === 'INVALID_STATE') return res.status(400).json({ success: false, message: err.message });
    console.error('[bookingController.markBookingCompleted]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createBooking,
  getMyBookingsAsClient,
  getMyBookingsAsWorker,
  respondToBooking,
  markBookingCompleted,
};