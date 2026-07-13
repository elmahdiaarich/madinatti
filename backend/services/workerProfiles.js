// backend/services/workerProfiles.js
const prisma = require('../config/db');

const MAX_PROFILES_PER_USER = 5;

// ----------------------------------------------------------
// PUBLIC SEARCH / LIST
// ----------------------------------------------------------

async function searchWorkerProfiles({
  categoryId,
  categorySlug,
  city,
  minRate,
  maxRate,
  pricingUnit,
  minRating,
  page = 1,
  limit = 12,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}) {
  const where = {
    status: 'APPROVED',
    isActive: true,
    deletedByOwner: false,
  };

  // The Phase 5 frontend (WorkerProfileFilter.jsx) sends `categorySlug`, not
  // `categoryId` — resolve it here so the filter actually works. `categoryId`
  // is still honored directly if a caller passes it (kept for compatibility).
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId && categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: categorySlug, module: 'mini-jobs' },
      select: { id: true },
    });
    // Slug didn't resolve to a real category — force an empty result set
    // instead of silently ignoring the filter.
    resolvedCategoryId = category ? category.id : '__no_match__';
  }

  if (resolvedCategoryId) where.categoryId = resolvedCategoryId;
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (pricingUnit) where.pricingUnit = pricingUnit;
  if (minRating) where.ratingAvg = { gte: Number(minRating) };
  if (minRate || maxRate) {
    where.rate = {};
    if (minRate) where.rate.gte = Number(minRate);
    if (maxRate) where.rate.lte = Number(maxRate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    prisma.workerProfile.findMany({
      where,
      include: { category: true, user: { select: { id: true, name: true, avatar: true, city: true } } },
      orderBy: [{ isFeatured: 'desc' }, { [sortBy]: sortOrder }],
      skip,
      take: Number(limit),
    }),
    prisma.workerProfile.count({ where }),
  ]);

  return {
    items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

async function getWorkerProfileById(id) {
  return prisma.workerProfile.findUnique({
    where: { id },
    include: {
      category: true,
      user: { select: { id: true, name: true, avatar: true, city: true, createdAt: true, phone: true } },
    },
  });
}

// ----------------------------------------------------------
// OWNER (citizen) — "Mes profils prestataire"
// ----------------------------------------------------------

async function getMyWorkerProfiles(userId) {
  return prisma.workerProfile.findMany({
    where: { userId, deletedByOwner: false },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function createWorkerProfile(userId, data) {
  const activeCount = await prisma.workerProfile.count({
    where: { userId, deletedByOwner: false },
  });

  if (activeCount >= MAX_PROFILES_PER_USER) {
    const err = new Error(`Limite de ${MAX_PROFILES_PER_USER} profils prestataire atteinte`);
    err.code = 'WORKER_PROFILE_LIMIT_REACHED';
    throw err;
  }

  return prisma.workerProfile.create({
    data: {
      userId,
      categoryId: data.categoryId,
      headline: data.headline,
      description: data.description,
      city: data.city,
      region: data.region ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      serviceRadius: data.serviceRadius ?? null,
      pricingUnit: data.pricingUnit,
      // WorkerProfile.rate is a required Decimal field in the schema — it
      // has no "?" — so `null` (sent when isNegotiable is checked) violates
      // it. Default to 0 as a sentinel; the frontend always checks
      // isNegotiable first before ever displaying rate, so 0 never leaks
      // as a real price.
      rate: data.rate ?? 0,
      isNegotiable: data.isNegotiable ?? false,
      photo: data.photo ?? null,
      portfolioImages: data.portfolioImages ?? null,
      yearsExperience: data.yearsExperience ?? null,
      availability: data.availability ?? null,
      status: 'PENDING',
    },
  });
}

// Content fields — editing any of these resets status to PENDING (re-review required)
const CONTENT_FIELDS = [
  'categoryId', 'headline', 'description', 'city', 'region', 'latitude', 'longitude',
  'serviceRadius', 'pricingUnit', 'rate', 'isNegotiable', 'photo', 'portfolioImages',
  'yearsExperience', 'availability',
];

async function updateWorkerProfile(id, userId, data) {
  const existing = await prisma.workerProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId || existing.deletedByOwner) {
    const err = new Error('Profil introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const updateData = {};
  for (const field of CONTENT_FIELDS) {
    if (data[field] !== undefined) {
      updateData[field] = field === 'rate' && data[field] === null ? 0 : data[field];
    }
  }

  // Any actual content edit resets moderation status — must go back through
  // the admin MODULE_REGISTRY approve/reject flow (see adminController.js).
  if (Object.keys(updateData).length > 0) {
    updateData.status = 'PENDING';
    updateData.reviewedAt = null;
    updateData.reviewedBy = null;
    updateData.publishedAt = null;
  }

  return prisma.workerProfile.update({ where: { id }, data: updateData });
}

// Operational toggle — does NOT reset to PENDING, not content-moderation-sensitive
async function toggleActive(id, userId, isActive) {
  const existing = await prisma.workerProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    const err = new Error('Profil introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return prisma.workerProfile.update({ where: { id }, data: { isActive } });
}

async function softDeleteWorkerProfile(id, userId, force = false) {
  const existing = await prisma.workerProfile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    const err = new Error('Profil introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (!force) {
    const [activeBookings, activeApplications] = await Promise.all([
      prisma.booking.count({
        where: { workerProfileId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
      }),
      prisma.taskApplication.count({
        where: {
          workerProfileId: id,
          status: 'ACCEPTED',
          taskRequest: { status: 'IN_PROGRESS' },
        },
      }),
    ]);
    const activeCount = activeBookings + activeApplications;
    if (activeCount > 0) {
      const err = new Error(
        `Ce profil a ${activeCount} réservation(s)/tâche(s) en cours.`
      );
      err.code = 'ACTIVE_ENGAGEMENTS';
      err.activeCount = activeCount;
      throw err;
    }
  }

  return prisma.workerProfile.update({
    where: { id },
    data: { deletedByOwner: true, deletedAt: new Date(), isActive: false },
  });
}

// NOTE: no admin moderation functions here (list-for-moderation / approve /
// reject / suspend / unsuspend). Those are handled entirely by the generic
// MODULE_REGISTRY system already in adminController.js (see the "miniJobs"
// entry added there: NORMALIZERS, SELECTS, WHERE_BUILDERS, STATUS_HANDLERS,
// approveListing/rejectListing/updateListingStatus/deleteListing/getListings).
// Duplicating that logic here would fork the moderation code path and drift
// from the pattern the rest of the platform already relies on.

module.exports = {
  MAX_PROFILES_PER_USER,
  searchWorkerProfiles,
  getWorkerProfileById,
  getMyWorkerProfiles,
  createWorkerProfile,
  updateWorkerProfile,
  toggleActive,
  softDeleteWorkerProfile,
};