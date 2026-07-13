// backend/services/reviews.js
const prisma = require('../config/db');

// ── Tunable knobs ────────────────────────────────────────────────────────────
// Decision doc left this as "2 or 5 days, either defensible" — picked 5 for a
// bit more anti-burner-account margin. Easy to change, single source of truth.
const REVIEW_ACCOUNT_AGE_DAYS = 5;

// Only WORKER_PROFILE exists today (mini-jobs). Both Model A (Booking) and
// Model B (TaskApplication) reviews target it. Future verticals (hotels,
// pharmacy, santé) will add their own ReviewTargetType values here, and those
// won't have a transaction record to gate on (see decisions doc 1.9) — that
// exemption is intentionally NOT implemented yet since no such target exists.
const GATED_TARGET_TYPES = ['WORKER_PROFILE'];

// ────────────────────────────────────────────────────────────────────────────
// RATING RECALCULATION
// Shared so reportController.js can call it too after a moderated deletion.
// ────────────────────────────────────────────────────────────────────────────

async function recalcWorkerProfileRating(workerProfileId) {
  const agg = await prisma.review.aggregate({
    where: { targetType: 'WORKER_PROFILE', targetId: workerProfileId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// CREATE
// ────────────────────────────────────────────────────────────────────────────

async function createReview(userId, data) {
  const { targetType, targetId, rating, comment, bookingId, taskApplicationId } = data;

  // ── Basic validation ────────────────────────────────────────────────────
  const rNum = Number(rating);
  if (!Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
    const err = new Error('La note doit être un entier entre 1 et 5');
    err.code = 'RATING_INVALID';
    throw err;
  }

  if (!targetType || !targetId) {
    const err = new Error('targetType et targetId sont requis');
    err.code = 'MISSING_TARGET';
    throw err;
  }

// ── Account-age gate ────────────────────────────────────────────────────
  // Skipped for GATED_TARGET_TYPES (currently: WORKER_PROFILE) — those
  // reviews already require a real completed Booking/TaskApplication as
  // proof of a legitimate interaction (see completion gate below), which is
  // stronger evidence than account age. The age gate stays reserved for
  // future non-gated target types (hotels, pharmacie, santé...) that won't
  // have a transaction record to check against.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!GATED_TARGET_TYPES.includes(targetType)) {
    const minAge = new Date(Date.now() - REVIEW_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000);
    if (user.createdAt > minAge) {
      const err = new Error(
        `Votre compte doit avoir au moins ${REVIEW_ACCOUNT_AGE_DAYS} jours pour laisser un avis`
      );
      err.code = 'ACCOUNT_TOO_NEW';
      throw err;
    }
  }

  // ── Completion gate (mandatory for every currently-existing targetType) ──
  let bookingRef = null;
  let taskApplicationRef = null;

  if (GATED_TARGET_TYPES.includes(targetType)) {
    if (!bookingId && !taskApplicationId) {
      const err = new Error(
        "Un avis pour ce type de cible doit être lié à une réservation ou une candidature terminée"
      );
      err.code = 'MISSING_REFERENCE';
      throw err;
    }
    if (bookingId && taskApplicationId) {
      const err = new Error('Fournissez soit bookingId, soit taskApplicationId, pas les deux');
      err.code = 'AMBIGUOUS_REFERENCE';
      throw err;
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        const err = new Error('Réservation introuvable');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (booking.clientId !== userId) {
        const err = new Error("Cette réservation ne vous appartient pas");
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (booking.workerProfileId !== targetId) {
        const err = new Error("Cette réservation ne correspond pas au profil ciblé");
        err.code = 'TARGET_MISMATCH';
        throw err;
      }
      if (booking.status !== 'COMPLETED') {
        const err = new Error('Seule une réservation terminée peut être notée');
        err.code = 'NOT_COMPLETED';
        throw err;
      }
      bookingRef = booking;
    }

    if (taskApplicationId) {
      const application = await prisma.taskApplication.findUnique({
        where: { id: taskApplicationId },
        include: { taskRequest: true },
      });
      if (!application) {
        const err = new Error('Candidature introuvable');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (application.taskRequest.userId !== userId) {
        const err = new Error("Cette candidature ne concerne pas une de vos demandes");
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (application.workerProfileId !== targetId) {
        const err = new Error("Cette candidature ne correspond pas au profil ciblé");
        err.code = 'TARGET_MISMATCH';
        throw err;
      }
      if (application.status !== 'ACCEPTED' || application.taskRequest.status !== 'COMPLETED') {
        const err = new Error('Seule une tâche terminée avec candidature acceptée peut être notée');
        err.code = 'NOT_COMPLETED';
        throw err;
      }
      taskApplicationRef = application;
    }
  }

  // ── Create ──────────────────────────────────────────────────────────────
  let review;
  try {
    review = await prisma.review.create({
      data: {
        targetType,
        targetId,
        userId,
        rating: rNum,
        comment: comment?.trim() || null,
        bookingId: bookingRef ? bookingRef.id : null,
        taskApplicationId: taskApplicationRef ? taskApplicationRef.id : null,
        isVerified: Boolean(bookingRef || taskApplicationRef),
      },
    });
  } catch (err) {
    // @@unique([userId, targetId, targetType]) OR bookingId/taskApplicationId @unique
    if (err.code === 'P2002') {
      const dupErr = new Error('Vous avez déjà laissé un avis pour cet élément');
      dupErr.code = 'ALREADY_REVIEWED';
      throw dupErr;
    }
    throw err;
  }

  if (targetType === 'WORKER_PROFILE') {
    await recalcWorkerProfileRating(targetId);
  }

  return review;
}

// ────────────────────────────────────────────────────────────────────────────
// READ — public
// ────────────────────────────────────────────────────────────────────────────

async function getReviewsForTarget(targetType, targetId, { page = 1, limit = 10 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total, agg] = await Promise.all([
    prisma.review.findMany({
      where: { targetType, targetId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({ where: { targetType, targetId } }),
    prisma.review.aggregate({
      where: { targetType, targetId },
      _avg: { rating: true },
    }),
  ]);

  return {
    items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    ratingAvg: agg._avg.rating ?? 0,
    ratingCount: total,
  };
}

module.exports = {
  REVIEW_ACCOUNT_AGE_DAYS,
  createReview,
  getReviewsForTarget,
  recalcWorkerProfileRating,
};