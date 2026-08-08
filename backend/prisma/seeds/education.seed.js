const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'education', 'etablissements_publics_kenitra_audit_gps.xlsx');
const SOURCE = 'MENPS_PUBLIC_2011_KENITRA_PROVINCE';

const COMMUNE_COORDINATES = {
  'Ameur Seflia': { lat: 34.2752439, lng: -6.334433, provider: 'photon', score: 100 },
  Arbaoua: { lat: 34.9134851, lng: -5.932567, provider: 'photon', score: 100 },
  'Bahhara Ouled Ayad': { lat: 34.7578168, lng: -6.3014477, provider: 'photon', score: 55 },
  'Ben Mansour': { lat: 34.5956792, lng: -6.3752273, provider: 'photon', score: 100 },
  'Beni Malek': { lat: 34.7091004, lng: -6.0086412, provider: 'photon', score: 100 },
  Chouafaa: { lat: 34.9429002, lng: -6.177413, provider: 'photon', score: 100 },
  Haddada: { lat: 34.223052, lng: -6.510859, provider: 'photon', score: 100 },
  'Kariat Ben Aouda': { lat: 34.7283614, lng: -5.9918757, provider: 'photon', score: 100 },
  Kenitra: { lat: 34.5579171, lng: -6.355701, provider: 'photon', score: 100 },
  'Lalla Mimouna': { lat: 34.848871, lng: -6.069173, provider: 'photon', score: 100 },
  Mehdya: { lat: 34.2559174, lng: -6.6577278, provider: 'photon', score: 100 },
  Mnasra: { lat: 34.3708381, lng: -6.5306524, provider: 'photon', score: 100 },
  Mograne: { lat: 34.412485, lng: -6.427556, provider: 'photon', score: 100 },
  'Moulay Bousselham': { lat: 34.8813125, lng: -6.2923125, provider: 'file', score: 100 },
  'Oued EL Makhazine': { lat: 34.880914, lng: -5.831723, provider: 'photon', score: 100 },
  'Ouled Slama': { lat: 34.3431072, lng: -6.4579908, provider: 'photon', score: 55 },
  'Sidi Allal Tazi': { lat: 34.52185, lng: -6.323673, provider: 'photon', score: 100 },
  'Sidi Boubker EL Haj': { lat: 34.9223479, lng: -6.0545463, provider: 'photon', score: 100 },
  'Sidi Mohamed Benmansour': { lat: 34.728509, lng: -6.2479543, provider: 'photon', score: 55 },
  'Sidi Mohamed Lahmar': { lat: 34.728509, lng: -6.2479543, provider: 'photon', score: 100 },
  'Sidi Taibi': { lat: 34.1911875, lng: -6.6826875, provider: 'file', score: 100 },
  'Souk El Arbaa': { lat: 34.6765226, lng: -5.992617, provider: 'photon', score: 100 },
  'Souk Tlet EL Gharb': { lat: 34.601171, lng: -6.173848, provider: 'photon', score: 100 },
};

