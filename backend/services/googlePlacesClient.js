const axios = require('axios');

const BASE_URL = 'https://places.googleapis.com/v1';
const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.businessStatus',
  'places.googleMapsUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.currentOpeningHours',
  'places.regularOpeningHours',
  'places.rating',
  'places.userRatingCount',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'addressComponents',
  'location',
  'types',
  'primaryType',
  'businessStatus',
  'googleMapsUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'currentOpeningHours',
  'regularOpeningHours',
  'rating',
  'userRatingCount',
].join(',');

const cache = new Map();

function getConfig() {
  return {
    key: process.env.GOOGLE_MAPS_SERVER_API_KEY,
    ttlMs: Number(process.env.GOOGLE_PLACES_CACHE_TTL_SECONDS || 900) * 1000,
    timeout: Number(process.env.GOOGLE_PLACES_REQUEST_TIMEOUT_MS || 5000),
  };
}

function cacheKey(kind, payload) {
  return `${kind}:${JSON.stringify(payload)}`;
}

async function cached(kind, payload, fn) {
  const { ttlMs } = getConfig();
  const key = cacheKey(kind, payload);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

function headers(fieldMask) {
  const { key } = getConfig();
  if (!key) {
    const err = new Error('Google Places server key is not configured.');
    err.code = 'GOOGLE_PLACES_NOT_CONFIGURED';
    throw err;
  }
  return {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key,
    'X-Goog-FieldMask': fieldMask,
  };
}

async function searchNearby({ lat, lng, radius, types = [], openNow = false, limit = 20 }) {
  const body = {
    maxResultCount: Math.min(20, limit),
    rankPreference: 'DISTANCE',
    includedTypes: types.length ? types : undefined,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };
  if (openNow) body.openNow = true;

  return cached('nearby', body, async () => {
    const { timeout } = getConfig();
    const response = await axios.post(`${BASE_URL}/places:searchNearby`, body, {
      headers: headers(SEARCH_FIELD_MASK),
      timeout,
    });
    return response.data?.places || [];
  });
}

async function searchText({ textQuery, lat, lng, radius, openNow = false, limit = 20 }) {
  const body = {
    textQuery,
    maxResultCount: Math.min(20, limit),
    languageCode: 'fr',
    regionCode: 'MA',
    openNow: openNow || undefined,
  };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    };
  }

  return cached('text', body, async () => {
    const { timeout } = getConfig();
    const response = await axios.post(`${BASE_URL}/places:searchText`, body, {
      headers: headers(SEARCH_FIELD_MASK),
      timeout,
    });
    return response.data?.places || [];
  });
}

async function getDetails(placeId) {
  return cached('details', { placeId }, async () => {
    const { timeout } = getConfig();
    const response = await axios.get(`${BASE_URL}/places/${encodeURIComponent(placeId)}`, {
      headers: headers(DETAILS_FIELD_MASK),
      timeout,
      params: { languageCode: 'fr', regionCode: 'MA' },
    });
    return response.data;
  });
}

function clearGooglePlacesCache() {
  cache.clear();
}

module.exports = {
  searchNearby,
  searchText,
  getDetails,
  clearGooglePlacesCache,
  SEARCH_FIELD_MASK,
  DETAILS_FIELD_MASK,
};
