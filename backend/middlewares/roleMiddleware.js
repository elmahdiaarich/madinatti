const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    console.log("role: ",roles);
    console.log("user role: ",req.user.role);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    next()
  }
}

module.exports = roleMiddleware