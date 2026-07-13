// backend/utils/touristicValidator.js
const PHONE_RE = /^(\+212|0)(5|6|7)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

const DOC_DISPLAY_TYPES = ['pdf', 'map'];
const DOC_CATEGORY_SLUGS = ['magazine', 'carte-touristique'];

function isDocCategory(category) {
  return (
    DOC_DISPLAY_TYPES.includes(category?.displayType) ||
    DOC_CATEGORY_SLUGS.includes(category?.slug)
  );
}

/**
 * Validates a create/update payload for TouristicListing.
 * `category` should be the full Category row (needed to know whether a
 * PDF is required) — fetch it before calling this if it's not already
 * attached to the request.
 *
 * Returns { valid: boolean, errors: { [field]: message } }.
 * `isUpdate` relaxes required-field checks to only apply when the field is
 * actually present in the payload (so partial PATCH-style updates aren't
 * forced to resend everything).
 */
function validateTouristicPayload(data, category, { isUpdate = false } = {}) {
  const errors = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);

  if ((!isUpdate || has('name')) && !data.name?.trim()) {
    errors.name = 'Le nom est requis.';
  }
  if (!isUpdate && !data.categoryId) {
    errors.categoryId = 'La catégorie est requise.';
  }
  if ((!isUpdate || has('city')) && !data.city) {
    errors.city = 'La ville est requise.';
  }

  if (has('contactPhone') && data.contactPhone) {
    if (!PHONE_RE.test(String(data.contactPhone).replace(/\s/g, ''))) {
      errors.contactPhone = 'Numéro de téléphone invalide.';
    }
  }
  if (has('contactEmail') && data.contactEmail) {
    if (!EMAIL_RE.test(data.contactEmail)) {
      errors.contactEmail = 'Email invalide.';
    }
  }

  if (has('latitude') && data.latitude !== null && data.latitude !== '') {
    const lat = parseFloat(data.latitude);
    if (Number.isNaN(lat) || lat < 20 || lat > 36) {
      errors.latitude = 'Latitude hors des limites du Maroc.';
    }
  }
  if (has('longitude') && data.longitude !== null && data.longitude !== '') {
    const lng = parseFloat(data.longitude);
    if (Number.isNaN(lng) || lng < -18 || lng > 0) {
      errors.longitude = 'Longitude hors des limites du Maroc.';
    }
  }

  if (isDocCategory(category)) {
    if (!isUpdate || has('fileUrl')) {
      if (!data.fileUrl || !URL_RE.test(String(data.fileUrl).trim())) {
        errors.fileUrl = 'Une URL de document PDF valide est requise pour cette catégorie.';
      }
    }
  }

  if (has('images') && data.images && !Array.isArray(data.images)) {
    errors.images = 'Format des images invalide.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = { validateTouristicPayload, isDocCategory };