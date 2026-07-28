const test = require('node:test');
const assert = require('node:assert/strict');

function loadCarsWithMock(prisma) {
  const prismaClientPath = require.resolve('@prisma/client');
  const servicePath = require.resolve('../services/cars');
  delete require.cache[servicePath];
  require.cache[prismaClientPath] = {
    id: prismaClientPath,
    filename: prismaClientPath,
    loaded: true,
    exports: {
      PrismaClient: function PrismaClient() {
        return prisma;
      },
    },
  };
  return require('../services/cars');
}

function makeListing(overrides = {}) {
  return {
    id: 'car-1',
    slug: 'toyota-corolla-test',
    userId: 'owner-1',
    categoryId: 'cat-car',
    title: 'Toyota Corolla test',
    description: 'Voiture tres propre pour test',
    listingType: 'SALE',
    condition: 'USED',
    make: 'Toyota',
    model: 'Corolla',
    year: 2021,
    mileage: 45000,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    bodyType: 'SEDAN',
    color: 'Blanc',
    doors: 4,
    seats: 5,
    engineSize: 1.6,
    horsePower: 110,
    price: 145000,
    isNegotiable: true,
    city: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    location: 'Centre, Kenitra',
    latitude: 34.261,
    longitude: -6.5802,
    contactPhone: '0611111111',
    images: [],
    features: {},
    status: 'APPROVED',
    isActive: true,
    isFeatured: false,
    isSponsored: false,
    boostExpiresAt: null,
    viewsCount: 0,
    adminNotes: null,
    reviewedAt: null,
    reviewedBy: null,
    publishedAt: null,
    createdAt: new Date('2026-07-24T10:00:00Z'),
    updatedAt: new Date('2026-07-24T10:00:00Z'),
    deletedByOwner: false,
    deletedAt: null,
    ...overrides,
  };
}

function validCarPayload(overrides = {}) {
  return {
    categoryId: 'cat-car',
    title: 'Toyota Corolla test',
    description: 'Voiture propre et bien entretenue',
    listingType: 'SALE',
    condition: 'USED',
    make: ' Toyota ',
    model: ' Corolla ',
    year: '2021',
    mileage: '45000',
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    bodyType: 'SEDAN',
    color: ' Blanc ',
    doors: '4',
    seats: '5',
    engineSize: '1.6',
    horsePower: '110',
    price: '145000',
    isNegotiable: true,
    city: ' Kenitra ',
    region: ' Rabat-Sale-Kenitra ',
    location: ' Centre ',
    latitude: '34.261',
    longitude: '-6.5802',
    contactPhone: ' 0611111111 ',
    images: [],
    features: { abs: true },
    ...overrides,
  };
}

test('vehicle create normalizes numeric and string fields and starts pending', async () => {
  let createdData;
  const prisma = {
    carListing: {
      create: async ({ data }) => {
        createdData = data;
        return makeListing(data);
      },
    },
  };
  const cars = loadCarsWithMock(prisma);

  const listing = await cars.createListing(validCarPayload(), 'owner-1');

  assert.equal(createdData.userId, 'owner-1');
  assert.equal(createdData.make, 'Toyota');
  assert.equal(createdData.year, 2021);
  assert.equal(createdData.price, 145000);
  assert.equal(createdData.status, 'PENDING');
  assert.equal(listing.id, 'car-1');
});

test('vehicle public listing applies approved active filters and pagination cap', async () => {
  let findWhere;
  let takeValue;
  const prisma = {
    $transaction: async (ops) => Promise.all(ops),
    carListing: {
      findMany: async ({ where, take }) => {
        findWhere = where;
        takeValue = take;
        return [makeListing()];
      },
      count: async () => 1,
    },
  };
  const cars = loadCarsWithMock(prisma);

  const result = await cars.getListings({ limit: '100', search: 'corolla', city: 'Kenitra', minPrice: '100000' });

  assert.equal(findWhere.status, 'APPROVED');
  assert.equal(findWhere.isActive, true);
  assert.equal(findWhere.city.contains, 'Kenitra');
  assert.equal(findWhere.price.gte, 100000);
  assert.equal(takeValue, 50);
  assert.equal(result.pagination.totalPages, 1);
});