const TYPE_BY_LEVEL = {
  primaire: 'PRIMARY_SCHOOL',
  college: 'MIDDLE_SCHOOL',
  lycee: 'HIGH_SCHOOL',
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function uniqueSlug(prisma, seed, excludeId = null) {
  const base = slugify(seed) || 'education-institution';
  let slug = base;
  let i = 2;
  while (await prisma.educationInstitution.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
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

  if (comparable === 'kenitra') return 'Kenitra';
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

async function educationCategoryId(prisma) {
  const category = await prisma.category.upsert({
    where: { slug: 'education' },
    update: { name: 'Education', module: 'education', displayType: 'PLACE', isActive: true },
    create: { name: 'Education', slug: 'education', module: 'education', displayType: 'PLACE', isActive: true },
  });
  return category.id;
}

function readRows(filePath = DATA_FILE) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets.Etablissements_publics || workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function buildPayload(row, categoryId) {
  const city = cleanCommune(row.commune);
  const latitude = numberOrNull(row.latitude);
  const longitude = numberOrNull(row.longitude);
  const hasCoordinates = latitude !== null && longitude !== null;
  const communeCoordinate = COMMUNE_COORDINATES[city] || null;
  const hasCommuneCoordinate = Boolean(communeCoordinate && !hasCoordinates);
  const sourceUrl = cleanText(row.official_source_url) || cleanText(row.gps_source_url);

  return {
    categoryId,
    name: cleanText(row.name),
    nameFr: cleanText(row.name),
    institutionType: typeFromLevel(row.level),
    sector: 'PUBLIC',
    address: cleanText(row.address),
    country: 'MA',
    region: cleanText(row.region) || 'Rabat-Sale-Kenitra',
    province: cleanText(row.province) || 'Kenitra',
    city,
    latitude: hasCoordinates ? latitude : communeCoordinate?.lat ?? null,
    longitude: hasCoordinates ? longitude : communeCoordinate?.lng ?? null,
    phone: cleanText(row.phone),
    email: cleanText(row.email),
    website: cleanText(row.website),
    isVerified: hasCoordinates,
    isPublished: true,
    source: SOURCE,
    sourceUrl,
    externalId: `menps-public-kenitra-${row.id}`,
    dataSource: 'data.gov.ma / MEN public schools 2011 audit GPS',
    lastImportedAt: new Date(),
    manuallyEdited: false,
    metadata: {
      importFile: path.relative(path.join(__dirname, '..', '..', '..'), DATA_FILE).replace(/\\/g, '/'),
      originalId: row.id,
      originalCommune: cleanText(row.commune),
      level: cleanText(row.level),
      gpsStatus: hasCoordinates ? cleanText(row.gps_status) || 'VERIFIED_FROM_FILE' : cleanText(row.gps_status) || 'NOT_VERIFIED',
      gpsPrecision: cleanText(row.gps_precision),
      gpsSourceUrl: cleanText(row.gps_source_url),
      contactSource: cleanText(row.contact_source),
      sourceYear: cleanText(row.source_year),
      officialSourceUrl: cleanText(row.official_source_url),
      legacyContactField: cleanText(row.legacy_contact_field),
      nature2011: cleanText(row.nature_2011),
      notes: cleanText(row.notes),
      geocoding: hasCoordinates
        ? {
            provider: 'file',
            accuracy: 'verified_plus_code',
            geocodedAt: new Date().toISOString(),
          }
        : hasCommuneCoordinate
          ? {
              provider: communeCoordinate.provider,
              accuracy: 'commune',
              score: communeCoordinate.score,
              warning: 'Approximate point for the commune, not the exact school entrance.',
              geocodedAt: new Date().toISOString(),
            }
          : null,
    },
  };
}

async function seedEducationInstitutions(prisma, { filePath = DATA_FILE } = {}) {
  const rows = readRows(filePath);
  const categoryId = await educationCategoryId(prisma);
  const summary = { rows: rows.length, created: 0, updated: 0, failed: 0, withoutCoordinates: 0, errors: [] };

  for (let i = 0; i < rows.length; i += 1) {
    const payload = buildPayload(rows[i], categoryId);
    if (!payload.name || !payload.city || !payload.institutionType) {
      summary.failed += 1;
      summary.errors.push({ row: i + 2, id: rows[i].id, message: 'Missing name, city, or institution type.' });
      continue;
    }
    if (payload.latitude == null || payload.longitude == null) summary.withoutCoordinates += 1;

    try {
      const existing = await prisma.educationInstitution.findUnique({
        where: { source_externalId: { source: payload.source, externalId: payload.externalId } },
      });

      if (existing) {
        const slug = existing.slug || (await uniqueSlug(prisma, `${payload.name}-${payload.city}-${rows[i].id}`, existing.id));
        await prisma.educationInstitution.update({
          where: { id: existing.id },
          data: { ...payload, slug },
        });
        summary.updated += 1;
      } else {
        await prisma.educationInstitution.create({
          data: {
            ...payload,
            slug: await uniqueSlug(prisma, `${payload.name}-${payload.city}-${rows[i].id}`),
          },
        });
        summary.created += 1;
      }
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({ row: i + 2, id: rows[i].id, name: payload.name, message: error.message });
    }
  }

  console.log(`Education institutions seeded: ${summary.created} created, ${summary.updated} updated, ${summary.failed} failed.`);
  if (summary.withoutCoordinates) console.log(`Education institutions without coordinates: ${summary.withoutCoordinates}.`);
  return summary;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await seedEducationInstitutions(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  DATA_FILE,
  SOURCE,
  COMMUNE_COORDINATES,
  buildPayload,
  readRows,
  seedEducationInstitutions,
};
