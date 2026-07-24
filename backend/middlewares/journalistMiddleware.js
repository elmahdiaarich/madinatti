const prisma = require('../config/db');

const journalistMiddleware = async (req, res, next) => {
  if (req.user.role !== 'journalist') {
    return res.status(403).json({ message: 'Accès réservé aux journalistes' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { journalistStatus: true },
  });

  if (!user || user.journalistStatus !== 'APPROVED') {
    return res.status(403).json({ message: 'Compte journaliste en attente de validation' });
  }

  next();
};

module.exports = journalistMiddleware;