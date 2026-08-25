const prisma = require('../config/db');
const { Prisma } = require('@prisma/client'); // just utilities, no new client
const { cloudinary } = require("../config/cloudinary");
const { cities: moroccoCities } = require('morocco-cities');
const { prepareListingOwnership } = require('./shopService');

// Build once at module load
const citiesByRegion = moroccoCities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// ─── Slug Generator ──────────────────────────────────────────────────────────
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${base}-${Date.now().toString(36)}`;
}

// ─── Category Validation ─────────────────────────────────────────────────────
async function validateLeafCategory(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) return { valid: false, message: "Category not found." };
  if (!category.isActive)
    return { valid: false, message: "Category is inactive." };
  return { valid: true };
}

// ─── Get Categories (immobilier) ─────────────────────────────────────────────
async function getCategories() {
  return prisma.category.findMany({
    where: { module: 'immobilier', isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

// ─── Shared listing select for business (includes admin notes + inquiry count) ─
const BUSINESS_LISTING_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,

  listingType: true,
  propertyType: true,

  price: true,

  city: true,
  location: true,
  latitude: true,
  longitude: true,

  surface: true,
  rooms: true,
  bathrooms: true,
  floor: true,

  contactPhone: true,

  features: true,
  images: true,

  status: true,
  isActive: true,
  isFeatured: true,
  sellerType: true,
  shopId: true,

  adminNotes: true,
  viewsCount: true,

  createdAt: true,
  updatedAt: true,
  publishedAt: true,

  category: {
    select: {
      id: true,
      name: true,
    },
  },
  shop: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, status: true } },

  _count: {
    select: {
      inquiries: true,
    },
  },
};

const SLUG_TO_PROPERTY_TYPE = {
  appartement: "APARTMENT",
  villa: "VILLA",
  maison: "HOUSE",
  studio: "STUDIO",
  terrain: "LAND",
  bureau: "OFFICE",
  commerce: "SHOP",
};

// ─── 1. CREATE LISTING ───────────────────────────────────────────────────────
async function createListing(data, userId) {
  const slug = generateSlug(data.title);
  const listingOwner = await prepareListingOwnership(data.shopId, userId);

  // Derive propertyType from category slug
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { slug: true },
  });
  const propertyType = SLUG_TO_PROPERTY_TYPE[category?.slug];
  if (!propertyType) throw new Error(`Unknown category slug: ${category?.slug}`);

  return prisma.realEstateListing.create({
    data: {
      userId,
      ...listingOwner,
      categoryId: data.categoryId,
      title: data.title.trim(),
      slug,
      description: data.description.trim(),
      listingType: data.listingType,
      propertyType, // ← derived, not from client
      price: parseFloat(data.price),
      priceNegotiable: Boolean(data.priceNegotiable),
      surface: data.surface ? parseFloat(data.surface) : null,
      rooms: data.rooms ? parseInt(data.rooms, 10) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms, 10) : null,
      floor: data.floor ? parseInt(data.floor, 10) : null,
      city: data.city?.trim() || null,
      region: data.region?.trim() || null,
      location: data.location.trim(),
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      contactPhone: data.contactPhone?.trim() || null,
      images: data.images ?? [],
      features: data.features ?? {},
      status: "PENDING",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      listingType: true,
      propertyType: true,
      price: true,
      priceNegotiable: true,
      city: true,
      categoryId: true,
      sellerType: true,
      shopId: true,
      createdAt: true,
    },
  });
}

// ─── 2. GET LISTINGS (public, APPROVED only) ─────────────────────────────────

async function getListings(query) {
  const {
    page = 1,
    limit = 12,
    city,
    region,
    listingType,
    propertyType,
    categoryId,
    minPrice,
    maxPrice,
    rooms,
    search,
    sort,
    minSurface,
    maxSurface,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // ── Build each optional filter fragment once ──────────────────────
  // Prisma.empty = "insert nothing" when the filter wasn't provided.
  // Every column is prefixed with l. (the RealEstateListing alias) to
  // avoid ambiguous-column errors against joined tables (User, Category).
  let locationFragment = Prisma.empty;
  if (city) {
    locationFragment = Prisma.sql`AND l.city ILIKE ${'%' + city + '%'}`;
  } else if (region) {
    const citiesInRegion = citiesByRegion[region] || [];
    if (citiesInRegion.length > 0) {
      locationFragment = Prisma.sql`AND l.city = ANY(${citiesInRegion})`;
    }
  }

  const listingTypeFragment = listingType
    ? Prisma.sql`AND l."listingType" = ${listingType}::"ListingType"`
    : Prisma.empty;

  const propertyTypeFragment = propertyType
    ? Prisma.sql`AND l."propertyType" = ${propertyType}::"PropertyType"`
    : Prisma.empty;

  const categoryFragment = categoryId
    ? Prisma.sql`AND l."categoryId" = ${categoryId}`
    : Prisma.empty;

  const roomsFragment = rooms
    ? Prisma.sql`AND l.rooms >= ${parseInt(rooms, 10)}`
    : Prisma.empty;

  let priceFragment = Prisma.empty;
  if (minPrice && maxPrice) {
    priceFragment = Prisma.sql`AND l.price BETWEEN ${parseFloat(minPrice)} AND ${parseFloat(maxPrice)}`;
  } else if (minPrice) {
    priceFragment = Prisma.sql`AND l.price >= ${parseFloat(minPrice)}`;
  } else if (maxPrice) {
    priceFragment = Prisma.sql`AND l.price <= ${parseFloat(maxPrice)}`;
  }

  let surfaceFragment = Prisma.empty;
  if (minSurface && maxSurface) {
    surfaceFragment = Prisma.sql`AND l.surface BETWEEN ${parseFloat(minSurface)} AND ${parseFloat(maxSurface)}`;
  } else if (minSurface) {
    surfaceFragment = Prisma.sql`AND l.surface >= ${parseFloat(minSurface)}`;
  } else if (maxSurface) {
    surfaceFragment = Prisma.sql`AND l.surface <= ${parseFloat(maxSurface)}`;
  }

  const searchFragment = search
    ? Prisma.sql`AND (l.title ILIKE ${'%' + search + '%'} OR l.description ILIKE ${'%' + search + '%'})`
    : Prisma.empty;

  // ── One shared WHERE clause, reused in both queries ───────────────
  const whereClause = Prisma.sql`
    WHERE l.status = 'APPROVED'
      AND l."isActive" = true
      ${locationFragment}
      ${listingTypeFragment}
      ${propertyTypeFragment}
      ${categoryFragment}
      ${roomsFragment}
      ${priceFragment}
      ${surfaceFragment}
      ${searchFragment}
  `;

  const [listings, countResult] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        l.id, l.slug, l.title, l."listingType", l."propertyType", l.price,
        l."priceNegotiable",
        l.city, l.surface, l.rooms, l.bathrooms, l.images, l."isActive",
        l.latitude, l.longitude,
        l."isFeatured", l."isSponsored", l."boostExpiresAt", l."createdAt",
        json_build_object('id', u.id, 'name', u.name, 'avatar', u.avatar) AS user,
        json_build_object('id', c.id, 'name', c.name) AS category
      FROM "RealEstateListing" l
      JOIN "User" u ON u.id = l."userId"
      JOIN "Category" c ON c.id = l."categoryId"
      ${whereClause}
      ORDER BY
        CASE
          WHEN l."isSponsored" = true AND l."boostExpiresAt" > NOW() THEN 0
          WHEN l."isSponsored" = true THEN 1
          WHEN l."isFeatured" = true THEN 2
          ELSE 3
        END,
        ${sort === 'price_asc'
        ? Prisma.sql`l.price ASC`
        : sort === 'price_desc'
          ? Prisma.sql`l.price DESC`
          : Prisma.sql`l."createdAt" DESC`
      }
      LIMIT ${limitNum} OFFSET ${skip}
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "RealEstateListing" l
      ${whereClause}
    `,
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    listings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

