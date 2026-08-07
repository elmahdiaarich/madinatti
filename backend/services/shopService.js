const prisma = require('../config/db');
const { SHOP_SUBSCRIPTION_PLANS, SHOP_SUBSCRIPTION_PLAN_SLUGS } = require('../config/shopSubscriptionPlans');

const ACCOUNT_BOUTIQUE_PREFIX = 'business-';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(name, currentId) {
  const base = slugify(name) || 'boutique';
  let slug = base;
  let i = 2;
  while (true) {
    const existing = await prisma.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${i++}`;
  }
}

function accountBoutiqueSlug(userId) {
  return `${ACCOUNT_BOUTIQUE_PREFIX}${userId}`;
}

const shopInclude = {
  owner: { select: { id: true, name: true, email: true, avatar: true } },
  category: { select: { id: true, name: true, slug: true, module: true } },
  subscriptions: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { plan: true },
  },
};

function isActiveAccountSubscription(subscription) {
  if (!subscription || subscription.status !== 'ACTIVE') return false;
  if (subscription.expiresAt && new Date(subscription.expiresAt) <= new Date()) return false;
  return Boolean(subscription.plan?.hasBadge);
}

function accountSubscriptionSummary(user) {
  const subscription = user?.subscriptions?.find(isActiveAccountSubscription) || null;
  if (!subscription) return null;
  const price = subscription.plan?.price === undefined ? null : Number(subscription.plan.price);
  return {
    id: subscription.id,
    status: subscription.status,
    startedAt: subscription.startedAt,
    expiresAt: subscription.expiresAt,
    planId: subscription.planId,
    plan: subscription.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.id,
          displayedPrice: price === null ? null : price === 0 ? 'Gratuit' : `${price} MAD`,
          hasBadge: subscription.plan.hasBadge,
          hasStatistics: subscription.plan.hasStatistics,
          maxListings: subscription.plan.maxListings,
          maxPhotos: subscription.plan.maxPhotos,
        }
      : null,
  };
}

function buildAccountBoutique(user, { listings = [], counts = {}, stats = null } = {}) {
  const subscription = accountSubscriptionSummary(user);
  if (!user || !subscription) return null;
  const activeListingsCount = counts.total ?? listings.length ?? 0;
  return {
    id: `account-${user.id}`,
    ownerUserId: user.id,
    name: user.companyName || user.name || 'Boutique professionnelle',
    slug: accountBoutiqueSlug(user.id),
    description:
      user.boutiqueDescription ||
      (user.companyName
        ? `${user.companyName} publie ses annonces professionnelles sur Madinatti.`
        : 'Profil professionnel Madinatti.'),
    categoryId: null,
    logo: user.companyLogo || user.avatar || null,
    coverImage: user.boutiqueBanner || null,
    city: user.city || '',
    address: null,
    professionalPhone: user.boutiquePhone || user.phone || null,
    professionalEmail: user.boutiqueEmail || user.email || null,
    legalName: user.companyName || null,
    taxIdentifier: null,
    website: user.companyWebsite || null,
    socialLinks: {},
    openingHours: {},
    status: 'ACTIVE',
    isVerified: true,
    isAccountBoutique: true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    owner: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    category: null,
    subscriptions: [subscription],
    subscription,
    activeListingsCount,
    stats: stats || {
      activeListings: activeListingsCount,
      expiredListings: counts.expired || 0,
      views: counts.views || activeListingsCount * 23,
      contacts: counts.contacts || activeListingsCount * 2,
      favorites: counts.favorites || activeListingsCount,
      shopVisits: counts.shopVisits || activeListingsCount * 8,
      demo: true,
    },
    listings,
    customization: {
      description: user.boutiqueDescription || '',
      banner: user.boutiqueBanner || '',
      phone: user.boutiquePhone || '',
      email: user.boutiqueEmail || '',
      listingSort: user.boutiqueListingSort || 'newest',
      featuredListingIds: Array.isArray(user.boutiqueFeaturedListingIds) ? user.boutiqueFeaturedListingIds : [],
    },
  };
}

function subscriptionSummary(shop) {
  const subscription = shop.subscriptions?.[0] || null;
  if (!subscription) return null;
  return {
    ...subscription,
    plan: subscription.plan || null,
  };
}

function accountBoutiqueUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    phone: true,
    avatar: true,
    city: true,
    companyName: true,
    companyLogo: true,
    companyWebsite: true,
    boutiqueDescription: true,
    boutiqueBanner: true,
    boutiquePhone: true,
    boutiqueEmail: true,
    boutiqueListingSort: true,
    boutiqueFeaturedListingIds: true,
    createdAt: true,
    updatedAt: true,
    subscriptions: {
      where: {
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: 'desc' },
      take: 1,
      include: { plan: true },
    },
  };
}

async function serializeAccountBoutique(user, { includeListings = false } = {}) {
  if (!accountSubscriptionSummary(user)) return null;
  const [jobCount, realEstateCount, carCount, expiredJobs, expiredRealEstate, expiredCars] = await Promise.all([
    prisma.jobListing.count({ where: { userId: user.id, status: 'APPROVED', deletedByOwner: false } }).catch(() => 0),
    prisma.realEstateListing.count({ where: { userId: user.id, status: 'APPROVED', deletedByOwner: false } }).catch(() => 0),
    prisma.carListing.count({ where: { userId: user.id, status: 'APPROVED', isActive: true } }).catch(() => 0),
    prisma.jobListing.count({ where: { userId: user.id, status: { not: 'APPROVED' }, deletedByOwner: false } }).catch(() => 0),
    prisma.realEstateListing.count({ where: { userId: user.id, status: { not: 'APPROVED' }, deletedByOwner: false } }).catch(() => 0),
    prisma.carListing.count({ where: { userId: user.id, status: { not: 'APPROVED' } } }).catch(() => 0),
  ]);
  let listings = [];
  if (includeListings) {
    const [jobs, realEstate, cars] = await Promise.all([
      prisma.jobListing.findMany({ where: { userId: user.id, status: 'APPROVED', deletedByOwner: false }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.realEstateListing.findMany({ where: { userId: user.id, status: 'APPROVED', deletedByOwner: false }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.carListing.findMany({ where: { userId: user.id, status: 'APPROVED', isActive: true }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);
    listings = [
      ...jobs.map((item) => ({ ...item, module: 'jobs' })),
      ...realEstate.map((item) => ({ ...item, module: 'real-estate' })),
      ...cars.map((item) => ({ ...item, module: 'cars' })),
    ];
    const featuredIds = Array.isArray(user.boutiqueFeaturedListingIds) ? user.boutiqueFeaturedListingIds : [];
    const rank = new Map(featuredIds.map((id, index) => [id, index]));
    const sortMode = user.boutiqueListingSort || 'newest';
    listings.sort((a, b) => {
      const aRank = rank.has(a.id) ? rank.get(a.id) : 9999;
      const bRank = rank.has(b.id) ? rank.get(b.id) : 9999;
      if (aRank !== bRank) return aRank - bRank;
      if (sortMode === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortMode === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortMode === 'views') return Number(b.viewsCount || 0) - Number(a.viewsCount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  const total = jobCount + realEstateCount + carCount;
  const expired = expiredJobs + expiredRealEstate + expiredCars;
  const views = listings.reduce((sum, item) => sum + Number(item.viewsCount || 0), 0);
  return buildAccountBoutique(user, {
    listings,
    counts: {
      total,
      expired,
      views: views || total * 23,
      contacts: total * 2,
      favorites: total,
      shopVisits: total * 8,
    },
  });
}

function normalizeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (!/^https?:\/\/.+/i.test(trimmed)) {
    const err = new Error('URL invalide.');
    err.status = 400;
    throw err;
  }
  return trimmed;
}

function normalizeFeaturedIds(value) {
  if (Array.isArray(value)) return value.map((id) => String(id).trim()).filter(Boolean).slice(0, 12);
  return String(value || '')
    .split(/[\n,;]+/)
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function updateAccountBoutique(payload, user) {
  const userId = user.userId || user.id;
  const sortValues = new Set(['newest', 'price_asc', 'price_desc', 'views']);
  const listingSort = payload.boutiqueListingSort || payload.listingSort;
  if (listingSort && !sortValues.has(listingSort)) {
    const err = new Error('Tri boutique invalide.');
    err.status = 400;
    throw err;
  }

  const data = {
    boutiqueDescription: payload.boutiqueDescription === undefined ? undefined : String(payload.boutiqueDescription || '').trim().slice(0, 700) || null,
    boutiqueBanner: payload.boutiqueBanner === undefined ? undefined : normalizeUrl(payload.boutiqueBanner),
    boutiquePhone: payload.boutiquePhone === undefined ? undefined : String(payload.boutiquePhone || '').trim().slice(0, 30) || null,
    boutiqueEmail: payload.boutiqueEmail === undefined ? undefined : String(payload.boutiqueEmail || '').trim().slice(0, 120) || null,
    boutiqueListingSort: listingSort || undefined,
    boutiqueFeaturedListingIds: payload.boutiqueFeaturedListingIds === undefined ? undefined : normalizeFeaturedIds(payload.boutiqueFeaturedListingIds),
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  const accountUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: accountBoutiqueUserSelect(),
  });
  return serializeAccountBoutique(accountUser, { includeListings: true });
}

async function serializeShop(shop, { includeListings = false } = {}) {
  if (!shop) return null;
  const [jobCount, realEstateCount, carCount] = await Promise.all([
    prisma.jobListing.count({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false } }).catch(() => 0),
    prisma.realEstateListing.count({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false } }).catch(() => 0),
    prisma.carListing.count({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false } }).catch(() => 0),
  ]);
  const listingsCount = jobCount + realEstateCount + carCount;
  let listings = [];
  if (includeListings) {
    const [jobs, realEstate, cars] = await Promise.all([
      prisma.jobListing.findMany({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.realEstateListing.findMany({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.carListing.findMany({ where: { shopId: shop.id, status: 'APPROVED', deletedByOwner: false }, take: 30, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);
    listings = [
      ...jobs.map((item) => ({ ...item, module: 'jobs' })),
      ...realEstate.map((item) => ({ ...item, module: 'real-estate' })),
      ...cars.map((item) => ({ ...item, module: 'cars' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const subscription = subscriptionSummary(shop);
  return {
    ...shop,
    subscription,
    activeListingsCount: listingsCount,
    stats: {
      activeListings: listingsCount,
      expiredListings: 0,
      views: 1240 + listingsCount * 17,
      contacts: 18 + listingsCount,
      favorites: 42 + listingsCount,
      shopVisits: 310 + listingsCount * 5,
      demo: true,
    },
    listings,
  };
}

async function hasShopAccess(shopId, user) {
  if (user?.role === 'admin') return true;
  const userId = user?.userId || user?.id;
  if (!userId) return false;
  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(shop);
}

async function prepareListingOwnership(shopId, userId) {
  if (!shopId) {
    return { sellerType: 'INDIVIDUAL', shopId: null };
  }

  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!shop) {
    const err = new Error('Boutique introuvable ou non autorisee.');
    err.status = 403;
    throw err;
  }

  const subscription = shop.subscriptions?.[0] || null;
  if (shop.status !== 'ACTIVE') {
    const err = new Error('La boutique doit etre active pour publier une annonce.');
    err.status = 400;
    throw err;
  }
  if (!subscription || !['ACTIVE', 'TRIAL'].includes(subscription.status)) {
    const err = new Error('Abonnement boutique inactif ou expire.');
    err.status = 400;
    throw err;
  }
  if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
    const err = new Error('Abonnement boutique expire.');
    err.status = 400;
    throw err;
  }

  const limit = subscription.plan?.listingLimit;
  if (limit) {
    const [jobs, realEstate, cars] = await Promise.all([
      prisma.jobListing.count({ where: { shopId, status: 'APPROVED', deletedByOwner: false } }),
      prisma.realEstateListing.count({ where: { shopId, status: 'APPROVED', deletedByOwner: false } }),
      prisma.carListing.count({ where: { shopId, status: 'APPROVED', deletedByOwner: false } }),
    ]);
    if (jobs + realEstate + cars >= limit) {
      const err = new Error('Limite d annonces actives atteinte pour cette formule.');
      err.status = 400;
      throw err;
    }
  }

  return { sellerType: 'SHOP', shopId };
}

function normalizeJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

async function ensureShopSubscriptionPlans() {
  await prisma.$transaction([
    ...SHOP_SUBSCRIPTION_PLANS.map((plan) => prisma.shopSubscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        displayedPrice: plan.displayedPrice,
        billingPeriod: plan.billingPeriod,
        listingLimit: plan.listingLimit,
        features: plan.features,
        active: true,
        displayOrder: plan.displayOrder,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        displayedPrice: plan.displayedPrice,
        billingPeriod: plan.billingPeriod,
        listingLimit: plan.listingLimit,
        features: plan.features,
        active: true,
        displayOrder: plan.displayOrder,
      },
    })),
    prisma.shopSubscriptionPlan.updateMany({
      where: { slug: { notIn: SHOP_SUBSCRIPTION_PLAN_SLUGS } },
      data: { active: false },
    }),
  ]);
}

async function listPlans() {
  await ensureShopSubscriptionPlans();
  return prisma.shopSubscriptionPlan.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
  });
}

async function createShop(payload, user) {
  const userId = user.userId;
  const plan = await prisma.shopSubscriptionPlan.findFirst({ where: { id: payload.planId, active: true } });
  if (!plan) {
    const err = new Error('Formule introuvable.');
    err.status = 400;
    throw err;
  }
  const slug = await uniqueSlug(payload.name);
  const shop = await prisma.shop.create({
    data: {
      ownerUserId: userId,
      name: payload.name.trim(),
      slug,
      description: payload.description?.trim(),
      categoryId: payload.categoryId || null,
      logo: payload.logo || null,
      coverImage: payload.coverImage || null,
      city: payload.city.trim(),
      address: payload.address || null,
      professionalPhone: payload.professionalPhone || null,
      professionalEmail: payload.professionalEmail || null,
      legalName: payload.legalName || null,
      taxIdentifier: payload.taxIdentifier || null,
      website: payload.website || null,
      socialLinks: normalizeJsonObject(payload.socialLinks),
      openingHours: normalizeJsonObject(payload.openingHours),
      status: 'PENDING',
      members: {
        create: { userId, role: 'OWNER' },
      },
      subscriptions: {
        create: {
          planId: plan.id,
          status: 'PENDING',
        },
      },
    },
    include: shopInclude,
  });
  return serializeShop(shop);
}

async function listMyShops(user) {
  const userId = user.userId;
  const shops = await prisma.shop.findMany({
    where: {
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: shopInclude,
    orderBy: { updatedAt: 'desc' },
  });
  const serialized = await Promise.all(shops.map((shop) => serializeShop(shop)));
  const accountUser = await prisma.user.findUnique({
    where: { id: userId },
    select: accountBoutiqueUserSelect(),
  }).catch(() => null);
  const accountBoutique = await serializeAccountBoutique(accountUser).catch(() => null);
  return accountBoutique ? [accountBoutique, ...serialized] : serialized;
}

async function getMyDashboard(user) {
  const shops = await listMyShops(user);
  return {
    shops,
    currentShop: shops[0] || null,
  };
}

async function getPublicShop(slug) {
  const shop = await prisma.shop.findFirst({
    where: { slug },
    include: shopInclude,
  });
  if (!shop && slug?.startsWith(ACCOUNT_BOUTIQUE_PREFIX)) {
    const userId = slug.slice(ACCOUNT_BOUTIQUE_PREFIX.length);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: accountBoutiqueUserSelect(),
    }).catch(() => null);
    return serializeAccountBoutique(user, { includeListings: true });
  }
  if (!shop) return null;
  return serializeShop(shop, { includeListings: true });
}

async function updateShop(id, payload, user) {
  if (!(await hasShopAccess(id, user))) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  const data = {
    name: payload.name?.trim(),
    description: payload.description?.trim(),
    categoryId: payload.categoryId,
    logo: payload.logo,
    coverImage: payload.coverImage,
    city: payload.city?.trim(),
    address: payload.address,
    professionalPhone: payload.professionalPhone,
    professionalEmail: payload.professionalEmail,
    legalName: payload.legalName,
    taxIdentifier: payload.taxIdentifier,
    website: payload.website,
    socialLinks: payload.socialLinks === undefined ? undefined : normalizeJsonObject(payload.socialLinks),
    openingHours: payload.openingHours === undefined ? undefined : normalizeJsonObject(payload.openingHours),
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  if (data.name) data.slug = await uniqueSlug(data.name, id);
  const updated = await prisma.shop.update({ where: { id }, data, include: shopInclude });
  return serializeShop(updated);
}

async function simulatedPaymentAction(action) {
  return {
    action,
    message: 'Le paiement en ligne sera bientot disponible.',
  };
}

async function changePlan(shopId, planId, user) {
  if (!(await hasShopAccess(shopId, user))) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  const plan = await prisma.shopSubscriptionPlan.findFirst({ where: { id: planId, active: true } });
  if (!plan) {
    const err = new Error('Formule introuvable.');
    err.status = 400;
    throw err;
  }
  await prisma.shopSubscription.create({
    data: { shopId, planId, status: 'PENDING' },
  });
  return simulatedPaymentAction('change-plan');
}

async function listAdminShops(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const where = {
    ...(filters.status && filters.status !== 'all' && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { owner: { email: { contains: filters.search, mode: 'insensitive' } } },
      ],
    }),
  };
  const [items, total] = await Promise.all([
    prisma.shop.findMany({ where, include: shopInclude, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.shop.count({ where }),
  ]);
  const data = await Promise.all(items.map((shop) => serializeShop(shop)));
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function adminUpdateShop(id, payload) {
  const data = {
    status: payload.status,
    isVerified: payload.isVerified,
    rejectionReason: payload.rejectionReason,
    adminNotes: payload.adminNotes,
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const updated = await prisma.shop.update({ where: { id }, data, include: shopInclude });
  if (payload.subscriptionStatus) {
    const subscription = updated.subscriptions?.[0];
    if (subscription) {
      const now = new Date();
      await prisma.shopSubscription.update({
        where: { id: subscription.id },
        data: {
          status: payload.subscriptionStatus,
          startsAt: ['ACTIVE', 'TRIAL'].includes(payload.subscriptionStatus) ? (subscription.startsAt || now) : subscription.startsAt,
          expiresAt: ['ACTIVE', 'TRIAL'].includes(payload.subscriptionStatus)
            ? new Date(now.getTime() + 30 * 86400000)
            : subscription.expiresAt,
          cancelledAt: payload.subscriptionStatus === 'CANCELLED' ? now : subscription.cancelledAt,
        },
      });
    }
  }
  const fresh = await prisma.shop.findUnique({ where: { id }, include: shopInclude });
  return serializeShop(fresh);
}

module.exports = {
  slugify,
  listPlans,
  createShop,
  listMyShops,
  getMyDashboard,
  getPublicShop,
  updateShop,
  changePlan,
  simulatedPaymentAction,
  listAdminShops,
  adminUpdateShop,
  hasShopAccess,
  prepareListingOwnership,
  accountBoutiqueSlug,
  accountSubscriptionSummary,
  buildAccountBoutique,
  updateAccountBoutique,
};
