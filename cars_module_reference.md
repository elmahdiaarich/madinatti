# Fichiers de Référence du Module Cars

Ce document contient les fichiers demandés pour l'implémentation du modèle Cars, y compris le code Backend, les Modérations, Reviews, Reports et le code Frontend.

## `backend/controllers/carController.js`

```javascript
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
const BODY_TYPES      = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'MINIVAN', 'OTHER'];
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

```

## `backend/routes/cars.js`

```javascript
'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ctrl = require('../controllers/carController');
const { createListingLimiter, inquiryLimiter } = require('../middlewares/rateLimiter');

// ── PUBLIC ────────────────────────────────────────────────────────────────────
router.get('/categories',           ctrl.getCategories);
router.get('/',                     ctrl.getListings);

// ── AUTHENTICATED ─────────────────────────────────────────────────────────────
router.post('/inquiries',                    inquiryLimiter, authMiddleware, ctrl.createInquiry);
router.get('/favorites/me',                  authMiddleware, ctrl.getUserFavorites);
router.post('/favorites/:id/toggle',         authMiddleware, ctrl.toggleFavorite);

// ── BUSINESS ──────────────────────────────────────────────────────────────────
router.post('/',                             createListingLimiter, authMiddleware, roleMiddleware('business'), ctrl.createListing);
router.get('/business/my-listings',          authMiddleware, roleMiddleware('business'), ctrl.getMyListings);
router.get('/business/my-listings/:id',      authMiddleware, roleMiddleware('business'), ctrl.getMyListingById);
router.patch('/business/my-listings/:id',    authMiddleware, roleMiddleware('business'), ctrl.updateMyListing);
router.delete('/business/my-listings/:id',   authMiddleware, roleMiddleware('business'), ctrl.deleteMyListing);
router.get('/business/my-listings/:id/inquiries', authMiddleware, roleMiddleware('business'), ctrl.getMyListingInquiries);
router.patch('/business/inquiries/:inquiryId',    authMiddleware, roleMiddleware('business'), ctrl.updateInquiryStatus);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get('/admin/stats',                   authMiddleware, roleMiddleware('admin'), ctrl.adminGetStats);
router.get('/admin/pending',                 authMiddleware, roleMiddleware('admin'), ctrl.getPendingListings);
router.get('/admin/listings',                authMiddleware, roleMiddleware('admin'), ctrl.adminGetAllListings);
router.get('/admin/listings/:id',            authMiddleware, roleMiddleware('admin'), ctrl.adminGetListingById);
router.patch('/admin/listings/:id',          authMiddleware, roleMiddleware('admin'), ctrl.adminUpdateListing);
router.patch('/admin/:id/moderate',          authMiddleware, roleMiddleware('admin'), ctrl.moderateListing);
router.patch('/admin/:id/suspend',           authMiddleware, roleMiddleware('admin'), ctrl.suspendListing);
router.patch('/admin/:id/unsuspend',         authMiddleware, roleMiddleware('admin'), ctrl.unsuspendListing);
router.delete('/admin/listings/:id',         authMiddleware, roleMiddleware('admin'), ctrl.adminDeleteListing);
router.get('/admin/listings/:id/inquiries',  authMiddleware, roleMiddleware('admin'), ctrl.adminGetListingInquiries);

// ── MUST BE LAST (wildcard :id) ───────────────────────────────────────────────
router.get('/:id',                           ctrl.getListingById);

module.exports = router;
```

## `backend/services/cars.js`

```javascript
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
  const SORT_WHITELIST = { createdAt: true, price: true, year: true, mileage: true };
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
  const { page = 1, limit = 12, status, city, listingType, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId,
    isActive: true,
    ...(status      && { status }),
    ...(city        && { city: { contains: city, mode: 'insensitive' } }),
    ...(listingType && { listingType }),
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
```

## `backend/controllers/categoryController.js`

```javascript
const { getCategories } = require('../services/categoryService');

const handleGetCategories = async (req, res) => {
  try {
    const { module } = req.query;
    const data = await getCategories({ module });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[categoryController.getCategories]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { handleGetCategories };
```

## `backend/controllers/adminController.js`

```javascript
/**
 * backend/controllers/adminController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Controller admin — toutes les opérations du dashboard.
 * Utilise Prisma avec le schéma exact de schema.prisma.
 *
 * Endpoints couverts :
 *  GET  /api/admin/overview
 *  GET  /api/admin/listings
 *  PATCH /api/admin/listings/:id/approve
 *  PATCH /api/admin/listings/:id/reject
 *  GET  /api/admin/reports
 *  PATCH /api/admin/reports/:id
 *  GET  /api/admin/users
 *  PATCH /api/admin/users/:id/toggle
 *  GET  /api/admin/businesses
 * ─────────────────────────────────────────────────────────────────────────────
 */

const prisma = require("../config/db");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================================================================
// Adding a new module (e.g. "services") requires only:
//   1. Add its Prisma model key to MODULE_REGISTRY below
//   2. Add its normalizer to NORMALIZERS below
//   3. Add its status handler to STATUS_HANDLERS below
//   4. Done — getListings, approveListing, rejectListing,
//              updateListingStatus, deleteListing all pick it up automatically.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY
// Maps module slug → { model, cloudinaryFolder, targetType, frontendPath }
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_REGISTRY = {
  emploi: {
    model:             'jobListing',
    cloudinaryFolder:  null,          
    targetType:        'JOB',
    frontendPath:      (id) => `/jobs/${id}`,
  },
  immobilier: {
    model:             'realEstateListing',
    cloudinaryFolder:  'madinatti/real-estate',
    targetType:        'REAL_ESTATE',
    frontendPath:      (id) => `/real-estate/${id}`,
  },
   automobile: {
    model:             'carListing',
    cloudinaryFolder:  'madinatti/real-estate',
    targetType:        'CAR',
    frontendPath:      (id) => `/cars/${id}`,
  },
  miniJobs: {
    model:             'workerProfile',
    cloudinaryFolder:  'madinatti/mini-jobs',
    targetType:        'WORKER_PROFILE',
    frontendPath:      (id) => `/mini-jobs/profiles/${id}`,
  },
  taskRequests: {
    model:             'taskRequest',
    cloudinaryFolder:  null,           // no images on TaskRequest
    targetType:        'TASK_REQUEST',
    frontendPath:      (id) => `/mini-jobs/tasks/${id}`,
  },
  // ── Add future modules here ────────────────────────────────────────────────
  // services: {
  //   model:            'serviceListing',
  //   cloudinaryFolder: 'madinatti/services',
  //   targetType:       'SERVICE',
  //   frontendPath:     (id) => `/services/${id}`,
  // },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOUDINARY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Move an image from madinatti/temp → targetFolder on Cloudinary.
 * Returns the original img object unchanged if the move fails (non-blocking).
 */
async function moveImage(img, targetFolder) {
  try {
    if (!img.url?.includes('madinatti/temp')) return img;
    const urlParts    = img.url.split('/upload/');
    const withoutVer  = urlParts[1].replace(/^v\d+\//, '');
    const oldPublicId = withoutVer.replace(/\.[^/.]+$/, '');
    const newPublicId = oldPublicId.replace('madinatti/temp', targetFolder);
    const result      = await cloudinary.uploader.rename(oldPublicId, newPublicId);
    return { ...img, url: result.secure_url };
  } catch (err) {
    console.error('Failed to move image:', img.url, err.message);
    return img;
  }
}

/**
 * Delete an image from Cloudinary. Logs but never throws (non-blocking).
 */
async function destroyImage(img) {
  try {
    const url = img?.url || img;
    if (!url) return;
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return;
    const withoutVer = urlParts[1].replace(/^v\d+\//, '');
    const publicId   = withoutVer.replace(/\.[^/.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err.message);
  }
}

async function moveImages(images = [], targetFolder) {
  if (!targetFolder) return images;
  return Promise.all(images.map((img) => moveImage(img, targetFolder)));
}
 
async function destroyImages(images = []) {
  await Promise.all(images.map(destroyImage));
}
 
/**
 * WorkerProfile-specific image mover — handles the photo (single string)
 * + portfolioImages (array) split, since it doesn't use the {url,isCover}[]
 * "images" shape the other modules use.
 */
async function moveWorkerProfileImages(record, targetFolder) {
  const photo = record.photo
    ? (await moveImage({ url: record.photo }, targetFolder)).url
    : null;
  const portfolioImages = await moveImages(record.portfolioImages || [], targetFolder);
  return { photo, portfolioImages };
}
 
async function destroyWorkerProfileImages(record) {
  const jobs = [];
  if (record.photo) jobs.push(destroyImage({ url: record.photo }));
  jobs.push(destroyImages(record.portfolioImages || []));
  await Promise.all(jobs);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZERS  (raw Prisma row → common API shape)
// ─────────────────────────────────────────────────────────────────────────────

const NORMALIZERS = {
  emploi: (j) => ({
    id:                  j.id,
    module:              'emploi',
    title:               j.title,
    description:         j.description || null,
    company:             j.companyName,
    companyName:         j.companyName,
    companyLogo:         j.companyLogo || null,
    submittedBy:         j.user?.companyName || j.companyName || j.user?.name,
    submittedByEmail:    j.user?.email || '',
    submittedById:       j.user?.id || '',
    submittedByLogo:     j.user?.companyLogo || j.user?.avatar || null,
    city:                j.location,
    location:            j.location,
    region:              j.region || null,
    contractType:        j.contractType,
    remote:              j.remote || null,
    salaryMin:           j.salaryMin ?? null,
    salaryMax:           j.salaryMax ?? null,
    salaryPeriod:        j.salaryPeriod || null,
    experienceLevel:     j.experienceLevel || null,
    educationLevel:      j.educationLevel || [],
    languages:           j.languages || [],
    skills:              j.skills || [],
    applicationDeadline: j.applicationDeadline || null,
    status:              j.status,
    isFeatured:          j.isFeatured || false,
    isSponsored:         j.isSponsored || false,
    viewsCount:          j.viewsCount ?? 0,
    adminNote:           j.adminNotes || null,
    deletedByOwner:      j.deletedByOwner ?? false,
    createdAt:           j.createdAt,
    updatedAt:           j.updatedAt,
    publishedAt:         j.publishedAt || null,
    reviewedAt:          j.reviewedAt || null,
  }),

  immobilier: (r) => ({
    id:               r.id,
    module:           'immobilier',
    title:            r.title,
    description:      r.description,
    company:          r.user?.companyName || r.user?.name || '',
    submittedBy:      r.user?.companyName || r.user?.name || '',
    submittedByEmail: r.user?.email || '',
    submittedById:    r.user?.id || '',
    submittedByLogo:  r.user?.companyLogo || r.user?.avatar || null,
    location:         r.location,
    city:             r.city || r.location,
    region:           r.region,
    contractType:     r.listingType,
    propertyType:     r.propertyType,
    status:           r.status,
    isActive:         r.isActive,
    isFeatured:       r.isFeatured,
    isSponsored:      r.isSponsored,
    price:            r.price,
    surface:          r.surface,
    rooms:            r.rooms,
    bathrooms:        r.bathrooms,
    floor:            r.floor,
    latitude:         r.latitude,
    longitude:        r.longitude,
    contactPhone:     r.contactPhone,
    images:           r.images,
    features:         r.features,
    adminNote:        r.adminNotes || null,
    viewsCount:       r.viewsCount,
    category:         r.category || null,
    categoryId:       r.categoryId,
    inquiriesCount:   r._count?.inquiries ?? 0,
    deletedByOwner:   r.deletedByOwner ?? false,
    reviewedBy:       r.reviewedBy,
    reviewedAt:       r.reviewedAt,
    publishedAt:      r.publishedAt,
    createdAt:        r.createdAt,
    updatedAt:        r.updatedAt,
  }),

  automobile: (c) => ({
    id:               c.id,
    module:           'automobile',
    title:            c.title,
    description:      c.description,
    company:          c.user?.companyName || c.user?.name || '',
    submittedBy:      c.user?.companyName || c.user?.name || '',
    submittedByEmail: c.user?.email || '',
    submittedById:    c.user?.id || '',
    submittedByLogo:  c.user?.companyLogo || c.user?.avatar || null,
    location:         c.location,
    city:             c.city || c.location,
    region:           c.region || null,
    // car-specific
    make:             c.make,
    model:            c.model,
    year:             c.year,
    mileage:          c.mileage ?? null,
    fuelType:         c.fuelType,
    transmission:     c.transmission,
    bodyType:         c.bodyType,
    condition:        c.condition,
    color:            c.color || null,
    doors:            c.doors ?? null,
    seats:            c.seats ?? null,
    engineSize:       c.engineSize ?? null,
    horsePower:       c.horsePower ?? null,
    isNegotiable:     c.isNegotiable,
    listingType:      c.listingType,
    // shared
    price:            c.price,
    contactPhone:     c.contactPhone,
    images:           c.images,
    features:         c.features,
    status:           c.status,
    isActive:         c.isActive,
    isFeatured:       c.isFeatured,
    isSponsored:      c.isSponsored,
    viewsCount:       c.viewsCount ?? 0,
    adminNote:        c.adminNotes || null,
    category:         c.category || null,
    categoryId:       c.categoryId,
    inquiriesCount:   c._count?.inquiries ?? 0,
    deletedByOwner:   c.deletedByOwner ?? false,
    reviewedBy:       c.reviewedBy,
    reviewedAt:       c.reviewedAt,
    publishedAt:      c.publishedAt,
    createdAt:        c.createdAt,
    updatedAt:        c.updatedAt,
  }),
 
  miniJobs: (w) => ({
    id:               w.id,
    module:           'miniJobs',
    title:            w.headline,          // mapped: WorkerProfile has no "title" field
    headline:         w.headline,
    description:      w.description,
    company:          w.user?.name || '',
    submittedBy:      w.user?.name || '',
    submittedByEmail: w.user?.email || '',
    submittedById:    w.user?.id || '',
    submittedByLogo:  w.user?.avatar || null,
    location:         w.city,
    city:             w.city,
    region:           w.region || null,
    pricingUnit:      w.pricingUnit,
    rate:             w.rate,
    isNegotiable:     w.isNegotiable,
    photo:            w.photo || null,
    portfolioImages:  w.portfolioImages || [],
    yearsExperience:  w.yearsExperience ?? null,
    availability:     w.availability || null,
    serviceRadius:    w.serviceRadius ?? null,
    ratingAvg:        w.ratingAvg ?? 0,
    ratingCount:      w.ratingCount ?? 0,
    status:           w.status,
    isActive:         w.isActive,
    isFeatured:       w.isFeatured,
    viewsCount:       w.viewsCount ?? 0,
    adminNote:        w.adminNotes || null,
    category:         w.category || null,
    categoryId:       w.categoryId,
    deletedByOwner:   w.deletedByOwner ?? false,
    reviewedBy:       w.reviewedBy,
    reviewedAt:       w.reviewedAt,
    publishedAt:      w.publishedAt,
    createdAt:        w.createdAt,
    updatedAt:        w.updatedAt,
  }),
 
  taskRequests: (t) => ({
    id:               t.id,
    module:           'taskRequests',
    title:            t.title,
    description:      t.description,
    company:          t.user?.name || '',
    submittedBy:      t.user?.name || '',
    submittedByEmail: t.user?.email || '',
    submittedById:    t.user?.id || '',
    submittedByLogo:  t.user?.avatar || null,
    location:         t.city,
    city:             t.city,
    region:           t.region || null,
    budget:           t.budget ?? null,
    neededDate:       t.neededDate,
    status:           t.status,
    viewsCount:       t.viewsCount ?? 0,
    adminNote:        t.adminNotes || null,
    category:         t.category || null,
    categoryId:       t.categoryId,
    deletedByOwner:   t.deletedByOwner ?? false,
    reviewedBy:       t.reviewedBy,
    reviewedAt:       t.reviewedAt,
    createdAt:        t.createdAt,
    updatedAt:        t.updatedAt,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRISMA SELECT MAPS  (only fetch what the normalizer needs)
// ─────────────────────────────────────────────────────────────────────────────

const USER_SELECT = {
  id: true, name: true, email: true,
  companyName: true, companyLogo: true, avatar: true,
};

const SELECTS = {
  emploi: {
    id: true, title: true, description: true,
    companyName: true, companyLogo: true,
    location: true, region: true,
    contractType: true, remote: true,
    salaryMin: true, salaryMax: true, salaryPeriod: true,
    experienceLevel: true, educationLevel: true,
    languages: true, skills: true, applicationDeadline: true,
    status: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    createdAt: true, updatedAt: true, publishedAt: true, reviewedAt: true,
    user: { select: USER_SELECT },
  },

  immobilier: {
    id: true, title: true, description: true,
    location: true, city: true, region: true,
    listingType: true, propertyType: true,
    price: true, surface: true, rooms: true, bathrooms: true, floor: true,
    latitude: true, longitude: true, contactPhone: true,
    images: true, features: true,
    status: true, isActive: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
    _count:   { select: { inquiries: true } },
  },

  automobile: {
    id: true, title: true, description: true,
    location: true, city: true, region: true,
    make: true, model: true, year: true, mileage: true,
    fuelType: true, transmission: true, bodyType: true, condition: true,
    color: true, doors: true, seats: true, engineSize: true, horsePower: true,
    isNegotiable: true, listingType: true,
    price: true, contactPhone: true,
    images: true, features: true,
    status: true, isActive: true, isFeatured: true, isSponsored: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
    _count:   { select: { inquiries: true } },
  },
 
  miniJobs: {
    id: true, headline: true, description: true,
    city: true, region: true,
    pricingUnit: true, rate: true, isNegotiable: true,
    photo: true, portfolioImages: true, yearsExperience: true,
    availability: true, serviceRadius: true,
    ratingAvg: true, ratingCount: true,
    status: true, isActive: true, isFeatured: true,
    viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    publishedAt: true, createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
  },
 
  taskRequests: {
    id: true, title: true, description: true,
    city: true, region: true,
    budget: true, neededDate: true,
    status: true, viewsCount: true, adminNotes: true, deletedByOwner: true,
    categoryId: true, reviewedAt: true, reviewedBy: true,
    createdAt: true, updatedAt: true,
    user:     { select: USER_SELECT },
    category: { select: { id: true, name: true, slug: true } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WHERE CLAUSE BUILDERS  (module-specific search fields)
// ─────────────────────────────────────────────────────────────────────────────

const WHERE_BUILDERS = {
  emploi: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { location:    { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),

  immobilier: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:    { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { city:     { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),

  automobile: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:    { contains: search, mode: 'insensitive' } },
        { make:     { contains: search, mode: 'insensitive' } },
        { model:    { contains: search, mode: 'insensitive' } },
        { city:     { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
 
  miniJobs: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { headline:    { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city:        { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
 
  taskRequests: ({ status, userId, search }) => ({
    ...(status && { status }),
    ...(userId && { userId }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city:        { contains: search, mode: 'insensitive' } },
      ],
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ALERT NOTIFIERS  (match and notify subscribers when a listing is approved)
// ─────────────────────────────────────────────────────────────────────────────

async function notifyJobAlertSubscribers(approvedJob, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'emploi', isActive: true, NOT: [{ userId: approvedJob.userId }] },
    });

    const notified = new Set([approvedJob.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.categorySlug  || f.categorySlug  === approvedJob.category?.slug) &&
        (!f.region        || f.region        === approvedJob.region) &&
        (!f.city          || f.city          === approvedJob.city) &&
        (!f.contractType  || f.contractType  === approvedJob.contractType) &&
        (!f.remote        || f.remote        === approvedJob.remote) &&
        (!f.keyword       || approvedJob.title.toLowerCase().includes(f.keyword.toLowerCase()));

      if (matches) {
        await createNotification(
          alert.userId, 'JOB_ALERT',
          'Nouvelle offre qui vous correspond 🔔',
          `Une nouvelle offre "${approvedJob.title}" correspond à votre alerte.`,
          `/jobs/${approvedJob.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyJobAlertSubscribers] error:', err);
  }
}

