const express    = require('express')
const router     = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const roleMiddleware = require('../middlewares/roleMiddleware')
const {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
  getUsers,
  toggleUser,
  getBusinesses,
  updateListingStatus,   // ← ajouté
  deleteListing,  
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
  deleteModule 
} = require('../controllers/adminController')

const {
  getReports    : getReportsList,
  updateReport  : patchReport,
  getReportStats,
  getReportById,
  dismissReport,
  removeListingFromReport,
  suspendOwner,
  contactOwner,
} = require('../controllers/reportController')
 
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
 // PATCH /api/admin/listings/:id/reject   body: { adminNote }
router.patch('/listings/:id/reject', rejectListing)

// PATCH /api/admin/listings/:id/status   body: { status, adminNotes, module }
router.patch('/listings/:id/status', updateListingStatus)

// DELETE /api/admin/listings/:id
router.delete('/listings/:id', deleteListing)
// ── Reports (signalements) ────────────────────────────────────────────────────
// GET /api/admin/reports/stats  — doit être AVANT /reports/:id
router.get('/reports/stats', getReportStats)

// GET /api/admin/reports?status=&type=&page=&limit=
router.get('/reports', getReportsList)

// GET /api/admin/reports/:id  — détail complet
router.get('/reports/:id', getReportById)

// PATCH /api/admin/reports/:id   body: { status, adminNotes }
router.patch('/reports/:id', patchReport)

// POST /api/admin/reports/:id/dismiss   → innocenter
router.post('/reports/:id/dismiss', dismissReport)

// DELETE /api/admin/reports/:id/listing → retirer l'annonce
router.delete('/reports/:id/listing', removeListingFromReport)

// PATCH /api/admin/reports/:id/suspend  → suspendre le propriétaire
router.patch('/reports/:id/suspend', suspendOwner)

// POST /api/admin/reports/:id/contact   body: { message }
router.post('/reports/:id/contact', contactOwner)
 
// ── Users ─────────────────────────────────────────────────────────────────────
// GET /api/admin/users?search=&role=&page=&limit=
router.get('/users', getUsers)
 
// PATCH /api/admin/users/:id/toggle
router.patch('/users/:id/toggle', toggleUser)
 
// ── Businesses ────────────────────────────────────────────────────────────────
// GET /api/admin/businesses
router.get('/businesses', getBusinesses)

// ── Categories ────────────────────────────────────────────────────────────────
// GET    /api/admin/categories?parentSlug=emploi|immobilier
router.get('/categories', getCategories)

// POST   /api/admin/categories   body: { name, parentId }
router.post('/categories', createCategory)

// PATCH  /api/admin/categories/:id   body: { name }
router.patch('/categories/:id', updateCategory)

// PATCH  /api/admin/categories/:id/toggle
router.patch('/categories/:id/toggle', toggleCategoryActive)

// DELETE /api/admin/categories/:id
router.delete('/categories/module/:module', deleteModule)
router.delete('/categories/:id', deleteCategory)

 
module.exports = router
