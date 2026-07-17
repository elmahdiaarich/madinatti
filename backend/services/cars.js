/**
 * services/cars.js
 * Business logic for the Car listings module.
 * Mirrors the real-estate service pattern — same guards, same pagination shape.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary');
const { cities: moroccoCities } = require('morocco-cities');
const { getVehicleCatalog } = require('../data/vehicleCatalog');

// ── Build region → cities lookup once at startup ──────────────────────────────
const citiesByRegion = moroccoCities.reduce((acc, c) => {
  if (!acc[c.region_name]) acc[c.region_name] = [];
  acc[c.region_name].push(c.name);
  return acc;
}, {});

// ── Helpers ───────────────────────────────────────────────────────────────────

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

/**
 * Shared select for business-owner views — includes admin notes & inquiry count,
 * but excludes sensitive reviewer fields.
 */
const BUSINESS_SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  listingType: true,
  condition: true,
  make: true,
  model: true,
  year: true,
  mileage: true,
  fuelType: true,
  transmission: true,
  bodyType: true,
  color: true,
  doors: true,
  seats: true,
  engineSize: true,
  horsePower: true,
  price: true,
  isNegotiable: true,
  city: true,
  region: true,
  location: true,
  latitude: true,
  longitude: true,
  contactPhone: true,
  images: true,
  features: true,
  status: true,
  isActive: true,
  isFeatured: true,
  viewsCount: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  category: { select: { id: true, name: true } },
  _count: { select: { inquiries: true } },
};

// ── Category helpers ──────────────────────────────────────────────────────────

async function validateLeafCategory(categoryId) {
  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat) return { valid: false, message: 'Category not found.' };
  if (!cat.isActive) return { valid: false, message: 'Category is inactive.' };
  if (cat.module !== 'automobile')
    return { valid: false, message: 'Category does not belong to the automobile module.' };
  return { valid: true };
}

