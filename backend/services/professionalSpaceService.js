const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary');

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

  if (city) {
    where.city = { contains: city.trim(), mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [listings, total] = await Promise.all([
    prisma.professionalSpaceListing.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.professionalSpaceListing.count({ where }),
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

const getProfessionalSpaceListingById = async (id) => {
  return await prisma.professionalSpaceListing.findUnique({
    where: { id },
    include: { category: true }
  });
};

const createProfessionalSpaceListing = async (data, adminId) => {
  return await prisma.professionalSpaceListing.create({
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

const updateProfessionalSpaceListing = async (id, data) => {
  return await prisma.professionalSpaceListing.update({
    where: { id },
    data: {
      ...data,
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