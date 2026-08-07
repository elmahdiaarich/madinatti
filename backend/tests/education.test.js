const test = require('node:test');
const assert = require('node:assert/strict');
const XLSX = require('xlsx');

function loadEducationWithMock(prisma) {
  const dbPath = require.resolve('../config/db');
  const servicePath = require.resolve('../services/educationInstitutions');
  delete require.cache[servicePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: prisma,
  };
  return require('../services/educationInstitutions');
}

function makeInstitution(overrides = {}) {
  return {
    id: 'edu-1',
    name: 'Universite Test',
    slug: 'universite-test-rabat',
    nameAr: null,
    nameFr: null,
    nameEn: null,
    categoryId: 'cat-education',
    institutionType: 'UNIVERSITY',
    sector: 'PUBLIC',
    description: null,
    descriptionAr: null,
    descriptionFr: null,
    descriptionEn: null,
    address: 'Avenue Test',
    postalCode: null,
    country: 'MA',
    region: 'Rabat-Sale-Kenitra',
    province: 'Rabat',
    city: 'Rabat',
    latitude: null,
    longitude: null,
    phone: '0537000000',
    secondaryPhone: null,
    email: null,
    website: null,
    facebookUrl: null,
    instagramUrl: null,
    linkedinUrl: null,
    logoUrl: null,
    coverImageUrl: null,
    openingHours: null,
    metadata: null,
    isVerified: false,
    isFeatured: false,
    isPublished: true,
    source: null,
    sourceUrl: null,
    externalId: null,
    dataSource: null,
    lastImportedAt: null,
    manuallyEdited: false,
    createdById: 'admin-1',
    createdAt: new Date('2026-08-07T10:00:00Z'),
    updatedAt: new Date('2026-08-07T10:00:00Z'),
    category: { id: 'cat-education', slug: 'education', module: 'education' },
    ...overrides,
  };
}

test('education payload validation rejects invalid enums and coordinates', () => {
  const { validateInstitutionPayload } = require('../utils/educationValidator');

  const bad = validateInstitutionPayload({
    name: '',
    institutionType: 'UNKNOWN',
    sector: 'OTHER',
    latitude: '99',
    longitude: '-7',
    website: 'ftp://example.ma',
    email: 'bad',
  });

  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name);
  assert.ok(bad.errors.institutionType);
  assert.ok(bad.errors.sector);
  assert.ok(bad.errors.latitude);
  assert.ok(bad.errors.website);
  assert.ok(bad.errors.email);
});

test('admin creates an education institution with category fallback and unique slug', async () => {
  let createdData;
  const prisma = {
    category: {
      upsert: async () => ({ id: 'cat-education' }),
      findFirst: async () => null,
    },
    educationInstitution: {
      findFirst: async () => null,
      create: async ({ data }) => {
        createdData = data;
        return makeInstitution(data);
      },
    },
  };
  const education = loadEducationWithMock(prisma);

  const created = await education.createInstitution(
    {
      name: ' Universite Mohammed V ',
      institutionType: 'UNIVERSITY',
      sector: 'PUBLIC',
      city: 'Rabat',
      latitude: '',
      longitude: '',
      isPublished: true,
    },
    { userId: 'admin-1', role: 'admin' },
  );

  assert.equal(created.name, 'Universite Mohammed V');
  assert.equal(createdData.categoryId, 'cat-education');
  assert.equal(createdData.createdById, 'admin-1');
  assert.equal(createdData.manuallyEdited, true);
  assert.equal(createdData.slug, 'universite-mohammed-v-rabat');
});

test('public list applies published, search, filters and pagination', async () => {
  let findArgs;
  let countArgs;
  const prisma = {
    educationInstitution: {
      findMany: async (args) => {
        findArgs = args;
        return [makeInstitution()];
      },
      count: async (args) => {
        countArgs = args;
        return 1;
      },
    },
  };
  const education = loadEducationWithMock(prisma);

  const result = await education.listInstitutions({
    page: 2,
    limit: 10,
    sort: 'name',
    order: 'asc',
    search: 'ibn sina',
    city: 'Rabat',
    region: 'Rabat',
    province: '',
    type: 'UNIVERSITY',
    sector: 'PUBLIC',
  });

  assert.equal(result.pagination.page, 2);
  assert.equal(findArgs.skip, 10);
  assert.equal(findArgs.take, 10);
  assert.deepEqual(findArgs.orderBy, [{ name: 'asc' }]);
  assert.equal(findArgs.where.isPublished, true);
  assert.equal(findArgs.where.institutionType, 'UNIVERSITY');
  assert.equal(findArgs.where.sector, 'PUBLIC');
  assert.ok(findArgs.where.OR.length >= 3);
  assert.deepEqual(countArgs.where, findArgs.where);
});

