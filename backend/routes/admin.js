
const express    = require('express')
const router     = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
  getReports,
  handleReport,
  getUsers,
  toggleUser,
  getBusinesses,
} = require('../controllers/adminController')
 
// ── Middleware global sur toutes les routes admin ─────────────────────────────
router.use(authMiddleware)
router.use(roleMiddleware('admin'))
 
// ── Overview ──────────────────────────────────────────────────────────────────
// GET /api/admin/overview
// Returns: { pending, approvedToday, openReports, totalUsers }
router.get('/overview', getOverview)
 
// ── Listings ──────────────────────────────────────────────────────────────────
// GET /api/admin/listings?module=&status=&search=&page=&limit=
router.get('/listings', getListings)
 
// PATCH /api/admin/listings/:id/approve
router.patch('/listings/:id/approve', approveListing)
 
// PATCH /api/admin/listings/:id/reject   body: { adminNote }
router.patch('/listings/:id/reject', rejectListing)
 
// ── Reports ───────────────────────────────────────────────────────────────────
// GET /api/admin/reports
router.get('/reports', getReports)
 
// PATCH /api/admin/reports/:id   body: { action: 'dismiss' | 'delete' }
router.patch('/reports/:id', handleReport)
 
// ── Users ─────────────────────────────────────────────────────────────────────
// GET /api/admin/users?search=&role=&page=&limit=
router.get('/users', getUsers)
 
// PATCH /api/admin/users/:id/toggle
router.patch('/users/:id/toggle', toggleUser)
 
// ── Businesses ────────────────────────────────────────────────────────────────
// GET /api/admin/businesses
router.get('/businesses', getBusinesses)
 
module.exports = router