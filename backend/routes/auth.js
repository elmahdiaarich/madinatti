const express = require('express')
const router = express.Router()

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/authController')

const authMiddleware = require('../middlewares/authMiddleware')

const googleAuth = require('./googleAuth')

// mount google route properly
router.use('/', googleAuth)

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router