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