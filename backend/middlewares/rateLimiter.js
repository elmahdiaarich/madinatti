const rateLimit = require('express-rate-limit');

// ── Réponse standard en cas de dépassement ────────────────────────────────────
const handler = (req, res) => {
  res.status(429).json({
    message: 'Trop de tentatives. Veuillez réessayer plus tard.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ── AUTH — Login (strict) ─────────────────────────────────────────────────────
// 5 tentatives par IP toutes les 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── AUTH — Register (modéré) ──────────────────────────────────────────────────
// 10 inscriptions par IP par heure
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── AUTH — Forgot Password (strict) ──────────────────────────────────────────
// 3 demandes par IP par heure (évite le spam d'emails)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── LISTINGS — Création (modéré) ──────────────────────────────────────────────
// 20 créations par IP par heure (jobs, real estate, cars)
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── CANDIDATURES — Apply (modéré) ─────────────────────────────────────────────
// 10 candidatures par IP par heure
const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── INQUIRIES — Contact propriétaire (modéré) ─────────────────────────────────
// 15 messages par IP par heure
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── REPORTS — Signalement (strict) ───────────────────────────────────────────
// 5 reports par IP par heure (anonymes inclus)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── CHAT — Messages (modéré) ──────────────────────────────────────────────────
// 20 messages par IP par heure
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
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
};