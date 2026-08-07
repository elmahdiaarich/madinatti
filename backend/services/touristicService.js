const prisma = require('../config/db');
const { cloudinary } = require("../config/cloudinary");
const { cities: MOROCCO_CITIES } = require("morocco-cities");
const { isCurrentlyOpen } = require("../utils/openStatus");

function regionFor(cityName) {
  if (!cityName) return null;
  const match = MOROCCO_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase().trim(),
  );
  return match?.region_name || null;
}

const PRICE_BUCKETS = {
  low: { max: 100 },
  mid: { min: 100, max: 250 },
  high: { min: 250 },
};

const getTouristicListings = async (filters) => {
  const {
    categorySlug,
    city,
    neighborhood,
    search,
    attributes = {},
    page = 1,
    limit = 20,
    isActive,
    openOnly, 
  } = filters;

  const where = { category: { module: "tourisme" } };

  if (isActive !== undefined) {
    if (isActive !== "all")
      where.isActive = isActive === "true" || isActive === true;
  } else {
    where.isActive = true;
  }

  if (categorySlug) where.category.slug = categorySlug;
  if (neighborhood)
    where.neighborhood = { contains: neighborhood.trim(), mode: "insensitive" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // NOTE: `city` is intentionally NOT added to `where` anymore — it's a
  // ranking signal (searched city first, same-region cities next, others
  // after), not a hard filter. Same treatment for rating/priceRange below.
  const ratingThreshold = attributes.rating
    ? parseFloat(attributes.rating)
    : null;
  const priceRangeKey = attributes.priceRange || null;

  // Any remaining dynamic attributes still hard-filter as before (equals).
  const remainingKeys = Object.keys(attributes).filter(
    (k) =>
      k !== "rating" &&
      k !== "priceRange" &&
      attributes[k] !== undefined &&
      attributes[k] !== null &&
      attributes[k] !== "",
  );
  if (remainingKeys.length > 0) {
    where.AND = remainingKeys.map((key) => ({ [key]: attributes[key] }));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  // Fetch the FULL matching set (pre-ranking-boost) so sorting by
  // city/region/rating/price priority is correct across the whole result,
  // not just within one page — then paginate in JS after sorting.
  // Trade-off: loads more rows into memory per request than a pure DB
  // skip/take. Fine at your current data volume; revisit with a raw SQL
  // ORDER BY (like the earlier rating-only version) if a module ever grows
  // into the tens of thousands of rows.
  const [allMatching, total] = await Promise.all([
    prisma.touristicListing.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.touristicListing.count({ where }),
  ]);

  const openFiltered =
  openOnly === "true" || openOnly === true
    ? allMatching.filter((l) => l.hours && isCurrentlyOpen(l.hours))
    : allMatching;

  const searchedRegion = city ? regionFor(city) : null;

  const cityRank = (listing) => {
    if (!city) return 2; // no city filter active — everyone's equal
    if (listing.city?.toLowerCase().trim() === city.toLowerCase().trim())
      return 0; // exact city match
    if (searchedRegion && listing.region === searchedRegion) return 1; // same region
    return 2; // elsewhere
  };

  const ratingRank = (listing) => {
    if (ratingThreshold == null) return 0;
    const r = listing.rating != null ? Number(listing.rating) : 0;
    return r >= ratingThreshold ? 0 : 1; // meets threshold first
  };

  const priceMatches = (listing) => {
    if (!priceRangeKey) return true;
    const bucket = PRICE_BUCKETS[priceRangeKey];
    if (!bucket || listing.prix == null) return false;
    if (bucket.min != null && listing.prix < bucket.min) return false;
    if (bucket.max != null && listing.prix > bucket.max) return false;
    return true;
  };
  const priceRank = (listing) => (priceMatches(listing) ? 0 : 1);

  const sorted = [...openFiltered].sort((a, b) => {
    const cr = cityRank(a) - cityRank(b);
    if (cr !== 0) return cr;

    // Featured listings surface first within their city/region group —
    // above the rating/price boost tiers, matching how "Recommandé" reads
    // on the card (a curated pick, not just a high number).
    const featuredDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;

    const rr = ratingRank(a) - ratingRank(b);
    if (rr !== 0) return rr;

    const pr = priceRank(a) - priceRank(b);
    if (pr !== 0) return pr;

    // No further sort by absolute rating value here — that's what was
    // making every filter (3+, 4+) look identical, since it always bubbled
    // 5★ to the top regardless of the chosen threshold. Once a listing
    // clears the threshold, its exact score no longer changes its position;
    // recency is the only remaining tiebreak.
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const skip = (pageNum - 1) * limitNum;
const listings = sorted.slice(skip, skip + limitNum);

return {
  listings,
  pagination: {
    page: pageNum,
    limit: limitNum,
    total: openFiltered.length,
    totalPages: Math.ceil(openFiltered.length / limitNum) || 1,
  },
};
};

const getTouristicListingById = async (id) => {
  return await prisma.touristicListing.findUnique({
    where: { id },
    include: { category: true },
  });
};

const createTouristicListing = async (data, adminId) => {
  const { mapUrl, ...rest } = data;
  return await prisma.touristicListing.create({
    data: {
      ...rest,
      mapUrl: mapUrl || null,
      createdBy: adminId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : [],
    },
    include: { category: true },
  });
};

const updateTouristicListing = async (id, data) => {
  return await prisma.touristicListing.update({
    where: { id },
    data: {
      ...data,
      images: data.images ? JSON.parse(JSON.stringify(data.images)) : undefined,
    },
    include: { category: true },
  });
};

const deleteTouristicListing = async (id) => {
  // Fetch the listing first so we can access its images and fileUrl
  const listing = await prisma.touristicListing.findUnique({
    where: { id },
  });

  if (!listing) {
    throw new Error("Touristic listing not found");
  }

  // Extract and delete images from Cloudinary
  const images = Array.isArray(listing.images) ? listing.images : [];
  const imageDeletions = images.map(async (img) => {
    try {
      const url = img?.url || img;
      if (!url) return;
      const urlParts = url.split("/upload/");
      if (urlParts.length !== 2) return;
      const withoutVer = urlParts[1].replace(/^v\d+\//, "");
      const publicId = withoutVer.replace(/\.[^/.]+$/, "");
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(
        "[deleteTouristicListing] Failed to delete image from Cloudinary:",
        img.url,
        err.message,
      );
    }
  });

  // Extract and delete PDF document (raw resource) from Cloudinary
  let docDeletion = Promise.resolve();
  if (listing.fileUrl) {
    docDeletion = (async () => {
      try {
        const urlParts = listing.fileUrl.split("/upload/");
        if (urlParts.length === 2) {
          const withoutVer = urlParts[1].replace(/^v\d+\//, "");
          const publicId = withoutVer; // Keep extension for raw resource
          await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
        }
      } catch (err) {
        console.error(
          "[deleteTouristicListing] Failed to delete document from Cloudinary:",
          listing.fileUrl,
          err.message,
        );
      }
    })();
  }

  // Extract and delete video from Cloudinary
  let videoDeletion = Promise.resolve();
  if (listing.videoUrl) {
    videoDeletion = (async () => {
      try {
        const urlParts = listing.videoUrl.split("/upload/");
        if (urlParts.length === 2) {
          const withoutVer = urlParts[1].replace(/^v\d\//, "");
          const publicId = withoutVer.replace(/\.[^/.]$/, "");
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "video",
          });
        }
      } catch (err) {
        console.error(
          "[deleteTouristicListing] Failed to delete video from Cloudinary:",
          listing.videoUrl,
          err.message,
        );
      }
    })();
  }

  // Run Cloudinary deletions in parallel (settled to avoid blocking database deletion on failures)
  await Promise.allSettled([...imageDeletions, docDeletion, videoDeletion]);

  // Delete the database record
  return await prisma.touristicListing.delete({
    where: { id },
  });
};

const incrementDownloadCount = async (id) =>
  prisma.touristicListing.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });

const getDistinctNeighborhoods = async () => {
  const listings = await prisma.touristicListing.findMany({
    where: { isActive: true },
    select: { city: true, neighborhood: true },
    distinct: ["city", "neighborhood"],
  });

  const map = {};
  listings.forEach((item) => {
    if (!item.city || !item.neighborhood) return;
    const key = item.city.trim();
    if (!map[key]) map[key] = new Set();
    map[key].add(item.neighborhood.trim());
  });

  return Object.fromEntries(
    Object.entries(map).map(([city, set]) => [city, [...set].sort()]),
  );
};

module.exports = {
  getTouristicListings,
  getTouristicListingById,
  createTouristicListing,
  updateTouristicListing,
  deleteTouristicListing,
  incrementDownloadCount,
  getDistinctNeighborhoods,
};
