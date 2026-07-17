const { HEALTH_SUBCATEGORY_MAP } = require('../config/healthCategories');
const { isMoroccoCoordinate, toNumber } = require('./healthGeo');

const MAX_RADIUS = Number(process.env.HEALTH_SEARCH_MAX_RADIUS_METERS || 50000);

function clampLimit(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return 20;
  return Math.min(50, Math.max(1, n));
}

function validatePlaceSearch(query) {
  const errors = {};
  const lat = toNumber(query.lat);
  const lng = toNumber(query.lng);
  const hasLat = query.lat !== undefined && query.lat !== '';
  const hasLng = query.lng !== undefined && query.lng !== '';
  const radius = toNumber(query.radius) || 5000;
  const limit = clampLimit(query.limit);
  const subcategory = query.subcategory || undefined;

  if (hasLat !== hasLng) errors.location = 'lat et lng doivent etre fournis ensemble.';
  if (hasLat && (lat === null || lat < -90 || lat > 90)) errors.lat = 'Latitude invalide.';
  if (hasLng && (lng === null || lng < -180 || lng > 180)) errors.lng = 'Longitude invalide.';
  if (lat !== null && lng !== null && !isMoroccoCoordinate(lat, lng)) {
    errors.location = 'Les coordonnees doivent etre situees au Maroc.';
  }
  if (radius <= 0 || radius > MAX_RADIUS) {
    errors.radius = `Le rayon doit etre compris entre 1 et ${MAX_RADIUS} metres.`;
  }
  if (subcategory && !HEALTH_SUBCATEGORY_MAP[subcategory]) {
    errors.subcategory = 'Sous-categorie Sante inconnue.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      lat,
      lng,
      radius,
      limit,
      city: typeof query.city === 'string' ? query.city.trim() : '',
      query: typeof query.query === 'string' ? query.query.trim() : '',
      subcategory,
      openNow: query.openNow === 'true' || query.openNow === true,
    },
  };
}

function validatePlacePayload(body, { partial = false } = {}) {
  const errors = {};
  const subcategory = body.subcategory;
  const lat = toNumber(body.latitude);
  const lng = toNumber(body.longitude);

  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) errors.name = 'Nom requis.';
  }
  if (!partial || body.subcategory !== undefined) {
    if (!HEALTH_SUBCATEGORY_MAP[subcategory]) errors.subcategory = 'Sous-categorie Sante inconnue.';
  }
  if ((body.latitude !== undefined || body.longitude !== undefined) && (lat === null || lng === null)) {
    errors.location = 'Latitude et longitude valides requises.';
  }
  if (lat !== null && lng !== null && !isMoroccoCoordinate(lat, lng)) {
    errors.location = 'Les coordonnees doivent etre situees au Maroc.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  validatePlaceSearch,
  validatePlacePayload,
  clampLimit,
};
