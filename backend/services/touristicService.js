const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Bucket boundaries chosen to roughly split your seeded price spread
// (~25 DH to ~300 DH across spas/restaurants/museums/zoos). Adjust once
// you have real business pricing instead of seed data.
const PRICE_BUCKETS = {
  low:  { lte: 75 },
  mid:  { gt: 75, lte: 150 },
  high: { gt: 150 },
};

const getTouristicListings = async (filters) => {
  const { categorySlug, city, neighborhood, search, attributes, page = 1, limit = 20, isActive } = filters;

  // 1. Build the base query conditions
  const where = {
    category: {
      module: 'tourisme' // Guarantee we only query items in your tourism module
    }
  };

  // Admin filter or public default
  if (isActive !== undefined) {
    if (isActive !== 'all') {
      where.isActive = isActive === 'true' || isActive === true;
    }
  } else {
    where.isActive = true; // Only display active listings to the public
  }

  // 2. Filter by Category Slug if provided
  if (categorySlug) {
    where.category.slug = categorySlug;
  }

  // 3. Filter by Location (City / Neighborhood) — Case & accent insensitive
  if (city) {
    where.city = { contains: city.trim(), mode: 'insensitive' };
  }
  if (neighborhood) {
    where.neighborhood = { contains: neighborhood.trim(), mode: 'insensitive' };
  }

  // 4. Handle Global Text Search (Name or Description)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 5. Handle Dynamic JSON Attributes (e.g., prix, evaluation)
  if (attributes && Object.keys(attributes).length > 0) {
    const jsonFilters = [];

    // Map rating ('4' or '3') to evaluation stars ('4★', '3★')
    if (attributes.rating) {
      const minRating = parseInt(attributes.rating, 10) || 0;
      const stars = [];
      for (let r = minRating; r <= 5; r++) {
        stars.push(`${r}★`);
      }
      jsonFilters.push({
        OR: stars.map(star => ({
          attributes: {
            path: ['evaluation'],
            equals: star
          }
        }))
      });
      delete attributes.rating;
    }

    // Map priceRange ('low'/'mid'/'high') to a numeric gte/lte range
    // against attributes.prix. NOTE: this only matches listings whose
    // `prix` is stored as a JSON *number* — a formatted string like
    // "165 DH" will never satisfy gt/lte. See tourism.seed.js.
    if (attributes.priceRange) {
      const bucket = PRICE_BUCKETS[attributes.priceRange];
      if (bucket) {
        const rangeConds = [];
        if (bucket.gt != null) rangeConds.push({ attributes: { path: ['prix'], gt: bucket.gt } });
        if (bucket.gte != null) rangeConds.push({ attributes: { path: ['prix'], gte: bucket.gte } });
        if (bucket.lte != null) rangeConds.push({ attributes: { path: ['prix'], lte: bucket.lte } });
        if (rangeConds.length > 0) jsonFilters.push({ AND: rangeConds });
      }
      delete attributes.priceRange;
    }

    // Remaining standard attributes
    Object.keys(attributes).forEach((key) => {
      if (attributes[key] !== undefined && attributes[key] !== null && attributes[key] !== '') {
        jsonFilters.push({
          attributes: {
            path: [key],
            equals: attributes[key],
          },
        });
      }
    });

    if (jsonFilters.length > 0) {
      where.AND = jsonFilters;
    }
  }

  // 6. Pagination math
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // 7. Execute query + count in parallel
  const [listings, total] = await Promise.all([
    prisma.touristicListing.findMany({
      where,
      include: {
        category: true, // Pulls along category fields like names and icons
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    }),
    prisma.touristicListing.count({ where }),
  ]);

  return {
    listings,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getTouristicListingById = async (id) => {
  return await prisma.touristicListing.findUnique({
    where: { id },
    include: { category: true }
  });
};

const createTouristicListing = async (data, adminId) => {
  return await prisma.touristicListing.create({
    data: {
      ...data,
      createdBy: adminId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : [],
      attributes: data.attributes ? JSON.parse(JSON.stringify(data.attributes)) : {},
    },
    include: { category: true }
  });
};

const updateTouristicListing = async (id, data) => {
  return await prisma.touristicListing.update({
    where: { id },
    data: {
      ...data,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : undefined,
      attributes: data.attributes ? JSON.parse(JSON.stringify(data.attributes)) : undefined,
    },
    include: { category: true }
  });
};

const deleteTouristicListing = async (id) => {
  return await prisma.touristicListing.delete({
    where: { id }
  });
};

const incrementDownloadCount = async (id) =>
  prisma.touristicListing.update({ where: { id }, data: { downloadsCount: { increment: 1 } } });

const getDistinctNeighborhoods = async () => {
  const listings = await prisma.touristicListing.findMany({
    where: { isActive: true },
    select: { city: true, neighborhood: true },
    distinct: ['city', 'neighborhood'],
  });

  const map = {};
  listings.forEach((item) => {
    if (!item.city || !item.neighborhood) return;
    const key = item.city.trim();
    if (!map[key]) map[key] = new Set();
    map[key].add(item.neighborhood.trim());
  });

  return Object.fromEntries(
    Object.entries(map).map(([city, set]) => [city, [...set].sort()])
  );
};

module.exports = {
  getTouristicListings,
  getTouristicListingById,
  createTouristicListing,
  updateTouristicListing,
  deleteTouristicListing,
  incrementDownloadCount,
  getDistinctNeighborhoods
};