test('detail lookup accepts slug and id but hides unpublished public records', async () => {
  let whereArg;
  const prisma = {
    educationInstitution: {
      findFirst: async ({ where }) => {
        whereArg = where;
        return makeInstitution();
      },
    },
  };
  const education = loadEducationWithMock(prisma);

  const institution = await education.getInstitutionBySlug('universite-test-rabat');

  assert.equal(institution.slug, 'universite-test-rabat');
  assert.equal(whereArg.isPublished, true);
  assert.deepEqual(whereArg.OR, [{ slug: 'universite-test-rabat' }, { id: 'universite-test-rabat' }]);
});

test('update, publish and delete call the expected Prisma operations', async () => {
  const calls = [];
  const prisma = {
    educationInstitution: {
      findUnique: async () => makeInstitution({ id: 'edu-1', name: 'Old Name', city: 'Rabat' }),
      findFirst: async () => null,
      update: async ({ where, data }) => {
        calls.push({ op: 'update', where, data });
        return makeInstitution({ ...data, id: where.id });
      },
      delete: async ({ where }) => {
        calls.push({ op: 'delete', where });
        return makeInstitution({ id: where.id });
      },
    },
  };
  const education = loadEducationWithMock(prisma);

  await education.updateInstitution('edu-1', { name: 'New Name', institutionType: 'FACULTY' });
  await education.publishInstitution('edu-1', false);
  await education.deleteInstitution('edu-1');

  assert.equal(calls[0].data.slug, 'new-name-rabat');
  assert.equal(calls[0].data.manuallyEdited, true);
  assert.equal(calls[1].data.isPublished, false);
  assert.equal(calls[2].op, 'delete');
});

test('CSV/XLSX import creates and updates with external-id deduplication', async () => {
  const rows = [
    {
      Nom: 'Institut Import Test',
      Type: 'INSTITUTE',
      Secteur: 'PRIVATE',
      Ville: 'Casablanca',
      Region: 'Casablanca-Settat',
      Source: 'OFFICIAL',
      'Identifiant externe': 'inst-001',
    },
    {
      Nom: 'Institut Import Test',
      Type: 'INSTITUTE',
      Secteur: 'PRIVATE',
      Ville: 'Casablanca',
      Region: 'Casablanca-Settat',
      Source: 'OFFICIAL',
      'Identifiant externe': 'inst-001',
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Education');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const records = [];
  let findFirstCalls = 0;

  const prisma = {
    category: {
      upsert: async () => ({ id: 'cat-education' }),
    },
    educationInstitution: {
      findFirst: async ({ where }) => {
        if (where.slug) return null;
        findFirstCalls += 1;
        return findFirstCalls > 2 ? makeInstitution({ id: 'existing-1', manuallyEdited: false }) : null;
      },
      create: async ({ data }) => {
        records.push({ op: 'create', data });
        return makeInstitution(data);
      },
      update: async ({ data }) => {
        records.push({ op: 'update', data });
        return makeInstitution(data);
      },
    },
  };
  const education = loadEducationWithMock(prisma);

  const result = await education.importInstitutions(buffer, { userId: 'admin-1', role: 'admin' }, 'education.xlsx');

  assert.equal(result.created, 1);
  assert.equal(result.updated, 1);
  assert.equal(result.failed, 0);
  assert.equal(records[0].data.externalId, 'inst-001');
  assert.equal(records[0].data.manuallyEdited, false);
  assert.ok(records[1].data.lastImportedAt instanceof Date);
});

test('role middleware blocks education admin operations for non-admin users', () => {
  const roleMiddleware = require('../middlewares/roleMiddleware');
  const middleware = roleMiddleware('admin');
  let statusCode = null;
  const req = { user: { role: 'business' } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
});
