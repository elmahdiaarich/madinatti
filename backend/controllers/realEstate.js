const service = require('../services/realEstate');

const VALID_LISTING_TYPES  = ['SALE', 'RENT'];
const VALID_PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'LAND', 'OFFICE', 'SHOP'];

// ─── Validators ───────────────────────────────────────────────────────────────
function validateCreate(body) {
  const errors = [];

  if (!body.title || body.title.trim().length < 5)
    errors.push('title: required, min 5 chars');
  if (!body.description || body.description.trim().length < 10)
    errors.push('description: required, min 10 chars');
  if (!body.categoryId)
    errors.push('categoryId: required');
  if (!VALID_LISTING_TYPES.includes(body.listingType))
    errors.push(`listingType: must be SALE or RENT`);
  if (!VALID_PROPERTY_TYPES.includes(body.propertyType))
    errors.push(`propertyType: must be one of ${VALID_PROPERTY_TYPES.join(', ')}`);
  if (!body.price || isNaN(Number(body.price)) || Number(body.price) <= 0)
    errors.push('price: must be a positive number');
  if (!body.location || body.location.trim().length < 2)
    errors.push('location: required');
  if (body.surface   !== undefined && Number(body.surface)   <= 0) errors.push('surface: must be positive');
  if (body.rooms     !== undefined && Number(body.rooms)      < 0) errors.push('rooms: must be >= 0');
  if (body.bathrooms !== undefined && Number(body.bathrooms)  < 0) errors.push('bathrooms: must be >= 0');

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

// ─── 1. CREATE ────────────────────────────────────────────────────────────────
async function createListing(req, res) {
  const errors = validateCreate(req.body);
  if (errors.length) return res.status(400).json({ success: false, errors });

  const categoryCheck = await service.validateLeafCategory(req.body.categoryId);
  if (!categoryCheck.valid)
    return res.status(400).json({ success: false, message: categoryCheck.message });

  try {
    const listing = await service.createListing(req.body, req.user.id);
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

// ─── 2. GET LISTINGS ──────────────────────────────────────────────────────────
async function getListings(req, res) {
  try {
    const result = await service.getListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 3. GET LISTING DETAILS ───────────────────────────────────────────────────
async function getListingById(req, res) {
  try {
    const listing = await service.getListingById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.status !== 'APPROVED' || !listing.isActive)
      return res.status(404).json({ success: false, message: 'Listing not available.' });

    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[getListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 4. FAVORITES ─────────────────────────────────────────────────────────────
async function toggleFavorite(req, res) {
  try {
    const result = await service.toggleFavorite(req.user.id, req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[toggleFavorite]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getUserFavorites(req, res) {
  try {
    const listings = await service.getUserFavorites(req.user.id);
    return res.json({ success: true, data: listings });
  } catch (err) {
    console.error('[getUserFavorites]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 5. INQUIRIES ─────────────────────────────────────────────────────────────
async function createInquiry(req, res) {
  const { message, listingId, contactPhone, contactEmail } = req.body;

  if (!message || message.trim().length < 5)
    return res.status(400).json({ success: false, message: 'message: required, min 5 chars' });
  if (!listingId)
    return res.status(400).json({ success: false, message: 'listingId: required' });

  try {
    const userId = req.user?.userId;
    console.log("USER:", req.user);
    console.log("USER ID:", userId);

    const result = await service.createInquiry(req.body, userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });

    return res.status(201).json({ success: true, data: result.inquiry });
  } catch (err) {
    console.error("🔥 INQUIRY ERROR:", err);
    console.error('[createInquiry]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ─── 6. ADMIN MODERATION ──────────────────────────────────────────────────────
async function getPendingListings(req, res) {
  try {
    const result = await service.getPendingListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[getPendingListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function moderateListing(req, res) {
  const { action, adminNotes } = req.body;

  if (!['approve', 'reject'].includes(action))
    return res.status(400).json({ success: false, message: 'action: must be approve or reject' });

  try {
    const result = await service.moderateListing(req.params.id, action, req.user.id, adminNotes);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });

    return res.json({ success: true, data: result.listing });
  } catch (err) {
    console.error('[moderateListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  createListing, getListings, getListingById,
  toggleFavorite, getUserFavorites,
  createInquiry,
  getPendingListings, moderateListing,
};