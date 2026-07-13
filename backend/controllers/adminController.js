/**
 * backend/controllers/adminController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Controller admin — toutes les opérations du dashboard.
 * Utilise Prisma avec le schéma exact de schema.prisma.
 *
 * Endpoints couverts :
 *  GET  /api/admin/overview
 *  GET  /api/admin/listings
 *  PATCH /api/admin/listings/:id/approve
 *  PATCH /api/admin/listings/:id/reject
 *  GET  /api/admin/reports
 *  PATCH /api/admin/reports/:id
 *  GET  /api/admin/users
 *  PATCH /api/admin/users/:id/toggle
 *  GET  /api/admin/businesses
 * ─────────────────────────────────────────────────────────────────────────────
 */

const prisma = require("../config/db");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================================================
// Adding a new module (e.g. "services") requires only:
//   1. Add its Prisma model key to MODULE_REGISTRY below
//   2. Add its normalizer to NORMALIZERS below
//   3. Add its status handler to STATUS_HANDLERS below
//   4. Done — getListings, approveListing, rejectListing,
//              updateListingStatus, deleteListing all pick it up automatically.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY
// Maps module slug → { model, cloudinaryFolder, targetType, frontendPath }
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_REGISTRY = {
  emploi: {
    model:             'jobListing',
    cloudinaryFolder:  null,          
    targetType:        'JOB',
    frontendPath:      (id) => `/jobs/${id}`,
  },
  immobilier: {
    model:             'realEstateListing',
    cloudinaryFolder:  'madinatti/real-estate',
    targetType:        'REAL_ESTATE',
    frontendPath:      (id) => `/real-estate/${id}`,
  },
   automobile: {
    model:             'carListing',
    cloudinaryFolder:  'madinatti/real-estate',
    targetType:        'CAR',
    frontendPath:      (id) => `/cars/${id}`,
  },
  miniJobs: {
    model:             'workerProfile',
    cloudinaryFolder:  'madinatti/mini-jobs',
    targetType:        'WORKER_PROFILE',
    frontendPath:      (id) => `/mini-jobs/profiles/${id}`,
  },
  taskRequests: {
    model:             'taskRequest',
    cloudinaryFolder:  null,           // no images on TaskRequest
    targetType:        'TASK_REQUEST',
    frontendPath:      (id) => `/mini-jobs/tasks/${id}`,
  },
  // ── Add future modules here ────────────────────────────────────────────────
  // services: {
  //   model:            'serviceListing',
  //   cloudinaryFolder: 'madinatti/services',
  //   targetType:       'SERVICE',
  //   frontendPath:     (id) => `/services/${id}`,
  // },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move an image from madinatti/temp → targetFolder on Cloudinary.
 * Returns the original img object unchanged if the move fails (non-blocking).
 */
async function moveImage(img, targetFolder) {
  try {
    if (!img.url?.includes('madinatti/temp')) return img;
    const urlParts    = img.url.split('/upload/');
    const withoutVer  = urlParts[1].replace(/^v\d+\//, '');
    const oldPublicId = withoutVer.replace(/\.[^/.]+$/, '');
    const newPublicId = oldPublicId.replace('madinatti/temp', targetFolder);
    const result      = await cloudinary.uploader.rename(oldPublicId, newPublicId);
    return { ...img, url: result.secure_url };
  } catch (err) {
    console.error('Failed to move image:', img.url, err.message);
    return img;
  }
}

/**
 * Delete an image from Cloudinary. Logs but never throws (non-blocking).
 */
async function destroyImage(img) {
  try {
    const url = img?.url || img;
    if (!url) return;
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return;
    const withoutVer = urlParts[1].replace(/^v\d+\//, '');
    const publicId   = withoutVer.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err.message);
  }
}

async function moveImages(images = [], targetFolder) {
  if (!targetFolder) return images;
  return Promise.all(images.map((img) => moveImage(img, targetFolder)));
}
 
async function destroyImages(images = []) {
  await Promise.all(images.map(destroyImage));
}
 
/**
 * WorkerProfile-specific image mover — handles the photo (single string)
 * + portfolioImages (array) split, since it doesn't use the {url,isCover}[]
 * "images" shape the other modules use.
 */
async function moveWorkerProfileImages(record, targetFolder) {
  const photo = record.photo
    ? (await moveImage({ url: record.photo }, targetFolder)).url
    : null;
  const portfolioImages = await moveImages(record.portfolioImages || [], targetFolder);
  return { photo, portfolioImages };
}
 
async function destroyWorkerProfileImages(record) {
  const jobs = [];
  if (record.photo) jobs.push(destroyImage({ url: record.photo }));
  jobs.push(destroyImages(record.portfolioImages || []));
  await Promise.all(jobs);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZERS  (raw Prisma row → common API shape)
// ─────────────────────────────────────────────────────────────────────────────

const NORMALIZERS = {
  emploi: (j) => ({
    id:                  j.id,
    module:              'emploi',
    title:               j.title,
    description:         j.description || null,
    company:             j.companyName,
    companyName:         j.companyName,
    companyLogo:         j.companyLogo || null,
    submittedBy:         j.user?.companyName || j.companyName || j.user?.name,
    submittedByEmail:    j.user?.email || '',
    submittedById:       j.user?.id || '',
    submittedByLogo:     j.user?.companyLogo || j.user?.avatar || null,
    city:                j.location,
    location:            j.location,
    region:              j.region || null,
    contractType:        j.contractType,
    remote:              j.remote || null,
    salaryMin:           j.salaryMin ?? null,
    salaryMax:           j.salaryMax ?? null,
    salaryPeriod:        j.salaryPeriod || null,
    experienceLevel:     j.experienceLevel || null,
    educationLevel:      j.educationLevel || [],
    languages:           j.languages || [],
    skills:              j.skills || [],
    applicationDeadline: j.applicationDeadline || null,
    status:              j.status,
    isFeatured:          j.isFeatured || false,
    isSponsored:         j.isSponsored || false,
    viewsCount:          j.viewsCount ?? 0,
    adminNote:           j.adminNotes || null,
    deletedByOwner:      j.deletedByOwner ?? false,
    createdAt:           j.createdAt,
    updatedAt:           j.updatedAt,
    publishedAt:         j.publishedAt || null,
    reviewedAt:          j.reviewedAt || null,
  }),

  immobilier: (r) => ({
    id:               r.id,
    module:           'immobilier',
    title:            r.title,
    description:      r.description,
    company:          r.user?.companyName || r.user?.name || '',
    submittedBy:      r.user?.companyName || r.user?.name || '',
    submittedByEmail: r.user?.email || '',
    submittedById:    r.user?.id || '',
    submittedByLogo:  r.user?.companyLogo || r.user?.avatar || null,
    location:         r.location,
    city:             r.city || r.location,
    region:           r.region,
    contractType:     r.listingType,
    propertyType:     r.propertyType,
    status:           r.status,
    isActive:         r.isActive,
    isFeatured:       r.isFeatured,
    isSponsored:      r.isSponsored,
    price:            r.price,
    surface:          r.surface,
    rooms:            r.rooms,
    bathrooms:        r.bathrooms,
    floor:            r.floor,
    latitude:         r.latitude,
    longitude:        r.longitude,
    contactPhone:     r.contactPhone,
    images:           r.images,
    features:         r.features,
    adminNote:        r.adminNotes || null,
    viewsCount:       r.viewsCount,
    category:         r.category || null,
    categoryId:       r.categoryId,
    inquiriesCount:   r._count?.inquiries ?? 0,
    deletedByOwner:   r.deletedByOwner ?? false,
    reviewedBy:       r.reviewedBy,
    reviewedAt:       r.reviewedAt,
    publishedAt:      r.publishedAt,
    createdAt:        r.createdAt,
    updatedAt:        r.updatedAt,
  }),

  automobile: (c) => ({
    id:               c.id,
    module:           'automobile',
    title:            c.title,
    description:      c.description,
    company:          c.user?.companyName || c.user?.name || '',
    submittedBy:      c.user?.companyName || c.user?.name || '',
    submittedByEmail: c.user?.email || '',
    submittedById:    c.user?.id || '',
    submittedByLogo:  c.user?.companyLogo || c.user?.avatar || null,
    location:         c.location,
    city:             c.city || c.location,
    region:           c.region || null,
    // car-specific
    make:             c.make,
    model:            c.model,
    year:             c.year,
    mileage:          c.mileage ?? null,
    fuelType:         c.fuelType,
    transmission:     c.transmission,
    bodyType:         c.bodyType,
    condition:        c.condition,
    color:            c.color || null,
    doors:            c.doors ?? null,
    seats:            c.seats ?? null,
    engineSize:       c.engineSize ?? null,
    horsePower:       c.horsePower ?? null,
    isNegotiable:     c.isNegotiable,
    listingType:      c.listingType,
    // shared
    price:            c.price,
    contactPhone:     c.contactPhone,
    images:           c.images,
    features:         c.features,
    status:           c.status,
    isActive:         c.isActive,
    isFeatured:       c.isFeatured,
    isSponsored:      c.isSponsored,
    viewsCount:       c.viewsCount ?? 0,
    adminNote:        c.adminNotes || null,
    category:         c.category || null,
    categoryId:       c.categoryId,
    inquiriesCount:   c._count?.inquiries ?? 0,
    deletedByOwner:   c.deletedByOwner ?? false,
    reviewedBy:       c.reviewedBy,
    reviewedAt:       c.reviewedAt,
    publishedAt:      c.publishedAt,
    createdAt:        c.createdAt,
    updatedAt:        c.updatedAt,
  }),
 
  miniJobs: (w) => ({
    id:               w.id,
    module:           'miniJobs',
    title:            w.headline,          // mapped: WorkerProfile has no "title" field
    headline:         w.headline,
    description:      w.description,
    company:          w.user?.name || '',
    submittedBy:      w.user?.name || '',
    submittedByEmail: w.user?.email || '',
    submittedById:    w.user?.id || '',
    submittedByLogo:  w.user?.avatar || null,
    location:         w.city,
    city:             w.city,
    region:           w.region || null,
    pricingUnit:      w.pricingUnit,
    rate:             w.rate,
    isNegotiable:     w.isNegotiable,
    photo:            w.photo || null,
    portfolioImages:  w.portfolioImages || [],
    yearsExperience:  w.yearsExperience ?? null,
    availability:     w.availability || null,
    serviceRadius:    w.serviceRadius ?? null,
    ratingAvg:        w.ratingAvg ?? 0,
    ratingCount:      w.ratingCount ?? 0,
    status:           w.status,
    isActive:         w.isActive,
    isFeatured:       w.isFeatured,
    viewsCount:       w.viewsCount ?? 0,
    adminNote:        w.adminNotes || null,
    category:         w.category || null,
    categoryId:       w.categoryId,
    deletedByOwner:   w.deletedByOwner ?? false,
    reviewedBy:       w.reviewedBy,
    reviewedAt:       w.reviewedAt,
    publishedAt:      w.publishedAt,
    createdAt:        w.createdAt,
    updatedAt:        w.updatedAt,
  }),
 
  taskRequests: (t) => ({
    id:               t.id,
    module:           'taskRequests',
    title:            t.title,
    description:      t.description,
    company:          t.user?.name || '',
    submittedBy:      t.user?.name || '',
    submittedByEmail: t.user?.email || '',
    submittedById:    t.user?.id || '',
    submittedByLogo:  t.user?.avatar || null,
    location:         t.city,
    city:             t.city,
    region:           t.region || null,
    budget:           t.budget ?? null,
    neededDate:       t.neededDate,
    status:           t.status,
    viewsCount:       t.viewsCount ?? 0,
    adminNote:        t.adminNotes || null,
    category:         t.category || null,
    categoryId:       t.categoryId,
    deletedByOwner:   t.deletedByOwner ?? false,
    reviewedBy:       t.reviewedBy,
    reviewedAt:       t.reviewedAt,
    createdAt:        t.createdAt,
    updatedAt:        t.updatedAt,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRISMA SELECT MAPS  (only fetch what the normalizer needs)
// ─────────────────────────────────────────────────────────────────────────────

const USER_SELECT = {
  id: true, name: true, email: true,
  companyName: true, companyLogo: true, avatar: true,
};

const SELECTS = {
  emploi: {
    id: true, title: true, description: true,
    companyName: true, companyLogo: true,
    location: true, region: true,
    contractType: true, remote: true,
    salaryMin: true, salaryMax: true, salaryPeriod: true,
    experienceLevel: true, educationLevel: true,
    languages: true, skills: true, applicationDeadline: true,
    status: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    createdAt: true, updatedAt: true, publishedAt: true, reviewedAt: true,
    user: { select: USER_SELECT },
  },

  immobilier: {
    id: true, title: true, description: true,
    location: true, city: true, region: true,
    listingType: true, propertyType: true,
    price: true, surface: true, rooms: true, bathrooms: true, floor: true,
    latitude: true, longitude: true, contactPhone: true,
    images: true, features: true,
    status: true, isActive: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
    _count:   { select: { inquiries: true } },
  },

  automobile: {
    id: true, title: true, description: true,
    location: true, city: true, region: true,
    make: true, model: true, year: true, mileage: true,
    fuelType: true, transmission: true, bodyType: true, condition: true,
    color: true, doors: true, seats: true, engineSize: true, horsePower: true,
    isNegotiable: true, listingType: true,
    price: true, contactPhone: true,
    images: true, features: true,
    status: true, isActive: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
    _count:   { select: { inquiries: true } },
  },
 
  miniJobs: {
    id: true, headline: true, description: true,
    city: true, region: true,
    pricingUnit: true, rate: true, isNegotiable: true,
    photo: true, portfolioImages: true, yearsExperience: true,
    availability: true, serviceRadius: true,
    ratingAvg: true, ratingCount: true,
    status: true, isActive: true, isFeatured: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
  },
 
  taskRequests: {
    id: true, title: true, description: true,
    city: true, region: true,
    budget: true, neededDate: true,
    status: true, viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WHERE CLAUSE BUILDERS  (module-specific search fields)
// ─────────────────────────────────────────────────────────────────────────────

const WHERE_BUILDERS = {
  emploi: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { location:    { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),

  immobilier: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:    { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { city:     { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),

  automobile: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:    { contains: search, mode: 'insensitive' } },
        { make:     { contains: search, mode: 'insensitive' } },
        { model:    { contains: search, mode: 'insensitive' } },
        { city:     { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
 
  miniJobs: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { headline:    { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city:        { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
 
  taskRequests: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city:        { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ALERT NOTIFIERS  (match and notify subscribers when a listing is approved)
// ─────────────────────────────────────────────────────────────────────────────

async function notifyJobAlertSubscribers(approvedJob, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'emploi', isActive: true, NOT: [{ userId: approvedJob.userId }] },
    });

    const notified = new Set([approvedJob.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.categorySlug  || f.categorySlug  === approvedJob.category?.slug) &&
        (!f.region        || f.region        === approvedJob.region) &&
        (!f.city          || f.city          === approvedJob.city) &&
        (!f.contractType  || f.contractType  === approvedJob.contractType) &&
        (!f.remote        || f.remote        === approvedJob.remote) &&
        (!f.keyword       || approvedJob.title.toLowerCase().includes(f.keyword.toLowerCase()));

      if (matches) {
        await createNotification(
          alert.userId, 'JOB_ALERT',
          'Nouvelle offre qui vous correspond 🔔',
          `Une nouvelle offre "${approvedJob.title}" correspond à votre alerte.`,
          `/jobs/${approvedJob.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyJobAlertSubscribers] error:', err);
  }
}

async function notifyRealEstateAlertSubscribers(approvedRe, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'immobilier', isActive: true },
    });

    const notified = new Set([approvedRe.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.categoryId  || f.categoryId  === approvedRe.categoryId) &&
        (!f.listingType || f.listingType === approvedRe.listingType) &&
        (!f.region      || f.region      === approvedRe.region) &&
        (!f.city        || f.city        === approvedRe.city) &&
        (!f.minPrice    || Number(approvedRe.price) >= Number(f.minPrice)) &&
        (!f.maxPrice    || Number(approvedRe.price) <= Number(f.maxPrice));

      if (matches) {
        await createNotification(
          alert.userId, 'REALESTATE_ALERT_MATCH',
          'Nouvelle annonce correspond à votre alerte 🔔',
          `Une nouvelle annonce "${approvedRe.title}" correspond à votre alerte immobilière.`,
          `/real-estate/${approvedRe.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyRealEstateAlertSubscribers] error:', err);
  }
}

async function notifyCarAlertSubscribers(approvedCar, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'automobile', isActive: true },
    });

    const notified = new Set([approvedCar.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.make         || f.make         === approvedCar.make) &&
        (!f.bodyType     || f.bodyType     === approvedCar.bodyType) &&
        (!f.fuelType     || f.fuelType     === approvedCar.fuelType) &&
        (!f.transmission || f.transmission === approvedCar.transmission) &&
        (!f.condition    || f.condition    === approvedCar.condition) &&
        (!f.region       || f.region       === approvedCar.region) &&
        (!f.city         || f.city         === approvedCar.city) &&
        (!f.listingType  || f.listingType  === approvedCar.listingType) &&
        (!f.minPrice     || Number(approvedCar.price) >= Number(f.minPrice)) &&
        (!f.maxPrice     || Number(approvedCar.price) <= Number(f.maxPrice)) &&
        (!f.maxMileage   || (approvedCar.mileage != null && approvedCar.mileage <= Number(f.maxMileage))) &&
        (!f.minYear      || approvedCar.year >= Number(f.minYear)) &&
        (!f.maxYear      || approvedCar.year <= Number(f.maxYear));

      if (matches) {
        await createNotification(
          alert.userId, 'CAR_ALERT_MATCH',
          'Nouvelle annonce correspond à votre alerte 🔔',
          `Une nouvelle annonce "${approvedCar.title}" correspond à votre alerte véhicule.`,
          `/cars/${approvedCar.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyCarAlertSubscribers] error:', err);
  }
}

// Registry so approveListing can look up the right notifier by module
const ALERT_NOTIFIERS = {
  emploi:     notifyJobAlertSubscribers,
  immobilier: notifyRealEstateAlertSubscribers,
  automobile: notifyCarAlertSubscribers,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/overview
// ─────────────────────────────────────────────────────────────────────────────

const getOverview = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      pendingJobs,
      pendingRealEstate,
      pendingCars,
      pendingWorkerProfiles,
      approvedTodayJobs,
      approvedTodayRealEstate,
      approvedTodayCars,
      approvedTodayWorkerProfiles,
      openReports,
      totalUsers,
    ] = await Promise.all([
      prisma.jobListing.count({ where: { status: 'PENDING' } }),
      prisma.realEstateListing.count({ where: { status: 'PENDING' } }),
      prisma.carListing.count({ where: { status: 'PENDING' } }),
      prisma.workerProfile.count({ where: { status: 'PENDING' } }),
 
      prisma.jobListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.realEstateListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.carListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.workerProfile.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
 
      // Replace Promise.resolve(0) with prisma.report.count(...) once reports go live
      Promise.resolve(0),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        pending:      pendingJobs + pendingRealEstate + pendingCars + pendingWorkerProfiles,
        approvedToday: approvedTodayJobs + approvedTodayRealEstate + approvedTodayCars + approvedTodayWorkerProfiles,
        openReports,
        totalUsers,
        // Granular breakdown — useful for per-module sidebar badges
        pendingByModule: {
          emploi:     pendingJobs,
          immobilier: pendingRealEstate,
          automobile: pendingCars,
          miniJobs:   pendingWorkerProfiles,
        },
      },
    });
  } catch (error) {
    console.error('admin getOverview error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/listings
// Query params: module, status, search, userId, page, limit
// ─────────────────────────────────────────────────────────────────────────────

const getListings = async (req, res) => {
  try {
    const {
      module: mod = 'tous',
      status  = '',
      search  = '',
      userId  = '',
      page    = 1,
      limit   = 10,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const filters = { status, userId, search };

    // Determine which modules to query
    const activeModules = mod === 'tous'
      ? Object.keys(MODULE_REGISTRY)
      : Object.keys(MODULE_REGISTRY).filter((k) => k === mod);

  // Fetch all active modules in parallel
    const results = await Promise.all(
      activeModules.map((moduleKey) => {
        const { model } = MODULE_REGISTRY[moduleKey];

        // TaskRequest uses its own status enum (OPEN/IN_PROGRESS/COMPLETED/
        // CANCELLED/ARCHIVED) — it has no PENDING/APPROVED/REJECTED/etc.
        // If the admin's status filter doesn't apply to that enum, this
        // module simply has nothing to show under that filter — skip the
        // query instead of letting Prisma reject an invalid enum value.
        if (moduleKey === 'taskRequests' && status && !TASK_REQUEST_VALID_STATUSES.includes(status)) {
          return Promise.resolve([]);
        }

        return prisma[model].findMany({
          where:   WHERE_BUILDERS[moduleKey](filters),
          orderBy: { createdAt: 'desc' },
          select:  SELECTS[moduleKey],
        });
      }),
    );
    // Normalize, merge, sort, paginate
    const all = activeModules
      .flatMap((moduleKey, i) =>
        results[i].map((row) => NORMALIZERS[moduleKey](row)),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total    = all.length;
    const paginated = all.slice(skip, skip + take);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('admin getListings error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/approve
// Auto-detects the module by trying each model in registry order.
// ─────────────────────────────────────────────────────────────────────────────

const approveListing = async (req, res) => {
  try {
    const { id }    = req.params;
    const adminId   = req.user.userId;
    const now       = new Date();
    const { createNotification } = require('./notificationController');

    for (const [moduleKey, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;

      if (record.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: "Cette annonce n'est pas en attente" });
      }

       // Move images out of temp/ if this module uses Cloudinary images.
      // WorkerProfile (miniJobs) is special-cased: it splits photo (string)
      // + portfolioImages (array) instead of a single "images" array.
      let images = record.images || [];
      let workerProfileImageFields = {};
 
      if (moduleKey === 'miniJobs') {
        const moved = await moveWorkerProfileImages(record, config.cloudinaryFolder);
        workerProfileImageFields = { photo: moved.photo, portfolioImages: moved.portfolioImages };
      } else if (config.cloudinaryFolder) {
        images = await moveImages(record.images || [], config.cloudinaryFolder);
      }
 
      const approved = await prisma[config.model].update({
        where: { id },
        data: {
          status:     'APPROVED',
          publishedAt: now,
          reviewedAt:  now,
          reviewedBy:  adminId,
          adminNotes:  null,
          ...(moduleKey === 'miniJobs'
            ? workerProfileImageFields
            : config.cloudinaryFolder ? { images } : {}),
        },
        include: { category: { select: { slug: true } } },
      });
 
      // Fire alert subscribers (if a notifier is registered for this module)
      const notifier = ALERT_NOTIFIERS[moduleKey];
      if (notifier) await notifier(approved, createNotification);
 
      // Notify the listing owner (WorkerProfile has "headline", not "title")
      await createNotification(
        record.userId,
        'LISTING_APPROVED',
        'Votre annonce a été approuvée ✅',
        `Votre annonce "${record.title || record.headline}" est maintenant en ligne.`,
        config.frontendPath(id),
      );

      return res.json({ success: true, message: 'Annonce approuvée' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin approveListing error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/reject
// Body: { adminNote, messageToSend }
// ─────────────────────────────────────────────────────────────────────────────

const rejectListing = async (req, res) => {
  try {
    const { id }                           = req.params;
    const { adminNote = '', messageToSend = '' } = req.body;
    const adminId                          = req.user.userId;
    const now                              = new Date();
    const { createNotification }           = require('./notificationController');

    for (const [moduleKey, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;
 
      // Delete temp images on rejection (only for image-based modules).
      // WorkerProfile (miniJobs) is special-cased for the photo/portfolioImages split.
      if (moduleKey === 'miniJobs') {
        await destroyWorkerProfileImages(record);
      } else if (config.cloudinaryFolder) {
        await destroyImages(record.images || []);
      }

      await prisma[config.model].update({
        where: { id },
        data: { status: 'REJECTED', adminNotes: adminNote, reviewedAt: now, reviewedBy: adminId },
      });

      // Dashboard message
      await prisma.businessMessage.create({
        data: {
          userId:       record.userId,
          type:         'REJECTION',
          targetType:   config.targetType,
          targetId:     id,
          targetTitle:  record.title || record.headline,
          adminMessage: messageToSend || adminNote || '',
        },
      });
 
      // Bell notification (citizen-owned WorkerProfile -> /my-space/messages,
      // everything else -> /dashboard/messages)
      await createNotification(
        record.userId,
        'LISTING_REJECTED',
        'Votre annonce a été refusée ❌',
        `Votre annonce "${record.title || record.headline}" a été refusée. Consultez vos messages pour plus de détails.`,
        moduleKey === 'miniJobs' ? '/my-space/messages' : '/dashboard/messages',
      );

      return res.json({ success: true, message: 'Annonce refusée' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin rejectListing error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS HANDLERS  (used by updateListingStatus — one per module)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'];

/**
 * Generic status handler shared by all image-based modules.
 * Pass moduleKey to get the right Cloudinary folder, frontend path, and notifier.
 */
async function handleGenericStatus(req, res, { id, status, adminNotes, adminId, now }, moduleKey) {
  const { createNotification } = require('./notificationController');
  const config = MODULE_REGISTRY[moduleKey];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' });
  }

  const record = await prisma[config.model].findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Annonce introuvable' });

  const wasPending = record.status === 'PENDING';
  let   images     = record.images || [];

  // Approve: move images out of temp/
  if (status === 'APPROVED' && wasPending && config.cloudinaryFolder) {
    images = await moveImages(images, config.cloudinaryFolder);
  }

  // Reject: destroy temp images
  if (status === 'REJECTED' && wasPending && config.cloudinaryFolder) {
    await destroyImages(images.filter((img) => img.url?.includes('madinatti/temp')));
  }

  const updated = await prisma[config.model].update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      reviewedAt: now,
      reviewedBy: adminId,
      ...(config.cloudinaryFolder ? { images } : {}),
      ...(status === 'APPROVED' && !record.publishedAt ? { publishedAt: now } : {}),
    },
    include: { category: { select: { slug: true } } },
  });

  // Notifications on key transitions
  if (status === 'APPROVED' && wasPending) {
    const notifier = ALERT_NOTIFIERS[moduleKey];
    if (notifier) await notifier(updated, createNotification);
    await createNotification(
      updated.userId, 'LISTING_APPROVED',
      'Votre annonce a été approuvée ✅',
      `Votre annonce "${updated.title}" est maintenant en ligne.`,
      config.frontendPath(updated.id),
    );
  } else if (status === 'REJECTED' && wasPending) {
    await createNotification(
      updated.userId, 'LISTING_REJECTED',
      'Votre annonce a été refusée ❌',
      `Votre annonce "${updated.title}" a été refusée. Consultez vos messages pour plus de détails.`,
      '/dashboard/messages',
    );
  }

  return res.json({ success: true, message: 'Annonce mise à jour', data: updated });
}
 
/**
 * Dedicated status handler for WorkerProfile (mini-jobs). Not routed through
 * handleGenericStatus because WorkerProfile splits images into photo (string)
 * + portfolioImages (array) instead of a single "images" array, and uses
 * "headline" instead of "title".
 */
async function handleMiniJobsStatus(req, res, { id, status, adminNotes, adminId, now }) {
  const { createNotification } = require('./notificationController');
  const config = MODULE_REGISTRY.miniJobs;
 
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' });
  }
 
  const record = await prisma.workerProfile.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Profil introuvable' });
 
  const wasPending = record.status === 'PENDING';
  let photo = record.photo;
  let portfolioImages = record.portfolioImages || [];
 
  if (status === 'APPROVED' && wasPending) {
    const moved = await moveWorkerProfileImages(record, config.cloudinaryFolder);
    photo = moved.photo;
    portfolioImages = moved.portfolioImages;
  }
 
  if (status === 'REJECTED' && wasPending) {
    await destroyWorkerProfileImages(record);
  }
 
  const updated = await prisma.workerProfile.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      reviewedAt: now,
      reviewedBy: adminId,
      photo,
      portfolioImages,
      ...(status === 'APPROVED' && !record.publishedAt ? { publishedAt: now } : {}),
    },
    include: { category: { select: { slug: true } } },
  });
 
  if (status === 'APPROVED' && wasPending) {
    await createNotification(
      updated.userId, 'WORKER_PROFILE_APPROVED',
      'Votre profil prestataire a été approuvé ✅',
      `Votre profil "${updated.headline}" est maintenant visible publiquement.`,
      config.frontendPath(updated.id),
    );
  } else if (status === 'REJECTED' && wasPending) {
    await createNotification(
      updated.userId, 'WORKER_PROFILE_REJECTED',
      'Votre profil prestataire a été refusé ❌',
      `Votre profil "${updated.headline}" a été refusé. Consultez vos messages pour plus de détails.`,
      '/my-space/messages',
    );
    await prisma.businessMessage.create({
      data: {
        userId:       updated.userId,
        type:         'REJECTION',
        targetType:   'WORKER_PROFILE',
        targetId:     id,
        targetTitle:  updated.headline,
        adminMessage: adminNotes || '',
      },
    });
  }
 
  return res.json({ success: true, message: 'Profil mis à jour', data: updated });
}
 
// Module-specific handlers (thin wrappers — add custom logic per module here if needed)
/**
 * Dedicated status handler for TaskRequest. Uses a completely different
 * valid-status set (OPEN/IN_PROGRESS/COMPLETED/CANCELLED/ARCHIVED) than
 * the PENDING/APPROVED/REJECTED/SUSPENDED/EXPIRED cycle the generic
 * handler assumes — TaskRequest never goes through PENDING at all
 * (publishes immediately, moderated reactively via Report). In practice
 * this handler is only reached from a Report resolution flow, typically
 * to set status to ARCHIVED (hide a reported task) or CANCELLED.
 */
const TASK_REQUEST_VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
 
async function handleTaskRequestStatus(req, res, { id, status, adminNotes, adminId, now }) {
  if (!TASK_REQUEST_VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide pour une demande de tâche' });
  }
 
  const record = await prisma.taskRequest.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Demande introuvable' });
 
  const updated = await prisma.taskRequest.update({
    where: { id },
    data: { status, adminNotes: adminNotes || null, reviewedAt: now, reviewedBy: adminId },
  });
 
  const { createNotification } = require('./notificationController');
  if (status === 'ARCHIVED' || status === 'CANCELLED') {
    await createNotification(
      updated.userId,
      'TASK_REQUEST_MODERATED',
      'Votre demande a été retirée',
      `Votre demande "${updated.title}" a été retirée par un administrateur.${adminNotes ? ' Motif : ' + adminNotes : ''}`,
      '/my-space/task-requests'
    );
  }
 
  return res.json({ success: true, message: 'Demande mise à jour', data: updated });
}
 
// Module-specific handlers (thin wrappers — add custom logic per module here if needed)
const STATUS_HANDLERS = {
  emploi:       (req, res, ctx) => handleGenericStatus(req, res, ctx, 'emploi'),
  immobilier:   (req, res, ctx) => handleGenericStatus(req, res, ctx, 'immobilier'),
  automobile:   (req, res, ctx) => handleGenericStatus(req, res, ctx, 'automobile'),
  miniJobs:     handleMiniJobsStatus,
  taskRequests: handleTaskRequestStatus,
  // services:  (req, res, ctx) => handleGenericStatus(req, res, ctx, 'services'),
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/status
// Body: { status, adminNotes, module }
// ─────────────────────────────────────────────────────────────────────────────

const updateListingStatus = async (req, res) => {
  try {
    const { id }                    = req.params;
    const { status, adminNotes, module } = req.body;
    const adminId                   = req.user.userId;
    const now                       = new Date();

    const handler = STATUS_HANDLERS[module];
    if (!handler) {
      return res.status(400).json({ success: false, message: `Module inconnu : ${module}` });
    }

    return await handler(req, res, { id, status, adminNotes, adminId, now });
  } catch (error) {
    console.error('admin updateListingStatus error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/listings/:id
// Permanently deletes a listing and its Cloudinary assets.
// ─────────────────────────────────────────────────────────────────────────────

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    for (const [, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;

      // Destroy all associated Cloudinary images
      if (config.cloudinaryFolder) {
        await destroyImages(record.images || []);
      }

      // For job listings, also clean up the company logo
      if (config.model === 'jobListing' && record.companyLogo) {
        await destroyImage({ url: record.companyLogo });
      }

      await prisma[config.model].delete({ where: { id } });
      return res.json({ success: true, message: 'Annonce supprimée définitivement' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin deleteListing error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports
// NOTE: No Report model in schema.prisma yet — returns empty array.
// When you add the model, replace the body below.
// ─────────────────────────────────────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    // Real implementation once Report model is added to schema:
    // const reports = await prisma.report.findMany({
    //   orderBy: { createdAt: 'desc' },
    //   include: { reporter: { select: { name: true, email: true } } },
    // })

    // Placeholder — no Report model in current schema
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("admin getReports error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:id
// Body: { action: 'dismiss' | 'delete' }
// NOTE: Placeholder until Report model is added.
// ─────────────────────────────────────────────────────────────────────────────
const handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["dismiss", "delete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action invalide. Utilisez dismiss ou delete.",
      });
    }

    // Real implementation once Report model is added:
    // if (action === 'dismiss') {
    //   await prisma.report.update({ where: { id }, data: { status: 'DISMISSED' } })
    // } else if (action === 'delete') {
    //   const report = await prisma.report.findUnique({ where: { id } })
    //   // Delete the listing too
    //   await prisma.report.update({ where: { id }, data: { status: 'DELETED' } })
    // }

    res.json({
      success: true,
      message: `Signalement ${action === "dismiss" ? "ignoré" : "traité"}`,
    });
  } catch (error) {
    console.error("admin handleReport error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query params: search, role, page, limit
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(role && { role: { name: role } }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          role: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const normalized = users.map((u) => ({
      ...u,
      role: u.role?.name || "citizen",
    }));

    res.json({
      success: true,
      data: normalized,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("admin getUsers error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle
// Flips isActive. Cannot toggle admin users.
// ─────────────────────────────────────────────────────────────────────────────
const toggleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable" });
    }

    if (user.role?.name === "admin") {
      return res.status(403).json({
        success: false,
        message: "Impossible de désactiver un compte admin",
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({
      success: true,
      isActive: updated.isActive,
      message: updated.isActive ? "Compte réactivé" : "Compte désactivé",
    });
  } catch (error) {
    console.error("admin toggleUser error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/businesses
// Returns business users with their listing stats
// ─────────────────────────────────────────────────────────────────────────────
const getBusinesses = async (req, res) => {
  try {
    const businessRole = await prisma.role.findUnique({
      where: { name: "business" },
    });

    if (!businessRole) {
      return res.json({ success: true, data: [] });
    }

    const businesses = await prisma.user.findMany({
      where: { roleId: businessRole.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        isActive: true,
        companyName: true,
        companyLogo: true,
        companyWebsite: true,
        createdAt: true,
        subscriptions: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            status: true,
            expiresAt: true,
            plan: { select: { name: true } },
          },
        },
        jobListings: {
          select: { status: true },
        },
        realEstateListings: {
          select: { status: true },
        },
      },
    });

    const normalized = businesses.map((b) => {
      // Combine job + real estate listings
      const allListings = [
        ...b.jobListings.map((l) => ({ status: l.status })),
        ...b.realEstateListings.map((l) => ({
          status: l.status,
        })),
      ];

      const activeSub = b.subscriptions[0];
      const plan = activeSub?.plan?.name || "Standard";

      return {
        id: b.id,
        name: b.companyName || b.name,
        email: b.email,
        city: b.city || "—",
        isActive: b.isActive,
        plan,
        joinedAt: b.createdAt,
        totalListings: allListings.length,
        pendingListings: allListings.filter((l) => l.status === "PENDING")
          .length,
        publishedListings: allListings.filter((l) => l.status === "APPROVED")
          .length,
        rejectedListings: allListings.filter((l) => l.status === "REJECTED")
          .length,
      };
    });

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("admin getBusinesses error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT — flat schema, module-based
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utility — convert a name to a slug.
 * e.g. "Informatique & Tech" → "informatique-tech"
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/categories
// Query: module (e.g. "emploi" | "immobilier") — optional filter
// Returns flat list of categories with listing counts.
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { module: mod } = req.query;

    const where = mod ? { module: mod } : {};

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            jobListings: true,
            realEstateListings: true,
          },
        },
      },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("admin getCategories error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/categories
// Body: { name, module }
// Creates a new category under the given module.
// ─────────────────────────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, module: mod } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est requis" });
    }
    if (!mod) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le module est requis (emploi | immobilier)",
        });
    }

    const MODULE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!MODULE_SLUG_RE.test(mod)) {
      return res.status(400).json({
        success: false,
        message:
          "Le module doit contenir uniquement des minuscules, chiffres et tirets.",
      });
    }

    const slug = `${mod}-${toSlug(name.trim())}`;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Une catégorie avec ce nom existe déjà dans ce module",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        module: mod,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("admin createCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id
// Body: { name }
// Renames a category and regenerates its slug.
// ─────────────────────────────────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est requis" });
    }

    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    // Rebuild slug: module prefix + new name
    const newSlug = `${cat.module}-${toSlug(name.trim())}`;

    // Check collision (exclude self)
    const collision = await prisma.category.findFirst({
      where: { slug: newSlug, NOT: { id } },
    });
    if (collision) {
      return res.status(409).json({
        success: false,
        message: "Une catégorie avec ce nom existe déjà dans ce module",
      });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug: newSlug },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("admin updateCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id/toggle
// Flips isActive on the category.
// ─────────────────────────────────────────────────────────────────────────────
const toggleCategoryActive = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    const newValue = !cat.isActive;

    await prisma.category.update({
      where: { id },
      data: { isActive: newValue },
    });

    res.json({
      success: true,
      isActive: newValue,
      message: newValue ? "Catégorie activée" : "Catégorie désactivée",
    });
  } catch (error) {
    console.error("admin toggleCategoryActive error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/categories/:id
// Blocks deletion if the category has linked listings.
// ─────────────────────────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobListings: true,
            realEstateListings: true,
          },
        },
      },
    });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    const totalListings =
      cat._count.jobListings + cat._count.realEstateListings;
    if (totalListings > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : ${totalListings} annonce(s) sont liées à cette catégorie. Désactivez-la à la place.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: "Catégorie supprimée" });
  } catch (error) {
    console.error("admin deleteCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admincategories/module/:module
// delete full module.
// ─────────────────────────────────────────────────────────────────────────────
const deleteModule = async (req, res) => {
  try {
    const { module: mod } = req.params;

    // Find all categories in this module
    const cats = await prisma.category.findMany({
      where: { module: mod },
      include: {
        _count: { select: { jobListings: true, realEstateListings: true } },
      },
    });

    const deletable = cats.filter(
      (c) => c._count.jobListings === 0 && c._count.realEstateListings === 0,
    );
    const blocked = cats.length - deletable.length;

    if (deletable.length === 0) {
      return res.status(409).json({
        success: false,
        message: `Aucune catégorie supprimable — ${blocked} ont des annonces liées.`,
      });
    }

    await prisma.category.deleteMany({
      where: { id: { in: deletable.map((c) => c.id) } },
    });

    res.json({
      success: true,
      deleted: deletable.length,
      blocked,
      message: `${deletable.length} catégorie(s) supprimée(s)${blocked > 0 ? `, ${blocked} conservée(s) (annonces liées)` : ""}.`,
    });
  } catch (error) {
    console.error("admin deleteModule error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
  updateListingStatus,
  deleteListing,
  getReports,
  handleReport,
  getUsers,
  toggleUser,
  getBusinesses,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
  deleteModule,
};