async function notifyRealEstateAlertSubscribers(approvedRe, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'immobilier', isActive: true },
    });

    const notified = new Set([approvedRe.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.categoryId  || f.categoryId  === approvedRe.categoryId) &&
        (!f.listingType || f.listingType === approvedRe.listingType) &&
        (!f.region      || f.region      === approvedRe.region) &&
        (!f.city        || f.city        === approvedRe.city) &&
        (!f.minPrice    || Number(approvedRe.price) >= Number(f.minPrice)) &&
        (!f.maxPrice    || Number(approvedRe.price) <= Number(f.maxPrice));

      if (matches) {
        await createNotification(
          alert.userId, 'REALESTATE_ALERT_MATCH',
          'Nouvelle annonce correspond à votre alerte 🔔',
          `Une nouvelle annonce "${approvedRe.title}" correspond à votre alerte immobilière.`,
          `/real-estate/${approvedRe.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyRealEstateAlertSubscribers] error:', err);
  }
}

async function notifyCarAlertSubscribers(approvedCar, createNotification) {
  try {
    const alerts = await prisma.alert.findMany({
      where: { module: 'automobile', isActive: true },
    });

    const notified = new Set([approvedCar.userId]);
    for (const alert of alerts) {
      if (notified.has(alert.userId)) continue;
      const f = alert.filters || {};
      const matches =
        (!f.make         || f.make         === approvedCar.make) &&
        (!f.bodyType     || f.bodyType     === approvedCar.bodyType) &&
        (!f.fuelType     || f.fuelType     === approvedCar.fuelType) &&
        (!f.transmission || f.transmission === approvedCar.transmission) &&
        (!f.condition    || f.condition    === approvedCar.condition) &&
        (!f.region       || f.region       === approvedCar.region) &&
        (!f.city         || f.city         === approvedCar.city) &&
        (!f.listingType  || f.listingType  === approvedCar.listingType) &&
        (!f.minPrice     || Number(approvedCar.price) >= Number(f.minPrice)) &&
        (!f.maxPrice     || Number(approvedCar.price) <= Number(f.maxPrice)) &&
        (!f.maxMileage   || (approvedCar.mileage != null && approvedCar.mileage <= Number(f.maxMileage))) &&
        (!f.minYear      || approvedCar.year >= Number(f.minYear)) &&
        (!f.maxYear      || approvedCar.year <= Number(f.maxYear));

      if (matches) {
        await createNotification(
          alert.userId, 'CAR_ALERT_MATCH',
          'Nouvelle annonce correspond à votre alerte 🔔',
          `Une nouvelle annonce "${approvedCar.title}" correspond à votre alerte véhicule.`,
          `/cars/${approvedCar.id}`,
        );
        notified.add(alert.userId);
      }
    }
  } catch (err) {
    console.error('[notifyCarAlertSubscribers] error:', err);
  }
}

// Registry so approveListing can look up the right notifier by module
const ALERT_NOTIFIERS = {
  emploi:     notifyJobAlertSubscribers,
  immobilier: notifyRealEstateAlertSubscribers,
  automobile: notifyCarAlertSubscribers,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/overview
// ─────────────────────────────────────────────────────────────────────────────

const getOverview = async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      pendingJobs,
      pendingRealEstate,
      pendingCars,
      pendingWorkerProfiles,
      approvedTodayJobs,
      approvedTodayRealEstate,
      approvedTodayCars,
      approvedTodayWorkerProfiles,
      openReports,
      totalUsers,
    ] = await Promise.all([
      prisma.jobListing.count({ where: { status: 'PENDING' } }),
      prisma.realEstateListing.count({ where: { status: 'PENDING' } }),
      prisma.carListing.count({ where: { status: 'PENDING' } }),
      prisma.workerProfile.count({ where: { status: 'PENDING' } }),
 
      prisma.jobListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.realEstateListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.carListing.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.workerProfile.count({
        where: { status: 'APPROVED', publishedAt: { gte: todayStart, lte: todayEnd } },
      }),
 
      // Replace Promise.resolve(0) with prisma.report.count(...) once reports go live
      Promise.resolve(0),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: {
        pending:      pendingJobs + pendingRealEstate + pendingCars + pendingWorkerProfiles,
        approvedToday: approvedTodayJobs + approvedTodayRealEstate + approvedTodayCars + approvedTodayWorkerProfiles,
        openReports,
        totalUsers,
        // Granular breakdown — useful for per-module sidebar badges
        pendingByModule: {
          emploi:     pendingJobs,
          immobilier: pendingRealEstate,
          automobile: pendingCars,
          miniJobs:   pendingWorkerProfiles,
        },
      },
    });
  } catch (error) {
    console.error('admin getOverview error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/listings
// Query params: module, status, search, userId, page, limit
// ─────────────────────────────────────────────────────────────────────────────

const getListings = async (req, res) => {
  try {
    const {
      module: mod = 'tous',
      status  = '',
      search  = '',
      userId  = '',
      page    = 1,
      limit   = 10,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const filters = { status, userId, search };

    // Determine which modules to query
    const activeModules = mod === 'tous'
      ? Object.keys(MODULE_REGISTRY)
      : Object.keys(MODULE_REGISTRY).filter((k) => k === mod);

  // Fetch all active modules in parallel
    const results = await Promise.all(
      activeModules.map((moduleKey) => {
        const { model } = MODULE_REGISTRY[moduleKey];

        // TaskRequest uses its own status enum (OPEN/IN_PROGRESS/COMPLETED/
        // CANCELLED/ARCHIVED) — it has no PENDING/APPROVED/REJECTED/etc.
        // If the admin's status filter doesn't apply to that enum, this
        // module simply has nothing to show under that filter — skip the
        // query instead of letting Prisma reject an invalid enum value.
        if (moduleKey === 'taskRequests' && status && !TASK_REQUEST_VALID_STATUSES.includes(status)) {
          return Promise.resolve([]);
        }

        return prisma[model].findMany({
          where:   WHERE_BUILDERS[moduleKey](filters),
          orderBy: { createdAt: 'desc' },
          select:  SELECTS[moduleKey],
        });
      }),
    );
    // Normalize, merge, sort, paginate
    const all = activeModules
      .flatMap((moduleKey, i) =>
        results[i].map((row) => NORMALIZERS[moduleKey](row)),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total    = all.length;
    const paginated = all.slice(skip, skip + take);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('admin getListings error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/approve
// Auto-detects the module by trying each model in registry order.
// ─────────────────────────────────────────────────────────────────────────────

const approveListing = async (req, res) => {
  try {
    const { id }    = req.params;
    const adminId   = req.user.userId;
    const now       = new Date();
    const { createNotification } = require('./notificationController');

    for (const [moduleKey, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;

      if (record.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: "Cette annonce n'est pas en attente" });
      }

       // Move images out of temp/ if this module uses Cloudinary images.
      // WorkerProfile (miniJobs) is special-cased: it splits photo (string)
      // + portfolioImages (array) instead of a single "images" array.
      let images = record.images || [];
      let workerProfileImageFields = {};
 
      if (moduleKey === 'miniJobs') {
        const moved = await moveWorkerProfileImages(record, config.cloudinaryFolder);
        workerProfileImageFields = { photo: moved.photo, portfolioImages: moved.portfolioImages };
      } else if (config.cloudinaryFolder) {
        images = await moveImages(record.images || [], config.cloudinaryFolder);
      }
 
      const approved = await prisma[config.model].update({
        where: { id },
        data: {
          status:     'APPROVED',
          publishedAt: now,
          reviewedAt:  now,
          reviewedBy:  adminId,
          adminNotes:  null,
          ...(moduleKey === 'miniJobs'
            ? workerProfileImageFields
            : config.cloudinaryFolder ? { images } : {}),
        },
        include: { category: { select: { slug: true } } },
      });
 
      // Fire alert subscribers (if a notifier is registered for this module)
      const notifier = ALERT_NOTIFIERS[moduleKey];
      if (notifier) await notifier(approved, createNotification);
 
      // Notify the listing owner (WorkerProfile has "headline", not "title")
      await createNotification(
        record.userId,
        'LISTING_APPROVED',
        'Votre annonce a été approuvée ✅',
        `Votre annonce "${record.title || record.headline}" est maintenant en ligne.`,
        config.frontendPath(id),
      );

      return res.json({ success: true, message: 'Annonce approuvée' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin approveListing error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/reject
// Body: { adminNote, messageToSend }
// ─────────────────────────────────────────────────────────────────────────────

const rejectListing = async (req, res) => {
  try {
    const { id }                           = req.params;
    const { adminNote = '', messageToSend = '' } = req.body;
    const adminId                          = req.user.userId;
    const now                              = new Date();
    const { createNotification }           = require('./notificationController');

    for (const [moduleKey, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;
 
      // Delete temp images on rejection (only for image-based modules).
      // WorkerProfile (miniJobs) is special-cased for the photo/portfolioImages split.
      if (moduleKey === 'miniJobs') {
        await destroyWorkerProfileImages(record);
      } else if (config.cloudinaryFolder) {
        await destroyImages(record.images || []);
      }

      await prisma[config.model].update({
        where: { id },
        data: { status: 'REJECTED', adminNotes: adminNote, reviewedAt: now, reviewedBy: adminId },
      });

      // Dashboard message
      await prisma.businessMessage.create({
        data: {
          userId:       record.userId,
          type:         'REJECTION',
          targetType:   config.targetType,
          targetId:     id,
          targetTitle:  record.title || record.headline,
          adminMessage: messageToSend || adminNote || '',
        },
      });
 
      // Bell notification (citizen-owned WorkerProfile -> /my-space/messages,
      // everything else -> /dashboard/messages)
      await createNotification(
        record.userId,
        'LISTING_REJECTED',
        'Votre annonce a été refusée ❌',
        `Votre annonce "${record.title || record.headline}" a été refusée. Consultez vos messages pour plus de détails.`,
        moduleKey === 'miniJobs' ? '/my-space/messages' : '/dashboard/messages',
      );

      return res.json({ success: true, message: 'Annonce refusée' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin rejectListing error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS HANDLERS  (used by updateListingStatus — one per module)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'];

/**
 * Generic status handler shared by all image-based modules.
 * Pass moduleKey to get the right Cloudinary folder, frontend path, and notifier.
 */
async function handleGenericStatus(req, res, { id, status, adminNotes, adminId, now }, moduleKey) {
  const { createNotification } = require('./notificationController');
  const config = MODULE_REGISTRY[moduleKey];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' });
  }

  const record = await prisma[config.model].findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Annonce introuvable' });

  const wasPending = record.status === 'PENDING';
  let   images     = record.images || [];

  // Approve: move images out of temp/
  if (status === 'APPROVED' && wasPending && config.cloudinaryFolder) {
    images = await moveImages(images, config.cloudinaryFolder);
  }

  // Reject: destroy temp images
  if (status === 'REJECTED' && wasPending && config.cloudinaryFolder) {
    await destroyImages(images.filter((img) => img.url?.includes('madinatti/temp')));
  }

  const updated = await prisma[config.model].update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      reviewedAt: now,
      reviewedBy: adminId,
      ...(config.cloudinaryFolder ? { images } : {}),
      ...(status === 'APPROVED' && !record.publishedAt ? { publishedAt: now } : {}),
    },
    include: { category: { select: { slug: true } } },
  });

  // Notifications on key transitions
  if (status === 'APPROVED' && wasPending) {
    const notifier = ALERT_NOTIFIERS[moduleKey];
    if (notifier) await notifier(updated, createNotification);
    await createNotification(
      updated.userId, 'LISTING_APPROVED',
      'Votre annonce a été approuvée ✅',
      `Votre annonce "${updated.title}" est maintenant en ligne.`,
      config.frontendPath(updated.id),
    );
  } else if (status === 'REJECTED' && wasPending) {
    await createNotification(
      updated.userId, 'LISTING_REJECTED',
      'Votre annonce a été refusée ❌',
      `Votre annonce "${updated.title}" a été refusée. Consultez vos messages pour plus de détails.`,
      '/dashboard/messages',
    );
  }

  return res.json({ success: true, message: 'Annonce mise à jour', data: updated });
}
 
/**
 * Dedicated status handler for WorkerProfile (mini-jobs). Not routed through
 * handleGenericStatus because WorkerProfile splits images into photo (string)
 * + portfolioImages (array) instead of a single "images" array, and uses
 * "headline" instead of "title".
 */
async function handleMiniJobsStatus(req, res, { id, status, adminNotes, adminId, now }) {
  const { createNotification } = require('./notificationController');
  const config = MODULE_REGISTRY.miniJobs;
 
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide' });
  }
 
  const record = await prisma.workerProfile.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Profil introuvable' });
 
  const wasPending = record.status === 'PENDING';
  let photo = record.photo;
  let portfolioImages = record.portfolioImages || [];
 
  if (status === 'APPROVED' && wasPending) {
    const moved = await moveWorkerProfileImages(record, config.cloudinaryFolder);
    photo = moved.photo;
    portfolioImages = moved.portfolioImages;
  }
 
  if (status === 'REJECTED' && wasPending) {
    await destroyWorkerProfileImages(record);
  }
 
  const updated = await prisma.workerProfile.update({
    where: { id },
    data: {
      status,
      adminNotes: adminNotes || null,
      reviewedAt: now,
      reviewedBy: adminId,
      photo,
      portfolioImages,
      ...(status === 'APPROVED' && !record.publishedAt ? { publishedAt: now } : {}),
    },
    include: { category: { select: { slug: true } } },
  });
 
  if (status === 'APPROVED' && wasPending) {
    await createNotification(
      updated.userId, 'WORKER_PROFILE_APPROVED',
      'Votre profil prestataire a été approuvé ✅',
      `Votre profil "${updated.headline}" est maintenant visible publiquement.`,
      config.frontendPath(updated.id),
    );
  } else if (status === 'REJECTED' && wasPending) {
    await createNotification(
      updated.userId, 'WORKER_PROFILE_REJECTED',
      'Votre profil prestataire a été refusé ❌',
      `Votre profil "${updated.headline}" a été refusé. Consultez vos messages pour plus de détails.`,
      '/my-space/messages',
    );
    await prisma.businessMessage.create({
      data: {
        userId:       updated.userId,
        type:         'REJECTION',
        targetType:   'WORKER_PROFILE',
        targetId:     id,
        targetTitle:  updated.headline,
        adminMessage: adminNotes || '',
      },
    });
  }
 
  return res.json({ success: true, message: 'Profil mis à jour', data: updated });
}
 
// Module-specific handlers (thin wrappers — add custom logic per module here if needed)
/**
 * Dedicated status handler for TaskRequest. Uses a completely different
 * valid-status set (OPEN/IN_PROGRESS/COMPLETED/CANCELLED/ARCHIVED) than
 * the PENDING/APPROVED/REJECTED/SUSPENDED/EXPIRED cycle the generic
 * handler assumes — TaskRequest never goes through PENDING at all
 * (publishes immediately, moderated reactively via Report). In practice
 * this handler is only reached from a Report resolution flow, typically
 * to set status to ARCHIVED (hide a reported task) or CANCELLED.
 */
const TASK_REQUEST_VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
 
async function handleTaskRequestStatus(req, res, { id, status, adminNotes, adminId, now }) {
  if (!TASK_REQUEST_VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Statut invalide pour une demande de tâche' });
  }
 
  const record = await prisma.taskRequest.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Demande introuvable' });
 
  const updated = await prisma.taskRequest.update({
    where: { id },
    data: { status, adminNotes: adminNotes || null, reviewedAt: now, reviewedBy: adminId },
  });
 
  const { createNotification } = require('./notificationController');
  if (status === 'ARCHIVED' || status === 'CANCELLED') {
    await createNotification(
      updated.userId,
      'TASK_REQUEST_MODERATED',
      'Votre demande a été retirée',
      `Votre demande "${updated.title}" a été retirée par un administrateur.${adminNotes ? ' Motif : ' + adminNotes : ''}`,
      '/my-space/task-requests'
    );
  }
 
  return res.json({ success: true, message: 'Demande mise à jour', data: updated });
}
 
// Module-specific handlers (thin wrappers — add custom logic per module here if needed)
const STATUS_HANDLERS = {
  emploi:       (req, res, ctx) => handleGenericStatus(req, res, ctx, 'emploi'),
  immobilier:   (req, res, ctx) => handleGenericStatus(req, res, ctx, 'immobilier'),
  automobile:   (req, res, ctx) => handleGenericStatus(req, res, ctx, 'automobile'),
  miniJobs:     handleMiniJobsStatus,
  taskRequests: handleTaskRequestStatus,
  // services:  (req, res, ctx) => handleGenericStatus(req, res, ctx, 'services'),
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/status
// Body: { status, adminNotes, module }
// ─────────────────────────────────────────────────────────────────────────────

const updateListingStatus = async (req, res) => {
  try {
    const { id }                    = req.params;
    const { status, adminNotes, module } = req.body;
    const adminId                   = req.user.userId;
    const now                       = new Date();

    const handler = STATUS_HANDLERS[module];
    if (!handler) {
      return res.status(400).json({ success: false, message: `Module inconnu : ${module}` });
    }

    return await handler(req, res, { id, status, adminNotes, adminId, now });
  } catch (error) {
    console.error('admin updateListingStatus error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/listings/:id
// Permanently deletes a listing and its Cloudinary assets.
// ─────────────────────────────────────────────────────────────────────────────

const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    for (const [, config] of Object.entries(MODULE_REGISTRY)) {
      const record = await prisma[config.model].findUnique({ where: { id } });
      if (!record) continue;

      // Destroy all associated Cloudinary images
      if (config.cloudinaryFolder) {
        await destroyImages(record.images || []);
      }

      // For job listings, also clean up the company logo
      if (config.model === 'jobListing' && record.companyLogo) {
        await destroyImage({ url: record.companyLogo });
      }

      await prisma[config.model].delete({ where: { id } });
      return res.json({ success: true, message: 'Annonce supprimée définitivement' });
    }

    return res.status(404).json({ success: false, message: 'Annonce introuvable' });
  } catch (error) {
    console.error('admin deleteListing error:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports
// NOTE: No Report model in schema.prisma yet — returns empty array.
// When you add the model, replace the body below.
// ─────────────────────────────────────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    // Real implementation once Report model is added to schema:
    // const reports = await prisma.report.findMany({
    //   orderBy: { createdAt: 'desc' },
    //   include: { reporter: { select: { name: true, email: true } } },
    // })

    // Placeholder — no Report model in current schema
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error("admin getReports error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:id
// Body: { action: 'dismiss' | 'delete' }
// NOTE: Placeholder until Report model is added.
// ─────────────────────────────────────────────────────────────────────────────
const handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!["dismiss", "delete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action invalide. Utilisez dismiss ou delete.",
      });
    }

    // Real implementation once Report model is added:
    // if (action === 'dismiss') {
    //   await prisma.report.update({ where: { id }, data: { status: 'DISMISSED' } })
    // } else if (action === 'delete') {
    //   const report = await prisma.report.findUnique({ where: { id } })
    //   // Delete the listing too
    //   await prisma.report.update({ where: { id }, data: { status: 'DELETED' } })
    // }

    res.json({
      success: true,
      message: `Signalement ${action === "dismiss" ? "ignoré" : "traité"}`,
    });
  } catch (error) {
    console.error("admin handleReport error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query params: search, role, page, limit
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(role && { role: { name: role } }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          role: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const normalized = users.map((u) => ({
      ...u,
      role: u.role?.name || "citizen",
    }));

    res.json({
      success: true,
      data: normalized,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("admin getUsers error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle
// Flips isActive. Cannot toggle admin users.
// ─────────────────────────────────────────────────────────────────────────────
const toggleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable" });
    }

    if (user.role?.name === "admin") {
      return res.status(403).json({
        success: false,
        message: "Impossible de désactiver un compte admin",
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({
      success: true,
      isActive: updated.isActive,
      message: updated.isActive ? "Compte réactivé" : "Compte désactivé",
    });
  } catch (error) {
    console.error("admin toggleUser error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/businesses
// Returns business users with their listing stats
// ─────────────────────────────────────────────────────────────────────────────
const getBusinesses = async (req, res) => {
  try {
    const businessRole = await prisma.role.findUnique({
      where: { name: "business" },
    });

    if (!businessRole) {
      return res.json({ success: true, data: [] });
    }

    const businesses = await prisma.user.findMany({
      where: { roleId: businessRole.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        isActive: true,
        companyName: true,
        companyLogo: true,
        companyWebsite: true,
        createdAt: true,
        subscriptions: {
          orderBy: { startedAt: "desc" },
          take: 1,
          select: {
            status: true,
            expiresAt: true,
            plan: { select: { name: true } },
          },
        },
        jobListings: {
          select: { status: true },
        },
        realEstateListings: {
          select: { status: true },
        },
      },
    });

    const normalized = businesses.map((b) => {
      // Combine job + real estate listings
      const allListings = [
        ...b.jobListings.map((l) => ({ status: l.status })),
        ...b.realEstateListings.map((l) => ({
          status: l.status,
        })),
      ];

      const activeSub = b.subscriptions[0];
      const plan = activeSub?.plan?.name || "Standard";

      return {
        id: b.id,
        name: b.companyName || b.name,
        email: b.email,
        city: b.city || "—",
        isActive: b.isActive,
        plan,
        joinedAt: b.createdAt,
        totalListings: allListings.length,
        pendingListings: allListings.filter((l) => l.status === "PENDING")
          .length,
        publishedListings: allListings.filter((l) => l.status === "APPROVED")
          .length,
        rejectedListings: allListings.filter((l) => l.status === "REJECTED")
          .length,
      };
    });

    res.json({ success: true, data: normalized });
  } catch (error) {
    console.error("admin getBusinesses error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT — flat schema, module-based
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utility — convert a name to a slug.
 * e.g. "Informatique & Tech" → "informatique-tech"
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/categories
// Query: module (e.g. "emploi" | "immobilier") — optional filter
// Returns flat list of categories with listing counts.
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { module: mod } = req.query;

    const where = mod ? { module: mod } : {};

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            jobListings: true,
            realEstateListings: true,
            carListings: true,
          },
        },
      },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("admin getCategories error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/categories
// Body: { name, module }
// Creates a new category under the given module.
// ─────────────────────────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, module: mod } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est requis" });
    }
    if (!mod) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Le module est requis (emploi | immobilier)",
        });
    }

    const MODULE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!MODULE_SLUG_RE.test(mod)) {
      return res.status(400).json({
        success: false,
        message:
          "Le module doit contenir uniquement des minuscules, chiffres et tirets.",
      });
    }

    const slug = `${mod}-${toSlug(name.trim())}`;

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Une catégorie avec ce nom existe déjà dans ce module",
      });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        module: mod,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("admin createCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id
// Body: { name }
// Renames a category and regenerates its slug.
// ─────────────────────────────────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Le nom est requis" });
    }

    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    // Rebuild slug: module prefix + new name
    const newSlug = `${cat.module}-${toSlug(name.trim())}`;

    // Check collision (exclude self)
    const collision = await prisma.category.findFirst({
      where: { slug: newSlug, NOT: { id } },
    });
    if (collision) {
      return res.status(409).json({
        success: false,
        message: "Une catégorie avec ce nom existe déjà dans ce module",
      });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug: newSlug },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("admin updateCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id/toggle
// Flips isActive on the category.
// ─────────────────────────────────────────────────────────────────────────────
const toggleCategoryActive = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    const newValue = !cat.isActive;

    await prisma.category.update({
      where: { id },
      data: { isActive: newValue },
    });

    res.json({
      success: true,
      isActive: newValue,
      message: newValue ? "Catégorie activée" : "Catégorie désactivée",
    });
  } catch (error) {
    console.error("admin toggleCategoryActive error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/categories/:id
// Blocks deletion if the category has linked listings.
// ─────────────────────────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobListings: true,
            realEstateListings: true,
            carListings: true,
          },
        },
      },
    });
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Catégorie introuvable" });
    }

    const totalListings =
      cat._count.jobListings + cat._count.realEstateListings + cat._count.carListings;
    if (totalListings > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : ${totalListings} annonce(s) sont liées à cette catégorie. Désactivez-la à la place.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({ success: true, message: "Catégorie supprimée" });
  } catch (error) {
    console.error("admin deleteCategory error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admincategories/module/:module
// delete full module.
// ─────────────────────────────────────────────────────────────────────────────
const deleteModule = async (req, res) => {
  try {
    const { module: mod } = req.params;

    // Find all categories in this module
    const cats = await prisma.category.findMany({
      where: { module: mod },
      include: {
        _count: { select: { jobListings: true, realEstateListings: true, carListings: true } },
      },
    });

    const deletable = cats.filter(
      (c) => c._count.jobListings === 0 && c._count.realEstateListings === 0 && c._count.carListings === 0,
    );
    const blocked = cats.length - deletable.length;

    if (deletable.length === 0) {
      return res.status(409).json({
        success: false,
        message: `Aucune catégorie supprimable — ${blocked} ont des annonces liées.`,
      });
    }

    await prisma.category.deleteMany({
      where: { id: { in: deletable.map((c) => c.id) } },
    });

    res.json({
      success: true,
      deleted: deletable.length,
      blocked,
      message: `${deletable.length} catégorie(s) supprimée(s)${blocked > 0 ? `, ${blocked} conservée(s) (annonces liées)` : ""}.`,
    });
  } catch (error) {
    console.error("admin deleteModule error:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

module.exports = {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
  updateListingStatus,
  deleteListing,
  getReports,
  handleReport,
  getUsers,
  toggleUser,
  getBusinesses,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
  deleteModule,
};

```

## `backend/controllers/reviewController.js`

```javascript
const reviewService = require('../services/reviews');

const ERROR_STATUS = {
  RATING_INVALID: 400,
  MISSING_TARGET: 400,
  MISSING_REFERENCE: 400,
  AMBIGUOUS_REFERENCE: 400,
  ACCOUNT_TOO_NEW: 400,
  NOT_COMPLETED: 400,
  TARGET_MISMATCH: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ALREADY_REVIEWED: 409,
};

const createReview = async (req, res) => {
  try {
    const review = await reviewService.createReview(req.user.userId, req.body);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    const status = ERROR_STATUS[err.code];
    if (status) {
      return res.status(status).json({ success: false, code: err.code, message: err.message });
    }
    console.error('[reviewController.createReview]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getReviewsForTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    if (!targetType || !targetId) {
      return res
        .status(400)
        .json({ success: false, message: 'targetType et targetId sont requis' });
    }
    const result = await reviewService.getReviewsForTarget(targetType, targetId, req.query);
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[reviewController.getReviewsForTarget]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createReview,
  getReviewsForTarget,
};
```

## `backend/routes/reviews.js`

```javascript
// backend/routes/reviews.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { reviewLimiter } = require('../middlewares/rateLimiter');
const controller = require('../controllers/reviewController');

// ---------------- PUBLIC ----------------
// GET /api/reviews?targetType=WORKER_PROFILE&targetId=<id>&page=&limit=
router.get('/', controller.getReviewsForTarget);

// ---------------- AUTHENTICATED (citizen) ----------------
// The reviewer is always the client side of a Booking or TaskRequest, both
// of which are citizen-only flows (see decisions 1.1/1.6) — restricting to
// citizen here rather than leaving it open to any authenticated role.
router.post('/', authMiddleware, roleMiddleware('citizen'), reviewLimiter, controller.createReview);

module.exports = router;

// NOTE: already mounted in server.js as:
//   app.use('/api/reviews', require('./routes/reviews'));
```

## `backend/services/reviews.js`

```javascript
// backend/services/reviews.js
const prisma = require('../config/db');

// ── Tunable knobs ────────────────────────────────────────────────────────────
// Decision doc left this as "2 or 5 days, either defensible" — picked 5 for a
// bit more anti-burner-account margin. Easy to change, single source of truth.
const REVIEW_ACCOUNT_AGE_DAYS = 5;

// Only WORKER_PROFILE exists today (mini-jobs). Both Model A (Booking) and
// Model B (TaskApplication) reviews target it. Future verticals (hotels,
// pharmacy, santé) will add their own ReviewTargetType values here, and those
// won't have a transaction record to gate on (see decisions doc 1.9) — that
// exemption is intentionally NOT implemented yet since no such target exists.
const GATED_TARGET_TYPES = ['WORKER_PROFILE'];

// ────────────────────────────────────────────────────────────────────────────
// RATING RECALCULATION
// Shared so reportController.js can call it too after a moderated deletion.
// ────────────────────────────────────────────────────────────────────────────

async function recalcWorkerProfileRating(workerProfileId) {
  const agg = await prisma.review.aggregate({
    where: { targetType: 'WORKER_PROFILE', targetId: workerProfileId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return prisma.workerProfile.update({
    where: { id: workerProfileId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// CREATE
// ────────────────────────────────────────────────────────────────────────────

async function createReview(userId, data) {
  const { targetType, targetId, rating, comment, bookingId, taskApplicationId } = data;

  // ── Basic validation ────────────────────────────────────────────────────
  const rNum = Number(rating);
  if (!Number.isInteger(rNum) || rNum < 1 || rNum > 5) {
    const err = new Error('La note doit être un entier entre 1 et 5');
    err.code = 'RATING_INVALID';
    throw err;
  }

  if (!targetType || !targetId) {
    const err = new Error('targetType et targetId sont requis');
    err.code = 'MISSING_TARGET';
    throw err;
  }

// ── Account-age gate ────────────────────────────────────────────────────
  // Skipped for GATED_TARGET_TYPES (currently: WORKER_PROFILE) — those
  // reviews already require a real completed Booking/TaskApplication as
  // proof of a legitimate interaction (see completion gate below), which is
  // stronger evidence than account age. The age gate stays reserved for
  // future non-gated target types (hotels, pharmacie, santé...) that won't
  // have a transaction record to check against.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (!GATED_TARGET_TYPES.includes(targetType)) {
    const minAge = new Date(Date.now() - REVIEW_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000);
    if (user.createdAt > minAge) {
      const err = new Error(
        `Votre compte doit avoir au moins ${REVIEW_ACCOUNT_AGE_DAYS} jours pour laisser un avis`
      );
      err.code = 'ACCOUNT_TOO_NEW';
      throw err;
    }
  }

  // ── Completion gate (mandatory for every currently-existing targetType) ──
  let bookingRef = null;
  let taskApplicationRef = null;

  if (GATED_TARGET_TYPES.includes(targetType)) {
    if (!bookingId && !taskApplicationId) {
      const err = new Error(
        "Un avis pour ce type de cible doit être lié à une réservation ou une candidature terminée"
      );
      err.code = 'MISSING_REFERENCE';
      throw err;
    }
    if (bookingId && taskApplicationId) {
      const err = new Error('Fournissez soit bookingId, soit taskApplicationId, pas les deux');
      err.code = 'AMBIGUOUS_REFERENCE';
      throw err;
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        const err = new Error('Réservation introuvable');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (booking.clientId !== userId) {
        const err = new Error("Cette réservation ne vous appartient pas");
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (booking.workerProfileId !== targetId) {
        const err = new Error("Cette réservation ne correspond pas au profil ciblé");
        err.code = 'TARGET_MISMATCH';
        throw err;
      }
      if (booking.status !== 'COMPLETED') {
        const err = new Error('Seule une réservation terminée peut être notée');
        err.code = 'NOT_COMPLETED';
        throw err;
      }
      bookingRef = booking;
    }

    if (taskApplicationId) {
      const application = await prisma.taskApplication.findUnique({
        where: { id: taskApplicationId },
        include: { taskRequest: true },
      });
      if (!application) {
        const err = new Error('Candidature introuvable');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (application.taskRequest.userId !== userId) {
        const err = new Error("Cette candidature ne concerne pas une de vos demandes");
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (application.workerProfileId !== targetId) {
        const err = new Error("Cette candidature ne correspond pas au profil ciblé");
        err.code = 'TARGET_MISMATCH';
        throw err;
      }
      if (application.status !== 'ACCEPTED' || application.taskRequest.status !== 'COMPLETED') {
        const err = new Error('Seule une tâche terminée avec candidature acceptée peut être notée');
        err.code = 'NOT_COMPLETED';
        throw err;
      }
      taskApplicationRef = application;
    }
  }

  // ── Create ──────────────────────────────────────────────────────────────
  let review;
  try {
    review = await prisma.review.create({
      data: {
        targetType,
        targetId,
        userId,
        rating: rNum,
        comment: comment?.trim() || null,
        bookingId: bookingRef ? bookingRef.id : null,
        taskApplicationId: taskApplicationRef ? taskApplicationRef.id : null,
        isVerified: Boolean(bookingRef || taskApplicationRef),
      },
    });
  } catch (err) {
    // @@unique([userId, targetId, targetType]) OR bookingId/taskApplicationId @unique
    if (err.code === 'P2002') {
      const dupErr = new Error('Vous avez déjà laissé un avis pour cet élément');
      dupErr.code = 'ALREADY_REVIEWED';
      throw dupErr;
    }
    throw err;
  }

  if (targetType === 'WORKER_PROFILE') {
    await recalcWorkerProfileRating(targetId);
  }

  return review;
}

// ────────────────────────────────────────────────────────────────────────────
// READ — public
// ────────────────────────────────────────────────────────────────────────────

async function getReviewsForTarget(targetType, targetId, { page = 1, limit = 10 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total, agg] = await Promise.all([
    prisma.review.findMany({
      where: { targetType, targetId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.review.count({ where: { targetType, targetId } }),
    prisma.review.aggregate({
      where: { targetType, targetId },
      _avg: { rating: true },
    }),
  ]);

  return {
    items,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    ratingAvg: agg._avg.rating ?? 0,
    ratingCount: total,
  };
}

module.exports = {
  REVIEW_ACCOUNT_AGE_DAYS,
  createReview,
  getReviewsForTarget,
  recalcWorkerProfileRating,
};
```

## `backend/controllers/reportController.js`

```javascript
const prisma = require('../config/db')

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Renvoie l'IP réelle même derrière un proxy */
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Ouvert à tous : visiteur anonyme (email requis) ou utilisateur connecté
// ─────────────────────────────────────────────────────────────────────────────
const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description, reporterEmail } = req.body
    const userId    = req.user?.userId ?? null
    const userRole  = req.user?.role  ?? null
    const ipAddress = getIp(req)

    // ── Validation minimale ──────────────────────────────────────────────────
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: 'Champs requis : targetType, targetId, reason' })
    }

const validTargets = ['REAL_ESTATE', 'JOB', 'USER', 'CAR', 'WORKER_PROFILE', 'TASK_REQUEST', 'REVIEW']
    const validReasons = ['FAKE', 'FRAUD', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER']
    if (!validTargets.includes(targetType)) {
      return res.status(400).json({ success: false, message: 'targetType invalide' })
    }
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'reason invalide' })
    }

    // ── Visiteur anonyme : email requis ─────────────────────────────────────
    if (!userId && !reporterEmail) {
      return res.status(400).json({ success: false, message: 'Votre email est requis pour signaler en tant que visiteur' })
    }

    // ── Anti double-signalement ──────────────────────────────────────────────
    if (userId) {
      const already = await prisma.report.findUnique({
        where: { userId_targetId_targetType: { userId, targetId, targetType } },
      })
      if (already) {
        return res.status(409).json({ success: false, message: 'Vous avez déjà signalé cet élément' })
      }
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    if (!userId) {
      // Visiteur anonyme : max 3 signalements par IP par 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const ipCount = await prisma.report.count({
        where: { ipAddress, userId: null, createdAt: { gte: since } },
      })
      if (ipCount >= 3) {
        return res.status(429).json({ success: false, message: 'Limite atteinte : 3 signalements par 24h pour les visiteurs' })
      }
    } else if (userRole === 'citizen') {
      // Citoyen connecté : max 10 signalements par semaine
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const userCount = await prisma.report.count({
        where: { userId, createdAt: { gte: since } },
      })
      if (userCount >= 10) {
        return res.status(429).json({ success: false, message: 'Limite atteinte : 10 signalements par semaine' })
      }
    }
    // business : illimité — pas de vérification nécessaire

    // ── Créer le signalement ─────────────────────────────────────────────────
    const report = await prisma.report.create({
      data: {
        targetType,
        targetId,
        reason,
        description: description?.trim() || null,
        reporterEmail: !userId ? reporterEmail?.trim() : null,
        userId:        userId || null,
        ipAddress,
        status: 'PENDING',
      },
    })

    // ── Règle des 5 signalements → re-passer la cible en PENDING ─────────────
    const reportCount = await prisma.report.count({
      where: { targetId, targetType, status: { in: ['PENDING', 'REVIEWED'] } },
    })

    if (reportCount >= 5) {
      if (targetType === 'JOB') {
        await prisma.jobListing.updateMany({
          where: { id: targetId },
          data: { status: 'PENDING' },
        })
      } else if (targetType === 'REAL_ESTATE') {
        await prisma.realEstateListing.updateMany({
          where: { id: targetId },
          data: { status: 'PENDING' },
        })
      }
    }

    res.status(201).json({
      success: true,
      message: 'Signalement enregistré. Notre équipe le traitera dans les plus brefs délais.',
      data: { id: report.id },
    })
  } catch (error) {
    // Violation de contrainte unique (double signalement race condition)
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Vous avez déjà signalé cet élément' })
    }
    console.error('createReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports
// Admin only — filtres : ?status=&type=&page=&limit=&search=
// ─────────────────────────────────────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20, search = '' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      ...(status && { status }),
      ...(type   && { targetType: type }),
      ...(search && {
        OR: [
          { targetId:      { contains: search, mode: 'insensitive' } },
          { reporterEmail: { contains: search, mode: 'insensitive' } },
          { description:   { contains: search, mode: 'insensitive' } },
          { user: { name:  { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
        },
      }),
      prisma.report.count({ where }),
    ])

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    })
  } catch (error) {
    console.error('getReports error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:id
// Admin only — body: { status, adminNotes }
// status: PENDING | REVIEWED | RESOLVED | REJECTED
// ─────────────────────────────────────────────────────────────────────────────
const updateReport = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNotes } = req.body
    const adminId = req.user?.userId

    const validStatuses = ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' })
    }

    const existing = await prisma.report.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Signalement introuvable' })
    }

    const isClosing = ['RESOLVED', 'REJECTED'].includes(status)

    const updated = await prisma.report.update({
      where: { id },
      data: {
        ...(status     && { status }),
        ...(adminNotes !== undefined && { adminNotes: adminNotes?.trim() || null }),
        ...(isClosing  && { resolvedAt: new Date(), resolvedBy: adminId }),
        // Ré-ouvrir si on repasse en PENDING ou REVIEWED
        ...(!isClosing && existing.resolvedAt && { resolvedAt: null, resolvedBy: null }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('updateReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports/stats
// Admin only — compteurs pour le dashboard
// ─────────────────────────────────────────────────────────────────────────────
const getReportStats = async (req, res) => {
  try {
    const [total, pending, reviewed, resolved, rejected, byType, byReason] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'REVIEWED' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'REJECTED' } }),
      prisma.report.groupBy({ by: ['targetType'], _count: { id: true } }),
      prisma.report.groupBy({ by: ['reason'],     _count: { id: true } }),
    ])

    res.json({
      success: true,
      data: {
        total,
        byStatus: { pending, reviewed, resolved, rejected },
        byType:   Object.fromEntries(byType.map((r)   => [r.targetType, r._count.id])),
        byReason: Object.fromEntries(byReason.map((r) => [r.reason,     r._count.id])),
      },
    })
  } catch (error) {
    console.error('getReportStats error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

const { sendReportContactEmail } = require('../services/mailService')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/reports/:id
// Détail complet : le report + tous les reporters sur la même cible
// ─────────────────────────────────────────────────────────────────────────────
const getReportById = async (req, res) => {
  try {
    const { id } = req.params

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true, role: { select: { name: true } } } },
      },
    })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    const allReporters = await prisma.report.findMany({
      where: { targetId: report.targetId, targetType: report.targetType },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
      },
    })

    let listingInfo = null
    let owner       = null

    if (report.targetType === 'JOB') {
      const job = await prisma.jobListing.findUnique({
        where: { id: report.targetId },
        select: { id: true, title: true, status: true, createdAt: true, userId: true,
                  salaryMin: true, salaryMax: true, contractType: true,
                  user: { select: { id: true, name: true, email: true, isActive: true } } },
      })
      if (job) {
        listingInfo = { id: job.id, title: job.title, status: job.status, createdAt: job.createdAt,
                        salaryMin: job.salaryMin, salaryMax: job.salaryMax, type: job.contractType, module: 'JOB' }
        owner = job.user
      }
    } else if (report.targetType === 'REAL_ESTATE') {
      const re = await prisma.realEstateListing.findUnique({
        where: { id: report.targetId },
        select: { id: true, title: true, status: true, createdAt: true, price: true,
                  user: { select: { id: true, name: true, email: true, isActive: true } } },
      })
      if (re) {
        listingInfo = { id: re.id, title: re.title, status: re.status, createdAt: re.createdAt,
                        price: re.price, module: 'REAL_ESTATE' }
        owner = re.user
      }
    } else if (report.targetType === 'WORKER_PROFILE') {
      const wp = await prisma.workerProfile.findUnique({
        where: { id: report.targetId },
        select: { id: true, headline: true, status: true, createdAt: true, rate: true,
                  user: { select: { id: true, name: true, email: true, isActive: true } } },
      })
      if (wp) {
        listingInfo = { id: wp.id, title: wp.headline, status: wp.status, createdAt: wp.createdAt,
                        price: wp.rate, module: 'WORKER_PROFILE' }
        owner = wp.user
      }
    } else if (report.targetType === 'TASK_REQUEST') {
      const tr = await prisma.taskRequest.findUnique({
        where: { id: report.targetId },
        select: { id: true, title: true, status: true, createdAt: true, budget: true,
                  user: { select: { id: true, name: true, email: true, isActive: true } } },
      })
      if (tr) {
        listingInfo = { id: tr.id, title: tr.title, status: tr.status, createdAt: tr.createdAt,
                        price: tr.budget, module: 'TASK_REQUEST' }
        owner = tr.user
      }
    }

    let ownerListingsCount = 0
    if (owner?.id) {
      const [jobs, res2, workerProfiles, taskRequests] = await Promise.all([
        prisma.jobListing.count({ where: { userId: owner.id } }),
        prisma.realEstateListing.count({ where: { userId: owner.id } }),
        prisma.workerProfile.count({ where: { userId: owner.id } }),
        prisma.taskRequest.count({ where: { userId: owner.id } }),
      ])
      ownerListingsCount = jobs + res2 + workerProfiles + taskRequests
    }

    res.json({
      success: true,
      data: { report, allReporters, listingInfo, owner, ownerListingsCount },
    })
  } catch (error) {
    console.error('getReportById error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/reports/:id/dismiss
// Innocenter : remet l'annonce en PUBLISHED, clôt le signalement en REJECTED
// ─────────────────────────────────────────────────────────────────────────────
const dismissReport = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user?.userId

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    if (report.targetType === 'JOB') {
      await prisma.jobListing.updateMany({ where: { id: report.targetId }, data: { status: 'APPROVED' } })
    } else if (report.targetType === 'REAL_ESTATE') {
      await prisma.realEstateListing.updateMany({ where: { id: report.targetId }, data: { status: 'APPROVED' } })
    } else if (report.targetType === 'WORKER_PROFILE') {
      await prisma.workerProfile.updateMany({ where: { id: report.targetId }, data: { status: 'APPROVED' } })
    } else if (report.targetType === 'TASK_REQUEST') {
      await prisma.taskRequest.updateMany({ where: { id: report.targetId }, data: { status: 'OPEN' } })
    }

    await prisma.report.updateMany({
      where: { targetId: report.targetId, targetType: report.targetType, status: { in: ['PENDING', 'REVIEWED'] } },
      data: { status: 'REJECTED', resolvedAt: new Date(), resolvedBy: adminId },
    })

    res.json({ success: true, message: 'Annonce innocentée et remise en ligne.' })
  } catch (error) {
    console.error('dismissReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/reports/:id/listing
// Retirer l'annonce : passe en REJECTED + signalement → RESOLVED
// ─────────────────────────────────────────────────────────────────────────────
const removeListingFromReport = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user?.userId

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    if (report.targetType === 'JOB') {
      await prisma.jobListing.updateMany({ where: { id: report.targetId }, data: { status: 'REJECTED' } })
    } else if (report.targetType === 'REAL_ESTATE') {
      await prisma.realEstateListing.updateMany({ where: { id: report.targetId }, data: { status: 'REJECTED' } })
    } else if (report.targetType === 'WORKER_PROFILE') {
      await prisma.workerProfile.updateMany({ where: { id: report.targetId }, data: { status: 'REJECTED' } })
    } else if (report.targetType === 'TASK_REQUEST') {
      await prisma.taskRequest.updateMany({ where: { id: report.targetId }, data: { status: 'ARCHIVED' } })
    }

    await prisma.report.updateMany({
      where: { targetId: report.targetId, targetType: report.targetType },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: adminId },
    })

    res.json({ success: true, message: 'Annonce retirée et signalement résolu.' })
  } catch (error) {
    console.error('removeListingFromReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:id/suspend
// Suspendre le compte propriétaire : isActive=false
// ─────────────────────────────────────────────────────────────────────────────
const suspendOwner = async (req, res) => {
  try {
    const { id } = req.params

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    let ownerId = null
    if (report.targetType === 'JOB') {
      const job = await prisma.jobListing.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = job?.userId
    } else if (report.targetType === 'REAL_ESTATE') {
      const re = await prisma.realEstateListing.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = re?.userId
    } else if (report.targetType === 'WORKER_PROFILE') {
      const wp = await prisma.workerProfile.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = wp?.userId
    } else if (report.targetType === 'TASK_REQUEST') {
      const tr = await prisma.taskRequest.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = tr?.userId
    } else if (report.targetType === 'USER') {
      ownerId = report.targetId
    }

    if (!ownerId) return res.status(404).json({ success: false, message: 'Propriétaire introuvable' })

    await prisma.user.update({ where: { id: ownerId }, data: { isActive: false } })

    res.json({ success: true, message: 'Compte suspendu avec succès.' })
  } catch (error) {
    console.error('suspendOwner error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/reports/:id/contact
// Envoyer un email au propriétaire de l'annonce
// body: { message }
// ─────────────────────────────────────────────────────────────────────────────
const contactOwner = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Le message est requis' })
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    let owner       = null
    let ownerId     = null
    let listingTitle = 'Votre annonce'

    if (report.targetType === 'JOB') {
      const job = await prisma.jobListing.findUnique({
        where:  { id: report.targetId },
        select: { userId: true, title: true, user: { select: { name: true, email: true } } },
      })
      if (job) { owner = job.user; ownerId = job.userId; listingTitle = job.title }
    } else if (report.targetType === 'REAL_ESTATE') {
      const re = await prisma.realEstateListing.findUnique({
        where:  { id: report.targetId },
        select: { userId: true, title: true, user: { select: { name: true, email: true } } },
      })
      if (re) { owner = re.user; ownerId = re.userId; listingTitle = re.title }
    } else if (report.targetType === 'WORKER_PROFILE') {
      const wp = await prisma.workerProfile.findUnique({
        where:  { id: report.targetId },
        select: { userId: true, headline: true, user: { select: { name: true, email: true } } },
      })
      if (wp) { owner = wp.user; ownerId = wp.userId; listingTitle = wp.headline }
    } else if (report.targetType === 'TASK_REQUEST') {
      const tr = await prisma.taskRequest.findUnique({
        where:  { id: report.targetId },
        select: { userId: true, title: true, user: { select: { name: true, email: true } } },
      })
      if (tr) { owner = tr.user; ownerId = tr.userId; listingTitle = tr.title }
    }

    if (!owner?.email) {
      return res.status(404).json({ success: false, message: 'Email du propriétaire introuvable' })
    }

    if (ownerId) {
      await prisma.businessMessage.create({
        data: {
          userId:       ownerId,
          type:         'REPORT_CONTACT',
          targetType:   report.targetType,
          targetId:     report.targetId,
          targetTitle:  listingTitle,
          adminMessage: message.trim(),
        },
      })

      const { createNotification } = require('./notificationController')
      const isCitizenOwned = ['WORKER_PROFILE', 'TASK_REQUEST'].includes(report.targetType)
      await createNotification(
        ownerId,
        'REPORT_CONTACT',
        'Un message de l\'équipe Madinatti 📬',
        `L'administration vous a contacté au sujet de "${listingTitle}".`,
        isCitizenOwned ? '/my-space/messages' : '/dashboard/messages'
      )
    }

    try {
      await sendReportContactEmail({
        to:           owner.email,
        ownerName:    owner.name || 'Utilisateur',
        listingTitle,
        adminMessage: message.trim(),
      })
    } catch (mailErr) {
      console.warn('Impossible d\'envoyer l\'email:', mailErr.message)
    }

    res.json({ success: true, message: `Message envoyé à ${owner.email}` })
  } catch (error) {
    console.error('contactOwner error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/reports/:id/review
// Supprime l'avis signalé (Review) et recalcule la note de la cible.
// Le report ciblant ce Review passe en RESOLVED.
// ─────────────────────────────────────────────────────────────────────────────
const deleteReviewFromReport = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user?.userId

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })
    if (report.targetType !== 'REVIEW') {
      return res.status(400).json({ success: false, message: "Ce signalement ne cible pas un avis" })
    }

    const review = await prisma.review.findUnique({ where: { id: report.targetId } })
    if (!review) {
      await prisma.report.updateMany({
        where: { targetId: report.targetId, targetType: 'REVIEW' },
        data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: adminId },
      })
      return res.json({ success: true, message: "Avis déjà supprimé, signalement résolu." })
    }

    await prisma.review.delete({ where: { id: review.id } })

    if (review.targetType === 'WORKER_PROFILE') {
      const remaining = await prisma.review.findMany({
        where: { targetType: 'WORKER_PROFILE', targetId: review.targetId },
        select: { rating: true },
      })
      const ratingCount = remaining.length
      const ratingAvg = ratingCount
        ? remaining.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0

      await prisma.workerProfile.update({
        where: { id: review.targetId },
        data: { ratingAvg, ratingCount },
      })
    }

    await prisma.report.updateMany({
      where: { targetId: report.targetId, targetType: 'REVIEW' },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: adminId },
    })

    res.json({ success: true, message: "Avis supprimé et signalement résolu." })
  } catch (error) {
    console.error('deleteReviewFromReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
module.exports = { createReport, getReports, getReportById, updateReport, getReportStats,
                   dismissReport, removeListingFromReport, suspendOwner, contactOwner,deleteReviewFromReport }


```

## `backend/routes/reports.js`

```javascript
const express    = require('express')
const router     = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { createReport } = require('../controllers/reportController')
const { reportLimiter } = require('../middlewares/rateLimiter')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Ouvert à tous : visiteur anonyme ou utilisateur connecté
// authMiddleware est "soft" ici : on tente de décoder le token s'il est présent
// mais on ne bloque pas si absent
// ─────────────────────────────────────────────────────────────────────────────
const softAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  const jwt = require('jsonwebtoken')
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}

router.post('/', reportLimiter, softAuth, createReport)

module.exports = router
```

## `backend/server.js`

```javascript
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express() 
app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth')
const realEstateRoutes = require('./routes/realEstate');
const carsRouter = require('./routes/cars');
const tourismRoutes = require('./routes/tourism');

const googleAuthRoutes = require("./routes/googleAuth")


app.use('/api/auth', authRoutes)
app.use("/api/auth", googleAuthRoutes)

app.use('/api/real-estate', realEstateRoutes);
app.use('/api/cars', carsRouter);
app.use('/api/tourism', tourismRoutes);


//to uploas imgs on cloudnary
app.use('/api/upload', require('./routes/upload'));
//to get all catigories
app.use('/api/categories', require('./routes/categories'));


app.get('/', (req, res) => {
  res.json({ message: 'Madinatti API is running' })
})

const jobRoutes = require('./routes/jobs');
app.use('/api/jobs', jobRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/alerts', require('./routes/alerts'));

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.use('/api/worker-profiles', require('./routes/workerProfiles'));
 
app.use('/api/task-requests', require('./routes/taskRequests'));
app.use('/api/task-applications', require('./routes/taskApplications'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/business/stats', require('./routes/stats'));

app.use('/api/uploads', require('./routes/uploadRoutes'));
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

## `backend/middlewares/roleMiddleware.js`

```javascript
const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    next()
  }
}

module.exports = roleMiddleware
```

## `frontend/app/dashboard/listings/cars/page.jsx`

```jsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { carsService } from "@/services/carsService";
import CarListingDrawer from "@/components/cars/CarListingDrawer";
import { useToast } from "@/context/ToastContext";

const INQUIRY_STATUS_STYLES = {
  pending: { label: "Nouveau",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  read:    { label: "Lu",       cls: "bg-gray-50 text-gray-600 border-gray-200" },
  replied: { label: "Répondu",  cls: "bg-green-50 text-green-700 border-green-200" },
  closed:  { label: "Fermé",    cls: "bg-gray-100 text-gray-400 border-gray-200" },
};

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate  = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "";

function StatusBadge({ status, map }) {
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ listings }) {
  const active       = listings.filter((l) => l.status === "APPROVED").length;
  const pending      = listings.filter((l) => l.status === "PENDING").length;
  const totalInq     = listings.reduce((sum, l) => sum + (l._count?.inquiries ?? 0), 0);
  const newInq       = listings.reduce((sum, l) => sum + (l._count?.newInquiries ?? 0), 0);

  const stats = [
    {
      label: "Véhicules actifs",
      value: active,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0 M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
        </svg>
      ),
      color: "text-green-700 bg-green-50 border-green-100",
    },
    {
      label: "En attente",
      value: pending,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: "text-yellow-700 bg-yellow-50 border-yellow-100",
    },
    {
      label: "Demandes",
      value: totalInq,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: "text-blue-700 bg-blue-50 border-blue-100",
      badge: newInq > 0 ? `${newInq} nouvelles` : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${s.color}`}
        >
          <span className="opacity-60 shrink-0">{s.icon}</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-extrabold leading-none">{s.value}</p>
              {s.badge && (
                <span className="text-[9px] font-bold bg-white/70 border border-current/20 px-1.5 py-0.5 rounded-full opacity-80 leading-none">
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium opacity-70 mt-0.5 truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inquiries drawer ─────────────────────────────────────────────────────────
function InquiriesDrawer({ listingId, onClose, token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await carsService.getMyListingInquiries(listingId, {}, token);
        setInquiries(res.inquiries || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId]);

  const updateStatus = async (inquiryId, status) => {
    setUpdating(inquiryId);
    try {
      await carsService.updateInquiryStatus(inquiryId, status, token);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Messages reçus</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chargement...</div>
        ) : inquiries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 text-gray-400">
            <span className="text-4xl">💬</span>
            <p className="font-semibold text-gray-600">Aucun message pour l'instant</p>
            <p className="text-xs">Les messages des visiteurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {inquiries.map((inq) => (
              <div key={inq.id} className={`p-5 transition ${inq.status === "pending" ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{inq.user?.name || "Anonyme"}</p>
                    <p className="text-xs text-gray-400">{fmtDate(inq.createdAt)}</p>
                  </div>
                  <StatusBadge status={inq.status} map={INQUIRY_STATUS_STYLES} />
                </div>
                <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100 mb-3 leading-relaxed">
                  {inq.message}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                  {inq.contactPhone && (
                    <a href={`tel:${inq.contactPhone}`} className="flex items-center gap-1 hover:text-green-700 transition">
                      📞 {inq.contactPhone}
                    </a>
                  )}
                  {inq.contactEmail && (
                    <a href={`mailto:${inq.contactEmail}`} className="flex items-center gap-1 hover:text-green-700 transition">
                      ✉️ {inq.contactEmail}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["read", "replied", "closed"]
                    .filter((s) => s !== inq.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(inq.id, s)}
                        disabled={updating === inq.id}
                        className="text-[11px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 font-semibold"
                      >
                        {updating === inq.id ? "..." : INQUIRY_STATUS_STYLES[s]?.label}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, onDelete, onViewInquiries, onViewDetails }) {
  const cover        = listing.images?.find((i) => i.isCover) || listing.images?.[0];
  const inquiryCount = listing._count?.inquiries || 0;

  const statusStyles = {
    APPROVED: { label: "Approuvée",  className: "bg-green-50 text-green-700 border border-green-200" },
    PENDING:  { label: "En attente", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    REJECTED: { label: "Rejetée",    className: "bg-red-50 text-red-700 border border-red-200" },
  };
  const statusStyle = statusStyles[listing.status] ?? statusStyles.PENDING;

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all ${
        listing.status === "REJECTED" && listing.adminNotes ? "sm:min-h-32" : "sm:h-32"
      }`}
      onClick={() => onViewDetails(listing)}
    >
      {/* Thumbnail */}
      <div className="relative h-32 sm:h-auto sm:w-44 sm:self-stretch shrink-0 bg-gray-50">
        {cover?.url ? (
          <img src={cover.url} alt="" className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            🚗
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.className}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row: title + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{listing.make} {listing.model} ({listing.year})</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>📍</span>
              {listing.city || "—"}
              <span className="opacity-30">·</span>
              {listing.category?.name || "—"}
            </p>
          </div>
          <p className="text-base font-semibold text-gray-900 leading-none shrink-0">
            {fmtPrice(listing.price)}{" "}
            <span className="text-xs font-normal text-gray-400">MAD</span>
          </p>
        </div>

        {/* Admin rejection note */}
        {listing.status === "REJECTED" && listing.adminNotes && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <span className="mt-px shrink-0">⛔</span>
            <span className="line-clamp-2">{listing.adminNotes}</span>
          </div>
        )}

        {/* Bottom row: stats + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {listing.viewsCount || 0}
            </span>

            {/* Messages button */}
            <button
              onClick={(e) => { e.stopPropagation(); onViewInquiries(listing.id); }}
              title="Voir les messages"
              className={`relative flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                inquiryCount > 0
                  ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {inquiryCount} message{inquiryCount !== 1 ? "s" : ""}
              {inquiryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {inquiryCount}
                </span>
              )}
            </button>

            <span className="text-xs text-gray-300">{fmtDate(listing.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {listing.status === "APPROVED" && (
              <Link
                href={`/cars/${listing.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <span className="hidden sm:inline">Voir</span>
              </Link>
            )}
            <Link
              href={`/dashboard/listings/cars/edit/${listing.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="hidden sm:inline">Modifier</span>
            </Link>
            <button
              onClick={() => onDelete(listing.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline filter component ──────────────────────────────────────────────────
function ListingFilters({ onChange, showStatus = true, listings = [] }) {
  const [filters, setFilters] = useState({ status: '', listingType: '', city: '', search: '' });

  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))].sort();
  const listingTypes = [...new Set(listings.map(l => l.listingType).filter(Boolean))];

  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const empty = { status: '', listingType: '', city: '', search: '' };
    setFilters(empty);
    onChange(empty);
  };

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Rechercher par modèle ou titre..."
          className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {showStatus && (
          <select
            value={filters.status}
            onChange={e => set('status', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        )}

        {listingTypes.length > 1 && (
          <select
            value={filters.listingType}
            onChange={e => set('listingType', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Vente & Location</option>
            {listingTypes.map(t => (
              <option key={t} value={t}>{t === 'SALE' ? 'Vente' : 'Location'}</option>
            ))}
          </select>
        )}

        {cities.length > 1 && (
          <select
            value={filters.city}
            onChange={e => set('city', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Toutes les villes</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {hasActive && (
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-red-500 transition font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarsDashboard() {
  return (
    <ProtectedRoute roles={["business"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings]       = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({});
  const [page, setPage]               = useState(1);
  const [activeInquiryListingId, setActiveInquiryListingId] = useState(null);
  const [selectedListing, setSelectedListing]               = useState(null);
  const toastShown = useRef(false);

  useEffect(() => {
    if (searchParams.get("created") === "1" && !toastShown.current) {
      toastShown.current = true;
      toast.success(
        "Annonce de véhicule soumise avec succès ! Elle sera visible après validation par l'administrateur.",
        { title: "Annonce envoyée ✦", duration: 6000 }
      );
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const loadAll = async () => {
    try {
      const res = await carsService.getMyListings({ page: 1, limit: 100 }, token);
      setAllListings(res.listings || []);
    } catch (e) {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await carsService.getMyListings(
        {
          page,
          limit: 10,
          ...(filters.status      && { status: filters.status }),
          ...(filters.city        && { city: filters.city }),
          ...(filters.listingType && { listingType: filters.listingType }),
          ...(filters.search      && { search: filters.search }),
        },
        token,
      );
      setListings(res.listings || []);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette annonce de véhicule ?")) return;
    try {
      await carsService.deleteMyListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.filter((l) => l.id !== id));
      if (selectedListing?.id === id) setSelectedListing(null);
      toast.success("Annonce supprimée avec succès");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Erreur lors de la suppression");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Stats bar */}
        {allListings.length > 0 && <StatsBar listings={allListings} />}

        {/* Filters + Publish button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ListingFilters onChange={handleFiltersChange} showStatus={true} listings={allListings} />
          </div>
          <Link
            href="/dashboard/listings/cars/create"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#2D5016] hover:bg-[#A7D129] text-white hover:text-[#2D5016] rounded-xl text-sm font-bold transition whitespace-nowrap"
          >
            <span className="hidden sm:inline">Publier un véhicule</span>
            <span className="sm:hidden">Publier</span>
          </Link>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">🚗</span>
            <p className="font-bold text-gray-700">Aucun véhicule</p>
            <p className="text-sm text-gray-400">Publiez votre première annonce de véhicule.</p>
            <Link
              href="/dashboard/listings/cars/create"
              className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
            >
              Publier un véhicule
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onDelete={handleDelete}
                onViewInquiries={(id) => setActiveInquiryListingId(id)}
                onViewDetails={(listing) => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                  page === i + 1
                    ? "bg-[#2D5016] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#2D5016]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listing detail drawer */}
      {selectedListing && (
        <CarListingDrawer
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onEdit={(id) => (window.location.href = `/dashboard/listings/cars/edit/${id}`)}
          onDelete={(id) => { handleDelete(id); setSelectedListing(null); }}
          isAdmin={false}
        />
      )}

      {/* Inquiries drawer */}
      {activeInquiryListingId && (
        <InquiriesDrawer
          listingId={activeInquiryListingId}
          token={token}
          onClose={() => setActiveInquiryListingId(null)}
        />
      )}
    </div>
  );
}

```

## `frontend/app/dashboard/listings/cars/create/page.jsx`

```jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { carsService } from "@/services/carsService";
import PricingModal from "@/components/shared/PricingModal";
import axios from "axios";
import moroccoCities from "morocco-cities";
import { useToast } from "@/context/ToastContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const LISTING_TYPES = [
  { label: "Vente", value: "SALE" },
  { label: "Location", value: "RENT" },
];

const CONDITIONS = [
  { label: "Occasion", value: "USED" },
  { label: "Neuf", value: "NEW" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { label: "Diesel", value: "DIESEL" },
  { label: "Essence", value: "PETROL" },
  { label: "Hybride", value: "HYBRID" },
  { label: "Électrique", value: "ELECTRIC" },
  { label: "GPL", value: "LPG" },
  { label: "Autre", value: "OTHER" },
];

const TRANSMISSIONS = [
  { label: "Manuelle", value: "MANUAL" },
  { label: "Automatique", value: "AUTOMATIC" },
  { label: "Semi-automatique", value: "SEMI_AUTOMATIC" },
];

const BODY_TYPES = [
  { label: "Berline", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "Citadine", value: "HATCHBACK" },
  { label: "Coupé", value: "COUPE" },
  { label: "Cabriolet", value: "CONVERTIBLE" },
  { label: "Break", value: "WAGON" },
  { label: "Utilitaire / Van", value: "VAN" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Monospace", value: "MINIVAN" },
  { label: "Autre", value: "OTHER" },
];

const ALL_CITIES = moroccoCities.cities;

const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region_name))]
  .filter(Boolean)
  .sort();

function citiesByRegion(region) {
  return ALL_CITIES
    .filter((c) => c.region_name === region)
    .map((c) => c.name)
    .sort();
}

const EMPTY = {
  title: "",
  description: "",
  categoryId: "",
  listingType: "SALE",
  condition: "USED",
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuelType: "DIESEL",
  transmission: "MANUAL",
  bodyType: "SEDAN",
  color: "",
  doors: "",
  seats: "",
  engineSize: "",
  horsePower: "",
  price: "",
  isNegotiable: false,
  region: "",
  city: "",
  location: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  images: [],
  features: {},
};

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
        error
          ? "border-red-300 focus:ring-red-200 bg-red-50"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white ${
        error
          ? "border-red-300 focus:ring-red-200"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    >
      {children}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-[#2D5016] inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}

function MapPicker({ latitude, longitude, onChange, flyTo }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (leafletMap.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      if (mapRef.current._leaflet_id) return;

      const L = window.L;
      const defaultLat = latitude ? parseFloat(latitude) : 31.7917;
      const defaultLng = longitude ? parseFloat(longitude) : -7.0926;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        latitude ? 13 : 6,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (latitude && longitude) {
        markerRef.current = L.marker(
          [parseFloat(latitude), parseFloat(longitude)],
          { icon },
        ).addTo(map);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onChange(lat.toFixed(6), lng.toFixed(6));
      });

      leafletMap.current = map;
      setReady(true);
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!flyTo || !leafletMap.current || !window.L) return;
    const { lat, lng, zoom = 12 } = flyTo;

    const L = window.L;
    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    leafletMap.current.flyTo([lat, lng], zoom, { duration: 1.2 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
    }
  }, [flyTo]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden"
        style={{ position: "relative", zIndex: 0 }}
      />
      {!ready && (
        <p className="text-xs text-gray-400">Chargement de la carte...</p>
      )}
      {latitude && longitude ? (
        <p className="text-xs text-green-600 font-semibold">
          📍 Position sélectionnée : {parseFloat(latitude).toFixed(5)},{" "}
          {parseFloat(longitude).toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          Cliquez sur la carte pour épingler la position exacte (optionnel).
        </p>
      )}
    </div>
  );
}

function ImageUploader({ images, onChange, token, error }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      const res = await axios.post(`${API}/api/upload/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const newImages = res.data.files.map((f, i) => ({
        url: f.url,
        isCover: images.length === 0 && i === 0,
      }));

      onChange([...images, ...newImages]);
    } catch (err) {
      setUploadError("Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i) => {
    const next = images.filter((_, idx) => idx !== i);
    if (next.length > 0 && !next.some((img) => img.isCover)) next[0].isCover = true;
    onChange(next);
  };

  const setCover = (i) => {
    onChange(images.map((img, idx) => ({ ...img, isCover: idx === i })));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          uploading
            ? "border-primary bg-primary/5 cursor-wait"
            : error
              ? "border-red-300 bg-red-50 hover:border-red-400"
              : "border-gray-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-semibold">Cliquez pour choisir des photos</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo par photo — jusqu'à 10 photos</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {uploadError && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{uploadError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={`relative group rounded-xl overflow-hidden border-2 w-24 h-24 ${
                img.isCover ? "border-[#2D5016]" : "border-gray-200"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                {!img.isCover && (
                  <button type="button" onClick={() => setCover(i)}
                    className="text-[10px] bg-white text-gray-800 px-2 py-0.5 rounded-full font-bold">
                    Couverture
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Supprimer
                </button>
              </div>
              {img.isCover && (
                <span className="absolute top-1 left-1 text-[9px] bg-[#2D5016] text-white px-1.5 py-0.5 rounded-full font-bold">
                  Couv.
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturesManager({ features, onChange }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  const add = () => {
    if (!key.trim()) return;
    onChange({ ...features, [key.trim()]: val.trim() || true });
    setKey(""); setVal("");
  };

  const remove = (k) => {
    const next = { ...features };
    delete next[k];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Option (ex: Climatisation)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <input value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Valeur (optionnel)"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
          +
        </button>
      </div>
      {Object.keys(features).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(features).map(([k, v]) => (
            <span key={k}
              className="flex items-center gap-1 px-3 py-1 bg-[#E8F5D0] border border-[#A7D129] rounded-full text-xs font-semibold text-[#2D5016]">
              {k}{v !== true ? `: ${v}` : ""}
              <button type="button" onClick={() => remove(k)}
                className="ml-1 text-red-500 hover:text-red-700 font-bold font-mono">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateCarPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <CreateCarForm />
    </ProtectedRoute>
  );
}

function CreateCarForm() {
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  // ── CHANGED: no longer shown on mount; shown only after validation passes ──
  const [showPricingModal, setShowPricingModal] = useState(false);

  const sectionRefs = {
    title: useRef(null),
    description: useRef(null),
    categoryId: useRef(null),
    make: useRef(null),
    model: useRef(null),
    year: useRef(null),
    price: useRef(null),
    region: useRef(null),
    city: useRef(null),
    location: useRef(null),
    images: useRef(null),
  };

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const ERROR_ORDER = [
    "title",
    "description",
    "categoryId",
    "make",
    "model",
    "year",
    "price",
    "region",
    "city",
    "location",
    "images",
  ];

  const availableCities = form.region ? citiesByRegion(form.region) : [];

  // Load car categories
  useEffect(() => {
    carsService.getCategories().then((r) => {
      setCategories(r.data || []);
    });
  }, []);

  const geocodeAddress = useCallback(async (city, address) => {
    if (!city) return;
    setGeocoding(true);
    try {
      const q = encodeURIComponent(
        `${address ? address + ", " : ""}${city}, Maroc`
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
        setFlyTo({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          zoom: address ? 15 : 12,
        });
      }
    } catch {
      // ignore
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleRegionChange = (region) => {
    setForm((p) => ({ ...p, region, city: "", latitude: "", longitude: "" }));
    setFlyTo(null);
    if (errors.region) setErrors((p) => ({ ...p, region: null }));
  };

  const handleCityChange = useCallback(async (cityName) => {
    set("city", cityName);
    if (!cityName) return;
    await geocodeAddress(cityName, form.location || "");
  }, [form.location, geocodeAddress]);

  useEffect(() => {
    if (!form.city || !form.location.trim()) return;
    const t = setTimeout(() => {
      geocodeAddress(form.city, form.location);
    }, 500);
    return () => clearTimeout(t);
  }, [form.location, form.city, geocodeAddress]);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Min 5 caractères";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Min 10 caractères";
    if (!form.categoryId) e.categoryId = "Catégorie requise";
    if (!form.make.trim()) e.make = "Marque requise";
    if (!form.model.trim()) e.model = "Modèle requis";
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 1) e.year = "Année invalide";
    if (!form.price || Number(form.price) <= 0) e.price = "Prix invalide";
    if (!form.region) e.region = "Veuillez sélectionner une région";
    if (!form.city) e.city = "Veuillez sélectionner une ville";
    if (!form.location.trim()) e.location = "Requis";
    if (form.images.length === 0) e.images = "Ajoutez au moins une photo";
    return e;
  };

  // ── CHANGED: "Publier" now validates first, then opens the pricing modal ──
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      if (firstKey && sectionRefs[firstKey]?.current) {
        sectionRefs[firstKey].current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    // Validation passed → show plan picker
    setShowPricingModal(true);
  };

  // ── called when user picks a plan in the modal → save listing then redirect ──
  const handlePlanSelect = async (planId) => {
    setShowPricingModal(false);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        plan: planId,
        price: parseFloat(form.price),
        year: parseInt(form.year),
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
        doors: form.doors ? parseInt(form.doors) : undefined,
        seats: form.seats ? parseInt(form.seats) : undefined,
        engineSize: form.engineSize ? parseFloat(form.engineSize) : undefined,
        horsePower: form.horsePower ? parseInt(form.horsePower) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      await carsService.createListing(payload, token);
      router.push("/dashboard/listings/cars?created=1");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── CHANGED: modal only shown after clicking Publier + passing validation ── */}
      {showPricingModal && (
        <PricingModal
          module="vehicules"
          onSelect={handlePlanSelect}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className="font-extrabold text-gray-900 text-lg">Publier un véhicule</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              En attente de validation admin
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* ── GENERAL INFO ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations de l'annonce</SectionTitle>

          <div ref={sectionRefs.title}>
            <Field label="Titre de l'annonce *" error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex: Peugeot 208 Signature Diesel 1.6 BlueHDi"
                error={errors.title}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Type d'annonce *">
              <Select value={form.listingType} onChange={(e) => set("listingType", e.target.value)}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <div ref={sectionRefs.categoryId} className="col-span-2">
              <Field label="Catégorie de véhicule *" error={errors.categoryId}>
                <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
                  <option value="">Sélectionner</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.description}>
            <Field label="Description *" error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Décrivez l'état mécanique, carrosserie, entretien, options..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-[#2D5016]"
                }`}
              />
            </Field>
          </div>
        </div>

        {/* ── CAR SPECS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Fiche technique du véhicule</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.make}>
              <Field label="Marque *" error={errors.make}>
                <Input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Ex: Peugeot" error={errors.make} />
              </Field>
            </div>
            <div ref={sectionRefs.model}>
              <Field label="Modèle *" error={errors.model}>
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Ex: 208" error={errors.model} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div ref={sectionRefs.year}>
              <Field label="Année *" error={errors.year}>
                <Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="Ex: 2019" error={errors.year} />
              </Field>
            </div>
            <Field label="Kilométrage (km)">
              <Input type="number" min="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="Ex: 85000" />
            </Field>
            <Field label="État du véhicule *">
              <Select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Carburant *">
              <Select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                {FUEL_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Transmission *">
              <Select value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                {TRANSMISSIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Carrosserie *">
              <Select value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)}>
                {BODY_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Field label="Couleur">
              <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ex: Gris" />
            </Field>
            <Field label="Portes">
              <Select value={form.doors} onChange={(e) => set("doors", e.target.value)}>
                <option value="">Requis</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="2">2 (Coupé)</option>
              </Select>
            </Field>
            <Field label="Places">
              <Select value={form.seats} onChange={(e) => set("seats", e.target.value)}>
                <option value="">Requis</option>
                <option value="5">5</option>
                <option value="7">7</option>
                <option value="2">2</option>
                <option value="9">9</option>
              </Select>
            </Field>
            <Field label="Puissance (ch)">
              <Input type="number" value={form.horsePower} onChange={(e) => set("horsePower", e.target.value)} placeholder="Ex: 100" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cylindrée (L)">
              <Input type="number" step="0.1" value={form.engineSize} onChange={(e) => set("engineSize", e.target.value)} placeholder="Ex: 1.6" />
            </Field>
            <div ref={sectionRefs.price}>
              <Field label="Prix (MAD) *" error={errors.price}>
                <div className="flex gap-2">
                  <Input type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} error={errors.price} placeholder="Ex: 110000" />
                  <label className="flex items-center gap-1 shrink-0 text-xs text-gray-500 font-semibold cursor-pointer">
                    <input type="checkbox" checked={form.isNegotiable} onChange={(e) => set("isNegotiable", e.target.checked)} className="rounded text-[#2D5016]" />
                    Négociable
                  </label>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* ── LOCALISATION ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.region}>
              <Field label="Région *" error={errors.region}>
                <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} error={errors.region}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div ref={sectionRefs.city}>
              <Field label="Ville *" error={errors.city}>
                <div className="relative">
                  <Select value={form.city} onChange={(e) => handleCityChange(e.target.value)} error={errors.city} disabled={!form.region}>
                    <option value="">{form.region ? "Sélectionner une ville" : "Choisir région d'abord"}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  {geocoding && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.location}>
            <Field label="Adresse / Lieu précis *" error={errors.location}>
              <div className="relative">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex: Maarif, face au Twin Center" error={errors.location} />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="Position sur la carte">
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              flyTo={flyTo}
              onChange={(lat, lng) => {
                const lat_n = parseFloat(lat);
                const lng_n = parseFloat(lng);
                if (lat_n < 27.6 || lat_n > 35.9 || lng_n < -13.2 || lng_n > -1.0) {
                  setErrors((p) => ({ ...p, map: "Position hors du Maroc." }));
                  return;
                }
                setErrors((p) => ({ ...p, map: null }));
                set("latitude", lat);
                set("longitude", lng);
              }}
            />
            {errors.map && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><span>⚠</span> {errors.map}</p>}
          </Field>
        </div>

        {/* ── CONTACT ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Téléphone de contact" hint="Ex: 06XXXXXXXX, 07XXXXXXXX">
            <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="Ex: 0612345678" />
          </Field>
        </div>

        {/* ── PHOTOS ── */}
        <div ref={sectionRefs.images} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Photos du véhicule *</SectionTitle>
          <ImageUploader images={form.images} onChange={(v) => set("images", v)} token={token} error={errors.images} />
        </div>

        {/* ── ÉQUIPEMENTS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Options & Équipements</SectionTitle>
          <p className="text-xs text-gray-400">
            Exemples: Climatisation, Jantes alliage, Caméra de recul, Toit ouvrant, GPS...
          </p>
          <FeaturesManager features={form.features} onChange={(v) => set("features", v)} />
        </div>

        {/* ── SUBMIT ── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-[#2D5016] text-white font-extrabold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition text-sm disabled:opacity-60">
            {submitting ? "Publication..." : "Publier le véhicule"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400">Votre annonce sera soumise à validation avant d'être publiée.</p>
      </div>
    </div>
  );
}
```

## `frontend/app/dashboard/listings/cars/edit/[id]/page.jsx`

```jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { carsService } from "@/services/carsService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import axios from "axios";
import moroccoCities from "morocco-cities";
import { useToast } from "@/context/ToastContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const LISTING_TYPES = [
  { label: "Vente", value: "SALE" },
  { label: "Location", value: "RENT" },
];

const CONDITIONS = [
  { label: "Occasion", value: "USED" },
  { label: "Neuf", value: "NEW" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { label: "Diesel", value: "DIESEL" },
  { label: "Essence", value: "PETROL" },
  { label: "Hybride", value: "HYBRID" },
  { label: "Électrique", value: "ELECTRIC" },
  { label: "GPL", value: "LPG" },
  { label: "Autre", value: "OTHER" },
];

const TRANSMISSIONS = [
  { label: "Manuelle", value: "MANUAL" },
  { label: "Automatique", value: "AUTOMATIC" },
  { label: "Semi-automatique", value: "SEMI_AUTOMATIC" },
];

const BODY_TYPES = [
  { label: "Berline", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "Citadine", value: "HATCHBACK" },
  { label: "Coupé", value: "COUPE" },
  { label: "Cabriolet", value: "CONVERTIBLE" },
  { label: "Break", value: "WAGON" },
  { label: "Utilitaire / Van", value: "VAN" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Monospace", value: "MINIVAN" },
  { label: "Autre", value: "OTHER" },
];

const ALL_CITIES = moroccoCities.cities;

const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region_name))]
  .filter(Boolean)
  .sort();

function citiesByRegion(region) {
  return ALL_CITIES
    .filter((c) => c.region_name === region)
    .map((c) => c.name)
    .sort();
}

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
        error
          ? "border-red-300 focus:ring-red-200 bg-red-50"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white ${
        error
          ? "border-red-300 focus:ring-red-200"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    >
      {children}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-[#2D5016] inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}

function MapPicker({ latitude, longitude, onChange, flyTo }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (leafletMap.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      if (mapRef.current._leaflet_id) return;

      const L = window.L;
      const defaultLat = latitude ? parseFloat(latitude) : 31.7917;
      const defaultLng = longitude ? parseFloat(longitude) : -7.0926;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        latitude ? 13 : 6,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (latitude && longitude) {
        markerRef.current = L.marker(
          [parseFloat(latitude), parseFloat(longitude)],
          { icon },
        ).addTo(map);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onChange(lat.toFixed(6), lng.toFixed(6));
      });

      leafletMap.current = map;
      setReady(true);
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!flyTo || !leafletMap.current || !window.L) return;
    const { lat, lng, zoom = 12 } = flyTo;

    const L = window.L;
    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    leafletMap.current.flyTo([lat, lng], zoom, { duration: 1.2 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
    }
  }, [flyTo]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden"
        style={{ position: "relative", zIndex: 0 }}
      />
      {!ready && (
        <p className="text-xs text-gray-400">Chargement de la carte...</p>
      )}
      {latitude && longitude ? (
        <p className="text-xs text-green-600 font-semibold">
          📍 Position sélectionnée : {parseFloat(latitude).toFixed(5)},{" "}
          {parseFloat(longitude).toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          Cliquez sur la carte pour épingler la position exacte (optionnel).
        </p>
      )}
    </div>
  );
}

function ImageUploader({ images, onChange, token, error }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      const res = await axios.post(`${API}/api/upload/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const newImages = res.data.files.map((f, i) => ({
        url: f.url,
        isCover: images.length === 0 && i === 0,
      }));

      onChange([...images, ...newImages]);
    } catch (err) {
      setUploadError("Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i) => {
    const next = images.filter((_, idx) => idx !== i);
    if (next.length > 0 && !next.some((img) => img.isCover)) next[0].isCover = true;
    onChange(next);
  };

  const setCover = (i) => {
    onChange(images.map((img, idx) => ({ ...img, isCover: idx === i })));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          uploading
            ? "border-primary bg-primary/5 cursor-wait"
            : error
              ? "border-red-300 bg-red-50 hover:border-red-400"
              : "border-gray-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-semibold">Cliquez pour choisir des photos</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo par photo — jusqu'à 10 photos</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {uploadError && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{uploadError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={`relative group rounded-xl overflow-hidden border-2 w-24 h-24 ${
                img.isCover ? "border-[#2D5016]" : "border-gray-200"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                {!img.isCover && (
                  <button type="button" onClick={() => setCover(i)}
                    className="text-[10px] bg-white text-gray-800 px-2 py-0.5 rounded-full font-bold">
                    Couverture
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Supprimer
                </button>
              </div>
              {img.isCover && (
                <span className="absolute top-1 left-1 text-[9px] bg-[#2D5016] text-white px-1.5 py-0.5 rounded-full font-bold">
                  Couv.
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturesManager({ features, onChange }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  const add = () => {
    if (!key.trim()) return;
    onChange({ ...features, [key.trim()]: val.trim() || true });
    setKey(""); setVal("");
  };

  const remove = (k) => {
    const next = { ...features };
    delete next[k];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Option (ex: Climatisation)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <input value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Valeur (optionnel)"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
          +
        </button>
      </div>
      {Object.keys(features).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(features).map(([k, v]) => (
            <span key={k}
              className="flex items-center gap-1 px-3 py-1 bg-[#E8F5D0] border border-[#A7D129] rounded-full text-xs font-semibold text-[#2D5016]">
              {k}{v !== true ? `: ${v}` : ""}
              <button type="button" onClick={() => remove(k)}
                className="ml-1 text-red-500 hover:text-red-700 font-bold font-mono">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditCarPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <EditCarForm />
    </ProtectedRoute>
  );
}

function EditCarForm() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const sectionRefs = {
    title: useRef(null),
    description: useRef(null),
    categoryId: useRef(null),
    make: useRef(null),
    model: useRef(null),
    year: useRef(null),
    price: useRef(null),
    region: useRef(null),
    city: useRef(null),
    location: useRef(null),
    images: useRef(null),
  };

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const ERROR_ORDER = [
    "title",
    "description",
    "categoryId",
    "make",
    "model",
    "year",
    "price",
    "region",
    "city",
    "location",
    "images",
  ];

  const availableCities = form?.region ? citiesByRegion(form.region) : [];

  // Load car categories
  useEffect(() => {
    carsService.getCategories().then((r) => {
      setCategories(r.data || []);
    });
  }, []);

  // Load car listing
  useEffect(() => {
    const load = async () => {
      try {
        const res = await carsService.getMyListingById(id, token);
        const d = res.data;
        setForm({
          title: d.title || "",
          description: d.description || "",
          categoryId: d.categoryId || "",
          listingType: d.listingType || "SALE",
          condition: d.condition || "USED",
          make: d.make || "",
          model: d.model || "",
          year: d.year?.toString() || "",
          mileage: d.mileage?.toString() || "",
          fuelType: d.fuelType || "DIESEL",
          transmission: d.transmission || "MANUAL",
          bodyType: d.bodyType || "SEDAN",
          color: d.color || "",
          doors: d.doors?.toString() || "",
          seats: d.seats?.toString() || "",
          engineSize: d.engineSize?.toString() || "",
          horsePower: d.horsePower?.toString() || "",
          price: d.price?.toString() || "",
          isNegotiable: d.isNegotiable || false,
          region: d.region || "",
          city: d.city || "",
          location: d.location || "",
          latitude: d.latitude?.toString() || "",
          longitude: d.longitude?.toString() || "",
          contactPhone: d.contactPhone || "",
          images: Array.isArray(d.images) ? d.images : [],
          features: d.features && typeof d.features === "object" ? d.features : {},
        });
        if (d.latitude && d.longitude) {
          setFlyTo({
            lat: parseFloat(d.latitude),
            lng: parseFloat(d.longitude),
            zoom: 14,
          });
        }
      } catch (e) {
        toast.error("Annonce introuvable ou accès refusé.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  const geocodeAddress = useCallback(async (city, address) => {
    if (!city) return;
    setGeocoding(true);
    try {
      const q = encodeURIComponent(
        `${address ? address + ", " : ""}${city}, Maroc`
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
        setFlyTo({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          zoom: address ? 15 : 12,
        });
      }
    } catch {
      // ignore
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleRegionChange = (region) => {
    setForm((p) => ({ ...p, region, city: "", latitude: "", longitude: "" }));
    setFlyTo(null);
    if (errors.region) setErrors((p) => ({ ...p, region: null }));
  };

  const handleCityChange = useCallback(async (cityName) => {
    set("city", cityName);
    if (!cityName) return;
    await geocodeAddress(cityName, form.location || "");
  }, [form?.location, geocodeAddress]);

  useEffect(() => {
    if (!form?.city || !form?.location.trim()) return;
    const t = setTimeout(() => {
      geocodeAddress(form.city, form.location);
    }, 500);
    return () => clearTimeout(t);
  }, [form?.location, form?.city, geocodeAddress]);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Min 5 caractères";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Min 10 caractères";
    if (!form.categoryId) e.categoryId = "Catégorie requise";
    if (!form.make.trim()) e.make = "Marque requise";
    if (!form.model.trim()) e.model = "Modèle requis";
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 1) e.year = "Année invalide";
    if (!form.price || Number(form.price) <= 0) e.price = "Prix invalide";
    if (!form.region) e.region = "Veuillez sélectionner une région";
    if (!form.city) e.city = "Veuillez sélectionner une ville";
    if (!form.location.trim()) e.location = "Requis";
    if (form.images.length === 0) e.images = "Ajoutez au moins une photo";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      if (firstKey && sectionRefs[firstKey]?.current) {
        sectionRefs[firstKey].current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        year: parseInt(form.year),
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
        doors: form.doors ? parseInt(form.doors) : undefined,
        seats: form.seats ? parseInt(form.seats) : undefined,
        engineSize: form.engineSize ? parseFloat(form.engineSize) : undefined,
        horsePower: form.horsePower ? parseInt(form.horsePower) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      await carsService.updateMyListing(id, payload, token);
      toast.success("Annonce de véhicule modifiée avec succès !");
      router.push("/dashboard/listings/cars");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement du véhicule..." />;
  if (!form) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 font-semibold">Annonce introuvable.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-[#2D5016] text-lg">Modifier le véhicule</h1>
          <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            Annonce re-soumise à validation
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations de l'annonce</SectionTitle>

          <div ref={sectionRefs.title}>
            <Field label="Titre de l'annonce *" error={errors.title}>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} error={errors.title} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Type d'annonce *">
              <Select value={form.listingType} onChange={(e) => set("listingType", e.target.value)}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <div ref={sectionRefs.categoryId} className="col-span-2">
              <Field label="Catégorie de véhicule *" error={errors.categoryId}>
                <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
                  <option value="">Sélectionner</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.description}>
            <Field label="Description *" error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[#2D5016]"
                }`}
              />
            </Field>
          </div>
        </div>

        {/* Technical specs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Fiche technique du véhicule</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.make}>
              <Field label="Marque *" error={errors.make}>
                <Input value={form.make} onChange={(e) => set("make", e.target.value)} error={errors.make} />
              </Field>
            </div>
            <div ref={sectionRefs.model}>
              <Field label="Modèle *" error={errors.model}>
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} error={errors.model} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div ref={sectionRefs.year}>
              <Field label="Année *" error={errors.year}>
                <Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} error={errors.year} />
              </Field>
            </div>
            <Field label="Kilométrage (km)">
              <Input type="number" min="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} />
            </Field>
            <Field label="État du véhicule *">
              <Select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Carburant *">
              <Select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                {FUEL_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Transmission *">
              <Select value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                {TRANSMISSIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Carrosserie *">
              <Select value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)}>
                {BODY_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Field label="Couleur">
              <Input value={form.color} onChange={(e) => set("color", e.target.value)} />
            </Field>
            <Field label="Portes">
              <Select value={form.doors} onChange={(e) => set("doors", e.target.value)}>
                <option value="">Optionnel</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="2">2 (Coupé)</option>
              </Select>
            </Field>
            <Field label="Places">
              <Select value={form.seats} onChange={(e) => set("seats", e.target.value)}>
                <option value="">Optionnel</option>
                <option value="5">5</option>
                <option value="7">7</option>
                <option value="2">2</option>
                <option value="9">9</option>
              </Select>
            </Field>
            <Field label="Puissance (ch)">
              <Input type="number" value={form.horsePower} onChange={(e) => set("horsePower", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cylindrée (L)">
              <Input type="number" step="0.1" value={form.engineSize} onChange={(e) => set("engineSize", e.target.value)} />
            </Field>
            <div ref={sectionRefs.price}>
              <Field label="Prix (MAD) *" error={errors.price}>
                <div className="flex gap-2">
                  <Input type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} error={errors.price} />
                  <label className="flex items-center gap-1 shrink-0 text-xs text-gray-500 font-semibold cursor-pointer">
                    <input type="checkbox" checked={form.isNegotiable} onChange={(e) => set("isNegotiable", e.target.checked)} className="rounded text-[#2D5016]" />
                    Négociable
                  </label>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.region}>
              <Field label="Région *" error={errors.region}>
                <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} error={errors.region}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div ref={sectionRefs.city}>
              <Field label="Ville *" error={errors.city}>
                <div className="relative">
                  <Select value={form.city} onChange={(e) => handleCityChange(e.target.value)} error={errors.city} disabled={!form.region}>
                    <option value="">{form.region ? "Sélectionner une ville" : "Choisir région d'abord"}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  {geocoding && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.location}>
            <Field label="Adresse / Lieu précis *" error={errors.location}>
              <div className="relative">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} error={errors.location} />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="Position sur la carte">
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              flyTo={flyTo}
              onChange={(lat, lng) => {
                const lat_n = parseFloat(lat);
                const lng_n = parseFloat(lng);
                if (lat_n < 27.6 || lat_n > 35.9 || lng_n < -13.2 || lng_n > -1.0) {
                  setErrors((p) => ({ ...p, map: "Position hors du Maroc." }));
                  return;
                }
                setErrors((p) => ({ ...p, map: null }));
                set("latitude", lat);
                set("longitude", lng);
              }}
            />
            {errors.map && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><span>⚠</span> {errors.map}</p>}
          </Field>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Téléphone de contact">
            <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
        </div>

        {/* Photos */}
        <div ref={sectionRefs.images} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Photos du véhicule *</SectionTitle>
          <ImageUploader images={form.images} onChange={(v) => set("images", v)} token={token} error={errors.images} />
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Options & Équipements</SectionTitle>
          <FeaturesManager features={form.features} onChange={(v) => set("features", v)} />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-[#2D5016] text-white font-extrabold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition text-sm disabled:opacity-60">
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

```

## `frontend/app/cars/page.jsx`

```jsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { carsService } from "@/services/carsService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CarCard   from "@/components/cars/CarCard";
import CarFilter from "@/components/cars/CarFilter";
import BusinessAccountGate from "@/components/shared/BusinessAccountGate";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";
import { cities } from "morocco-cities";

const LISTING_TYPE_TABS = [
  { label: "Tous",     value: null },
  { label: "Vente",    value: "SALE" },
  { label: "Location", value: "RENT" },
];

const CONDITION_TABS = [
  { label: "Tous",      value: null },
  { label: "Neuf",      value: "NEW" },
  { label: "Occasion",  value: "USED" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { value: "PETROL",    label: "Essence" },
  { value: "DIESEL",    label: "Diesel" },
  { value: "ELECTRIC",  label: "Électrique" },
  { value: "HYBRID",    label: "Hybride" },
  { value: "LPG",       label: "GPL" },
];

const TRANSMISSIONS = [
  { value: "MANUAL",         label: "Manuelle" },
  { value: "AUTOMATIC",      label: "Automatique" },
  { value: "SEMI_AUTOMATIC", label: "Semi-auto" },
];

const BODY_TYPES = [
  { value: "SEDAN",       label: "Berline" },
  { value: "SUV",         label: "SUV" },
  { value: "HATCHBACK",   label: "Citadine" },
  { value: "COUPE",       label: "Coupé" },
  { value: "CONVERTIBLE", label: "Cabriolet" },
  { value: "WAGON",       label: "Break" },
  { value: "VAN",         label: "Van" },
  { value: "PICKUP",      label: "Pickup" },
  { value: "MINIVAN",     label: "Minivan" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Plus récents" },
  { value: "price_asc",      label: "Prix croissant" },
  { value: "price_desc",     label: "Prix décroissant" },
  { value: "year_desc",      label: "Année décroissante" },
  { value: "mileage_asc",    label: "Km croissant" },
];

const FUEL_LABELS  = { PETROL: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride", LPG: "GPL" };
const TRANS_LABELS = { MANUAL: "Manuelle", AUTOMATIC: "Automatique", SEMI_AUTOMATIC: "Semi-auto" };
const COND_LABELS  = { NEW: "Neuf", USED: "Occasion", DAMAGED: "Accidenté" };

const citiesByRegion = cities.reduce((acc, c) => {
  if (!acc[c.region_name]) acc[c.region_name] = [];
  acc[c.region_name].push(c.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");

// ── Car Card ──────────────────────────────────────────────────────────────────

// function CarCard({ listing, initialFavorited }) {
//   const { user } = useAuth();
//   const [favorited, setFavorited] = useState(initialFavorited);
//   const [favLoading, setFavLoading] = useState(false);

//   const cover = Array.isArray(listing.images)
//     ? listing.images.find((i) => i.isCover)?.url ?? listing.images[0]?.url
//     : null;

//   const handleFav = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!user || favLoading) return;
//     const prev = favorited;
//     setFavorited(!prev);
//     setFavLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       await carsService.toggleFavorite(listing.id, token);
//     } catch {
//       setFavorited(prev);
//     } finally {
//       setFavLoading(false);
//     }
//   };

//   return (
//     <Link href={`/cars/${listing.id}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
//       <div className="relative h-[200px] bg-gray-100 overflow-hidden">
//         {cover ? (
//           <img src={cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">🚗</div>
//         )}
//         <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
//           <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${listing.listingType === "SALE" ? "bg-[#2D5016] text-white" : "bg-[#A7D129] text-[#2D5016]"}`}>
//             {listing.listingType === "SALE" ? "Vente" : "Location"}
//           </span>
//           {listing.condition && (
//             <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-gray-700">
//               {COND_LABELS[listing.condition]}
//             </span>
//           )}
//         </div>
//         {listing.isFeatured && (
//           <span className="absolute top-3 right-10 px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-400 text-yellow-900">À la une</span>
//         )}
//         {user && (
//           <button onClick={handleFav}
//             className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
//               favorited ? "bg-[#A7D129] text-[#2D5016]" : "bg-white/80 text-gray-400 hover:bg-[#E8F5D0] hover:text-[#2D5016]"
//             }`}
//           >
//             <svg viewBox="0 0 24 24" className="w-4 h-4" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
//             </svg>
//           </button>
//         )}
//       </div>

//       <div className="p-4">
//         <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 mb-1 group-hover:text-[#2D5016] transition-colors">
//           {listing.make} {listing.model} {listing.year}
//         </p>
//         <p className="text-xs text-gray-500 line-clamp-1 mb-3">{listing.title}</p>

//         <div className="flex flex-wrap gap-1.5 mb-3">
//           {listing.fuelType && (
//             <span className="px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-[11px] font-medium">
//               {FUEL_LABELS[listing.fuelType] ?? listing.fuelType}
//             </span>
//           )}
//           {listing.transmission && (
//             <span className="px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-[11px] font-medium">
//               {TRANS_LABELS[listing.transmission] ?? listing.transmission}
//             </span>
//           )}
//           {listing.mileage != null && (
//             <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
//               {listing.mileage.toLocaleString("fr-MA")} km
//             </span>
//           )}
//         </div>

//         <div className="flex items-center justify-between">
//           <p className="text-lg font-extrabold text-[#2D5016]">
//             {fmtPrice(listing.price)} MAD
//             {listing.listingType === "RENT" && <span className="text-xs font-normal text-gray-400">/j</span>}
//           </p>
//           {listing.isNegotiable && (
//             <span className="text-[10px] text-[#7BA428] font-semibold border border-[#A7D129] rounded-full px-2 py-0.5">Négociable</span>
//           )}
//         </div>
//         {listing.city && (
//           <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
//             <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             {listing.city}
//           </p>
//         )}
//       </div>
//     </Link>
//   );
// }

// ── Sidebar Filter ─────────────────────────────────────────────────────────────

// function CarFilter({ onFilter }) {
//   const [form, setForm] = useState({
//     make: "", model: "", minYear: "", maxYear: "",
//     minPrice: "", maxPrice: "", maxMileage: "",
//     fuelType: "", transmission: "", bodyType: "",
//     region: "", city: "",
//   });

//   const citiesInRegion = form.region ? [...(citiesByRegion[form.region] || [])].sort() : [];

//   const apply = () => {
//     const f = {};
//     Object.entries(form).forEach(([k, v]) => { if (v) f[k] = v; });
//     onFilter(f);
//   };

//   const reset = () => {
//     setForm({ make: "", model: "", minYear: "", maxYear: "", minPrice: "", maxPrice: "", maxMileage: "", fuelType: "", transmission: "", bodyType: "", region: "", city: "" });
//     onFilter({});
//   };

//   const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white";
//   const lbl = "text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block";

//   return (
//     <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
//       <p className="font-bold text-gray-800 text-sm">Filtres</p>

//       <div>
//         <label className={lbl}>Marque</label>
//         <input value={form.make} onChange={(e) => setForm((p) => ({ ...p, make: e.target.value }))} placeholder="Ex: Toyota" className={inp} />
//       </div>
//       <div>
//         <label className={lbl}>Modèle</label>
//         <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="Ex: Corolla" className={inp} />
//       </div>

//       <div>
//         <label className={lbl}>Année</label>
//         <div className="flex gap-2">
//           <input type="number" value={form.minYear} onChange={(e) => setForm((p) => ({ ...p, minYear: e.target.value }))} placeholder="De" className={inp} />
//           <input type="number" value={form.maxYear} onChange={(e) => setForm((p) => ({ ...p, maxYear: e.target.value }))} placeholder="À" className={inp} />
//         </div>
//       </div>

//       <div>
//         <label className={lbl}>Prix (MAD)</label>
//         <div className="flex gap-2">
//           <input type="number" value={form.minPrice} onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))} placeholder="Min" className={inp} />
//           <input type="number" value={form.maxPrice} onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))} placeholder="Max" className={inp} />
//         </div>
//       </div>

//       <div>
//         <label className={lbl}>Kilométrage max</label>
//         <input type="number" value={form.maxMileage} onChange={(e) => setForm((p) => ({ ...p, maxMileage: e.target.value }))} placeholder="Ex: 100000" className={inp} />
//       </div>

//       <div>
//         <label className={lbl}>Carburant</label>
//         <select value={form.fuelType} onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value }))} className={inp}>
//           <option value="">Tous</option>
//           {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Boîte de vitesse</label>
//         <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value }))} className={inp}>
//           <option value="">Toutes</option>
//           {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Carrosserie</label>
//         <select value={form.bodyType} onChange={(e) => setForm((p) => ({ ...p, bodyType: e.target.value }))} className={inp}>
//           <option value="">Toutes</option>
//           {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Région</label>
//         <select value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value, city: "" }))} className={inp}>
//           <option value="">Toutes</option>
//           {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
//         </select>
//       </div>

//       {form.region && citiesInRegion.length > 0 && (
//         <div>
//           <label className={lbl}>Ville</label>
//           <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inp}>
//             <option value="">Toutes</option>
//             {citiesInRegion.map((c) => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </div>
//       )}

//       <button onClick={apply} className="w-full py-2.5 bg-[#2D5016] text-white font-bold rounded-xl text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition">
//         Appliquer
//       </button>
//       <button onClick={reset} className="w-full py-2 border border-gray-200 text-gray-500 font-semibold rounded-xl text-sm hover:bg-gray-50 transition">
//         Réinitialiser
//       </button>
//     </div>
//   );
// }

// ─── ALERT MODAL COMPONENT ───────────────────────────────────────────────────
function AlertModal({ token, onClose }) {
  const [form, setForm] = useState({
    listingType: "",
    categoryId: "",
    region: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    make: "",
    model: "",
    condition: "",
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    carsService
      .getCategories()
      .then((d) => {
        setCategories(d.data || []);
      })
      .catch(() => {});
  }, []);

  const handleRegionChange = (region) => {
    setForm((f) => ({ ...f, region, city: "" }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const filters = {
        ...(form.listingType && { listingType: form.listingType }),
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.region && { region: form.region }),
        ...(form.city && { city: form.city }),
        ...(form.minPrice && { minPrice: form.minPrice }),
        ...(form.maxPrice && { maxPrice: form.maxPrice }),
        ...(form.make && { make: form.make.trim() }),
        ...(form.model && { model: form.model.trim() }),
        ...(form.condition && { condition: form.condition }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ module: "automobile", filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              🔔 Créer une alerte
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Soyez notifié dès qu'un véhicule correspond
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une notification pour chaque nouvelle annonce
              correspondante.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Type d'annonce
                </label>
                <select
                  value={form.listingType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, listingType: e.target.value }))
                  }
                  className={inputStyle}
                >
                  <option value="">Tous types</option>
                  <option value="SALE">Vente</option>
                  <option value="RENT">Location</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Catégorie de véhicule
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className={inputStyle}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Marque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Toyota"
                    value={form.make}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, make: e.target.value }))
                    }
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Modèle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Corolla"
                    value={form.model}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  État du véhicule
                </label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, condition: e.target.value }))
                  }
                  className={inputStyle}
                >
                  <option value="">Tous états</option>
                  <option value="NEW">Neuf</option>
                  <option value="USED">Occasion</option>
                  <option value="DAMAGED">Accidenté</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Région
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Ville
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className={inputStyle}
                  >
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Prix (MAD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={form.minPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minPrice: e.target.value }))
                    }
                    className={inputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={form.maxPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                    className={inputStyle}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Créer l'alerte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page Content ─────────────────────────────────────────────────────────
function CarsPageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 12 };
    ["region", "city", "listingType", "condition", "make", "model", "search", "categoryId"].forEach((k) => {
      if (searchParams.get(k)) init[k] = searchParams.get(k);
    });
    return init;
  });

  const [listings, setListings]         = useState([]);
  const [pagination, setPagination]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [activeType, setActiveType]     = useState(null);
  const [activeCond, setActiveCond]     = useState(null);
  const [sort, setSort]                 = useState("createdAt_desc");
  const [showBusinessGate, setShowBusinessGate] = useState(false);
  const [showAlertModal, setShowAlertModal]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sortBy, sortDir] = sort.split("_");
        const [res, favRes] = await Promise.all([
          carsService.getListings({ ...filters, sortBy, sortDir }),
          token
            ? carsService.getFavorites(token).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);
        setListings(res.listings);
        setPagination(res.pagination);
        setFavoritedIds(new Set((favRes.data ?? []).map((l) => l.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, token, sort]);

  const handleFilter = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({ page: 1, limit: 12 });
      return;
    }
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters, page: 1 };
      Object.keys(merged).forEach((k) => { if (merged[k] === undefined) delete merged[k]; });
      return merged;
    });
  };

  const handleTypeTab = (value) => {
    setActiveType(value);
    setFilters({ page: 1, limit: 12, ...(value && { listingType: value }) });
  };

  const handleCondTab = (value) => {
    setActiveCond(value);
    setFilters((p) => ({ ...p, page: 1, ...(value ? { condition: value } : { condition: undefined }) }));
  };

  const handlePageChange = (n) => {
    setFilters((p) => ({ ...p, page: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublishClick = () => {
    if (!user) {
      document
        .getElementById("inline-register")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (user.role === "business") {
      router.push("/dashboard/listings/cars/create");
    } else {
      setShowBusinessGate(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 pt-2.5 pb-0 flex flex-col gap-0">

          {/* Row 1: listing type tabs */}
          <div className="flex gap-1.5 flex-wrap pb-2">
            {LISTING_TYPE_TABS.map((t) => (
              <button key={t.label} onClick={() => handleTypeTab(t.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeType === t.value
                    ? "bg-[#2D5016] text-white shadow-sm"
                    : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Row 2: condition tabs + sort + publish */}
          <div className="flex items-center justify-between pb-2.5 gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {CONDITION_TABS.map((t) => (
                <button key={t.label} onClick={() => handleCondTab(t.value)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeCond === t.value
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-[#A7D129] bg-white"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {user?.role === "citizen" && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150"
                >
                  🔔 Créer une alerte
                </button>
              )}

              {(user?.role === "business" || user?.role === "citizen" || !user) && (
                <button onClick={handlePublishClick}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition hover:scale-105 active:scale-100"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Publier une annonce
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex gap-6">
        {/* SIDEBAR */}
        <aside className="w-[260px] shrink-0 hidden lg:block">
          <div className="sticky top-[88px] overflow-y-auto max-h-[calc(100vh-88px)]">
            <CarFilter onFilter={handleFilter} />
          </div>
        </aside>

        {/* GRID */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {pagination ? (
                <><span className="font-semibold text-gray-800">{pagination.total}</span> annonces trouvées</>
              ) : (
                <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              )}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-[200px] bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🚗</div>
              <p className="text-lg font-semibold text-gray-700">Aucune annonce trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <CarCard key={l.id} listing={l} initialFavorited={favoritedIds.has(l.id)} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >‹</button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i} onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? "bg-[#2D5016] text-white shadow-sm"
                      : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129]"
                  }`}
                >{i + 1}</button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >›</button>
            </div>
          )}
        </main>
      </div>

      {showBusinessGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBusinessGate(false); }}
        >
          <BusinessAccountGate onClose={() => setShowBusinessGate(false)} />
        </div>
      )}

      {showAlertModal && (
        <AlertModal token={token} onClose={() => setShowAlertModal(false)} />
      )}

      {/* INLINE REGISTER — visiteurs only */}
      {!user && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inline-register" />
        </div>
      )}
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement des véhicules..." />}>
      <CarsPageContent />
    </Suspense>
  );
}
```

## `frontend/app/cars/[id]/page.jsx`

```jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { carsService } from "@/services/carsService";
import MapFrame from "@/components/shared/MapFrame";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReportModal from "@/components/shared/ReportModal";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";

const FUEL_LABELS  = { PETROL: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride", LPG: "GPL", OTHER: "Autre" };
const TRANS_LABELS = { MANUAL: "Manuelle", AUTOMATIC: "Automatique", SEMI_AUTOMATIC: "Semi-automatique" };
const BODY_LABELS  = { SEDAN: "Berline", SUV: "SUV", HATCHBACK: "Citadine", COUPE: "Coupé", CONVERTIBLE: "Cabriolet", WAGON: "Break", VAN: "Van", PICKUP: "Pickup", MINIVAN: "Minivan", OTHER: "Autre" };
const COND_LABELS  = { NEW: "Neuf", USED: "Occasion", DAMAGED: "Accidenté" };
const TYPE_LABELS  = { SALE: "Vente", RENT: "Location" };

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({ images }) {
  const [active, setActive] = useState(0);
  if (!images?.length)
    return <div className="w-full h-[380px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-200 text-7xl">🚗</div>;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full h-[380px] bg-gray-100 rounded-2xl overflow-hidden">
        <img src={images[active]?.url} alt={`Photo ${active + 1}`} className="w-full h-full object-cover" />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
          {active + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${active === i ? "border-[#A7D129]" : "border-transparent hover:border-[#E8F5D0]"}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Spec Row ──────────────────────────────────────────────────────────────────

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 py-2 border-b border-gray-50 last:border-0 text-sm flex-wrap">
      <span className="text-gray-400">» {label} :</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

// ── Inquiry Form ──────────────────────────────────────────────────────────────

function InquiryForm({ listingId }) {
  const { user } = useAuth();
  const [form, setForm]     = useState({ message: "", contactPhone: "", contactEmail: "" });
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.message.trim() || form.message.trim().length < 5)
      errs.message = "Message requis (min 5 caractères)";
    if (form.contactPhone && !/^(\+212|0)(6|7)\d{8}$/.test(form.contactPhone.replace(/\s/g, "")))
      errs.contactPhone = "Numéro invalide (ex: 0612345678)";
    return errs;
  };

  const handleSend = async () => {
    if (!user) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("sending");
    try {
      const token = localStorage.getItem("token");
      await carsService.createInquiry({ ...form, listingId }, token);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  if (status === "ok")
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-green-700 text-sm">Message envoyé !</p>
        <p className="text-xs text-green-600 mt-1">Le vendeur vous contactera bientôt.</p>
      </div>
    );

  const inp = (field) => `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
    errors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[#A7D129] focus:border-transparent"
  }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
        <h2 className="font-bold text-gray-900 text-base">Contacter le vendeur</h2>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3">
        {!user && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Link href="/auth/login" className="font-bold underline">Connectez-vous</Link> pour envoyer un message.
          </p>
        )}
        <div>
          <textarea rows={4} placeholder="Votre message..." value={form.message} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); if (errors.message) setErrors((p) => ({ ...p, message: null })); }}
            className={inp("message") + " resize-none"}
          />
          {errors.message && <p className="text-xs text-red-500 mt-1">⚠ {errors.message}</p>}
        </div>
        <div>
          <input placeholder="Téléphone (ex: 0612345678)" value={form.contactPhone} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, contactPhone: e.target.value })); if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null })); }}
            className={inp("contactPhone")}
          />
          {errors.contactPhone && <p className="text-xs text-red-500 mt-1">⚠ {errors.contactPhone}</p>}
        </div>
        <input placeholder="Email (optionnel)" value={form.contactEmail} disabled={!user}
          onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
          className={inp("contactEmail")}
        />
        {status === "error" && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">❌ Erreur lors de l'envoi.</p>
        )}
        <button onClick={handleSend} disabled={!user || status === "sending"}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-50"
        >
          {status === "sending" ? "Envoi..." : "Envoyer le message"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const { id }   = useParams();
  const { user } = useAuth();

  const [listing, setListing]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isFavorited, setIsFavorited]   = useState(false);
  const [favLoading, setFavLoading]     = useState(false);
  const [showReport, setShowReport]     = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res  = await carsService.getListingById(id);
        const data = res.data ?? res;
        setListing(data);

        const token = localStorage.getItem("token");
        if (user && token) {
          try {
            const favRes = await carsService.getFavorites(token);
            setIsFavorited((favRes.data ?? []).some((l) => l.id === id));
          } catch (_) {}
        }
        try {
          const rel = await carsService.getListings({ limit: 4, page: 1, make: data.make });
          setRelated((rel.listings ?? []).filter((l) => l.id !== id));
        } catch (_) {}
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;
  if (error || !listing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🚗</span>
        <h1 className="text-2xl font-bold text-gray-800">Annonce introuvable</h1>
        <p className="text-gray-500 text-sm">Cette annonce n'existe plus ou a été supprimée.</p>
        <Link href="/cars" className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition">
          Voir toutes les annonces
        </Link>
      </div>
    );

  const images   = Array.isArray(listing.images) ? listing.images : [];
  const features = listing.features && typeof listing.features === "object" ? listing.features : {};
  const pageUrl  = typeof window !== "undefined" ? window.location.href : "";

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!user || favLoading) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);
    try {
      const token = localStorage.getItem("token");
      await carsService.toggleFavorite(id, token);
    } catch {
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* BREADCRUMB BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <Link href="/" className="hover:text-[#A7D129] transition-colors shrink-0">Accueil</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <Link href="/cars" className="hover:text-[#A7D129] transition-colors shrink-0">Automobile</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <span className="text-gray-800 font-medium truncate">{listing.make} {listing.model}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href={`https://wa.me/?text=${encodeURIComponent(listing.title + " " + pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] hover:scale-110 transition shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z"/>
                <path d="M5 21v-7"/>
              </svg>
              <span className="text-xs font-semibold">Signaler</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO STRIP */}
      <div className="bg-gradient-to-br from-[#2D5016] to-[#7BA428] text-white py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${listing.listingType === "SALE" ? "bg-white text-[#2D5016]" : "bg-[#A7D129] text-[#2D5016]"}`}>
                  {TYPE_LABELS[listing.listingType]}
                </span>
                {listing.condition && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{COND_LABELS[listing.condition]}</span>
                )}
                {listing.isFeatured && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-1">
                {listing.make} {listing.model} {listing.year}
              </h1>
              <p className="text-white/70 text-sm mb-2">{listing.title}</p>
              {listing.city && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}{listing.city ? `, ${listing.city}` : ""}
                </div>
              )}
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-3">
              <p className="text-3xl font-extrabold">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === "RENT" && <span className="text-lg font-medium opacity-70">/jour</span>}
              </p>
              {listing.isNegotiable && (
                <span className="text-xs bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full font-semibold">Négociable</span>
              )}
              <p className="text-white/50 text-xs">Publié le {fmtDate(listing.publishedAt || listing.createdAt)}</p>
              {user && (
                <button onClick={handleToggleFavorite}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 ${
                    isFavorited
                      ? "bg-[#A7D129] border-[#A7D129] text-[#2D5016]"
                      : "bg-white/10 border-white/40 text-white hover:bg-[#A7D129] hover:border-[#A7D129] hover:text-[#2D5016]"
                  } ${favLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Gallery images={images} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Fiche technique</h2>
            </div>
            <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <SpecRow label="Marque"      value={listing.make} />
                <SpecRow label="Modèle"      value={listing.model} />
                <SpecRow label="Année"       value={listing.year?.toString()} />
                <SpecRow label="Kilométrage" value={listing.mileage != null ? `${listing.mileage.toLocaleString("fr-MA")} km` : null} />
                <SpecRow label="Carburant"   value={FUEL_LABELS[listing.fuelType]} />
                <SpecRow label="Boîte"       value={TRANS_LABELS[listing.transmission]} />
              </div>
              <div>
                <SpecRow label="Carrosserie" value={BODY_LABELS[listing.bodyType]} />
                <SpecRow label="Couleur"     value={listing.color} />
                <SpecRow label="Portes"      value={listing.doors?.toString()} />
                <SpecRow label="Places"      value={listing.seats?.toString()} />
                <SpecRow label="Cylindrée"   value={listing.engineSize != null ? `${listing.engineSize}L` : null} />
                <SpecRow label="Puissance"   value={listing.horsePower != null ? `${listing.horsePower} ch` : null} />
              </div>
            </div>

            {Object.keys(features).length > 0 && (
              <div className="px-6 pb-5 pt-3 border-t border-gray-50">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Options & équipements</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(features).map(([k, v]) => (
                    <span key={k} className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5D0] border border-[#A7D129] text-[#2D5016]">
                      {k}{v !== true ? `: ${v}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Description</h2>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </div>
          </section>

          <MapFrame latitude={listing.latitude} longitude={listing.longitude} location={listing.location} city={listing.city} />

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Conseil sécurité !</strong> Ne versez aucune somme avant d'avoir inspecté le véhicule en personne.
              Méfiez-vous des prix anormalement bas. En cas de doute, signalez l'annonce.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {/* Price card */}
          <div className="bg-[#2D5016] rounded-2xl p-6 text-white shadow-lg">
            <p className="text-3xl font-extrabold mb-1">
              {fmtPrice(listing.price)} MAD
              {listing.listingType === "RENT" && <span className="text-base font-medium opacity-70">/jour</span>}
            </p>
            {listing.isNegotiable && (
              <p className="text-[#A7D129] text-xs font-semibold mb-2">Prix négociable</p>
            )}
            <p className="text-white/50 text-xs mb-4">{listing.make} {listing.model} · {TYPE_LABELS[listing.listingType]}</p>
            <div className="my-4 border-t border-white/10" />
            {listing.contactPhone && (
              <a href={`tel:${listing.contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#2D5016] font-extrabold rounded-xl text-sm mb-3 hover:bg-[#E8F5D0] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {listing.contactPhone}
              </a>
            )}
            <a href={`https://wa.me/${listing.contactPhone?.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je suis intéressé par votre annonce : " + listing.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-extrabold rounded-xl text-sm hover:bg-green-500 transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          <InquiryForm listingId={listing.id} />

          {/* Quick info */}
          <div className="bg-[#E8F5D0] rounded-2xl border border-[#A7D129] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[#7BA428] font-bold mb-3">Infos rapides</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {listing.viewsCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vues</span>
                  <span className="font-bold text-[#2D5016]">{listing.viewsCount.toLocaleString("fr-MA")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Référence</span>
                <span className="font-bold text-[#2D5016] text-xs font-mono">{listing.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Publié le</span>
                <span className="font-bold text-[#2D5016]">{fmtDate(listing.publishedAt || listing.createdAt)}</span>
              </div>
              {listing.category && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-bold text-[#2D5016]">{listing.category.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related listings */}
          {related.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Même marque</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {related.map((l) => (
                  <Link key={l.id} href={`/cars/${l.id}`}
                    className="flex gap-3 group hover:bg-[#E8F5D0] p-2 rounded-xl transition"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#E8F5D0] shrink-0">
                      {l.images?.[0]?.url ? (
                        <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A7D129] text-xl">🚗</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-[#2D5016] transition">
                        {l.make} {l.model} {l.year}
                      </p>
                      <p className="text-xs text-[#2D5016] font-semibold mt-0.5">{fmtPrice(l.price)} MAD</p>
                      {l.mileage != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{l.mileage.toLocaleString("fr-MA")} km</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/cars"
                  className="block w-full text-center py-2.5 border-2 border-[#2D5016] text-[#2D5016] font-bold rounded-full text-xs hover:bg-[#2D5016] hover:text-white transition"
                >
                  Toutes les annonces
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INLINE REGISTER — visiteurs only, full width, centered */}
      {!user && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inscription-cars" />
        </div>
      )}

      {showReport && (
        <ReportModal isOpen={showReport} targetType="CAR" targetId={id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
```

## `frontend/app/admin/vehicles/page.jsx`

```jsx
/**
 * app/admin/cars/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de gestion des annonces véhicules.
 * Filtre automatiquement sur module="automobile".
 * Réutilise ListingTable avec showModuleCol=false.
 * Parité complète avec la page immobilier.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import ListingTable from '../../../components/admin/ListingTable'
import UserFilterDropdown from '@/components/admin/UserFilterDropdown'
import ListingDetailModal from '@/components/admin/ListingDetailModal'
import { getListings, approveListing, rejectListing, updateListingStatus } from '../../../lib/adminApi'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '@/context/ToastContext'

// ── Status label map ──────────────────────────────────────────────────────────

const STATUS_LABELS = {
  PENDING:   'En attente',
  APPROVED:  'Approuvée',
  REJECTED:  'Refusée',
  SUSPENDED: 'Suspendue',
  ARCHIVED:  'Archivée',
  DELETED:   'Supprimée',
  EXPIRED:   'Expirée',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
)

const IconCar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
  </svg>
)

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)

// ── Status filter tabs ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: '',          label: 'Tous statuts' },
  { key: 'PENDING',   label: 'En attente' },
  { key: 'APPROVED',  label: 'Approuvés' },
  { key: 'REJECTED',  label: 'Refusés' },
  { key: 'SUSPENDED', label: 'Suspendus' },
  { key: 'EXPIRED',   label: 'Expirés' },
  { key: 'ARCHIVED',  label: 'Archivés' },
]

// ── Filter chip ───────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      bg-amber-50 text-amber-800 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-red-500 transition-colors">
        <IconX />
      </button>
    </span>
  )
}

// ── Notifie la sidebar de recalculer ses compteurs ────────────────────────────

const refreshSidebarCounts = () =>
  window.dispatchEvent(new Event('admin:counts:refresh'))

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminVehiclesPage() {
  const { token } = useAuth()
  const { toast } = useToast()

  const [listings, setListings]           = useState([])
  const [pagination, setPagination]       = useState({})
  const [tableLoading, setTableLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const [selectedListing, setSelectedListing] = useState(null)

  const [status, setStatus]             = useState('PENDING')
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchInput, setSearchInput]   = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadListings = useCallback(async () => {
    if (!token) return
    setTableLoading(true)
    try {
      const result = await getListings({
        module: 'automobile',
        status,
        search,
        page,
        token,
        userId: selectedUser?.id || '',
      })
      setListings(result.data)
      setPagination(result.pagination)
    } finally {
      setTableLoading(false)
    }
  }, [status, search, page, token, selectedUser])

  useEffect(() => { loadListings() }, [loadListings])
  useEffect(() => { setPage(1) }, [status, search, selectedUser])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Action handlers (table row quick-actions) ─────────────────────────────

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await approveListing(id, token)
      await loadListings()
      refreshSidebarCounts()
      toast.success('Annonce approuvée avec succès.')
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id, note) => {
    setActionLoading(id)
    try {
      await rejectListing(id, note, token)
      await loadListings()
      refreshSidebarCounts()
      toast.success('Annonce refusée.')
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (id, newStatus, adminNotes) => {
    setActionLoading(id)
    try {
      await updateListingStatus(id, newStatus, adminNotes, token)
      await loadListings()
      refreshSidebarCounts()
      toast.success(`Statut mis à jour → ${STATUS_LABELS[newStatus] ?? newStatus}`)
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = async () => {
    await loadListings()
  }

  // ── Status change from inside the detail modal ────────────────────────────

  const handleModalStatusChanged = useCallback(async (listingId, newStatus) => {
    await loadListings()
    refreshSidebarCounts()

    if (newStatus === 'DELETED') {
      setSelectedListing(null)
      toast.success('Annonce supprimée définitivement.')
      return
    }

    setSelectedListing(prev =>
      prev?.id === listingId ? { ...prev, status: newStatus } : prev
    )

    const label = STATUS_LABELS[newStatus] ?? newStatus
    const toastType = newStatus === 'REJECTED' || newStatus === 'SUSPENDED' ? 'warning' : 'success'
    toast({ message: `Statut mis à jour → ${label}`, type: toastType })
  }, [loadListings, toast])

  const hasActiveFilters = search || status !== 'PENDING' || selectedUser

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <IconCar />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces véhicules</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Modération des annonces automobiles soumises par les vendeurs et concessionnaires
          </p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par modèle, vendeur ou ville..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50
                text-sm text-gray-800 placeholder:text-gray-400 outline-none
                focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20
                transition-all"
            />
          </div>
          <UserFilterDropdown
            value={selectedUser}
            onChange={(user) => setSelectedUser(user)}
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Statut :</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${status === f.key
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
            <span className="text-xs text-gray-400">Filtres actifs :</span>
            {search && (
              <FilterChip label={`"${search}"`} onRemove={() => { setSearch(''); setSearchInput('') }} />
            )}
            {status && status !== 'PENDING' && (
              <FilterChip
                label={STATUS_FILTERS.find(f => f.key === status)?.label}
                onRemove={() => setStatus('PENDING')}
              />
            )}
            {selectedUser && (
              <FilterChip
                label={selectedUser.name || selectedUser.email}
                onRemove={() => setSelectedUser(null)}
              />
            )}
            <button
              onClick={() => { setStatus('PENDING'); setSearch(''); setSearchInput(''); setSelectedUser(null) }}
              className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 ml-1 transition-colors"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            Annonces véhicules
            {pagination.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({pagination.total} résultat{pagination.total > 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        <ListingTable
          listings={listings}
          pagination={pagination}
          onPageChange={setPage}
          onApprove={handleApprove}
          onReject={handleReject}
          onUpdateStatus={handleUpdateStatus}
          onRefresh={handleRefresh}
          onRowClick={(listing) => setSelectedListing(listing)}
          loading={tableLoading}
          showModuleCol={false}
          actionLoading={actionLoading}
          onStatusSuccess={(newStatus) => toast.success(`Statut mis à jour → ${STATUS_LABELS[newStatus] ?? newStatus}`)}
        />
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      <ListingDetailModal
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        listing={selectedListing}
        onStatusChanged={handleModalStatusChanged}
      />
    </div>
  )
}
```

## `frontend/services/carsService.js`

```javascript
// services/carsService.js

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL + "/api"
  : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined"); })();

export const carsService = {
  // ── PUBLIC ──────────────────────────────────────────────────────────────────

  getListings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars?${query}`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des annonces");
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_URL}/cars/categories`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des catégories");
    return res.json();
  },

  getListingById: async (id) => {
    const res = await fetch(`${API_URL}/cars/${id}`);
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  // ── AUTHENTICATED ────────────────────────────────────────────────────────────

  toggleFavorite: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/favorites/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  getFavorites: async (token) => {
    const res = await fetch(`${API_URL}/cars/favorites/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  createInquiry: async (data, token) => {
    const res = await fetch(`${API_URL}/cars/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Erreur envoi message");
    return result;
  },

  // ── BUSINESS ─────────────────────────────────────────────────────────────────

  createListing: async (data, token) => {
    const res = await fetch(`${API_URL}/cars`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(
        result.message || result.errors?.join(", ") || "Erreur création annonce"
      );
    }
    return result;
  },

  getMyListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars/business/my-listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  getMyListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  updateMyListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour");
    return result;
  },

  deleteMyListing: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  getMyListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/cars/business/my-listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  updateInquiryStatus: async (inquiryId, status, token) => {
    const res = await fetch(`${API_URL}/cars/business/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour statut");
    return result;
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────────

  adminGetAllListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars/admin/listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  adminGetListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  getPendingListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars/admin/pending?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces en attente");
    return res.json();
  },

  moderateListing: async (id, action, adminNotes = "", token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/moderate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, adminNotes }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur modération");
    return result;
  },

  suspendListing: async (id, adminNotes = "", token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/suspend`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNotes }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur suspension");
    return result;
  },

  unsuspendListing: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/unsuspend`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur réactivation");
    return result;
  },

  adminUpdateListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour");
    return result;
  },

  adminDeleteListing: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  adminGetListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/cars/admin/listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  adminGetStats: async (token) => {
    const res = await fetch(`${API_URL}/cars/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération statistiques");
    return res.json();
  },
};
```