// ─── 3. GET LISTING DETAIL (public) ─────────────────────────────────────────
async function getListingById(id) {
  return prisma.realEstateListing.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, phone: true, city: true },
      },
      category: { select: { id: true, name: true, slug: true } },
      shop: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, status: true, professionalPhone: true } },
    },
  });
}

// ─── 4. FAVORITES ────────────────────────────────────────────────────────────
async function toggleFavorite(userId, listingId) {
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_itemId_itemType: {
        userId,
        itemId: listingId,
        itemType: "REAL_ESTATE",
      },
    },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: "removed" };
  }
  await prisma.favorite.create({
    data: { userId, itemId: listingId, itemType: "REAL_ESTATE" },
  });
  return { action: "added" };
}

async function getUserFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, itemType: "REAL_ESTATE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, itemId: true, createdAt: true },
  });
  if (!favorites.length) return [];
  const ids = favorites.map((f) => f.itemId);
  return prisma.realEstateListing.findMany({
    where: { id: { in: ids }, status: "APPROVED", isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      listingType: true,
      propertyType: true,
      price: true,
      city: true,
      surface: true,
      rooms: true,
      images: true,
      createdAt: true,
    },
  });
}

// ─── 5. INQUIRIES ────────────────────────────────────────────────────────────
async function createInquiry(data, userId) {
  const listing = await prisma.realEstateListing.findUnique({
    where: { id: data.listingId },
    select: { id: true, status: true, isActive: true },
  });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.status !== "APPROVED" || !listing.isActive)
    return { error: "Listing is not available.", status: 400 };

  const inquiry = await prisma.propertyInquiry.create({
    data: {
      listingId: data.listingId,
      userId,
      message: data.message.trim(),
      contactPhone: data.contactPhone?.trim() || null,
      contactEmail: data.contactEmail?.trim() || null,
    },
    select: {
      id: true,
      listingId: true,
      message: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
      createdAt: true,
    },
  });
  return { inquiry };
}

