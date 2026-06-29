const express    = require('express')
const router     = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { createReport } = require('../controllers/reportController')
const { reportLimiter } = require('../middlewares/rateLimiter')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Ouvert à tous : visiteur anonyme ou utilisateur connecté
// authMiddleware est "soft" ici : on tente de décoder le token s'il est présent
// mais on ne bloque pas si absent
// ─────────────────────────────────────────────────────────────────────────────
const softAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  const jwt = require('jsonwebtoken')
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

router.post('/', reportLimiter, softAuth, createReport)

module.exports = router