const test = require('node:test');
const assert = require('node:assert/strict');

function loadShopServiceWithMock(prisma) {
  const dbPath = require.resolve('../config/db');
  const servicePath = require.resolve('../services/shopService');
  delete require.cache[servicePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: prisma,
  };
  return require('../services/shopService');
}

function makeShop(overrides = {}) {
  return {
    id: 'shop-1',
    ownerUserId: 'owner-1',
    name: 'Auto Pro Kenitra',
    slug: 'auto-pro-kenitra',
    description: 'Boutique professionnelle de test',
    categoryId: 'cat-1',
    logo: null,
    coverImage: null,
    city: 'Kenitra',
    address: 'Centre ville',
    professionalPhone: '0611111111',
    professionalEmail: 'pro@example.com',
    legalName: 'Auto Pro SARL',
    taxIdentifier: 'IF123',
    website: null,
    socialLinks: {},
    openingHours: {},
    status: 'ACTIVE',
    isVerified: false,
    rejectionReason: null,
    adminNotes: null,
    createdAt: new Date('2026-08-03T08:00:00Z'),
    updatedAt: new Date('2026-08-03T08:00:00Z'),
    owner: { id: 'owner-1', name: 'Owner', email: 'owner@example.com', avatar: null },
    category: { id: 'cat-1', name: 'Automobile', slug: 'automobile', module: 'automobile' },
    subscriptions: [
      {
        id: 'sub-1',
        shopId: 'shop-1',
        planId: 'plan-1',
        status: 'ACTIVE',
        startsAt: new Date('2026-08-03T08:00:00Z'),
        expiresAt: new Date('2026-09-03T08:00:00Z'),
        cancelledAt: null,
        createdAt: new Date('2026-08-03T08:00:00Z'),
        updatedAt: new Date('2026-08-03T08:00:00Z'),
        plan: { id: 'plan-1', name: 'Basique', displayedPrice: '99 MAD/mois', listingLimit: 20 },
      },
    ],
    ...overrides,
  };
}

function makePrisma(overrides = {}) {
  return {
    shopSubscriptionPlan: {
      findMany: async () => [{ id: 'plan-1', name: 'Basique', active: true, displayOrder: 1 }],
      findFirst: async () => ({ id: 'plan-1', name: 'Basique', active: true }),
    },
    shop: {
      findUnique: async () => null,
      findFirst: async () => makeShop(),
      findMany: async () => [makeShop()],
      count: async () => 1,
      create: async ({ data }) => makeShop({ ...data, id: 'shop-new', slug: data.slug }),
      update: async ({ data }) => makeShop({ ...data }),
    },
    shopSubscription: {
      create: async ({ data }) => ({ id: 'sub-new', ...data }),
      update: async ({ data }) => ({ id: 'sub-1', ...data }),
    },
    jobListing: { count: async () => 1, findMany: async () => [] },
    realEstateListing: { count: async () => 2, findMany: async () => [] },
    carListing: { count: async () => 3, findMany: async () => [] },
    user: {
      findUnique: async () => ({
        id: 'owner-1',
        name: 'Owner',
        email: 'owner@example.com',
        phone: '0611111111',
        avatar: null,
        city: 'Kenitra',
        companyName: 'Auto Pro Kenitra',
        companyLogo: null,
        companyWebsite: 'https://auto-pro.test',
        createdAt: new Date('2026-08-03T08:00:00Z'),
        updatedAt: new Date('2026-08-03T08:00:00Z'),
        subscriptions: [
          {
            id: 'account-sub-1',
            planId: 'pro',
            status: 'ACTIVE',
            startedAt: new Date('2026-08-03T08:00:00Z'),
            expiresAt: new Date('2026-09-03T08:00:00Z'),
            plan: {
              id: 'pro',
              name: 'Pro',
              price: 179,
              maxListings: 20,
              maxPhotos: 20,
              hasBadge: true,
              hasStatistics: true,
            },
          },
        ],
      }),
    },
    ...overrides,
  };
}