// ─── 6. ADMIN — PENDING QUEUE ────────────────────────────────────────────────
async function getPendingListings(query) {
  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [listings, total] = await prisma.$transaction([
    prisma.realEstateListing.findMany({
      where: { status: "PENDING" },
      skip,
      take,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        listingType: true,
        propertyType: true,
        price: true,
        city: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.realEstateListing.count({ where: { status: "PENDING" } }),
  ]);

  return {
    listings,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// ─── 7. ADMIN — MODERATE ─────────────────────────────────────────────────────
async function moderateListing(id, action, adminId, adminNotes) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.status !== "PENDING")
    return { error: "Listing is not pending.", status: 400 };

  const updated = await prisma.realEstateListing.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      publishedAt: action === "approve" ? new Date() : null,
      adminNotes: adminNotes?.trim() || null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      reviewedAt: true,
      adminNotes: true,
    },
  });
  return { listing: updated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS SERVICE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

// B1. Get all own listings (all statuses, paginated + filterable by status)
async function getMyListings(userId, query) {
  const { page = 1, limit = 12, status, city, listingType, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId,
    isActive: true,
    ...(status && { status }),
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(listingType && { listingType }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.realEstateListing.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: BUSINESS_LISTING_SELECT,
    }),
    prisma.realEstateListing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// B2. Get full detail of one own listing (ownership enforced)
async function getMyListingById(id, userId) {
  const listing = await prisma.realEstateListing.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { inquiries: true } },
    },
  });
  if (!listing || listing.userId !== userId) return null;
  return listing;
}

// B3. Update own listing — resets to PENDING so admin re-approves
async function updateMyListing(id, userId, data) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.userId !== userId) return { error: "Forbidden.", status: 403 };
  if (!listing.isActive) return { error: "Listing is deleted.", status: 400 };

  const updated = await prisma.realEstateListing.update({
    where: { id },
    data: {
      ...(data.title && {
        title: data.title.trim(),
        slug: generateSlug(data.title),
      }),
      ...(data.description && { description: data.description.trim() }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.listingType && { listingType: data.listingType }),
      ...(data.propertyType && { propertyType: data.propertyType }),
      ...(data.price && { price: parseFloat(data.price) }),
      ...(data.priceNegotiable !== undefined && {
        priceNegotiable: Boolean(data.priceNegotiable),
      }),
      ...(data.surface !== undefined && {
        surface: data.surface ? parseFloat(data.surface) : null,
      }),
      ...(data.rooms !== undefined && {
        rooms: data.rooms !== null ? parseInt(data.rooms, 10) : null,
      }),
      ...(data.bathrooms !== undefined && {
        bathrooms:
          data.bathrooms !== null ? parseInt(data.bathrooms, 10) : null,
      }),
      ...(data.floor !== undefined && {
        floor: data.floor !== null ? parseInt(data.floor, 10) : null,
      }),
      ...(data.city !== undefined && { city: data.city?.trim() || null }),
      ...(data.location && { location: data.location.trim() }),
      ...(data.region !== undefined && { region: data.region?.trim() || null }),
      ...(data.latitude !== undefined && {
        latitude: data.latitude ? parseFloat(data.latitude) : null,
      }),
      ...(data.longitude !== undefined && {
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      }),
      ...(data.contactPhone !== undefined && {
        contactPhone: data.contactPhone?.trim() || null,
      }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.features !== undefined && { features: data.features }),
      // Always reset to PENDING on edit so admin reviews changes
      status: "PENDING",
      adminNotes: null,
      reviewedAt: null,
      reviewedBy: null,
      publishedAt: null,
    },
    select: BUSINESS_LISTING_SELECT,
  });

  return { listing: updated };
}