test('vehicle favorite toggles between add and remove', async () => {
  const favorites = [];
  const prisma = {
    favorite: {
      findUnique: async () => favorites[0] || null,
      create: async ({ data }) => {
        favorites.push({ id: 'fav-1', ...data });
        return favorites[0];
      },
      delete: async () => favorites.pop(),
    },
  };
  const cars = loadCarsWithMock(prisma);

  assert.deepEqual(await cars.toggleFavorite('user-1', 'car-1'), { action: 'added' });
  assert.deepEqual(await cars.toggleFavorite('user-1', 'car-1'), { action: 'removed' });
});

test('vehicle owner update can clear nullable technical fields and resets moderation', async () => {
  let updateData;
  const prisma = {
    carListing: {
      findUnique: async () => makeListing({ userId: 'owner-1', status: 'APPROVED' }),
      update: async ({ data }) => {
        updateData = data;
        return makeListing(data);
      },
    },
  };
  const cars = loadCarsWithMock(prisma);

  const result = await cars.updateMyListing('car-1', 'owner-1', {
    mileage: null,
    doors: null,
    seats: null,
    engineSize: null,
    horsePower: null,
    contactPhone: '',
  });

  assert.equal(updateData.mileage, null);
  assert.equal(updateData.doors, null);
  assert.equal(updateData.seats, null);
  assert.equal(updateData.engineSize, null);
  assert.equal(updateData.horsePower, null);
  assert.equal(updateData.contactPhone, null);
  assert.equal(updateData.status, 'PENDING');
  assert.equal(updateData.publishedAt, null);
  assert.equal(result.listing.id, 'car-1');
});

test('vehicle owner delete archives and soft-deletes listing', async () => {
  let deleteData;
  const prisma = {
    carListing: {
      findUnique: async () => makeListing({ userId: 'owner-1' }),
      update: async ({ data }) => {
        deleteData = data;
        return makeListing(data);
      },
    },
  };
  const cars = loadCarsWithMock(prisma);

  assert.deepEqual(await cars.deleteMyListing('car-1', 'owner-1'), { success: true });
  assert.equal(deleteData.status, 'ARCHIVED');
  assert.equal(deleteData.isActive, false);
  assert.equal(deleteData.deletedByOwner, true);
  assert.ok(deleteData.deletedAt instanceof Date);
});

test('vehicle moderation approve publishes pending listing', async () => {
  let updateData;
  const prisma = {
    carListing: {
      findUnique: async () => makeListing({ status: 'PENDING' }),
      update: async ({ data }) => {
        updateData = data;
        return makeListing(data);
      },
    },
  };
  const cars = loadCarsWithMock(prisma);

  await cars.moderateListing('car-1', 'approve', 'admin-1', 'Ok');

  assert.equal(updateData.status, 'APPROVED');
  assert.equal(updateData.reviewedBy, 'admin-1');
  assert.equal(updateData.adminNotes, 'Ok');
  assert.ok(updateData.publishedAt instanceof Date);
});

test('vehicle suspend and unsuspend enforce allowed state transitions', async () => {
  const updates = [];
  const prisma = {
    carListing: {
      findUnique: async () => makeListing({ status: updates.length ? 'SUSPENDED' : 'APPROVED' }),
      update: async ({ data }) => {
        updates.push(data);
        return makeListing(data);
      },
    },
  };
  const cars = loadCarsWithMock(prisma);

  await cars.suspendListing('car-1', 'admin-1', 'Controle');
  await cars.unsuspendListing('car-1', 'admin-1');

  assert.equal(updates[0].status, 'SUSPENDED');
  assert.equal(updates[0].isActive, false);
  assert.equal(updates[1].status, 'APPROVED');
  assert.equal(updates[1].isActive, true);
});
