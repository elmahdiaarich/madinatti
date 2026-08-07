const express = require('express')
const router = express.Router()
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  completeProfile,
  getMe,
  updateMe,
  googleLogin 
} = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')
const { upload } = require('../config/cloudinary')
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} = require('../middlewares/rateLimiter')

// Google auth
router.post('/google', googleLogin);

router.post('/register', registerLimiter, upload.single('companyLogo'), register)
router.post('/login',loginLimiter, login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/complete-profile', authMiddleware, upload.single('companyLogo'), completeProfile)

// ── /me ──────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, getMe)
router.patch('/me', authMiddleware, upload.single('avatar'), updateMe)

module.exports = router