// B4. Soft-delete own listing → ARCHIVED + deletedByOwner: true
async function deleteMyListing(id, userId) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.userId !== userId) return { error: "Forbidden.", status: 403 };
  if (listing.deletedByOwner) return { error: "Listing already deleted.", status: 400 };

  await prisma.realEstateListing.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      isActive: false,
      deletedByOwner: true,
      deletedAt: new Date(),
    },
  });
  return { success: true };
}

// B5. Get inquiries on own listing (ownership enforced, paginated)
async function getMyListingInquiries(listingId, userId, query) {
  const listing = await prisma.realEstateListing.findUnique({
    where: { id: listingId },
    select: { userId: true },
  });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.userId !== userId) return { error: "Forbidden.", status: 403 };

  const { page = 1, limit = 20, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    listingId,
    ...(status && { status }),
  };

  const [inquiries, total] = await prisma.$transaction([
    prisma.propertyInquiry.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    }),
    prisma.propertyInquiry.count({ where }),
  ]);

  return {
    inquiries,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// B6. Update inquiry status (business owner only — marks as read/replied/closed)
async function updateInquiryStatus(inquiryId, userId, status) {
  const inquiry = await prisma.propertyInquiry.findUnique({
    where: { id: inquiryId },
    include: { listing: { select: { userId: true } } },
  });
  if (!inquiry) return { error: "Inquiry not found.", status: 404 };
  if (inquiry.listing.userId !== userId)
    return { error: "Forbidden.", status: 403 };

  const updated = await prisma.propertyInquiry.update({
    where: { id: inquiryId },
    data: { status },
    select: {
      id: true,
      listingId: true,
      status: true,
      message: true,
      contactPhone: true,
      contactEmail: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { inquiry: updated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SERVICE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

// A1. Get all listings — filterable by status, city, userId, listingType, propertyType
async function adminGetAllListings(query) {
  const {
    page = 1,
    limit = 20,
    status,
    city,
    userId,
    listingType,
    propertyType,
    search,
  } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(userId && { userId }),
    ...(listingType && { listingType }),
    ...(propertyType && { propertyType }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.realEstateListing.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,         // Added
        listingType: true,
        propertyType: true,
        price: true,
        surface: true,             // Added
        rooms: true,               // Added
        bathrooms: true,           // Added
        floor: true,               // Added
        city: true,
        region: true,              // Added
        location: true,            // Added
        latitude: true,
        longitude: true,
        contactPhone: true,        // Added
        images: true,
        features: true,            // Added
        status: true,
        isActive: true,
        isFeatured: true,
        isSponsored: true,         // Added
        boostExpiresAt: true,      // Added
        viewsCount: true,
        adminNotes: true,
        reviewedAt: true,
        reviewedBy: true,          // Added
        publishedAt: true,         // Added
        createdAt: true,
        updatedAt: true,           // Added
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { inquiries: true } },
      },
    }),
    prisma.realEstateListing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// A2. Get full detail of any listing (admin view — all fields exposed)
async function adminGetListingById(id) {
  return prisma.realEstateListing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { inquiries: true } },
    },
  });
}