test('shop payload validation rejects missing required fields and unsafe urls', () => {
  const { validateShopPayload } = require('../utils/shopValidator');
  const result = validateShopPayload({
    name: '',
    description: 'short',
    city: '',
    professionalPhone: '',
    logo: 'javascript:alert(1)',
    planId: '',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.name, 'Nom de boutique requis.');
  assert.equal(result.errors.description, 'Description requise.');
  assert.equal(result.errors.logo, 'Logo invalide.');
  assert.equal(result.errors.planId, 'Formule requise.');
});

test('createShop stores selected plan and serializes listing stats', async () => {
  const created = [];
  const prisma = makePrisma({
    shop: {
      ...makePrisma().shop,
      create: async ({ data }) => {
        created.push(data);
        return makeShop({ ...data, id: 'shop-new', slug: data.slug });
      },
    },
  });
  const service = loadShopServiceWithMock(prisma);

  const shop = await service.createShop({
    name: 'Auto Pro Kenitra',
    description: 'Boutique professionnelle avec toutes les informations requises.',
    city: 'Kenitra',
    professionalPhone: '0611111111',
    planId: 'plan-1',
  }, { userId: 'owner-1' });

  assert.equal(created[0].ownerUserId, 'owner-1');
  assert.equal(created[0].subscriptions.create.planId, 'plan-1');
  assert.equal(shop.slug, 'auto-pro-kenitra');
  assert.equal(shop.activeListingsCount, 6);
});

test('listPlans syncs four active boutique plans and disables legacy plans', async () => {
  const upserted = [];
  let disabledLegacy = false;
  const prisma = makePrisma({
    $transaction: async (operations) => Promise.all(operations),
    shopSubscriptionPlan: {
      upsert: async ({ where, update, create }) => {
        upserted.push(where.slug);
        return { id: where.slug, slug: where.slug, ...create, ...update };
      },
      updateMany: async ({ where, data }) => {
        disabledLegacy = data.active === false && Array.isArray(where.slug.notIn);
        return { count: 2 };
      },
      findMany: async () => [
        { id: 'gratuit', slug: 'gratuit', name: 'Gratuit', active: true, displayOrder: 1 },
        { id: 'basic', slug: 'basic', name: 'Basic', active: true, displayOrder: 2 },
        { id: 'pro', slug: 'pro', name: 'Pro', active: true, displayOrder: 3 },
        { id: 'max', slug: 'max', name: 'Max', active: true, displayOrder: 4 },
      ],
    },
  });
  const service = loadShopServiceWithMock(prisma);

  const plans = await service.listPlans();

  assert.deepEqual(upserted, ['gratuit', 'basic', 'pro', 'max']);
  assert.equal(disabledLegacy, true);
  assert.deepEqual(plans.map((plan) => plan.slug), ['gratuit', 'basic', 'pro', 'max']);
});

test('prepareListingOwnership rejects inactive subscriptions and returns shop ownership fields', async () => {
  const service = loadShopServiceWithMock(makePrisma());
  const owner = await service.prepareListingOwnership('shop-1', 'owner-1');
  assert.deepEqual(owner, { sellerType: 'SHOP', shopId: 'shop-1' });

  const inactiveService = loadShopServiceWithMock(makePrisma({
    shop: { ...makePrisma().shop, findFirst: async () => makeShop({ subscriptions: [{ status: 'EXPIRED', plan: { listingLimit: 20 } }] }) },
  }));
  await assert.rejects(
    () => inactiveService.prepareListingOwnership('shop-1', 'owner-1'),
    /Abonnement boutique inactif/
  );
});

test('adminUpdateShop can approve, verify and update simulated subscription status', async () => {
  const subscriptionUpdates = [];
  const prisma = makePrisma({
    shop: {
      ...makePrisma().shop,
      update: async ({ data }) => makeShop({ ...data, status: data.status || 'ACTIVE', isVerified: data.isVerified ?? false }),
      findUnique: async () => makeShop({ status: 'ACTIVE', isVerified: true }),
    },
    shopSubscription: {
      create: async ({ data }) => data,
      update: async ({ data }) => {
        subscriptionUpdates.push(data);
        return data;
      },
    },
  });
  const service = loadShopServiceWithMock(prisma);

  const shop = await service.adminUpdateShop('shop-1', {
    status: 'ACTIVE',
    isVerified: true,
    subscriptionStatus: 'ACTIVE',
  });

  assert.equal(shop.status, 'ACTIVE');
  assert.equal(shop.isVerified, true);
  assert.equal(subscriptionUpdates[0].status, 'ACTIVE');
  assert.ok(subscriptionUpdates[0].expiresAt instanceof Date);
});

test('getPublicShop exposes a generated boutique for active PRO account plans', async () => {
  const prisma = makePrisma({
    shop: { ...makePrisma().shop, findFirst: async () => null },
  });
  const service = loadShopServiceWithMock(prisma);

  const shop = await service.getPublicShop('business-owner-1');

  assert.equal(shop.slug, 'business-owner-1');
  assert.equal(shop.name, 'Auto Pro Kenitra');
  assert.equal(shop.status, 'ACTIVE');
  assert.equal(shop.isVerified, true);
  assert.equal(shop.subscription.plan.id, 'pro');
  assert.equal(shop.activeListingsCount, 6);
});
