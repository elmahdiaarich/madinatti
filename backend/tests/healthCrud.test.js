const test = require('node:test');
const assert = require('node:assert/strict');
const XLSX = require('xlsx');

function loadHealthPlacesWithMock(prisma) {
  const dbPath = require.resolve('../config/db');
  const servicePath = require.resolve('../services/healthPlaces');
  delete require.cache[servicePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: prisma,
  };
  return require('../services/healthPlaces');
}

function makePlace(overrides = {}) {
  return {
    id: 'place-1',
    slug: 'clinique-test',
    googlePlaceId: null,
    source: 'MADINATI',
    name: 'Clinique Test',
    subcategory: 'hospital-clinic',
    categoryId: 'cat-hospital',
    googleTypes: [],
    description: null,
    address: 'Centre, Kenitra',
    neighborhood: 'Centre',
    city: 'Kenitra',
    region: null,
    postalCode: null,
    country: 'MA',
    latitude: null,
    longitude: null,
    phones: ['0537000000'],
    contactEmail: null,
    website: null,
    images: [],
    googleMapsUri: null,
    businessStatus: null,
    rating: null,
    userRatingCount: null,
    regularHours: null,
    currentHours: null,
    openNow: null,
    status: 'APPROVED',
    isVerified: true,
    ownerId: 'admin-1',
    lastGoogleRefreshAt: null,
    createdAt: new Date('2026-07-24T10:00:00Z'),
    updatedAt: new Date('2026-07-24T10:00:00Z'),
    ...overrides,
  };
}

test('health payload validation allows clearing optional coordinates', () => {
  const { validatePlacePayload } = require('../utils/healthValidator');

  const parsed = validatePlacePayload({
    name: 'Clinique Test',
    subcategory: 'hospital-clinic',
    latitude: null,
    longitude: null,
  });

  assert.equal(parsed.valid, true);
});

test('admin can create an approved health place with JWT userId and no coordinates', async () => {
  let createdData;
  const prisma = {
    category: {
      findUnique: async () => ({ id: 'cat-hospital' }),
    },
    healthPlace: {
      findUnique: async ({ where }) => (where.slug ? null : null),
      create: async ({ data }) => {
        createdData = data;
        return makePlace({ ...data, id: 'created-1' });
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  const created = await healthPlaces.createPlace(
    {
      name: ' Hopital Test ',
      subcategory: 'hospital-clinic',
      phone: ' 0537000001 ',
      latitude: null,
      longitude: null,
      status: 'APPROVED',
    },
    { userId: 'admin-1', role: 'admin' },
  );

  assert.equal(created.id, 'created-1');
  assert.equal(createdData.ownerId, 'admin-1');
  assert.equal(createdData.reviewedBy, 'admin-1');
  assert.equal(createdData.latitude, null);
  assert.deepEqual(createdData.phones, ['0537000001']);
  assert.equal(created.status, 'APPROVED');
});

test('health place images are normalized with a single cover image', async () => {
  let createdData;
  const prisma = {
    category: {
      findUnique: async () => ({ id: 'cat-pharmacy' }),
    },
    healthPlace: {
      findUnique: async () => null,
      create: async ({ data }) => {
        createdData = data;
        return makePlace({ ...data, id: 'created-images-1' });
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  await healthPlaces.createPlace(
    {
      name: 'Pharmacie Photo Test',
      subcategory: 'pharmacy',
      images: [
        { url: 'https://example.com/a.jpg' },
        { url: 'https://example.com/b.jpg', isCover: true },
        { url: 'https://example.com/c.jpg', isCover: true },
      ],
      status: 'APPROVED',
    },
    { userId: 'admin-1', role: 'admin' },
  );

  assert.equal(createdData.images.length, 3);
  assert.deepEqual(createdData.images.map((image) => image.isCover), [false, true, false]);
});

test('owner update uses JWT userId, refreshes category, and normalizes response', async () => {
  let updateData;
  const prisma = {
    category: {
      findUnique: async () => ({ id: 'cat-doctor' }),
    },
    healthPlace: {
      findUnique: async ({ where }) => {
        if (where.id) return makePlace({ ownerId: 'owner-1' });
        if (where.slug) return null;
        return null;
      },
      update: async ({ data }) => {
        updateData = data;
        return makePlace({ ...data, ownerId: 'owner-1' });
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  const updated = await healthPlaces.updatePlace(
    'place-1',
    {
      name: 'Cabinet Test',
      subcategory: 'doctor-office',
      phone: '0611111111',
      latitude: '',
      longitude: '',
    },
    { userId: 'owner-1', role: 'business' },
  );

  assert.equal(updateData.status, 'PENDING');
  assert.equal(updateData.categoryId, 'cat-doctor');
  assert.equal(updateData.isVerified, false);
  assert.equal(updateData.latitude, null);
  assert.deepEqual(updated.phones, ['0611111111']);
});

test('admin update status also updates verification metadata', async () => {
  let updateData;
  const prisma = {
    healthPlace: {
      findUnique: async ({ where }) => (where.id ? makePlace({ isVerified: true }) : null),
      update: async ({ data }) => {
        updateData = data;
        return makePlace({ ...data });
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  await healthPlaces.updatePlace('place-1', { status: 'SUSPENDED' }, { userId: 'admin-1', role: 'admin' });

  assert.equal(updateData.status, 'SUSPENDED');
  assert.equal(updateData.isVerified, false);
  assert.equal(updateData.reviewedBy, 'admin-1');
  assert.ok(updateData.reviewedAt instanceof Date);
});

test('deletePlace returns null when a health place does not exist', async () => {
  const prisma = {
    healthPlace: {
      findUnique: async () => null,
      delete: async () => {
        throw new Error('delete should not be called');
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  assert.equal(await healthPlaces.deletePlace('missing'), null);
});

test('CSV/XLSX import creates approved health places from hospital rows', async () => {
  const rows = [
    {
      Categorie: 'Clinique',
      Nom: 'Clinique Import Test',
      Quartier: 'Maamora',
      Ville: 'Kenitra',
      Contact: '0537000099',
      Latitude: '34.25',
      Longitude: '-6.57',
    },
  ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sante');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  const created = [];
  const prisma = {
    category: {
      findUnique: async () => ({ id: 'cat-hospital' }),
    },
    healthPlace: {
      findUnique: async () => null,
      create: async ({ data }) => {
        created.push(data);
        return makePlace(data);
      },
      update: async () => {
        throw new Error('update should not be called');
      },
    },
  };
  const healthPlaces = loadHealthPlacesWithMock(prisma);

  const result = await healthPlaces.importPlaces(buffer, { userId: 'admin-1', role: 'admin' });

  assert.equal(result.created, 1);
  assert.equal(result.failed, 0);
  assert.equal(created[0].subcategory, 'hospital-clinic');
  assert.equal(created[0].reviewedBy, 'admin-1');
  assert.deepEqual(created[0].phones, ['0537000099']);
});
