const express = require('express')
const router = express.Router()

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  completeProfile,
} = require('../controllers/authController')

const authMiddleware = require('../middlewares/authMiddleware')

const googleAuth = require('./googleAuth')

const { getMe } = require('../controllers/authController');
const { upload } = require('../config/cloudinary')

// mount google route properly
router.use('/', googleAuth)
router.post('/register', upload.single('companyLogo'), register)

router.post('/register', register)
router.post('/login', login)
router.post('/logout', authMiddleware, logout)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/complete-profile', authMiddleware, upload.single('companyLogo'), completeProfile)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router