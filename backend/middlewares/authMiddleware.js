const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    // console.log("user: " , req.user)
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' })
  }
}

module.exports = authMiddleware