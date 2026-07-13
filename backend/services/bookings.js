// backend/services/bookings.js
const prisma = require('../config/db');

async function createBooking(clientId, data) {
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { id: data.workerProfileId },
  });

  if (!workerProfile || workerProfile.status !== 'APPROVED' || !workerProfile.isActive) {
    const err = new Error('Profil prestataire indisponible');
    err.code = 'WORKER_PROFILE_UNAVAILABLE';
    throw err;
  }

  if (workerProfile.userId === clientId) {
    const err = new Error('Vous ne pouvez pas vous réserver vous-même');
    err.code = 'SELF_BOOKING_FORBIDDEN';
    throw err;
  }

  return prisma.booking.create({
    data: {
      workerProfileId: data.workerProfileId,
      clientId,
      taskDescription: data.taskDescription,
      requestedDate: new Date(data.requestedDate),
      estimatedHours: data.estimatedHours ?? null,
      clientPhone: data.clientPhone ?? null,
      status: 'PENDING',
    },
  });
}

// Bookings where the user is the CLIENT (they hired someone)
async function getMyBookingsAsClient(clientId) {
  return prisma.booking.findMany({
    where: { clientId },
    include: {
      workerProfile: {
        select: {
          id: true, headline: true, photo: true,
          category: true,
          user: { select: { id: true, name: true, phone: true } },
        },
      },
      review: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Bookings received on the user's own WorkerProfile(s) (they're the worker)
async function getMyBookingsAsWorker(userId) {
  return prisma.booking.findMany({
    where: { workerProfile: { userId } },
    include: {
      workerProfile: { select: { id: true, headline: true } },
      client: { select: { id: true, name: true, phone: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function respondToBooking(bookingId, workerUserId, { accept, workerNote }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { workerProfile: true },
  });

  if (!booking || booking.workerProfile.userId !== workerUserId) {
    const err = new Error('Réservation introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (booking.status !== 'PENDING') {
    const err = new Error('Cette réservation a déjà été traitée');
    err.code = 'INVALID_STATE';
    throw err;
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: accept ? 'ACCEPTED' : 'DECLINED',
      workerNote: workerNote ?? null,
    },
  });
}

async function markBookingCompleted(bookingId, requesterId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { workerProfile: true },
  });

  if (!booking) {
    const err = new Error('Réservation introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Either the client or the worker can mark it completed
  const isClient = booking.clientId === requesterId;
  const isWorker = booking.workerProfile.userId === requesterId;
  if (!isClient && !isWorker) {
    const err = new Error('Action non autorisée');
    err.code = 'FORBIDDEN';
    throw err;
  }

  if (booking.status !== 'ACCEPTED') {
    const err = new Error('Seule une réservation acceptée peut être marquée terminée');
    err.code = 'INVALID_STATE';
    throw err;
  }

  return prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
}

module.exports = {
  createBooking,
  getMyBookingsAsClient,
  getMyBookingsAsWorker,
  respondToBooking,
  markBookingCompleted,
};