const express = require('express')
const router = express.Router()
const { register, login, logout,forgotPassword,resetPassword } = require('../controllers/authController')
const authMiddleware = require('../middlewares/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router