require('dotenv').config();

const axios = require('axios');
const prisma = require('../config/db');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'MadinattiEducationGeocoder/1.0';
const RATE_LIMIT_MS = Number(process.env.GEOCODE_RATE_LIMIT_MS || 1200);
const DEFAULT_LIMIT = Number(process.env.GEOCODE_LIMIT || 0);
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const SKIP_OVERPASS = process.argv.includes('--skip-overpass') || process.env.SKIP_OVERPASS === 'true';

const KENITRA_BOX = {
  minLat: 34.18,
  maxLat: 34.34,
  minLng: -6.72,
  maxLng: -6.48,
};

const STOP_WORDS = new Set([
  'abd',
  'al',
  'de',
  'des',
  'du',
  'ecole',
  'ecoles',
  'el',
  'et',
  'groupe',
  'high',
  'institut',
  'kenitra',
  'la',
  'le',
  'les',
  'lycee',
  'maternelle',
  'middle',
  'prive',
  'privee',
  'royal',
  'school',
  'scolaire',
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function nameTokens(value) {
  return normalize(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenOverlap(left, right) {
  const a = nameTokens(left);
  const b = new Set(nameTokens(right));
  if (!a.length || !b.size) return 0;
  return a.filter((token) => b.has(token)).length / a.length;
}

function isInsideKenitra(lat, lng) {
  return (
    lat >= KENITRA_BOX.minLat &&
    lat <= KENITRA_BOX.maxLat &&
    lng >= KENITRA_BOX.minLng &&
    lng <= KENITRA_BOX.maxLng
  );
}

function coordinateFromOsmElement(element) {
  const lat = element.lat || element.center?.lat;
  const lng = element.lon || element.center?.lon;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

async function fetchSchoolPois() {
  if (SKIP_OVERPASS) return [];

  const query = `[out:json][timeout:25];(node["amenity"~"school|college|university|kindergarten|language_school"](${KENITRA_BOX.minLat},${KENITRA_BOX.minLng},${KENITRA_BOX.maxLat},${KENITRA_BOX.maxLng});way["amenity"~"school|college|university|kindergarten|language_school"](${KENITRA_BOX.minLat},${KENITRA_BOX.minLng},${KENITRA_BOX.maxLat},${KENITRA_BOX.maxLng});relation["amenity"~"school|college|university|kindergarten|language_school"](${KENITRA_BOX.minLat},${KENITRA_BOX.minLng},${KENITRA_BOX.maxLat},${KENITRA_BOX.maxLng}););out center tags;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];
  let response = null;

  for (const endpoint of endpoints) {
    try {
      response = await axios.post(endpoint, query, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': USER_AGENT,
        },
        timeout: 60000,
      });
      break;
    } catch (error) {
      console.warn(`Overpass unavailable at ${endpoint}: ${error.response?.status || error.message}`);
    }
  }

  if (!response) return [];

  return (response.data.elements || [])
    .map((element) => {
      const coordinate = coordinateFromOsmElement(element);
      const name = element.tags?.name || element.tags?.['name:fr'] || element.tags?.['name:en'];
      if (!coordinate || !name) return null;
      return {
        ...coordinate,
        name,
        osmType: element.type,
        osmId: element.id,
        class: 'amenity',
        type: element.tags?.amenity || 'school',
      };
    })
    .filter(Boolean);
}

function findPoiMatch(item, pois) {
  const matches = pois
    .map((poi) => {
      const overlap = tokenOverlap(item.name, poi.name);
      const reverseOverlap = tokenOverlap(poi.name, item.name);
      return { poi, score: Math.max(overlap, reverseOverlap) };
    })
    .filter(({ score }) => score >= 0.75)
    .sort((a, b) => b.score - a.score);

  const best = matches[0];
  if (!best) return null;

  return {
    provider: 'overpass',
    query: item.name,
    score: Math.round(best.score * 100),
    lat: best.poi.lat,
    lng: best.poi.lng,
    displayName: best.poi.name,
    osmType: best.poi.osmType,
    osmId: best.poi.osmId,
    class: best.poi.class,
    type: best.poi.type,
    accuracy: 'poi',
  };
}

function buildQueries(item) {
  const address = item.address || '';
  const city = item.city || 'Kenitra';
  const name = item.name || '';
  return [
    [name, address, city, 'Morocco'].filter(Boolean).join(', '),
    [address, city, 'Morocco'].filter(Boolean).join(', '),
    [name, city, 'Morocco'].filter(Boolean).join(', '),
  ].filter((query, index, arr) => query && arr.indexOf(query) === index);
}

function buildAddressQueries(item) {
  const address = item.address || '';
  const normalizedAddress = normalize(address);
  const hasSpecificAddress =
    normalizedAddress.replace(/\b(kenitra|morocco|maroc)\b/g, '').trim().length >= 5 &&
    /\d|rue|avenue|bd|boulevard|hay|lot|lotissement|zone|bloc|route|quartier|cite/.test(normalizedAddress);
  if (!hasSpecificAddress) return [];

  const city = item.city || 'Kenitra';
  const simplifiedAddress = address
    .replace(/\bn[°o]?\s*\d+[a-z]?\b/gi, ' ')
    .replace(/\bbloc\s+[a-z0-9]+\b/gi, ' ')
    .replace(/\blot\s*(n[°o]?)?\s*\d+[a-z]?\b/gi, ' ')
    .replace(/\bimm\.?\s+[^,]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => /\b(rue|avenue|bd|boulevard|hay|lotissement|zone|route|quartier|cite)\b/i.test(part));

  return [
    [address, city, 'Morocco'].filter(Boolean).join(', '),
    [simplifiedAddress, city, 'Morocco'].filter(Boolean).join(', '),
    ...parts.map((part) => [part, city, 'Morocco'].filter(Boolean).join(', ')),
    [address, 'Kenitra', 'Morocco'].filter(Boolean).join(', '),
  ].filter((query, index, arr) => query && arr.indexOf(query) === index);
}

function scorePhotonFeature(feature, query) {
  const [lng, lat] = feature.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInsideKenitra(lat, lng)) return 0;

  const props = feature.properties || {};
  const city = normalize(props.city || props.county || props.state);
  const name = normalize(props.name);
  const street = normalize(props.street);
  const queryText = normalize(query);
  const osmValue = normalize(props.osm_value);

  let score = 30;
  if (city.includes('kenitra') || city.includes('qnitra')) score += 25;
  if (street && queryText.includes(street)) score += 30;
  if (name && queryText.includes(name)) score += 20;
  if (['house', 'residential', 'tertiary', 'secondary', 'service', 'road'].includes(osmValue)) score += 10;
  if (props.housenumber && queryText.includes(String(props.housenumber))) score += 10;

  return score;
}

async function geocodeWithPhoton(item) {
  for (const query of buildAddressQueries(item)) {
    const response = await axios.get('https://photon.komoot.io/api/', {
      params: {
        q: query,
        lat: 34.261,
        lon: -6.58,
        limit: 5,
      },
      timeout: 20000,
    });

    const best = (response.data.features || [])
      .map((feature) => ({ feature, score: scorePhotonFeature(feature, query) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best && best.score >= 45) {
      const [lng, lat] = best.feature.geometry.coordinates;
      const props = best.feature.properties || {};
      const exactTypes = ['house', 'school', 'college', 'university', 'kindergarten'];
      const streetTypes = ['residential', 'tertiary', 'secondary', 'service', 'road'];
      return {
        provider: 'photon',
        query,
        score: Math.round(best.score),
        lat: Number(lat),
        lng: Number(lng),
        displayName: [props.name, props.street, props.city].filter(Boolean).join(', '),
        osmType: props.osm_type,
        osmId: props.osm_id,
        class: props.osm_key,
        type: props.osm_value,
        accuracy: exactTypes.includes(props.osm_value)
          ? 'address'
          : streetTypes.includes(props.osm_value)
            ? 'street'
            : 'neighborhood',
      };
    }

    await sleep(RATE_LIMIT_MS);
  }

  return null;
}

function scoreResult(result, query, item) {
  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInsideKenitra(lat, lng)) return 0;

  const resultName = normalize(result.display_name);
  const queryText = normalize(query);
  const itemName = normalize(item.name);
  const address = normalize(item.address);
  const klass = normalize(result.class);
  const type = normalize(result.type);

  let score = 30;
  if (itemName && resultName.includes(itemName)) score += 40;
  if (address && resultName.includes(address.split(',')[0])) score += 20;
  if (queryText.includes('ecole') || queryText.includes('school') || queryText.includes('college') || queryText.includes('lycee')) score += 5;
  if (['amenity', 'building'].includes(klass)) score += 12;
  if (['school', 'college', 'university', 'kindergarten'].includes(type)) score += 18;
  if (['house', 'residential', 'road', 'secondary', 'tertiary'].includes(type)) score += 5;
  score += Math.min(10, Number(result.importance || 0) * 20);

  return score;
}

async function geocodeWithNominatim(item) {
  const queries = buildQueries(item);

  for (const query of queries) {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      params: {
        q: query,
        format: 'jsonv2',
        limit: 5,
        countrycodes: 'ma',
        addressdetails: 1,
        bounded: 1,
        viewbox: `${KENITRA_BOX.minLng},${KENITRA_BOX.maxLat},${KENITRA_BOX.maxLng},${KENITRA_BOX.minLat}`,
      },
      timeout: 20000,
    });

    const best = (response.data || [])
      .map((result) => ({ result, score: scoreResult(result, query, item) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best && best.score >= 35) {
      return {
        provider: 'nominatim',
        query,
        score: Math.round(best.score),
        lat: Number(best.result.lat),
        lng: Number(best.result.lon),
        displayName: best.result.display_name,
        osmType: best.result.osm_type,
        osmId: best.result.osm_id,
        class: best.result.class,
        type: best.result.type,
        importance: best.result.importance,
        accuracy: ['school', 'college', 'university', 'kindergarten'].includes(best.result.type) ? 'poi' : 'approximate',
      };
    }

    await sleep(RATE_LIMIT_MS);
  }

  return null;
}

async function geocode(item, pois) {
  return findPoiMatch(item, pois) || (await geocodeWithPhoton(item)) || (await geocodeWithNominatim(item));
}

async function main() {
  const where = FORCE
    ? { city: { equals: 'Kénitra', mode: 'insensitive' }, isPublished: true }
    : {
        city: { equals: 'Kénitra', mode: 'insensitive' },
        isPublished: true,
        OR: [{ latitude: null }, { longitude: null }],
      };

  const institutions = await prisma.educationInstitution.findMany({
    where,
    orderBy: [{ name: 'asc' }],
    take: DEFAULT_LIMIT > 0 ? DEFAULT_LIMIT : undefined,
  });

  const summary = {
    dryRun: DRY_RUN,
    considered: institutions.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  const pois = await fetchSchoolPois();
  console.log(`Loaded ${pois.length} named OSM education POIs around Kenitra.`);

  for (const item of institutions) {
    try {
      const match = await geocode(item, pois);
      if (!match) {
        summary.skipped += 1;
        console.log(`SKIP ${item.name}`);
        continue;
      }

      const lat = Number(match.lat);
      const lng = Number(match.lng);
      const metadata = {
        ...(item.metadata && typeof item.metadata === 'object' ? item.metadata : {}),
        geocoding: {
          provider: match.provider,
          query: match.query,
          displayName: match.displayName,
          osmType: match.osmType,
          osmId: match.osmId,
          class: match.class,
          type: match.type,
          importance: match.importance,
          score: match.score,
          accuracy: match.accuracy,
          geocodedAt: new Date().toISOString(),
        },
      };

      if (!DRY_RUN) {
        await prisma.educationInstitution.update({
          where: { id: item.id },
          data: {
            latitude: lat,
            longitude: lng,
            metadata,
          },
        });
      }

      summary.updated += 1;
      console.log(`${DRY_RUN ? 'MATCH' : 'UPDATE'} ${item.name} -> ${lat}, ${lng} (${match.provider}/${match.accuracy}/${match.score})`);
    } catch (error) {
      summary.failed += 1;
      console.error(`FAIL ${item.name}: ${error.message}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
