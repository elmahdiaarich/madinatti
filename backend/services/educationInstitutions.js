const XLSX = require('xlsx');
const prisma = require('../config/db');
const { normalizeSector, normalizeType, toNumber } = require('../utils/educationValidator');

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function uniqueSlug(name, excludeId = null) {
  const base = slugify(name) || 'education-institution';
  let slug = base;
  let i = 2;
  while (await prisma.educationInstitution.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function currentUserId(user) {
  return user?.userId || user?.id || null;
}

function optionalString(value) {
  if (value === undefined) return undefined;
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function decimalOrNull(value) {
  if (value === undefined) return undefined;
  return toNumber(value);
}

function normalizeJson(value, fallback = null) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function normalizeInstitution(record) {
  if (!record) return null;
  return {
    ...record,
    latitude: record.latitude == null ? null : Number(record.latitude),
    longitude: record.longitude == null ? null : Number(record.longitude),
  };
}

async function educationCategoryId(categoryId) {
  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, module: 'education', isActive: true } });
    if (category) return category.id;
  }
  const fallback = await prisma.category.upsert({
    where: { slug: 'education' },
    update: { name: 'Education', module: 'education', displayType: 'PLACE', isActive: true },
    create: { name: 'Education', slug: 'education', module: 'education', displayType: 'PLACE', isActive: true },
  });
  return fallback.id;
}

function buildWriteData(data, { partial = false, imported = false } = {}) {
  const type = normalizeType(data.institutionType);
  const sector = normalizeSector(data.sector);
  const write = {
    name: data.name === undefined ? undefined : String(data.name).trim(),
    nameAr: optionalString(data.nameAr),
    nameFr: optionalString(data.nameFr),
    nameEn: optionalString(data.nameEn),
    institutionType: type,
    sector,
    description: optionalString(data.description),
    descriptionAr: optionalString(data.descriptionAr),
    descriptionFr: optionalString(data.descriptionFr),
    descriptionEn: optionalString(data.descriptionEn),
    address: optionalString(data.address),
    postalCode: optionalString(data.postalCode),
    region: optionalString(data.region),
    province: optionalString(data.province),
    city: optionalString(data.city),
    latitude: decimalOrNull(data.latitude),
    longitude: decimalOrNull(data.longitude),
    phone: optionalString(data.phone),
    secondaryPhone: optionalString(data.secondaryPhone),
    email: optionalString(data.email),
    website: optionalString(data.website),
    facebookUrl: optionalString(data.facebookUrl),
    instagramUrl: optionalString(data.instagramUrl),
    linkedinUrl: optionalString(data.linkedinUrl),
    logoUrl: optionalString(data.logoUrl),
    coverImageUrl: optionalString(data.coverImageUrl),
    openingHours: normalizeJson(data.openingHours, null),
    metadata: normalizeJson(data.metadata, null),
    isVerified: data.isVerified === undefined ? undefined : Boolean(data.isVerified),
    isFeatured: data.isFeatured === undefined ? undefined : Boolean(data.isFeatured),
    isPublished: data.isPublished === undefined ? undefined : Boolean(data.isPublished),
    source: optionalString(data.source),
    sourceUrl: optionalString(data.sourceUrl),
    externalId: optionalString(data.externalId),
    dataSource: optionalString(data.dataSource),
  };

  Object.keys(write).forEach((key) => write[key] === undefined && delete write[key]);
  if (!partial && !Object.prototype.hasOwnProperty.call(write, 'isPublished')) write.isPublished = false;
  if (imported) write.lastImportedAt = new Date();
  return write;
}

