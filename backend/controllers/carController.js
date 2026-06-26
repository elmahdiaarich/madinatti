/**
 * controllers/carController.js
 * Thin HTTP layer — validates input, calls the service, sends the response.
 * Mirrors the real-estate controller pattern exactly.
 */

'use strict';

const service = require('../services/cars');
const { trackListingView } = require('../services/viewTrackingService');

// ── Allowed enum values (source of truth for validation) ─────────────────────
const LISTING_TYPES   = ['SALE', 'RENT'];
const CONDITIONS      = ['NEW', 'USED', 'DAMAGED'];
const FUEL_TYPES      = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'LPG', 'OTHER'];
const TRANSMISSIONS   = ['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC'];
const BODY_TYPES      = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'PICKUP', 'VAN', 'MINIVAN', 'TRUCK', 'OTHER'];
const INQUIRY_STATUSES = ['pending', 'read', 'replied', 'closed'];

// ── Validators ────────────────────────────────────────────────────────────────

function validateCreate(body) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!body.title || body.title.trim().length < 5)
    errors.push('title: required, min 5 chars');
  if (!body.description || body.description.trim().length < 10)
    errors.push('description: required, min 10 chars');
  if (!body.categoryId)
    errors.push('categoryId: required');
  if (!LISTING_TYPES.includes(body.listingType))
    errors.push(`listingType: must be one of ${LISTING_TYPES.join(', ')}`);
  if (!CONDITIONS.includes(body.condition))
    errors.push(`condition: must be one of ${CONDITIONS.join(', ')}`);
  if (!body.make || body.make.trim().length < 1)
    errors.push('make: required');
  if (!body.model || body.model.trim().length < 1)
    errors.push('model: required');

  const year = parseInt(body.year, 10);
  if (!body.year || isNaN(year) || year < 1900 || year > currentYear + 1)
    errors.push(`year: must be a valid year between 1900 and ${currentYear + 1}`);

  if (body.mileage !== undefined && body.mileage !== null) {
    const m = parseInt(body.mileage, 10);
    if (isNaN(m) || m < 0) errors.push('mileage: must be >= 0');
  }

  if (!FUEL_TYPES.includes(body.fuelType))
    errors.push(`fuelType: must be one of ${FUEL_TYPES.join(', ')}`);
  if (!TRANSMISSIONS.includes(body.transmission))
    errors.push(`transmission: must be one of ${TRANSMISSIONS.join(', ')}`);
  if (!BODY_TYPES.includes(body.bodyType))
    errors.push(`bodyType: must be one of ${BODY_TYPES.join(', ')}`);

  if (!body.price || isNaN(Number(body.price)) || Number(body.price) <= 0)
    errors.push('price: must be a positive number');
  if (!body.location || body.location.trim().length < 2)
    errors.push('location: required');

  // Optional numerics
  if (body.doors !== undefined && body.doors !== null && (isNaN(parseInt(body.doors, 10)) || parseInt(body.doors, 10) < 1))
    errors.push('doors: must be a positive integer');
  if (body.seats !== undefined && body.seats !== null && (isNaN(parseInt(body.seats, 10)) || parseInt(body.seats, 10) < 1))
    errors.push('seats: must be a positive integer');
  if (body.engineSize !== undefined && body.engineSize !== null && (isNaN(parseFloat(body.engineSize)) || parseFloat(body.engineSize) <= 0))
    errors.push('engineSize: must be a positive number');
  if (body.horsePower !== undefined && body.horsePower !== null && (isNaN(parseInt(body.horsePower, 10)) || parseInt(body.horsePower, 10) <= 0))
    errors.push('horsePower: must be a positive integer');

  // Images
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

  if (body.features !== undefined && (typeof body.features !== 'object' || Array.isArray(body.features)))
    errors.push('features: must be a plain object');

  return errors;
}

function validateUpdate(body) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (body.title !== undefined && body.title.trim().length < 5)
    errors.push('title: min 5 chars');
  if (body.description !== undefined && body.description.trim().length < 10)
    errors.push('description: min 10 chars');
  if (body.listingType !== undefined && !LISTING_TYPES.includes(body.listingType))
    errors.push(`listingType: must be one of ${LISTING_TYPES.join(', ')}`);
  if (body.condition !== undefined && !CONDITIONS.includes(body.condition))
    errors.push(`condition: must be one of ${CONDITIONS.join(', ')}`);
  if (body.fuelType !== undefined && !FUEL_TYPES.includes(body.fuelType))
    errors.push(`fuelType: must be one of ${FUEL_TYPES.join(', ')}`);
  if (body.transmission !== undefined && !TRANSMISSIONS.includes(body.transmission))
    errors.push(`transmission: must be one of ${TRANSMISSIONS.join(', ')}`);
  if (body.bodyType !== undefined && !BODY_TYPES.includes(body.bodyType))
    errors.push(`bodyType: must be one of ${BODY_TYPES.join(', ')}`);

  if (body.year !== undefined) {
    const y = parseInt(body.year, 10);
    if (isNaN(y) || y < 1900 || y > currentYear + 1)
      errors.push(`year: must be between 1900 and ${currentYear + 1}`);
  }
  if (body.price !== undefined && (isNaN(Number(body.price)) || Number(body.price) <= 0))
    errors.push('price: must be a positive number');

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

  if (body.features !== undefined && (typeof body.features !== 'object' || Array.isArray(body.features)))
    errors.push('features: must be a plain object');

  return errors;
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

