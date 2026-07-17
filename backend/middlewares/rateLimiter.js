const rateLimit = require('express-rate-limit');
// ── Réponse standard en cas de dépassement ────────────────────────────────────
const handler = (req, res) => {
  res.status(429).json({
    message: 'Trop de tentatives. Veuillez réessayer plus tard.',
    retryAfter: res.getHeader('Retry-After'),
  });
};
// ── AUTH — Login  ─────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── AUTH — Register  ──────────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── AUTH — Forgot Password  ──────────────────────────────────────────
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── LISTINGS — Création  ──────────────────────────────────────────────
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── CANDIDATURES — Apply  ─────────────────────────────────────────────
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── INQUIRIES — Contact propriétaire  ─────────────────────────────────
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── REPORTS — Signalement (strict) ───────────────────────────────────────────
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── CHAT — Messages  ──────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── MINI-JOBS — TaskRequest ────────────────────────────────────────────
const createTaskRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: 'Trop de demandes de tâches créées. Réessayez plus tard.',
  },
});
// ── MINI-JOBS — Booking ────────────────────────────────────────────────
const createBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Trop de réservations créées. Réessayez plus tard.',
  },
});
// ── MINI-JOBS — WorkerProfile ──────────────────────────────────────────
// (était référencé depuis la Phase 2 dans routes/workerProfiles.js mais
// jamais déclaré/exporté ici — la route importait donc `undefined` comme
// middleware. Ajouté maintenant.)
const createWorkerProfileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Trop de créations de profil prestataire. Réessayez plus tard.',
  },
});

const healthSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
// ── REVIEWS — Création d'avis ──────────────────────────────────────────
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Trop d'avis créés. Réessayez plus tard.",
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  createListingLimiter,
  applyLimiter,
  inquiryLimiter,
  reportLimiter,
  chatLimiter,
  // Ces deux étaient déjà déclarés (Phase 3) mais absents de cet objet
  // exports — les routes taskRequests.js / bookings.js recevaient donc
  // `undefined` comme middleware. Corrigé ici.
  createTaskRequestLimiter,
  createBookingLimiter,
  createWorkerProfileLimiter,
  healthSearchLimiter,
  reviewLimiter,
};
