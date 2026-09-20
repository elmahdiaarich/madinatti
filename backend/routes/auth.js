const express = require('express')
const router = express.Router()
const {
  register, login, logout, logoutAll, forgotPassword,
  resetPassword, completeProfile, getMe, updateMe, googleLogin,
} = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')
const { upload } = require('../config/cloudinary')
const {
  loginLimiter, registerLimiter, forgotPasswordLimiter, updatePasswordLimiter,
} = require('../middlewares/rateLimiter')

router.post('/google', googleLogin);
router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
router.post('/logout', authMiddleware, logout)
router.post('/logout-all', authMiddleware, logoutAll)
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword)
router.post('/reset-password', forgotPasswordLimiter, resetPassword)
router.post('/complete-profile', authMiddleware, upload.single('avatar'), completeProfile)

router.get('/me', authMiddleware, getMe)
router.patch('/me', authMiddleware, updatePasswordLimiter, upload.single('avatar'), updateMe)

module.exports = router
