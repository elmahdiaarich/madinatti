const prisma = require('../config/db');

/**
 * Enregistre une vue pour une annonce :
 *  1. incrémente le compteur existant `viewsCount` (compatibilité avec l'existant)
 *  2. crée une entrée ListingView horodatée (permet les courbes temporelles)
 *
 * À appeler depuis les endpoints publics "get by id" de jobController.js
 * et realEstate.js (controller), à l'endroit où viewsCount était déjà incrémenté.
 *
 * @param {string} listingId
 * @param {"JOB"|"REAL_ESTATE"} listingType
 * @param {string|null} userId - null si visiteur anonyme
 */
const trackListingView = async (listingId, listingType, userId = null) => {
  try {
    const updateCount =
      listingType === 'JOB'
        ? prisma.jobListing.update({
            where: { id: listingId },
            data: { viewsCount: { increment: 1 } },
          })
        : prisma.realEstateListing.update({
            where: { id: listingId },
            data: { viewsCount: { increment: 1 } },
          });

    const logView = prisma.listingView.create({
      data: { listingId, listingType, userId },
    });

    await Promise.all([updateCount, logView]);
  } catch (err) {
    // On ne bloque jamais l'affichage de l'annonce si le tracking échoue
    console.error('trackListingView error:', err);
  }
};

module.exports = { trackListingView };