const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Slug Generator ───────────────────────────────────────────────────────────
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${base}-${Date.now().toString(36)}`;
}

// ─── Leaf Category Check ──────────────────────────────────────────────────────
async function validateLeafCategory(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { children: { select: { id: true } } },
  });

  if (!category)        return { valid: false, message: 'Category not found.' };
  if (!category.isActive) return { valid: false, message: 'Category is inactive.' };
  if (category.children.length > 0)
    return {
      valid: false,
      message: 'Select a specific sub-category (e.g. Apartment, Villa), not a parent.',
    };

  return { valid: true };
}

// ─── 1. CREATE LISTING ────────────────────────────────────────────────────────
async function createListing(data, userId) {
  const slug = generateSlug(data.title);

  return prisma.realEstateListing.create({
    data: {
      userId,
      categoryId:   data.categoryId,
      title:        data.title.trim(),
      slug,
      description:  data.description.trim(),
      listingType:  data.listingType,
      propertyType: data.propertyType,
      price:        parseFloat(data.price),
      surface:      data.surface    ? parseFloat(data.surface)     : null,
      rooms:        data.rooms      ? parseInt(data.rooms, 10)     : null,
      bathrooms:    data.bathrooms  ? parseInt(data.bathrooms, 10) : null,
      floor:        data.floor      ? parseInt(data.floor, 10)     : null,
      city:         data.city?.trim()       || null,
      location:     data.location.trim(),
      latitude:     data.latitude   ? parseFloat(data.latitude)    : null,
      longitude:    data.longitude  ? parseFloat(data.longitude)   : null,
      contactPhone: data.contactPhone?.trim() || null,
      images:       data.images   ?? [],
      features:     data.features ?? {},
      status:       'PENDING',
    },
    select: {
      id: true, slug: true, title: true, status: true,
      listingType: true, propertyType: true,
      price: true, city: true, categoryId: true, createdAt: true,
    },
  });
}

// ─── 2. GET LISTINGS (PUBLIC) ─────────────────────────────────────────────────
async function getListings(query) {
  const {
    page = 1, limit = 12,
    city, listingType, propertyType,
    minPrice, maxPrice, rooms,
    search,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    status:   'APPROVED',
    isActive: true,
    ...(city         && { city:         { contains: city,         mode: 'insensitive' } }),
    ...(listingType  && { listingType }),
    ...(propertyType && { propertyType }),
    ...(rooms        && { rooms: { gte: parseInt(rooms) } }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.realEstateListing.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true,
        listingType: true, propertyType: true,
        price: true, city: true, surface: true,
        rooms: true, bathrooms: true,
        images: true, isActive: true,
        isFeatured: true, createdAt: true,
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
      page:       parseInt(page),
      limit:      take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// ─── 3. GET LISTING DETAILS ───────────────────────────────────────────────────
async function getListingById(id) {
  // increment viewsCount + fetch in parallel
  const [listing] = await prisma.$transaction([
    prisma.realEstateListing.findUnique({
      where: { id },
      include: {
        user:     { select: { id: true, name: true, avatar: true, phone: true, city: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.realEstateListing.update({
      where: { id },
      data:  { viewsCount: { increment: 1 } },
    }),
  ]);

  return listing;
}

// ─── 4. FAVORITES ─────────────────────────────────────────────────────────────
async function toggleFavorite(userId, listingId) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_itemId_itemType: { userId, itemId: listingId, itemType: 'REAL_ESTATE' } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: 'removed' };
  }

  await prisma.favorite.create({
    data: { userId, itemId: listingId, itemType: 'REAL_ESTATE' },
  });
  return { action: 'added' };
}

async function getUserFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where:   { userId, itemType: 'REAL_ESTATE' },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, itemId: true, createdAt: true },
  });

  if (!favorites.length) return [];

  const ids = favorites.map(f => f.itemId);

  const listings = await prisma.realEstateListing.findMany({
    where:  { id: { in: ids }, status: 'APPROVED', isActive: true },
    select: {
      id: true, slug: true, title: true,
      listingType: true, propertyType: true,
      price: true, city: true, surface: true,
      rooms: true, images: true, createdAt: true,
    },
  });

  return listings;
}

// ─── 5. INQUIRIES ─────────────────────────────────────────────────────────────
async function createInquiry(data, userId) {
  // Make sure listing exists and is active
  const listing = await prisma.realEstateListing.findUnique({
    where:  { id: data.listingId },
    select: { id: true, status: true, isActive: true },
  });

  if (!listing)                              
    return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'APPROVED' || !listing.isActive)
    return { error: 'Listing is not available.', status: 400 };

  const inquiry = await prisma.propertyInquiry.create({
    data: {
      listingId:    data.listingId,
      userId,
      message:      data.message.trim(),
      contactPhone: data.contactPhone?.trim() || null,
      contactEmail: data.contactEmail?.trim() || null,
    },
    select: {
      id: true, listingId: true, message: true,
      contactPhone: true, contactEmail: true,
      status: true, createdAt: true,
    },
  });

  return { inquiry };
}

// ─── 6. ADMIN MODERATION ──────────────────────────────────────────────────────
async function getPendingListings(query) {
  const { page = 1, limit = 20 } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [listings, total] = await prisma.$transaction([
    prisma.realEstateListing.findMany({
      where:   { status: 'PENDING' },
      skip,
      take,
      orderBy: { createdAt: 'asc' },        // oldest first for fairness
      select: {
        id: true, slug: true, title: true,
        listingType: true, propertyType: true,
        price: true, city: true, createdAt: true,
        user:     { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.realEstateListing.count({ where: { status: 'PENDING' } }),
  ]);

  return { listings, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
}

async function moderateListing(id, action, adminId, adminNotes) {
  const listing = await prisma.realEstateListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'PENDING') return { error: 'Listing is not pending.', status: 400 };

  const updated = await prisma.realEstateListing.update({
    where: { id },
    data: {
      status:      action === 'approve' ? 'APPROVED' : 'REJECTED',
      reviewedBy:  adminId,
      reviewedAt:  new Date(),
      publishedAt: action === 'approve' ? new Date() : null,
      adminNotes:  adminNotes?.trim() || null,
    },
    select: {
      id: true, slug: true, title: true,
      status: true, reviewedAt: true, adminNotes: true,
    },
  });

  return { listing: updated };
}

module.exports = {
  createListing, validateLeafCategory,
  getListings, getListingById,
  toggleFavorite, getUserFavorites,
  createInquiry,
  getPendingListings, moderateListing,
};