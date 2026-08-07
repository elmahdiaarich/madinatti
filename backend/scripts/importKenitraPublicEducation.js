require('dotenv').config();

const axios = require('axios');
const XLSX = require('xlsx');
const prisma = require('../config/db');
const { uniqueSlug } = require('../services/educationInstitutions');

const FILE_PATH =
  process.argv.find((arg) => arg.endsWith('.xlsx')) ||
  'C:/Users/USER/Downloads/etablissements_publics_kenitra_audit_gps.xlsx';
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_GEOCODE = process.argv.includes('--skip-geocode');
const COMMUNE_FALLBACK = process.argv.includes('--commune-fallback');
const RATE_LIMIT_MS = Number(process.env.GEOCODE_RATE_LIMIT_MS || 1100);
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'MadinattiEducationImporter/1.0';
const SOURCE = 'MENPS_PUBLIC_2011_KENITRA_PROVINCE';

const PROVINCE_BOX = {
  minLat: 33.9,
  maxLat: 35.15,
  minLng: -7.2,
  maxLng: -5.55,
};

const TYPE_BY_LEVEL = {
  primaire: 'PRIMARY_SCHOOL',
  college: 'MIDDLE_SCHOOL',
  lycee: 'HIGH_SCHOOL',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function cleanText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function cleanCommune(value) {
  const withoutMunicipalityMarker = String(value || '')
    .replace(/\s*\(M\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const comparable = normalize(withoutMunicipalityMarker);

  if (comparable === 'kenitra') return 'K\u00e9nitra';
  if (comparable === 'mehdya') return 'Mehdya';
  if (comparable === 'souk el arbaa') return 'Souk El Arbaa';

  return withoutMunicipalityMarker
    .split(' ')
    .filter(Boolean)
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

function typeFromLevel(level) {
  return TYPE_BY_LEVEL[normalize(level)] || 'OTHER';
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isInsideProvince(lat, lng) {
  return (
    lat >= PROVINCE_BOX.minLat &&
    lat <= PROVINCE_BOX.maxLat &&
    lng >= PROVINCE_BOX.minLng &&
    lng <= PROVINCE_BOX.maxLng
  );
}

function scorePhotonFeature(feature, city) {
  const [lng, lat] = feature.geometry?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInsideProvince(lat, lng)) return 0;

  const props = feature.properties || {};
  const haystack = normalize([props.name, props.city, props.county, props.state, props.country].filter(Boolean).join(' '));
  const cityName = normalize(city);
  let score = 10;

  if (haystack.includes(cityName)) score += 45;
  if (haystack.includes('kenitra') || haystack.includes('qnitra')) score += 20;
  if (['city', 'town', 'village', 'municipality', 'administrative'].includes(normalize(props.osm_value))) score += 15;
  if (normalize(props.osm_key) === 'place' || normalize(props.osm_key) === 'boundary') score += 10;

  return score;
}

async function geocodeCommuneWithPhoton(city) {
  const queries = [
    `${city}, Province de Kenitra, Rabat-Sale-Kenitra, Morocco`,
    `${city}, Kenitra, Morocco`,
    `${city}, Morocco`,
  ];

  for (const query of queries) {
    const response = await axios.get('https://photon.komoot.io/api/', {
      params: {
        q: query,
        lat: 34.35,
        lon: -6.35,
        limit: 5,
      },
      timeout: 20000,
    });

    const best = (response.data.features || [])
      .map((feature) => ({ feature, score: scorePhotonFeature(feature, city) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best && best.score >= 45) {
      const [lng, lat] = best.feature.geometry.coordinates;
      const props = best.feature.properties || {};
      return {
        provider: 'photon',
        query,
        score: Math.round(best.score),
        lat: Number(lat),
        lng: Number(lng),
        displayName: [props.name, props.city, props.county, props.state].filter(Boolean).join(', '),
        osmType: props.osm_type,
        osmId: props.osm_id,
        class: props.osm_key,
        type: props.osm_value,
      };
    }
  }

  return null;
}

function scoreNominatimResult(result, city) {
  const lat = Number(result.lat);
  const lng = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInsideProvince(lat, lng)) return 0;

  const haystack = normalize([result.display_name, result.name, result.type, result.class].filter(Boolean).join(' '));
  const cityName = normalize(city);
  let score = 10;

  if (haystack.includes(cityName)) score += 50;
  if (haystack.includes('kenitra') || haystack.includes('qnitra')) score += 20;
  if (['city', 'town', 'village', 'municipality', 'administrative', 'locality'].includes(normalize(result.type))) score += 10;
  if (normalize(result.class) === 'boundary' || normalize(result.class) === 'place') score += 10;
  if (Number(result.importance) > 0.2) score += 5;

  return score;
}

async function geocodeCommuneWithNominatim(city) {
  const queries = [
    `${city}, Province de Kenitra, Rabat-Sale-Kenitra, Maroc`,
    `${city}, Kenitra, Maroc`,
    `${city}, Maroc`,
  ];

  for (const query of queries) {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'jsonv2',
        limit: 5,
        countrycodes: 'ma',
        addressdetails: 1,
        extratags: 1,
        viewbox: `${PROVINCE_BOX.minLng},${PROVINCE_BOX.maxLat},${PROVINCE_BOX.maxLng},${PROVINCE_BOX.minLat}`,
        bounded: 1,
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 25000,
    });

    const best = (response.data || [])
      .map((result) => ({ result, score: scoreNominatimResult(result, city) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best && best.score >= 45) {
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
      };
    }

    await sleep(RATE_LIMIT_MS);
  }

  return null;
}

async function geocodeCommune(city) {
  if (SKIP_GEOCODE) return null;

  try {
    const photon = await geocodeCommuneWithPhoton(city);
    if (photon) return photon;
  } catch (error) {
    console.warn(`Photon failed for ${city}: ${error.message}`);
  }

  try {
    return await geocodeCommuneWithNominatim(city);
  } catch (error) {
    console.warn(`Nominatim failed for ${city}: ${error.message}`);
    return null;
  }
}

async function educationCategoryId() {
  const category = await prisma.category.upsert({
    where: { slug: 'education' },
    update: { name: 'Education', module: 'education', displayType: 'PLACE', isActive: true },
    create: { name: 'Education', slug: 'education', module: 'education', displayType: 'PLACE', isActive: true },
  });
  return category.id;
}

function readRows() {
  const workbook = XLSX.readFile(FILE_PATH);
  const sheet = workbook.Sheets.Etablissements_publics || workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function buildPayload(row, categoryId, communeMatch) {
  const city = cleanCommune(row.commune);
  const latitude = numberOrNull(row.latitude);
  const longitude = numberOrNull(row.longitude);
  const hasVerifiedCoordinate = latitude !== null && longitude !== null;
  const fallbackCoordinate = COMMUNE_FALLBACK && communeMatch && !hasVerifiedCoordinate;
  const sourceUrl = cleanText(row.official_source_url) || cleanText(row.gps_source_url);

  return {
    categoryId,
    name: cleanText(row.name),
    nameFr: cleanText(row.name),
    slugSeed: `${row.name}-${city}-${row.id}`,
    institutionType: typeFromLevel(row.level),
    sector: 'PUBLIC',
    address: cleanText(row.address),
    country: 'MA',
    region: cleanText(row.region) || 'Rabat-Sal\u00e9-K\u00e9nitra',
    province: cleanText(row.province) || 'K\u00e9nitra',
    city,
    latitude: hasVerifiedCoordinate ? latitude : fallbackCoordinate ? communeMatch.lat : null,
    longitude: hasVerifiedCoordinate ? longitude : fallbackCoordinate ? communeMatch.lng : null,
    phone: cleanText(row.phone),
    email: cleanText(row.email),
    website: cleanText(row.website),
    isVerified: hasVerifiedCoordinate,
    isPublished: true,
    source: SOURCE,
    sourceUrl,
    externalId: `menps-public-kenitra-${row.id}`,
    dataSource: 'data.gov.ma / MEN public schools 2011 audit GPS',
    lastImportedAt: new Date(),
    manuallyEdited: false,
    metadata: {
      importFile: FILE_PATH,
      originalId: row.id,
      originalCommune: cleanText(row.commune),
      level: cleanText(row.level),
      gpsStatus: hasVerifiedCoordinate ? cleanText(row.gps_status) || 'VERIFIED_FROM_FILE' : fallbackCoordinate ? 'APPROXIMATE_COMMUNE' : cleanText(row.gps_status) || 'NOT_VERIFIED',
      gpsPrecision: cleanText(row.gps_precision),
      gpsSourceUrl: cleanText(row.gps_source_url),
      contactSource: cleanText(row.contact_source),
      sourceYear: cleanText(row.source_year),
      officialSourceUrl: cleanText(row.official_source_url),
      legacyContactField: cleanText(row.legacy_contact_field),
      nature2011: cleanText(row.nature_2011),
      notes: cleanText(row.notes),
      geocoding: hasVerifiedCoordinate
        ? {
            provider: 'file',
            accuracy: 'verified_plus_code',
            geocodedAt: new Date().toISOString(),
          }
        : fallbackCoordinate
          ? {
              ...communeMatch,
              accuracy: 'commune',
              warning: 'Approximate point for the commune, not the exact school entrance.',
              geocodedAt: new Date().toISOString(),
            }
          : null,
    },
  };
}

async function main() {
  const rows = readRows();
  const categoryId = await educationCategoryId();
  const communes = [...new Set(rows.map((row) => cleanCommune(row.commune)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  const communeMatches = {};

  for (const commune of communes) {
    const exactRows = rows.filter((row) => cleanCommune(row.commune) === commune && numberOrNull(row.latitude) !== null && numberOrNull(row.longitude) !== null);
    if (exactRows.length) {
      communeMatches[commune] = {
        provider: 'file',
        query: commune,
        score: 100,
        lat: numberOrNull(exactRows[0].latitude),
        lng: numberOrNull(exactRows[0].longitude),
        displayName: commune,
      };
      continue;
    }

    if (!COMMUNE_FALLBACK) continue;

    const match = await geocodeCommune(commune);
    if (match) {
      communeMatches[commune] = match;
      console.log(`COMMUNE ${commune} -> ${match.lat}, ${match.lng} (${match.provider}/${match.score})`);
    } else {
      console.log(`COMMUNE ${commune} -> no coordinate`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  const summary = {
    dryRun: DRY_RUN,
    rows: rows.length,
    communeCoordinates: Object.keys(communeMatches).length,
    created: 0,
    updated: 0,
    failed: 0,
    withoutCoordinates: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const city = cleanCommune(row.commune);
    const payload = buildPayload(row, categoryId, communeMatches[city]);
    if (!payload.name || !payload.city || !payload.institutionType) {
      summary.failed += 1;
      summary.errors.push({ row: i + 2, id: row.id, message: 'Missing name, city, or institution type.' });
      continue;
    }
    if (payload.latitude == null || payload.longitude == null) summary.withoutCoordinates += 1;

    try {
      const { slugSeed, ...data } = payload;
      const existing = await prisma.educationInstitution.findUnique({
        where: { source_externalId: { source: data.source, externalId: data.externalId } },
      });

      if (DRY_RUN) {
        if (existing) summary.updated += 1;
        else summary.created += 1;
        continue;
      }

      if (existing) {
        await prisma.educationInstitution.update({
          where: { id: existing.id },
          data: {
            ...data,
            slug: existing.slug,
          },
        });
        summary.updated += 1;
      } else {
        await prisma.educationInstitution.create({
          data: {
            ...data,
            slug: await uniqueSlug(slugSeed),
          },
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ row: i + 2, id: row.id, name: payload.name, message: error.message });
    }
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
