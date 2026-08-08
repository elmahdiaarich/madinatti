const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'education', 'etablissements_publics_kenitra_audit_gps.xlsx');
const SOURCE = 'MENPS_PUBLIC_2011_KENITRA_PROVINCE';

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
    latitude,
    longitude,
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
  buildPayload,
  readRows,
  seedEducationInstitutions,
};
