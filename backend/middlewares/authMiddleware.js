const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, tokenVersion: true, role: { select: { name: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Session invalide" });
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Session expirée, veuillez vous reconnecter" });
    }

    req.user = { ...decoded, role: user.role.name };
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = authMiddleware;