async function getCategories(req, res) {
  try {
    const categories = await service.getCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('[cars/getCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getListings(req, res) {
  try {
    const result = await service.getListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/getListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getListingById(req, res) {
  try {
    const listing = await service.getListingById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.status !== 'APPROVED' || !listing.isActive)
      return res.status(404).json({ success: false, message: 'Listing not available.' });

    await trackListingView(listing.id, 'CAR', req.user?.userId || null);

    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[cars/getListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── AUTHENTICATED ─────────────────────────────────────────────────────────────

async function toggleFavorite(req, res) {
  try {
    const result = await service.toggleFavorite(req.user.userId, req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/toggleFavorite]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getUserFavorites(req, res) {
  try {
    const listings = await service.getUserFavorites(req.user.userId);
    return res.json({ success: true, data: listings });
  } catch (err) {
    console.error('[cars/getUserFavorites]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function createInquiry(req, res) {
  const { message, listingId, contactPhone, contactEmail } = req.body;

  if (!message || message.trim().length < 5)
    return res.status(400).json({ success: false, message: 'message: required, min 5 chars' });
  if (!listingId)
    return res.status(400).json({ success: false, message: 'listingId: required' });

  // Basic email format guard
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
    return res.status(400).json({ success: false, message: 'contactEmail: invalid format' });

  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await service.createInquiry(req.body, userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });

    // Notify the listing owner
    if (result.inquiry) {
      const { createNotification } = require('./notificationController');
      const prisma = require('../config/db');
      const listing = await prisma.carListing.findUnique({
        where: { id: listingId },
        select: { userId: true, title: true },
      });
      if (listing) {
        await createNotification(
          listing.userId,
          'NEW_INQUIRY',
          'Nouveau message reçu',
          `Nouveau message pour votre annonce "${listing.title}".`,
          '/dashboard/messages',
        ).catch((e) => console.error('[cars/createInquiry] notification failed:', e.message));
      }
    }

    return res.status(201).json({ success: true, data: result.inquiry });
  } catch (err) {
    console.error('[cars/createInquiry]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── BUSINESS ──────────────────────────────────────────────────────────────────

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
    console.error('[cars/createListing]', err);
    if (err.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Slug conflict. Adjust the title.' });
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getMyListings(req, res) {
  try {
    const result = await service.getMyListings(req.user.userId, req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/getMyListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getMyListingById(req, res) {
  try {
    const listing = await service.getMyListingById(req.params.id, req.user.userId);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[cars/getMyListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

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
    console.error('[cars/updateMyListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function deleteMyListing(req, res) {
  try {
    const result = await service.deleteMyListing(req.params.id, req.user.userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, message: 'Listing removed.' });
  } catch (err) {
    console.error('[cars/deleteMyListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getMyListingInquiries(req, res) {
  try {
    const result = await service.getMyListingInquiries(req.params.id, req.user.userId, req.query);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/getMyListingInquiries]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function updateInquiryStatus(req, res) {
  const { status } = req.body;
  if (!INQUIRY_STATUSES.includes(status))
    return res.status(400).json({ success: false, message: `status must be one of: ${INQUIRY_STATUSES.join(', ')}` });

  try {
    const result = await service.updateInquiryStatus(req.params.inquiryId, req.user.userId, status);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, data: result.inquiry });
  } catch (err) {
    console.error('[cars/updateInquiryStatus]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

async function adminGetStats(req, res) {
  try {
    const stats = await service.adminGetStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[cars/adminGetStats]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getPendingListings(req, res) {
  try {
    // Reuse adminGetAllListings with status filter
    const result = await service.adminGetAllListings({ ...req.query, status: 'PENDING' });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/getPendingListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function adminGetAllListings(req, res) {
  try {
    const result = await service.adminGetAllListings(req.query);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/adminGetAllListings]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function adminGetListingById(req, res) {
  try {
    const listing = await service.adminGetListingById(req.params.id);
    if (!listing)
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    return res.json({ success: true, data: listing });
  } catch (err) {
    console.error('[cars/adminGetListingById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

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
    console.error('[cars/moderateListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

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
    console.error('[cars/adminUpdateListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function adminDeleteListing(req, res) {
  try {
    const result = await service.adminDeleteListing(req.params.id);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, message: 'Listing permanently deleted.' });
  } catch (err) {
    console.error('[cars/adminDeleteListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function adminGetListingInquiries(req, res) {
  try {
    const result = await service.adminGetListingInquiries(req.params.id, req.query);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[cars/adminGetListingInquiries]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function suspendListing(req, res) {
  const { adminNotes } = req.body;
  try {
    const result = await service.suspendListing(req.params.id, req.user.userId, adminNotes);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, data: result.listing });
  } catch (err) {
    console.error('[cars/suspendListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function unsuspendListing(req, res) {
  try {
    const result = await service.unsuspendListing(req.params.id, req.user.userId);
    if (result.error)
      return res.status(result.status).json({ success: false, message: result.error });
    return res.json({ success: true, data: result.listing });
  } catch (err) {
    console.error('[cars/unsuspendListing]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  // public
  getCategories,
  getListings,
  getListingById,
  // authenticated
  toggleFavorite,
  getUserFavorites,
  createInquiry,
  // business
  createListing,
  getMyListings,
  getMyListingById,
  updateMyListing,
  deleteMyListing,
  getMyListingInquiries,
  updateInquiryStatus,
  // admin
  adminGetStats,
  getPendingListings,
  adminGetAllListings,
  adminGetListingById,
  moderateListing,
  adminUpdateListing,
  adminDeleteListing,
  adminGetListingInquiries,
  suspendListing,
  unsuspendListing,
};