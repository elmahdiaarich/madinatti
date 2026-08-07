const SHOP_STATUSES = ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'CLOSED'];
const SHOP_SUBSCRIPTION_STATUSES = ['PENDING', 'TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'];

function isSafeUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateShopPayload(body, { partial = false } = {}) {
  const errors = {};
  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) errors.name = 'Nom de boutique requis.';
  }
  if (!partial || body.description !== undefined) {
    if (!body.description || String(body.description).trim().length < 20) errors.description = 'Description requise.';
  }
  if (!partial || body.city !== undefined) {
    if (!body.city || String(body.city).trim().length < 2) errors.city = 'Ville requise.';
  }
  if (!partial || body.professionalPhone !== undefined) {
    if (!body.professionalPhone || String(body.professionalPhone).trim().length < 6) errors.professionalPhone = 'Telephone professionnel requis.';
  }
  if (body.professionalEmail && !String(body.professionalEmail).includes('@')) errors.professionalEmail = 'Email professionnel invalide.';
  if (body.website && !isSafeUrl(body.website)) errors.website = 'Site internet invalide.';
  if (body.logo && !isSafeUrl(body.logo)) errors.logo = 'Logo invalide.';
  if (body.coverImage && !isSafeUrl(body.coverImage)) errors.coverImage = 'Image de couverture invalide.';
  if (body.status !== undefined && !SHOP_STATUSES.includes(body.status)) errors.status = 'Statut boutique invalide.';
  if (body.subscriptionStatus !== undefined && !SHOP_SUBSCRIPTION_STATUSES.includes(body.subscriptionStatus)) {
    errors.subscriptionStatus = 'Statut abonnement invalide.';
  }
  if (!partial || body.planId !== undefined) {
    if (!body.planId) errors.planId = 'Formule requise.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  SHOP_STATUSES,
  SHOP_SUBSCRIPTION_STATUSES,
  validateShopPayload,
};
