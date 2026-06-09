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
  updateMe 
} = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')
const googleAuth = require('./googleAuth')
const { upload } = require('../config/cloudinary')

// Google auth
router.use('/', googleAuth)

router.post('/register', upload.single('companyLogo'), register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/complete-profile', authMiddleware, upload.single('companyLogo'), completeProfile)

// ── /me — utilise le controller qui retourne le role correctement ──
router.get('/me', authMiddleware, getMe)
router.patch('/me', authMiddleware, upload.single('avatar'), updateMe)

module.exports = router