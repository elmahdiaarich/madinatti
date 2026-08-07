const {
  EDUCATION_SECTOR_VALUES,
  EDUCATION_TYPE_BY_SLUG,
  EDUCATION_TYPE_VALUES,
} = require('../config/educationConstants');

const VALID_SORT_FIELDS = ['name', 'city', 'region', 'updatedAt', 'createdAt'];

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampLimit(value, fallback = 20) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, n));
}

function normalizeType(value) {
  if (!value) return undefined;
  const upper = String(value).trim().toUpperCase();
  return EDUCATION_TYPE_VALUES.includes(upper) ? upper : EDUCATION_TYPE_BY_SLUG[String(value).trim()] || undefined;
}

function normalizeSector(value) {
  if (!value) return undefined;
  const upper = String(value).trim().toUpperCase();
  return EDUCATION_SECTOR_VALUES.includes(upper) ? upper : undefined;
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function validateInstitutionSearch(query = {}) {
  const errors = {};
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = clampLimit(query.limit);
  const type = normalizeType(query.type || query.institutionType);
  const sector = normalizeSector(query.sector);
  const sort = VALID_SORT_FIELDS.includes(query.sort) ? query.sort : 'updatedAt';
  const order = String(query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

  if ((query.type || query.institutionType) && !type) errors.type = 'Type Education invalide.';
  if (query.sector && !sector) errors.sector = 'Secteur invalide.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      page,
      limit,
      sort,
      order,
      search: typeof query.search === 'string' ? query.search.trim() : '',
      city: typeof query.city === 'string' ? query.city.trim() : '',
      region: typeof query.region === 'string' ? query.region.trim() : '',
      province: typeof query.province === 'string' ? query.province.trim() : '',
      type,
      sector,
      featured: query.featured === 'true' || query.featured === true,
      published:
        query.published === undefined || query.published === ''
          ? undefined
          : query.published === 'true' || query.published === true,
    },
  };
}

function validateInstitutionPayload(body = {}, { partial = false } = {}) {
  const errors = {};
  const type = normalizeType(body.institutionType);
  const sector = normalizeSector(body.sector);
  const lat = toNumber(body.latitude);
  const lng = toNumber(body.longitude);
  const hasLat = body.latitude !== undefined && body.latitude !== null && body.latitude !== '';
  const hasLng = body.longitude !== undefined && body.longitude !== null && body.longitude !== '';

  if (!partial || body.name !== undefined) {
    if (!body.name || String(body.name).trim().length < 2) errors.name = 'Nom requis.';
  }
  if (!partial || body.institutionType !== undefined) {
    if (!type) errors.institutionType = 'Type Education invalide.';
  }
  if (!partial || body.sector !== undefined) {
    if (!sector) errors.sector = 'Secteur invalide.';
  }
  if ((body.latitude !== undefined || body.longitude !== undefined) && (hasLat || hasLng)) {
    if (hasLat !== hasLng || lat === null || lng === null) errors.location = 'Latitude et longitude valides requises.';
    if (lat !== null && (lat < -90 || lat > 90)) errors.latitude = 'Latitude invalide.';
    if (lng !== null && (lng < -180 || lng > 180)) errors.longitude = 'Longitude invalide.';
  }

  ['website', 'facebookUrl', 'instagramUrl', 'linkedinUrl', 'sourceUrl', 'logoUrl', 'coverImageUrl'].forEach((field) => {
    if (body[field] && !isValidUrl(String(body[field]).trim())) errors[field] = 'URL invalide.';
  });
  if (body.email && !isValidEmail(body.email)) errors.email = 'Email invalide.';

  return { valid: Object.keys(errors).length === 0, errors, value: { type, sector } };
}

module.exports = {
  validateInstitutionSearch,
  validateInstitutionPayload,
  normalizeType,
  normalizeSector,
  toNumber,
  clampLimit,
};
