const prisma = require('../config/db');

const VIEW_COOLDOWN_MINUTES = 30;

/**
 * Enregistre une vue pour une annonce, avec dédoublonnage :
 *  - un même visiteur (userId si connecté, sinon ipAddress) ne fait
 *    incrémenter le compteur qu'une fois par fenêtre de VIEW_COOLDOWN_MINUTES
 *    pour une même annonce.
 *  1. incrémente le compteur existant `viewsCount` (compatibilité avec l'existant)
 *  2. crée une entrée ListingView horodatée (permet les courbes temporelles)
 *
 * @param {string} listingId
 * @param {"JOB"|"REAL_ESTATE"|"CAR"} listingType
 * @param {string|null} userId - null si visiteur anonyme
 * @param {string|null} ipAddress - utilisé pour dédoublonner les visiteurs anonymes
 */
const trackListingView = async (listingId, listingType, userId = null, ipAddress = null) => {
  try {
    const counters = {
      JOB: prisma.jobListing,
      REAL_ESTATE: prisma.realEstateListing,
      CAR: prisma.carListing,
    };
    const model = counters[listingType];
    if (!model) return;

    const cooldownStart = new Date(Date.now() - VIEW_COOLDOWN_MINUTES * 60 * 1000);

    const visitorFilter = userId
      ? { userId }
      : ipAddress
        ? { ipAddress }
        : null;

    if (visitorFilter) {
      const recentView = await prisma.listingView.findFirst({
        where: {
          listingId,
          listingType,
          ...visitorFilter,
          viewedAt: { gte: cooldownStart },
        },
        select: { id: true },
      });
      if (recentView) return; // déjà comptée récemment, on ignore
    }

    const updateCount = model.update({
      where: { id: listingId },
      data: { viewsCount: { increment: 1 } },
    });

    const logView = prisma.listingView.create({
      data: { listingId, listingType, userId, ipAddress: userId ? null : ipAddress },
    });

    await Promise.all([updateCount, logView]);
  } catch (err) {
    console.error('trackListingView error:', err);
  }
};

module.exports = { trackListingView };