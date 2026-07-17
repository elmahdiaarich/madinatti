const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary');
const { cities: MOROCCO_CITIES } = require('morocco-cities');

function regionFor(cityName) {
  if (!cityName) return null;
  const match = MOROCCO_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase().trim()
  );
  return match?.region_name || null;
}
const getProfessionalSpaceListings = async (filters) => {
  const { categorySlug, city, search, page = 1, limit = 20, isActive } = filters;

  const where = {
    category: {
      module: 'espaces-pro'
    }
  };

  // Admin filter or public default
  if (isActive !== undefined) {
    if (isActive !== 'all') {
      where.isActive = isActive === 'true' || isActive === true;
    }
  } else {
    where.isActive = true;
  }

  if (categorySlug) {
    where.category.slug = categorySlug;
  }

  // NOTE: `city` is intentionally NOT added to `where` anymore — it's a
  // ranking signal (searched city first, same-region cities next, others
  // after), not a hard filter.
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [allMatching, total] = await Promise.all([
    prisma.professionalSpaceListing.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.professionalSpaceListing.count({ where }),
  ]);

  const searchedRegion = city ? regionFor(city) : null;

  const cityRank = (listing) => {
    if (!city) return 2; // no city filter active — everyone's equal
    if (listing.city?.toLowerCase().trim() === city.toLowerCase().trim()) return 0; // exact city match
    if (searchedRegion && listing.region === searchedRegion) return 1; // same region
    return 2; // elsewhere
  };

  const sorted = [...allMatching].sort((a, b) => {
    const cr = cityRank(a) - cityRank(b);
    if (cr !== 0) return cr;

    // Featured listings surface first within their city/region group
    const featuredDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const skip = (pageNum - 1) * limitNum;
  const listings = sorted.slice(skip, skip + limitNum);

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

const getProfessionalSpaceListingById = async (id) => {
  return await prisma.professionalSpaceListing.findUnique({
    where: { id },
    include: { category: true }
  });
};
const createProfessionalSpaceListing = async (data, adminId) => {
  const { mapUrl, ...rest } = data;
  return await prisma.professionalSpaceListing.create({
    data: {
      ...rest,
      createdBy: adminId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : [],
      attributes: data.attributes ? JSON.parse(JSON.stringify(data.attributes)) : {},
    },
    include: { category: true }
  });
};

const updateProfessionalSpaceListing = async (id, data) => {
  const { mapUrl, ...rest } = data;
  return await prisma.professionalSpaceListing.update({
    where: { id },
    data: {
      ...rest,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : undefined,
      attributes: data.attributes ? JSON.parse(JSON.stringify(data.attributes)) : undefined,
    },
    include: { category: true }
  });
};

const deleteProfessionalSpaceListing = async (id) => {
  const listing = await prisma.professionalSpaceListing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new Error('Professional space listing not found');
  }

  // Only images to clean up here — no fileUrl/PDF like Tourism has
  const images = Array.isArray(listing.images) ? listing.images : [];
  const imageDeletions = images.map(async (img) => {
    try {
      const url = img?.url || img;
      if (!url) return;
      const urlParts = url.split('/upload/');
      if (urlParts.length !== 2) return;
      const withoutVer = urlParts[1].replace(/^v\d+\//, '');
      const publicId = withoutVer.replace(/\.[^/.]+$/, '');
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('[deleteProfessionalSpaceListing] Failed to delete image from Cloudinary:', img.url, err.message);
    }
  });

  await Promise.allSettled(imageDeletions);

  return await prisma.professionalSpaceListing.delete({
    where: { id }
  });
};

module.exports = {
  getProfessionalSpaceListings,
  getProfessionalSpaceListingById,
  createProfessionalSpaceListing,
  updateProfessionalSpaceListing,
  deleteProfessionalSpaceListing,
};