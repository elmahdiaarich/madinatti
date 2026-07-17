const test = require('node:test');
const assert = require('node:assert/strict');

process.env.GOOGLE_MAPS_SERVER_API_KEY = 'test-key';
process.env.GOOGLE_PLACES_CACHE_TTL_SECONDS = '60';
process.env.GOOGLE_PLACES_REQUEST_TIMEOUT_MS = '200';

const axios = require('axios');
const { validatePlaceSearch } = require('../utils/healthValidator');
const { normalizeGooglePlace, normalizeOpeningHours } = require('../services/healthPlaceNormalizer');
const { dedupePlaces } = require('../services/healthPlaces');
const googlePlaces = require('../services/googlePlacesClient');

test('validates latitude, longitude, radius and subcategory', () => {
  const bad = validatePlaceSearch({
    lat: '99',
    lng: '-7',
    radius: '90000',
    subcategory: 'unknown',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.lat);
  assert.ok(bad.errors.radius);
  assert.ok(bad.errors.subcategory);

  const good = validatePlaceSearch({
    lat: '33.5731',
    lng: '-7.5898',
    radius: '5000',
    subcategory: 'pharmacy',
    openNow: 'true',
  });
  assert.equal(good.valid, true);
  assert.equal(good.value.openNow, true);
});

test('normalizes Google place payloads with missing and 24h hours', () => {
  const normalized = normalizeGooglePlace({
    id: 'place-1',
    displayName: { text: 'Pharmacie Test' },
    formattedAddress: 'Casablanca, Maroc',
    location: { latitude: 33.57, longitude: -7.58 },
    types: ['pharmacy'],
    currentOpeningHours: {
      openNow: true,
      weekdayDescriptions: ['lundi: Ouvert 24h/24'],
      periods: [{ open: { day: 1, hour: 0, minute: 0 }, close: { day: 2, hour: 0, minute: 0 } }],
    },
  });
  assert.equal(normalized.subcategory, 'pharmacy');
  assert.equal(normalized.openNow, true);
  assert.equal(normalized.currentHours.weekdayDescriptions[0], 'lundi: Ouvert 24h/24');

  assert.equal(normalizeOpeningHours(null), null);
});

test('deduplicates Google and local places and keeps MADINATI records first', () => {
  const merged = dedupePlaces([
    { id: 'google-id', googlePlaceId: 'abc', source: 'GOOGLE', name: 'A' },
    { id: 'local-id', googlePlaceId: 'abc', source: 'MADINATI', name: 'A verified' },
    { id: 'other', source: 'MADINATI', name: 'Other', latitude: 1, longitude: 2, address: 'X' },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((p) => p.googlePlaceId === 'abc').id, 'local-id');
});

test('Google Places client uses cache and field masks without wildcard', async () => {
  googlePlaces.clearGooglePlacesCache();
  let calls = 0;
  const originalPost = axios.post;
  axios.post = async (url, body, config) => {
    calls += 1;
    assert.equal(config.headers['X-Goog-FieldMask'].includes('*'), false);
    return {
      data: {
        places: [{ id: 'cached-place', displayName: { text: 'Cached' } }],
      },
    };
  };

  try {
    const args = { textQuery: 'pharmacie Casablanca', limit: 1 };
    const first = await googlePlaces.searchText(args);
    const second = await googlePlaces.searchText(args);
    assert.equal(first[0].id, 'cached-place');
    assert.equal(second[0].id, 'cached-place');
    assert.equal(calls, 1);
  } finally {
    axios.post = originalPost;
    googlePlaces.clearGooglePlacesCache();
  }
});
