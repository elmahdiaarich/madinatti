require('dotenv').config();

const axios = require('axios');
const prisma = require('../config/db');

const SOURCE = 'MENPS_PUBLIC_2011_KENITRA_PROVINCE';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.env.REFINE_GPS_LIMIT || 0);
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'MadinattiEducationGpsRefiner/1.0';

const PROVINCE_BOX = {
  minLat: 33.9,
  maxLat: 35.15,
  minLng: -7.2,
  maxLng: -5.55,
};

const STOP_WORDS = new Set([
  'al',
  'ben',
  'bin',
  'de',
  'des',
  'du',
  'ecole',
  'ecoles',
  'el',
  'et',
  'groupe',
  'kenitra',
  'la',
  'le',
  'les',
  'lycee',
  'primaire',
  'school',
  'scolaire',
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function tokenOverlap(left, right) {
  const a = tokens(left);
  const b = new Set(tokens(right));
  if (!a.length || !b.size) return 0;
  return a.filter((token) => b.has(token)).length / a.length;
}

function coordinateFromElement(element) {
  const lat = element.lat || element.center?.lat;
  const lng = element.lon || element.center?.lon;
  if (lat == null || lng == null) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function poiName(element) {
  const tags = element.tags || {};
  return tags.name || tags['name:fr'] || tags['name:ar'] || tags['alt_name'] || '';
}

async function fetchEducationPois() {
  const query = `[out:json][timeout:60];(node["amenity"~"school|college|university|kindergarten|language_school"](${PROVINCE_BOX.minLat},${PROVINCE_BOX.minLng},${PROVINCE_BOX.maxLat},${PROVINCE_BOX.maxLng});way["amenity"~"school|college|university|kindergarten|language_school"](${PROVINCE_BOX.minLat},${PROVINCE_BOX.minLng},${PROVINCE_BOX.maxLat},${PROVINCE_BOX.maxLng});relation["amenity"~"school|college|university|kindergarten|language_school"](${PROVINCE_BOX.minLat},${PROVINCE_BOX.minLng},${PROVINCE_BOX.maxLat},${PROVINCE_BOX.maxLng}););out center tags;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, query, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': USER_AGENT,
        },
        timeout: 90000,
      });

      return (response.data.elements || [])
        .map((element) => {
          const coordinate = coordinateFromElement(element);
          const name = poiName(element);
          if (!coordinate || !name) return null;
          return {
            ...coordinate,
            name,
            normalizedName: normalize(name),
            tags: element.tags || {},
            osmType: element.type,
            osmId: element.id,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.warn(`Overpass failed at ${endpoint}: ${error.response?.status || error.message}`);
    }
  }

  return [];
}

function scorePoi(item, poi) {
  const nameScore = Math.max(tokenOverlap(item.name, poi.name), tokenOverlap(poi.name, item.name));
  const exactName = normalize(item.name) === normalize(poi.name) ? 0.2 : 0;
  const city = normalize(item.city);
  const address = normalize(item.address);
  const poiText = normalize(
    [
      poi.name,
      poi.tags['addr:city'],
      poi.tags['addr:suburb'],
      poi.tags['addr:street'],
      poi.tags.description,
      poi.tags.operator,
    ].filter(Boolean).join(' '),
  );
  const cityBonus = city && poiText.includes(city) ? 0.08 : 0;
  const addressBonus = address && poiText && (address.includes(poiText) || poiText.includes(address)) ? 0.05 : 0;
  return Math.min(1, nameScore + exactName + cityBonus + addressBonus);
}

function bestPoiMatch(item, pois) {
  const matches = pois
    .map((poi) => ({ poi, score: scorePoi(item, poi) }))
    .filter(({ score }) => score >= 0.9)
    .sort((a, b) => b.score - a.score);

  return matches[0] || null;
}

async function main() {
  const pois = await fetchEducationPois();
  const institutions = await prisma.educationInstitution.findMany({
    where: {
      source: SOURCE,
      OR: [{ latitude: null }, { longitude: null }],
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      metadata: true,
    },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
    take: LIMIT > 0 ? LIMIT : undefined,
  });

  const summary = {
    dryRun: DRY_RUN,
    pois: pois.length,
    considered: institutions.length,
    updated: 0,
    skipped: 0,
    matches: [],
  };

  for (const item of institutions) {
    const match = bestPoiMatch(item, pois);
    if (!match) {
      summary.skipped += 1;
      continue;
    }

    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
    const nextMetadata = {
      ...metadata,
      gpsStatus: 'VERIFIED_OSM_POI',
      geocoding: {
        provider: 'overpass',
        accuracy: 'poi',
        score: Number(match.score.toFixed(3)),
        displayName: match.poi.name,
        osmType: match.poi.osmType,
        osmId: match.poi.osmId,
        tags: match.poi.tags,
        geocodedAt: new Date().toISOString(),
      },
    };

    if (!DRY_RUN) {
      await prisma.educationInstitution.update({
        where: { id: item.id },
        data: {
          latitude: match.poi.lat,
          longitude: match.poi.lng,
          isVerified: true,
          metadata: nextMetadata,
        },
      });
    }

    summary.updated += 1;
    summary.matches.push({
      school: item.name,
      city: item.city,
      poi: match.poi.name,
      score: Number(match.score.toFixed(3)),
      lat: match.poi.lat,
      lng: match.poi.lng,
    });
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