// A3. Admin force-edit any listing (does NOT reset status — admin controls status directly)
async function adminUpdateListing(id, data) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };

  const updated = await prisma.realEstateListing.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title.trim() }),
      ...(data.description && { description: data.description.trim() }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.listingType && { listingType: data.listingType }),
      ...(data.propertyType && { propertyType: data.propertyType }),
      ...(data.price && { price: parseFloat(data.price) }),
      ...(data.surface !== undefined && {
        surface: data.surface ? parseFloat(data.surface) : null,
      }),
      ...(data.rooms !== undefined && {
        rooms: data.rooms !== null ? parseInt(data.rooms, 10) : null,
      }),
      ...(data.bathrooms !== undefined && {
        bathrooms:
          data.bathrooms !== null ? parseInt(data.bathrooms, 10) : null,
      }),
      ...(data.city !== undefined && { city: data.city?.trim() || null }),
      ...(data.location && { location: data.location.trim() }),
      ...(data.images !== undefined && { images: data.images }),
      ...(data.features !== undefined && { features: data.features }),
      // Admin can directly set status (e.g. re-approve after edit)
      ...(data.status && { status: data.status }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isSponsored !== undefined && { isSponsored: data.isSponsored }),
      ...(data.adminNotes !== undefined && {
        adminNotes: data.adminNotes?.trim() || null,
      }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      isActive: true,
      isFeatured: true,
      adminNotes: true,
      updatedAt: true,
    },
  });
  return { listing: updated };
}

// A4. Hard-delete any listing — only allowed if ARCHIVED
async function adminDeleteListing(id) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.status !== "ARCHIVED")
    return { error: "Only ARCHIVED listings can be permanently deleted.", status: 400 };

  // Clean up Cloudinary images
  const images = listing.images || [];
  await Promise.all(
    images.map(async (img) => {
      try {
        const urlParts = img.url.split("/upload/");
        const withVersion = urlParts[1];
        const withoutVersion = withVersion.replace(/^v\d+\//, "");
        const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Failed to delete image from Cloudinary:", img.url, err.message);
      }
    })
  );

  await prisma.propertyInquiry.deleteMany({ where: { listingId: id } });
  await prisma.realEstateListing.delete({ where: { id } });
  return { success: true };
}

// A5. Get all inquiries on any listing
async function adminGetListingInquiries(listingId, query) {
  const listing = await prisma.realEstateListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) return { error: "Listing not found.", status: 404 };

  const { page = 1, limit = 20, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    listingId,
    ...(status && { status }),
  };

  const [inquiries, total] = await prisma.$transaction([
    prisma.propertyInquiry.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    }),
    prisma.propertyInquiry.count({ where }),
  ]);

  return {
    inquiries,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// A6. Platform-wide stats
async function adminGetStats() {
  const [
    totalListings,
    pending,
    approved,
    rejected,
    totalInquiries,
    activeListings,
    featuredListings,
  ] = await prisma.$transaction([
    prisma.realEstateListing.count(),
    prisma.realEstateListing.count({ where: { status: "PENDING" } }),
    prisma.realEstateListing.count({ where: { status: "APPROVED" } }),
    prisma.realEstateListing.count({ where: { status: "REJECTED" } }),
    prisma.propertyInquiry.count(),
    prisma.realEstateListing.count({
      where: { status: "APPROVED", isActive: true },
    }),
    prisma.realEstateListing.count({ where: { isFeatured: true } }),
  ]);

  return {
    listings: {
      total: totalListings,
      pending,
      approved,
      rejected,
      active: activeListings,
      featured: featuredListings,
    },
    inquiries: { total: totalInquiries },
  };
}

module.exports = {
  // helpers
  validateLeafCategory,
  // public
  getCategories,
  createListing,
  getListings,
  getListingById,
  // authenticated
  toggleFavorite,
  getUserFavorites,
  createInquiry,
  // admin (original)
  getPendingListings,
  moderateListing,
  // business
  getMyListings,
  getMyListingById,
  updateMyListing,
  deleteMyListing,
  getMyListingInquiries,
  updateInquiryStatus,
  // admin (new)
  adminGetAllListings,
  adminGetListingById,
  adminUpdateListing,
  adminDeleteListing,
  adminGetListingInquiries,
  adminGetStats,
};
