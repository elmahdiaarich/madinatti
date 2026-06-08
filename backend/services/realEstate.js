const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

// ─── Leaf Category Check ─────────────────────────────────────────────────────
async function validateLeafCategory(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { children: { select: { id: true } } },
  });
  if (!category) return { valid: false, message: "Category not found." };
  if (!category.isActive)
    return { valid: false, message: "Category is inactive." };
  if (category.children.length > 0)
    return {
      valid: false,
      message:
        "Select a specific sub-category (e.g. Apartment, Villa), not a parent.",
    };
  return { valid: true };
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

  _count: {
    select: {
      inquiries: true,
    },
  },
};

// ─── 1. CREATE LISTING ───────────────────────────────────────────────────────
async function createListing(data, userId) {
  const slug = generateSlug(data.title);
  return prisma.realEstateListing.create({
    data: {
      userId,
      categoryId: data.categoryId,
      title: data.title.trim(),
      slug,
      description: data.description.trim(),
      listingType: data.listingType,
      propertyType: data.propertyType,
      price: parseFloat(data.price),
      surface: data.surface ? parseFloat(data.surface) : null,
      rooms: data.rooms ? parseInt(data.rooms, 10) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms, 10) : null,
      floor: data.floor ? parseInt(data.floor, 10) : null,
      city: data.city?.trim() || null,
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
      city: true,
      categoryId: true,
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
    listingType,
    propertyType,
    minPrice,
    maxPrice,
    rooms,
    search,
  } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    status: "APPROVED",
    isActive: true,
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(listingType && { listingType }),
    ...(propertyType && { propertyType }),
    ...(rooms && { rooms: { gte: parseInt(rooms) } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
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
        listingType: true,
        propertyType: true,
        price: true,
        city: true,
        surface: true,
        rooms: true,
        bathrooms: true,
        images: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
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

// ─── 3. GET LISTING DETAIL (public) ─────────────────────────────────────────
async function getListingById(id) {
  const [listing] = await prisma.$transaction([
    prisma.realEstateListing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            city: true,
          },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.realEstateListing.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }),
  ]);
  return listing;
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

// B4. Soft-delete own listing
async function deleteMyListing(id, userId) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };
  if (listing.userId !== userId) return { error: "Forbidden.", status: 403 };

  await prisma.realEstateListing.update({
    where: { id },
    data: { isActive: false },
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
        listingType: true,
        propertyType: true,
        price: true,
        city: true,
        status: true,
        isActive: true,
        isFeatured: true,
        viewsCount: true,
        adminNotes: true,
        createdAt: true,
        reviewedAt: true,
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

// A4. Hard-delete any listing (also cascades to inquiries via Prisma cascade or manual delete)
async function adminDeleteListing(id) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: "Listing not found.", status: 404 };

  // Delete inquiries first (if no cascade defined in schema)
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
