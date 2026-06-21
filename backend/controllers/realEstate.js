
const service = require('../services/realEstate');

const { trackListingView } = require('../services/viewTrackingService');
const VALID_LISTING_TYPES = ['SALE', 'RENT'];


// ─── Validators ──────────────────────────────────────────────────────────────
function validateCreate(body) {
  const errors = [];
  if (!body.title || body.title.trim().length < 5)
    errors.push('title: required, min 5 chars');
  if (!body.description || body.description.trim().length < 10)
    errors.push('description: required, min 10 chars');
  if (!body.categoryId)
    errors.push('categoryId: required');
  if (!VALID_LISTING_TYPES.includes(body.listingType))
    errors.push('listingType: must be SALE or RENT');
  // propertyType removed — derived from categoryId in service
  if (!body.price || isNaN(Number(body.price)) || Number(body.price) <= 0)
    errors.push('price: must be a positive number');
  if (!body.location || body.location.trim().length < 2)
    errors.push('location: required');
  if (body.surface !== undefined && Number(body.surface) <= 0)
    errors.push('surface: must be positive');
  if (body.rooms !== undefined && Number(body.rooms) < 0)
    errors.push('rooms: must be >= 0');
  if (body.bathrooms !== undefined && Number(body.bathrooms) < 0)
    errors.push('bathrooms: must be >= 0');
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push('images: must be an array');
    } else {
      body.images.forEach((img, i) => {
        if (!img.url || typeof img.url !== 'string')
          errors.push(`images[${i}].url: required string`);
        if (typeof img.isCover !== 'boolean')
          errors.push(`images[${i}].isCover: must be boolean`);
      });
    }
  }
  if (body.features !== undefined &&
    (typeof body.features !== 'object' || Array.isArray(body.features)))
    errors.push('features: must be a plain object');
  return errors;
}

// Partial validation for updates — only check fields that are present
function validateUpdate(body) {
  const errors = [];
  if (body.title !== undefined && body.title.trim().length < 5)
    errors.push('title: min 5 chars');
  if (body.description !== undefined && body.description.trim().length < 10)
    errors.push('description: min 10 chars');
  if (body.listingType !== undefined && !VALID_LISTING_TYPES.includes(body.listingType))
    errors.push('listingType: must be SALE or RENT');
  if (body.propertyType !== undefined && !VALID_PROPERTY_TYPES.includes(body.propertyType))
    errors.push(`propertyType: must be one of ${VALID_PROPERTY_TYPES.join(', ')}`);
  if (body.price !== undefined && (isNaN(Number(body.price)) || Number(body.price) <= 0))
    errors.push('price: must be a positive number');
  if (body.surface !== undefined && Number(body.surface) <= 0)
    errors.push('surface: must be positive');
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push('images: must be an array');
    } else {
      body.images.forEach((img, i) => {
        if (!img.url || typeof img.url !== 'string')
          errors.push(`images[${i}].url: required string`);
        if (typeof img.isCover !== 'boolean')
          errors.push(`images[${i}].isCover: must be boolean`);
      });
    }
  }
  return errors;
}

