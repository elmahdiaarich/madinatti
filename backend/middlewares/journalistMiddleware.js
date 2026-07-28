const prisma = require('../config/db');

// Les comptes journalistes sont créés directement par l'admin (staff de confiance).
// Vérifie aussi canPublish : l'admin peut suspendre la publication d'un
// journaliste sans désactiver tout son compte (accès/consultation restent possibles).
const journalistMiddleware = async (req, res, next) => {
  if (req.user.role !== 'journalist') {
    return res.status(403).json({ message: 'Accès réservé aux journalistes' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { canPublish: true },
  });

  if (!user || !user.canPublish) {
    return res.status(403).json({ message: 'Votre droit de publication a été suspendu par un administrateur.' });
  }

  next();
};

module.exports = journalistMiddleware;