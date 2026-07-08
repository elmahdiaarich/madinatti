const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTouristicListings = async (filters) => {
  const { categorySlug, city, neighborhood, search, attributes, page = 1, limit = 20 } = filters;

  // 1. Build the base query conditions
  const where = {
    isActive: true, // Only display active listings to the public
    category: {
      module: 'tourisme' // Guarantee we only query items in your tourism module
    }
  };

  // 2. Filter by Category Slug if provided
  if (categorySlug) {
    where.category.slug = categorySlug;
  }

  // 3. Filter by Location (City / Neighborhood)
  if (city) {
    where.city = city;
  }
  if (neighborhood) {
    where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
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
    // We add an 'AND' clause to check keys inside our Prisma Json field
    where.AND = Object.keys(attributes).map((key) => ({
      attributes: {
        path: [key],
        equals: attributes[key],
      },
    }));
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
      isActive: true, // Admin creations go live instantly
      // Ensure complex objects/arrays are structurally sound for Postgres JSON
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

module.exports = {
  getTouristicListings,
  getTouristicListingById,
  createTouristicListing,
  updateTouristicListing,
  deleteTouristicListing
};