function searchWhere(filters, { admin = false } = {}) {
  const where = {
    ...(!admin ? { isPublished: true } : filters.published !== undefined ? { isPublished: filters.published } : {}),
    ...(filters.type && { institutionType: filters.type }),
    ...(filters.sector && { sector: filters.sector }),
    ...(filters.featured && { isFeatured: true }),
  };
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.region) where.region = { contains: filters.region, mode: 'insensitive' };
  if (filters.province) where.province = { contains: filters.province, mode: 'insensitive' };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { nameFr: { contains: filters.search, mode: 'insensitive' } },
      { nameEn: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
      { city: { contains: filters.search, mode: 'insensitive' } },
      { province: { contains: filters.search, mode: 'insensitive' } },
      { region: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function listInstitutions(filters, { admin = false } = {}) {
  const where = searchWhere(filters, { admin });
  const [data, total] = await Promise.all([
    prisma.educationInstitution.findMany({
      where,
      include: { category: true },
      orderBy: [{ [filters.sort]: filters.order }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.educationInstitution.count({ where }),
  ]);

  return {
    data: data.map(normalizeInstitution),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
    },
  };
}

async function getInstitutionBySlug(slug, { admin = false } = {}) {
  const where = { OR: [{ slug }, { id: slug }] };
  if (!admin) where.isPublished = true;
  const institution = await prisma.educationInstitution.findFirst({ where, include: { category: true } });
  return normalizeInstitution(institution);
}

async function createInstitution(data, user) {
  const categoryId = await educationCategoryId(data.categoryId);
  const name = String(data.name || '').trim();
  const write = buildWriteData(data);
  const created = await prisma.educationInstitution.create({
    data: {
      ...write,
      categoryId,
      slug: await uniqueSlug(`${name}-${data.city || ''}`),
      createdById: currentUserId(user),
      manuallyEdited: true,
    },
    include: { category: true },
  });
  return normalizeInstitution(created);
}

async function updateInstitution(id, data) {
  const existing = await prisma.educationInstitution.findUnique({ where: { id } });
  if (!existing) return null;
  const write = buildWriteData(data, { partial: true });
  if (data.categoryId !== undefined) write.categoryId = await educationCategoryId(data.categoryId);
  if (write.name && write.name !== existing.name) write.slug = await uniqueSlug(`${write.name}-${write.city || existing.city || ''}`, id);
  write.manuallyEdited = true;
  const updated = await prisma.educationInstitution.update({
    where: { id },
    data: write,
    include: { category: true },
  });
  return normalizeInstitution(updated);
}

async function deleteInstitution(id) {
  const existing = await prisma.educationInstitution.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.educationInstitution.delete({ where: { id } });
  return normalizeInstitution(existing);
}

async function publishInstitution(id, isPublished) {
  const updated = await prisma.educationInstitution.update({
    where: { id },
    data: { isPublished: Boolean(isPublished) },
    include: { category: true },
  });
  return normalizeInstitution(updated);
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function valueFrom(row, keys) {
  for (const key of keys) {
    const found = Object.keys(row).find((candidate) => normalizeHeader(candidate) === key);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
}

const TYPE_ALIASES = {
  maternelle: 'PRESCHOOL',
  preschool: 'PRESCHOOL',
  prescolaire: 'PRESCHOOL',
  preparatoire: 'PRESCHOOL',
  primaire: 'PRIMARY_SCHOOL',
  ecoleprimaire: 'PRIMARY_SCHOOL',
  college: 'MIDDLE_SCHOOL',
  lycee: 'HIGH_SCHOOL',
  lyceemilitaire: 'HIGH_SCHOOL',
  universite: 'UNIVERSITY',
  university: 'UNIVERSITY',
  faculte: 'FACULTY',
  engineering: 'ENGINEERING_SCHOOL',
  ingenierie: 'ENGINEERING_SCHOOL',
  grandeecole: 'ENGINEERING_SCHOOL',
  commerce: 'BUSINESS_SCHOOL',
  businessschool: 'BUSINESS_SCHOOL',
  institut: 'INSTITUTE',
  formationprofessionnelle: 'VOCATIONAL_TRAINING',
  ofppt: 'OFPPT',
  langues: 'LANGUAGE_CENTER',
  centrelangues: 'LANGUAGE_CENTER',
  centreformation: 'TRAINING_CENTER',
};

const SECTOR_ALIASES = {
  public: 'PUBLIC',
  publique: 'PUBLIC',
  prive: 'PRIVATE',
  privee: 'PRIVATE',
  private: 'PRIVATE',
  semipublic: 'SEMI_PUBLIC',
  semipublique: 'SEMI_PUBLIC',
  publicaconfirmer: 'PUBLIC',
};

function importedType(raw) {
  const normalized = normalizeHeader(raw);
  const direct = normalizeType(raw) || TYPE_ALIASES[normalized];
  if (direct) return direct;
  if (normalized.includes('universite')) return 'UNIVERSITY';
  if (normalized.includes('faculte')) return 'FACULTY';
  if (normalized.includes('ofppt')) return 'OFPPT';
  if (normalized.includes('formation')) return 'VOCATIONAL_TRAINING';
  if (normalized.includes('lycee')) return 'HIGH_SCHOOL';
  if (normalized.includes('college')) return 'MIDDLE_SCHOOL';
  if (normalized.includes('primaire')) return 'PRIMARY_SCHOOL';
  if (normalized.includes('maternelle') || normalized.includes('prescolaire') || normalized.includes('preparatoire')) return 'PRESCHOOL';
  if (normalized.includes('ecole')) return 'PRIMARY_SCHOOL';
  if (normalized.includes('etablissement')) return 'OTHER';
  return 'OTHER';
}

function importedSector(raw) {
  return normalizeSector(raw) || SECTOR_ALIASES[normalizeHeader(raw)] || 'PUBLIC';
}

function rowToPayload(row) {
  const name = valueFrom(row, ['nom', 'name', 'etablissement', 'institution']);
  const address = valueFrom(row, ['adresse', 'address']);
  const city = valueFrom(row, ['ville', 'city']);
  const region = valueFrom(row, ['region']);
  const province = valueFrom(row, ['province', 'prefecture', 'prefectureprovince']);
  return {
    name,
    nameAr: valueFrom(row, ['nomar', 'namear']),
    nameFr: valueFrom(row, ['nomfr', 'namefr']),
    nameEn: valueFrom(row, ['nomen', 'nameen']),
    institutionType: importedType(valueFrom(row, ['type', 'typedetablissement', 'institutiontype', 'level', 'niveau'])),
    sector: importedSector(valueFrom(row, ['secteur', 'sector'])),
    description: valueFrom(row, ['description']),
    address,
    postalCode: valueFrom(row, ['codepostal', 'postalcode']),
    region,
    province,
    city,
    latitude: valueFrom(row, ['latitude', 'lat']),
    longitude: valueFrom(row, ['longitude', 'lng', 'lon']),
    phone: valueFrom(row, ['telephone', 'tel', 'phone']),
    secondaryPhone: valueFrom(row, ['telephonesecondaire', 'secondaryphone']),
    email: valueFrom(row, ['email', 'mail']),
    website: valueFrom(row, ['siteweb', 'website', 'url']),
    facebookUrl: valueFrom(row, ['facebook', 'facebookurl']),
    instagramUrl: valueFrom(row, ['instagram', 'instagramurl']),
    linkedinUrl: valueFrom(row, ['linkedin', 'linkedinurl']),
    logoUrl: valueFrom(row, ['logo', 'logourl']),
    coverImageUrl: valueFrom(row, ['image', 'cover', 'coverimageurl']),
    source: valueFrom(row, ['source']) || 'IMPORT',
    sourceUrl: valueFrom(row, ['sourceurl', 'urlsource', 'maporsourceurl', 'mapurl']),
    externalId: valueFrom(row, ['externalid', 'identifiantexterne', 'idexterne']),
    dataSource: valueFrom(row, ['datasource']) || valueFrom(row, ['source']) || 'IMPORT',
    metadata: {
      level: valueFrom(row, ['level', 'niveau']),
      gpsStatus: valueFrom(row, ['gpsstatus']),
      details: valueFrom(row, ['details']),
      confidence: valueFrom(row, ['confidence']),
    },
    isPublished: true,
    isVerified: false,
  };
}

function readRowsFromBuffer(buffer, filename = '') {
  if (/\.json$/i.test(filename)) {
    const parsed = JSON.parse(buffer.toString('utf8'));
    return Array.isArray(parsed) ? parsed : parsed.items || parsed.data || [];
  }
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

async function findDuplicate(payload) {
  if (payload.source && payload.externalId) {
    const byExternal = await prisma.educationInstitution.findFirst({
      where: { source: payload.source, externalId: payload.externalId },
    });
    if (byExternal) return byExternal;
  }

  if (payload.name && payload.city && payload.institutionType) {
    const byCityType = await prisma.educationInstitution.findFirst({
      where: {
        name: { equals: payload.name, mode: 'insensitive' },
        city: { equals: payload.city, mode: 'insensitive' },
        institutionType: payload.institutionType,
      },
    });
    if (byCityType) return byCityType;
  }

  if (payload.name && payload.address) {
    return prisma.educationInstitution.findFirst({
      where: {
        name: { equals: payload.name, mode: 'insensitive' },
        address: { equals: payload.address, mode: 'insensitive' },
      },
    });
  }

  return null;
}

async function importInstitutions(buffer, admin, filename = '') {
  const rows = readRowsFromBuffer(buffer, filename);
  const results = { created: 0, updated: 0, ignored: 0, failed: 0, errors: [] };
  const categoryId = await educationCategoryId();
  const adminId = currentUserId(admin);

  for (let i = 0; i < rows.length; i += 1) {
    const payload = rowToPayload(rows[i]);
    if (!payload.name || !payload.city || !payload.institutionType || !payload.sector) {
      results.failed += 1;
      results.errors.push({ row: i + 2, message: 'Nom, ville, type et secteur sont obligatoires.' });
      continue;
    }

    try {
      const existing = await findDuplicate(payload);
      const data = {
        ...buildWriteData(payload, { imported: true }),
        categoryId,
      };

      if (existing) {
        if (existing.manuallyEdited) {
          await prisma.educationInstitution.update({
            where: { id: existing.id },
            data: {
              source: data.source,
              sourceUrl: data.sourceUrl,
              externalId: data.externalId,
              dataSource: data.dataSource,
              lastImportedAt: data.lastImportedAt,
            },
          });
          results.ignored += 1;
        } else {
          await prisma.educationInstitution.update({ where: { id: existing.id }, data });
          results.updated += 1;
        }
      } else {
        await prisma.educationInstitution.create({
          data: {
            ...data,
            slug: await uniqueSlug(`${payload.name}-${payload.city}-${payload.institutionType}`),
            createdById: adminId,
            manuallyEdited: false,
          },
        });
        results.created += 1;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 2, message: error.message });
    }
  }

  return results;
}

function previewImport(buffer, filename = '') {
  const rows = readRowsFromBuffer(buffer, filename);
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return {
    columns,
    sample: rows.slice(0, 5),
    totalRows: rows.length,
    suggestedMapping: Object.fromEntries(columns.map((column) => [column, normalizeHeader(column)])),
  };
}

module.exports = {
  slugify,
  uniqueSlug,
  listInstitutions,
  getInstitutionBySlug,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  publishInstitution,
  importInstitutions,
  previewImport,
  rowToPayload,
  findDuplicate,
};