async function getCategories() {
  return prisma.category.findMany({
    where: { module: 'automobile', isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });
}

function getCatalog() {
  return getVehicleCatalog();
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

/**
 * 1. CREATE — business only
 */
async function createListing(data, userId) {
  const slug = generateSlug(`${data.make} ${data.model} ${data.title}`);

  return prisma.carListing.create({
    data: {
      userId,
      categoryId:   data.categoryId,
      title:        data.title.trim(),
      slug,
      description:  data.description.trim(),
      listingType:  data.listingType,
      condition:    data.condition,
      make:         data.make.trim(),
      model:        data.model.trim(),
      year:         parseInt(data.year, 10),
      mileage:      data.mileage != null ? parseInt(data.mileage, 10) : null,
      fuelType:     data.fuelType,
      transmission: data.transmission,
      bodyType:     data.bodyType,
      color:        data.color?.trim() || null,
      doors:        data.doors != null ? parseInt(data.doors, 10) : null,
      seats:        data.seats != null ? parseInt(data.seats, 10) : null,
      engineSize:   data.engineSize != null ? parseFloat(data.engineSize) : null,
      horsePower:   data.horsePower != null ? parseInt(data.horsePower, 10) : null,
      price:        parseFloat(data.price),
      isNegotiable: Boolean(data.isNegotiable),
      city:         data.city?.trim() || null,
      region:       data.region?.trim() || null,
      location:     data.location.trim(),
      latitude:     data.latitude != null ? parseFloat(data.latitude) : null,
      longitude:    data.longitude != null ? parseFloat(data.longitude) : null,
      contactPhone: data.contactPhone?.trim() || null,
      images:       data.images ?? [],
      features:     data.features ?? {},
      status:       'PENDING',
    },
    select: {
      id: true, slug: true, title: true, make: true, model: true,
      year: true, status: true, listingType: true, price: true,
      city: true, categoryId: true, createdAt: true,
    },
  });
}

/**
 * 2. GET LISTINGS — public, APPROVED only, filterable + paginated
 */
async function getListings(query) {
  const {
    page = 1, limit = 12,
    city, region,
    listingType, condition,
    make, model,
    fuelType, transmission, bodyType,
    categoryId,
    minPrice, maxPrice,
    minYear, maxYear,
    maxMileage,
    search,
    sortBy = 'createdAt', sortDir = 'desc',
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(parseInt(limit), 50); // hard cap per request

  // Location resolution
  let locationFilter = {};
  if (city) {
    locationFilter = { city: { contains: city, mode: 'insensitive' } };
  } else if (region) {
    const cities = citiesByRegion[region] || [];
    if (cities.length) locationFilter = { city: { in: cities } };
  }

  // Allowed sort columns (whitelist to prevent injection)
  const SORT_WHITELIST = { createdAt: true, price: true, year: true, mileage: true, make: true, model: true };
  const orderByField = SORT_WHITELIST[sortBy] ? sortBy : 'createdAt';
  const orderByDir = sortDir === 'asc' ? 'asc' : 'desc';

  const where = {
    status: 'APPROVED',
    isActive: true,
    ...locationFilter,
    ...(listingType   && { listingType }),
    ...(condition     && { condition }),
    ...(make          && { make: { contains: make, mode: 'insensitive' } }),
    ...(model         && { model: { contains: model, mode: 'insensitive' } }),
    ...(fuelType      && { fuelType }),
    ...(transmission  && { transmission }),
    ...(bodyType      && { bodyType }),
    ...(categoryId    && { categoryId }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      },
    }),
    ...((minYear || maxYear) && {
      year: {
        ...(minYear && { gte: parseInt(minYear, 10) }),
        ...(maxYear && { lte: parseInt(maxYear, 10) }),
      },
    }),
    ...(maxMileage && { mileage: { lte: parseInt(maxMileage, 10) } }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { make:        { contains: search, mode: 'insensitive' } },
        { model:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.carListing.findMany({
      where,
      skip,
      take,
      orderBy: [
        { isSponsored: 'desc' },   // sponsored first
        { isFeatured: 'desc' },    // then featured
        { [orderByField]: orderByDir }, // then user-selected sort
      ],
      select: {
        id: true, slug: true, title: true,
        listingType: true, condition: true,
        make: true, model: true, year: true, mileage: true,
        fuelType: true, transmission: true, bodyType: true,
        price: true, isNegotiable: true,
        city: true, images: true,
        isFeatured: true, isSponsored: true, // ← add isSponsored to select
        createdAt: true,
        user:     { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.carListing.count({ where }),
  ]);

  return {
    listings,
    pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
  };
}

/**
 * 3. GET LISTING DETAIL — public (caller must check status externally)
 */
async function getListingById(id) {
  return prisma.carListing.findUnique({
    where: { id },
    include: {
      user:     { select: { id: true, name: true, avatar: true, phone: true, city: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

// ── FAVORITES ─────────────────────────────────────────────────────────────────

async function toggleFavorite(userId, listingId) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_itemId_itemType: { userId, itemId: listingId, itemType: 'CAR' } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { action: 'removed' };
  }
  await prisma.favorite.create({ data: { userId, itemId: listingId, itemType: 'CAR' } });
  return { action: 'added' };
}

async function getUserFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, itemType: 'CAR' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, itemId: true, createdAt: true },
  });
  if (!favorites.length) return [];
  const ids = favorites.map((f) => f.itemId);
  return prisma.carListing.findMany({
    where: { id: { in: ids }, status: 'APPROVED', isActive: true },
    select: {
      id: true, slug: true, title: true,
      make: true, model: true, year: true,
      price: true, isNegotiable: true,
      city: true, images: true, createdAt: true,
    },
  });
}

// ── INQUIRIES ─────────────────────────────────────────────────────────────────

async function createInquiry(data, userId) {
  const listing = await prisma.carListing.findUnique({
    where: { id: data.listingId },
    select: { id: true, status: true, isActive: true },
  });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'APPROVED' || !listing.isActive)
    return { error: 'Listing is not available.', status: 400 };

  const inquiry = await prisma.carInquiry.create({
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

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS
// ═══════════════════════════════════════════════════════════════════════════════

async function getMyListings(userId, query) {
  const { page = 1, limit = 12, status, city, listingType, make, model, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId,
    isActive: true,
    ...(status      && { status }),
    ...(city        && { city: { contains: city, mode: 'insensitive' } }),
    ...(listingType && { listingType }),
    ...(make        && { make: { contains: make, mode: 'insensitive' } }),
    ...(model       && { model: { contains: model, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { make:  { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.carListing.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: BUSINESS_SELECT }),
    prisma.carListing.count({ where }),
  ]);

  return { listings, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
}

async function getMyListingById(id, userId) {
  const listing = await prisma.carListing.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { inquiries: true } },
    },
  });
  if (!listing || listing.userId !== userId) return null;
  return listing;
}

async function updateMyListing(id, userId, data) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.userId !== userId) return { error: 'Forbidden.', status: 403 };
  if (!listing.isActive) return { error: 'Listing is deleted.', status: 400 };

  const updated = await prisma.carListing.update({
    where: { id },
    data: {
      ...(data.title       && { title: data.title.trim(), slug: generateSlug(`${data.make || listing.make} ${data.model || listing.model} ${data.title}`) }),
      ...(data.description && { description: data.description.trim() }),
      ...(data.categoryId  && { categoryId: data.categoryId }),
      ...(data.listingType && { listingType: data.listingType }),
      ...(data.condition   && { condition: data.condition }),
      ...(data.make        && { make: data.make.trim() }),
      ...(data.model       && { model: data.model.trim() }),
      ...(data.year        != null && { year: parseInt(data.year, 10) }),
      ...(data.mileage     != null && { mileage: data.mileage !== null ? parseInt(data.mileage, 10) : null }),
      ...(data.fuelType    && { fuelType: data.fuelType }),
      ...(data.transmission && { transmission: data.transmission }),
      ...(data.bodyType    && { bodyType: data.bodyType }),
      ...(data.color       !== undefined && { color: data.color?.trim() || null }),
      ...(data.doors       != null && { doors: data.doors !== null ? parseInt(data.doors, 10) : null }),
      ...(data.seats       != null && { seats: data.seats !== null ? parseInt(data.seats, 10) : null }),
      ...(data.engineSize  != null && { engineSize: data.engineSize !== null ? parseFloat(data.engineSize) : null }),
      ...(data.horsePower  != null && { horsePower: data.horsePower !== null ? parseInt(data.horsePower, 10) : null }),
      ...(data.price       != null && { price: parseFloat(data.price) }),
      ...(data.isNegotiable !== undefined && { isNegotiable: Boolean(data.isNegotiable) }),
      ...(data.city        !== undefined && { city: data.city?.trim() || null }),
      ...(data.region      !== undefined && { region: data.region?.trim() || null }),
      ...(data.location    && { location: data.location.trim() }),
      ...(data.latitude    !== undefined && { latitude: data.latitude != null ? parseFloat(data.latitude) : null }),
      ...(data.longitude   !== undefined && { longitude: data.longitude != null ? parseFloat(data.longitude) : null }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone?.trim() || null }),
      ...(data.images      !== undefined && { images: data.images }),
      ...(data.features    !== undefined && { features: data.features }),
      // Always reset to PENDING so admin re-reviews the changes
      status:      'PENDING',
      adminNotes:  null,
      reviewedAt:  null,
      reviewedBy:  null,
      publishedAt: null,
    },
    select: BUSINESS_SELECT,
  });

  return { listing: updated };
}

async function deleteMyListing(id, userId) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.userId !== userId) return { error: 'Forbidden.', status: 403 };
  if (listing.deletedByOwner) return { error: 'Listing already deleted.', status: 400 };

  await prisma.carListing.update({
    where: { id },
    data: { status: 'ARCHIVED', isActive: false, deletedByOwner: true, deletedAt: new Date() },
  });
  return { success: true };
}

async function getMyListingInquiries(listingId, userId, query) {
  const listing = await prisma.carListing.findUnique({ where: { id: listingId }, select: { userId: true } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.userId !== userId) return { error: 'Forbidden.', status: 403 };

  const { page = 1, limit = 20, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = { listingId, ...(status && { status }) };

  const [inquiries, total] = await prisma.$transaction([
    prisma.carInquiry.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    }),
    prisma.carInquiry.count({ where }),
  ]);

  return { inquiries, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
}

async function updateInquiryStatus(inquiryId, userId, status) {
  const inquiry = await prisma.carInquiry.findUnique({
    where: { id: inquiryId },
    include: { listing: { select: { userId: true } } },
  });
  if (!inquiry) return { error: 'Inquiry not found.', status: 404 };
  if (inquiry.listing.userId !== userId) return { error: 'Forbidden.', status: 403 };

  const updated = await prisma.carInquiry.update({
    where: { id: inquiryId },
    data: { status },
    select: {
      id: true, listingId: true, status: true, message: true,
      contactPhone: true, contactEmail: true, createdAt: true, updatedAt: true,
    },
  });
  return { inquiry: updated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

async function adminGetAllListings(query) {
  const {
    page = 1, limit = 20,
    status, city, userId,
    listingType, condition,
    make, model,
    search,
  } = query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    ...(status      && { status }),
    ...(city        && { city: { contains: city, mode: 'insensitive' } }),
    ...(userId      && { userId }),
    ...(listingType && { listingType }),
    ...(condition   && { condition }),
    ...(make        && { make: { contains: make, mode: 'insensitive' } }),
    ...(model       && { model: { contains: model, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { make:        { contains: search, mode: 'insensitive' } },
        { model:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [listings, total] = await prisma.$transaction([
    prisma.carListing.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true, description: true,
        listingType: true, condition: true,
        make: true, model: true, year: true, mileage: true,
        fuelType: true, transmission: true, bodyType: true,
        color: true, doors: true, seats: true,
        engineSize: true, horsePower: true,
        price: true, isNegotiable: true,
        city: true, region: true, location: true,
        latitude: true, longitude: true, contactPhone: true,
        images: true, features: true,
        status: true, isActive: true,
        isFeatured: true, isSponsored: true, boostExpiresAt: true,
        viewsCount: true, adminNotes: true,
        reviewedAt: true, reviewedBy: true, publishedAt: true,
        createdAt: true, updatedAt: true,
        user:     { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        _count:   { select: { inquiries: true } },
      },
    }),
    prisma.carListing.count({ where }),
  ]);

  return { listings, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
}

async function adminGetListingById(id) {
  return prisma.carListing.findUnique({
    where: { id },
    include: {
      user:     { select: { id: true, name: true, email: true, phone: true, companyName: true } },
      category: { select: { id: true, name: true, slug: true } },
      _count:   { select: { inquiries: true } },
    },
  });
}

async function moderateListing(id, action, adminId, adminNotes) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'PENDING') return { error: 'Listing is not pending.', status: 400 };

  const updated = await prisma.carListing.update({
    where: { id },
    data: {
      status:      action === 'approve' ? 'APPROVED' : 'REJECTED',
      reviewedBy:  adminId,
      reviewedAt:  new Date(),
      publishedAt: action === 'approve' ? new Date() : null,
      adminNotes:  adminNotes?.trim() || null,
    },
    select: { id: true, slug: true, title: true, status: true, reviewedAt: true, adminNotes: true },
  });
  return { listing: updated };
}

async function adminUpdateListing(id, data) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };

  const updated = await prisma.carListing.update({
    where: { id },
    data: {
      ...(data.title        && { title: data.title.trim() }),
      ...(data.description  && { description: data.description.trim() }),
      ...(data.categoryId   && { categoryId: data.categoryId }),
      ...(data.listingType  && { listingType: data.listingType }),
      ...(data.condition    && { condition: data.condition }),
      ...(data.make         && { make: data.make.trim() }),
      ...(data.model        && { model: data.model.trim() }),
      ...(data.year         != null && { year: parseInt(data.year, 10) }),
      ...(data.mileage      != null && { mileage: data.mileage !== null ? parseInt(data.mileage, 10) : null }),
      ...(data.fuelType     && { fuelType: data.fuelType }),
      ...(data.transmission && { transmission: data.transmission }),
      ...(data.bodyType     && { bodyType: data.bodyType }),
      ...(data.price        != null && { price: parseFloat(data.price) }),
      ...(data.city         !== undefined && { city: data.city?.trim() || null }),
      ...(data.location     && { location: data.location.trim() }),
      ...(data.images       !== undefined && { images: data.images }),
      ...(data.features     !== undefined && { features: data.features }),
      // Admin controls status directly
      ...(data.status       && { status: data.status }),
      ...(data.isActive     !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured   !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isSponsored  !== undefined && { isSponsored: data.isSponsored }),
      ...(data.adminNotes   !== undefined && { adminNotes: data.adminNotes?.trim() || null }),
    },
    select: {
      id: true, slug: true, title: true,
      status: true, isActive: true, isFeatured: true,
      adminNotes: true, updatedAt: true,
    },
  });
  return { listing: updated };
}

async function adminDeleteListing(id) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'ARCHIVED')
    return { error: 'Only ARCHIVED listings can be permanently deleted.', status: 400 };

  // Clean up Cloudinary images
  const images = Array.isArray(listing.images) ? listing.images : [];
  await Promise.allSettled(
    images.map(async (img) => {
      try {
        const urlParts = img.url.split('/upload/');
        const withVersion = urlParts[1];
        const withoutVersion = withVersion.replace(/^v\d+\//, '');
        const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('[adminDeleteListing] Cloudinary cleanup failed:', img.url, err.message);
      }
    }),
  );

  await prisma.carInquiry.deleteMany({ where: { listingId: id } });
  await prisma.carListing.delete({ where: { id } });
  return { success: true };
}

async function adminGetListingInquiries(listingId, query) {
  const listing = await prisma.carListing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return { error: 'Listing not found.', status: 404 };

  const { page = 1, limit = 20, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const where = { listingId, ...(status && { status }) };

  const [inquiries, total] = await prisma.$transaction([
    prisma.carInquiry.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    }),
    prisma.carInquiry.count({ where }),
  ]);

  return { inquiries, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } };
}

async function adminGetStats() {
  const [
    totalListings, pending, approved, rejected, suspended, archived,
    totalInquiries, activeListings, featuredListings,
  ] = await prisma.$transaction([
    prisma.carListing.count(),
    prisma.carListing.count({ where: { status: 'PENDING' } }),
    prisma.carListing.count({ where: { status: 'APPROVED' } }),
    prisma.carListing.count({ where: { status: 'REJECTED' } }),
    prisma.carListing.count({ where: { status: 'SUSPENDED' } }),
    prisma.carListing.count({ where: { status: 'ARCHIVED' } }),
    prisma.carInquiry.count(),
    prisma.carListing.count({ where: { status: 'APPROVED', isActive: true } }),
    prisma.carListing.count({ where: { isFeatured: true } }),
  ]);

  return {
    listings: { total: totalListings, pending, approved, rejected, suspended, archived, active: activeListings, featured: featuredListings },
    inquiries: { total: totalInquiries },
  };
}

// ── Suspend / unsuspend (admin-only status transitions) ───────────────────────

async function suspendListing(id, adminId, adminNotes) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'APPROVED') return { error: 'Only APPROVED listings can be suspended.', status: 400 };

  const updated = await prisma.carListing.update({
    where: { id },
    data: { status: 'SUSPENDED', isActive: false, reviewedBy: adminId, reviewedAt: new Date(), adminNotes: adminNotes?.trim() || null },
    select: { id: true, title: true, status: true },
  });
  return { listing: updated };
}

async function unsuspendListing(id, adminId) {
  const listing = await prisma.carListing.findUnique({ where: { id } });
  if (!listing) return { error: 'Listing not found.', status: 404 };
  if (listing.status !== 'SUSPENDED') return { error: 'Listing is not suspended.', status: 400 };

  const updated = await prisma.carListing.update({
    where: { id },
    data: { status: 'APPROVED', isActive: true, reviewedBy: adminId, reviewedAt: new Date(), adminNotes: null },
    select: { id: true, title: true, status: true },
  });
  return { listing: updated };
}

module.exports = {
  // helpers
  validateLeafCategory,
  // public
  getCategories,
  getCatalog,
  createListing,
  getListings,
  getListingById,
  // authenticated
  toggleFavorite,
  getUserFavorites,
  createInquiry,
  // business
  getMyListings,
  getMyListingById,
  updateMyListing,
  deleteMyListing,
  getMyListingInquiries,
  updateInquiryStatus,
  // admin
  moderateListing,
  suspendListing,
  unsuspendListing,
  adminGetAllListings,
  adminGetListingById,
  adminUpdateListing,
  adminDeleteListing,
  adminGetListingInquiries,
  adminGetStats,
};
