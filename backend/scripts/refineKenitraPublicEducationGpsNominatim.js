require('dotenv').config();

const axios = require('axios');
const prisma = require('../config/db');

const SOURCE = 'MENPS_PUBLIC_2011_KENITRA_PROVINCE';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.env.REFINE_GPS_LIMIT || 0);
const RATE_LIMIT_MS = Number(process.env.GEOCODE_RATE_LIMIT_MS || 1200);
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'MadinattiEducationGpsRefiner/1.0';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function isEducationResult(result) {
  const type = normalize(result.type);
  const category = normalize(result.category || result.class);
  const display = normalize(result.display_name);
  return (
    category === 'amenity' &&
    ['school', 'college', 'university', 'kindergarten'].includes(type)
  ) || /\b(ecole|school|college|lycee|lycee|مدرسة)\b/.test(display);
}

function scoreResult(item, result) {
  const display = result.display_name || '';
  const name = result.name || display.split(',')[0] || '';
  const overlap = Math.max(tokenOverlap(item.name, name), tokenOverlap(item.name, display), tokenOverlap(name, item.name));
  const exactName = normalize(item.name) && normalize(item.name) === normalize(name) ? 0.2 : 0;
  const cityBonus = normalize(item.city) && normalize(display).includes(normalize(item.city)) ? 0.08 : 0;
  const addressBonus = normalize(item.address) && normalize(display).includes(normalize(item.address).split(' ').slice(0, 3).join(' ')) ? 0.03 : 0;
  const educationBonus = isEducationResult(result) ? 0.15 : -0.4;
  return Math.min(1, overlap + exactName + cityBonus + addressBonus + educationBonus);
}

function queriesFor(item) {
  const cleanName = String(item.name || '').replace(/[°º]/g, '').replace(/\s+/g, ' ').trim();
  return [
    `${cleanName}, ${item.city}, Kenitra, Morocco`,
    `${cleanName} ${item.address || ''}, ${item.city}, Morocco`,
  ].filter((query, index, list) => query.trim() && list.indexOf(query) === index);
}

async function searchNominatim(item) {
  for (const query of queriesFor(item)) {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'jsonv2',
        limit: 5,
        countrycodes: 'ma',
        addressdetails: 1,
        extratags: 1,
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 25000,
    });

    const best = (response.data || [])
      .map((result) => ({ result, score: scoreResult(item, result), query }))
      .filter(({ result, score }) => isEducationResult(result) && score >= 0.9)
      .sort((a, b) => b.score - a.score)[0];

    if (best) return best;
    await sleep(RATE_LIMIT_MS);
  }

  return null;
}

async function main() {
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
    considered: institutions.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    matches: [],
  };

  for (const item of institutions) {
    try {
      const match = await searchNominatim(item);
      if (!match) {
        summary.skipped += 1;
        continue;
      }

      const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
      const nextMetadata = {
        ...metadata,
        gpsStatus: 'VERIFIED_NOMINATIM_POI',
        geocoding: {
          provider: 'nominatim',
          accuracy: 'poi',
          query: match.query,
          score: Number(match.score.toFixed(3)),
          displayName: match.result.display_name,
          osmType: match.result.osm_type,
          osmId: match.result.osm_id,
          class: match.result.category || match.result.class,
          type: match.result.type,
          geocodedAt: new Date().toISOString(),
        },
      };

      if (!DRY_RUN) {
        await prisma.educationInstitution.update({
          where: { id: item.id },
          data: {
            latitude: Number(match.result.lat),
            longitude: Number(match.result.lon),
            isVerified: true,
            metadata: nextMetadata,
          },
        });
      }

      summary.updated += 1;
      summary.matches.push({
        school: item.name,
        city: item.city,
        query: match.query,
        score: Number(match.score.toFixed(3)),
        displayName: match.result.display_name,
        lat: Number(match.result.lat),
        lng: Number(match.result.lon),
      });
    } catch (error) {
      summary.failed += 1;
      console.warn(`Failed ${item.name}: ${error.message}`);
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