// ─── 1. CREATE (business) ────────────────────────────────────────────────────
async function createListing(req, res) {
  const errors = validateCreate(req.body);
  if (errors.length)
    return res.status(400).json({ success: false, errors });

  const categoryCheck = await service.validateLeafCategory(req.body.categoryId);
  if (!categoryCheck.valid)
    return res.status(400).json({ success: false, message: categoryCheck.message });

  try {
    const listing = await service.createListing(req.body, req.user.userId);
    return res.status(201).json({
      success: true,
      message: 'Listing submitted. Pending admin review.',
      data: listing,
    });
  } catch (err) {
    console.error('[createListing]', err);
    if (err.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Slug conflict. Adjust the title.' });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 2. GET LISTINGS (public) ────────────────────────────────────────────────
async function getListings(req, res) {
  try {
    const result = await service.getListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 3. GET LISTING DETAIL (public) ─────────────────────────────────────────
async function getListingById(req, res) {
  try {
    const listing = await service.getListingById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.status !== 'APPROVED' || !listing.isActive)
      return res.status(404).json({ success: false, message: 'Listing not available.' });

    await trackListingView(listing.id, 'REAL_ESTATE', req.user?.userId || null);

    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[getListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
// ─── 4. FAVORITES (authenticated) ───────────────────────────────────────────
async function toggleFavorite(req, res) {
  try {
    const result = await service.toggleFavorite(req.user.userId, req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[toggleFavorite]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getUserFavorites(req, res) {
  try {
    const listings = await service.getUserFavorites(req.user.userId);
    return res.json({ success: true, data: listings });
  } catch (err) {
    console.error('[getUserFavorites]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 5. INQUIRIES (authenticated) ───────────────────────────────────────────
async function createInquiry(req, res) {
  const { message, listingId, contactPhone, contactEmail } = req.body;
  if (!message || message.trim().length < 5)
    return res.status(400).json({ success: false, message: 'message: required, min 5 chars' });
  if (!listingId)
    return res.status(400).json({ success: false, message: 'listingId: required' });

  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await service.createInquiry(req.body, userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    // Notify business of new inquiry
if (result.inquiry) {
  const { createNotification } = require('./notificationController');
  const prisma = require('../config/db');
  const listing = await prisma.realEstateListing.findUnique({
    where: { id: listingId },
    select: { userId: true, title: true, id: true }
  });
  if (listing) {
    await createNotification(
      listing.userId,
      'NEW_INQUIRY',
      'Nouveau message reçu',
      `Nouveau message pour votre annonce "${listing.title}".`,
      '/dashboard/messages'
    );
  }
}

return res.status(201).json({ success: true, data: result.inquiry });
  } catch (err) {
    console.error('[createInquiry]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 6. ADMIN — PENDING QUEUE ────────────────────────────────────────────────
async function getPendingListings(req, res) {
  try {
    const result = await service.getPendingListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getPendingListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 7. ADMIN — MODERATE ────────────────────────────────────────────────────
async function moderateListing(req, res) {
  const { action, adminNotes } = req.body;
  if (!['approve', 'reject'].includes(action))
    return res.status(400).json({ success: false, message: 'action: must be approve or reject' });

  try {
    const result = await service.moderateListing(req.params.id, action, req.user.userId, adminNotes);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });

    return res.json({ success: true, data: result.listing });
  } catch (err) {
    console.error('[moderateListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── B1. GET OWN LISTINGS ────────────────────────────────────────────────────
async function getMyListings(req, res) {
  try {
    const result = await service.getMyListings(req.user.userId, req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getMyListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── B2. GET OWN LISTING DETAIL ──────────────────────────────────────────────
async function getMyListingById(req, res) {
  try {
    const listing = await service.getMyListingById(req.params.id, req.user.userId);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[getMyListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── B3. UPDATE OWN LISTING ──────────────────────────────────────────────────
async function updateMyListing(req, res) {
  const errors = validateUpdate(req.body);
  if (errors.length)
    return res.status(400).json({ success: false, errors });

  if (req.body.categoryId) {
    const categoryCheck = await service.validateLeafCategory(req.body.categoryId);
    if (!categoryCheck.valid)
      return res.status(400).json({ success: false, message: categoryCheck.message });
  }

  try {
    const result = await service.updateMyListing(req.params.id, req.user.userId, req.body);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({
      success: true,
      message: 'Listing updated. Pending admin re-approval.',
      data: result.listing,
    });
  } catch (err) {
    console.error('[updateMyListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── B4. DELETE OWN LISTING (soft) ───────────────────────────────────────────
async function deleteMyListing(req, res) {
  try {
    const result = await service.deleteMyListing(req.params.id, req.user.userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, message: 'Listing removed.' });
  } catch (err) {
    console.error('[deleteMyListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── B5. GET INQUIRIES ON OWN LISTING ────────────────────────────────────────
async function getMyListingInquiries(req, res) {
  try {
    const result = await service.getMyListingInquiries(req.params.id, req.user.userId, req.query);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getMyListingInquiries]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── B6. UPDATE INQUIRY STATUS ───────────────────────────────────────────────
async function updateInquiryStatus(req, res) {
  const { status } = req.body;
  const VALID_STATUSES = ['pending', 'read', 'replied', 'closed'];
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });

  try {
    const result = await service.updateInquiryStatus(
      req.params.inquiryId,
      req.user.userId,
      status,
    );
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, data: result.inquiry });
  } catch (err) {
    console.error('[updateInquiryStatus]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── A1. GET ALL LISTINGS (any status) ──────────────────────────────────────
async function adminGetAllListings(req, res) {
  try {
    const result = await service.adminGetAllListings(req.query);
    // console.log("listings: ",result);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[adminGetAllListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── A2. GET FULL DETAIL OF ANY LISTING ─────────────────────────────────────
async function adminGetListingById(req, res) {
  try {
    const listing = await service.adminGetListingById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[adminGetListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── A3. ADMIN EDIT ANY LISTING ─────────────────────────────────────────────
async function adminUpdateListing(req, res) {
  const errors = validateUpdate(req.body);
  if (errors.length)
    return res.status(400).json({ success: false, errors });

  try {
    const result = await service.adminUpdateListing(req.params.id, req.body);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, data: result.listing });
  } catch (err) {
    console.error('[adminUpdateListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── A4. ADMIN HARD DELETE ───────────────────────────────────────────────────
async function adminDeleteListing(req, res) {
  try {
    const result = await service.adminDeleteListing(req.params.id);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, message: "Listing permanently deleted." });
  } catch (err) {
    console.error('[adminDeleteListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── A5. GET ALL INQUIRIES ON ANY LISTING ───────────────────────────────────
async function adminGetListingInquiries(req, res) {
  try {
    const result = await service.adminGetListingInquiries(req.params.id, req.query);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[adminGetListingInquiries]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── A6. PLATFORM STATS ─────────────────────────────────────────────────────
async function adminGetStats(req, res) {
  try {
    const stats = await service.adminGetStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[adminGetStats]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── PUBLIC — CATEGORIES (immobilier) ───────────────────────────────────────
async function getCategories(req, res) {
  try {
    const categories = await service.getCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[getCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  // public
  getCategories,
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
  getPendingListings,
  moderateListing,
  adminGetAllListings,
  adminGetListingById,
  adminUpdateListing,
  adminDeleteListing,
  adminGetListingInquiries,
  adminGetStats,
};