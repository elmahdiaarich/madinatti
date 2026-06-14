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
 
const prisma = require('../config/db')
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/overview
// ─────────────────────────────────────────────────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
 
    const [
      pendingJobs,
      pendingRealEstate,
      approvedTodayJobs,
      approvedTodayRealEstate,
      openReports,
      totalUsers,
    ] = await Promise.all([
      // Pending jobs
      prisma.jobListing.count({ where: { status: 'PENDING' } }),
 
      // Pending real estate
      prisma.realEstateListing.count({ where: { status: 'PENDING' } }),
 
      // Approved today — jobs
      prisma.jobListing.count({
        where: {
          status: 'APPROVED',
          publishedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
 
      // Approved today — real estate
      prisma.realEstateListing.count({
        where: {
          status: 'APPROVED',
          publishedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
 
      // Open reports — using Favorite as report placeholder (adjust if you add a Report model)
      // NOTE: Replace with your Report model if added. Currently returns 0.
      Promise.resolve(0),
 
      // Total users
      prisma.user.count(),
    ])
 
    res.json({
      success: true,
      data: {
        pending:       pendingJobs + pendingRealEstate,
        approvedToday: approvedTodayJobs + approvedTodayRealEstate,
        openReports,
        totalUsers,
      },
    })
  } catch (error) {
    console.error('admin getOverview error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/listings
// Query params: module (emploi|immobilier|vehicule|tous), status, search, page, limit
// ─────────────────────────────────────────────────────────────────────────────
const getListings = async (req, res) => {
  try {
    const {
      module: mod = 'tous',
      status = '',
      search = '',
      page   = 1,
      limit  = 10,
    } = req.query
 
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)
 
    // ── Jobs ────────────────────────────────────────────────────────────────
    const jobWhere = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { location:    { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
 
    // ── Real Estate ─────────────────────────────────────────────────────────
    // Statut unifié: l'API et la BDD utilisent APPROVED / REJECTED / PENDING
    const reStatus = status;
 
    const reWhere = {
      ...(reStatus && { status: reStatus }),
      ...(search && {
        OR: [
          { title:    { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { city:     { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
 
    let jobs       = []
    let realEstate = []
 
    if (mod === 'tous' || mod === 'emploi') {
      jobs = await prisma.jobListing.findMany({
        where: jobWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id:          true,
          title:       true,
          companyName: true,
          location:    true,
          contractType: true,
          status:      true,
          adminNotes:  true,
          description: true,
          createdAt:   true,
          user: { select: { id: true, name: true, email: true } },
        },
      })
    }
 
    if (mod === 'tous' || mod === 'immobilier') {
      realEstate = await prisma.realEstateListing.findMany({
        where: reWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id:           true,
          title:        true,
          location:     true,
          city:         true,
          listingType:  true,
          status:       true,
          adminNotes:   true,
          createdAt:    true,
          user: { select: { id: true, name: true, email: true, companyName: true } },
        },
      })
    }
 
    // ── Normalize to common shape ────────────────────────────────────────────
    const normalizeJob = (j) => ({
      id:              j.id,
      module:          'emploi',
      title:           j.title,
      company:         j.companyName,
      submittedBy:     j.user?.name || j.companyName,
      submittedByEmail: j.user?.email || '',
      submittedById:   j.user?.id || '',
      city:            j.location,
      contractType:    j.contractType,
      status:          j.status,
      adminNote:       j.adminNotes || null,
      description:     j.description || null,
      createdAt:       j.createdAt,
    })
 
    const normalizeRE = (r) => {
      // Statut directement unifié (APPROVED, REJECTED, PENDING)
      return {
        id:              r.id,
        module:          'immobilier',
        title:           r.title,
        company:         r.user?.companyName || r.user?.name || '',
        submittedBy:     r.user?.companyName || r.user?.name || '',
        submittedByEmail: r.user?.email || '',
        submittedById:   r.user?.id || '',
        city:            r.city || r.location,
        contractType:    r.listingType,
        status:          r.status,
        adminNote:       r.adminNotes || null,
        createdAt:       r.createdAt,
      }
    }
 
    // ── Merge, sort, paginate ────────────────────────────────────────────────
    const all = [
      ...jobs.map(normalizeJob),
      ...realEstate.map(normalizeRE),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
 
    const total     = all.length
    const paginated = all.slice(skip, skip + take)
 
    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      take,
        totalPages: Math.ceil(total / take),
      },
    })
  } catch (error) {
    console.error('admin getListings error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/approve
// Détecte si c'est un job ou un bien immo par l'id (essaie les deux)
// ─────────────────────────────────────────────────────────────────────────────
const approveListing = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user.userId
    const now = new Date()

    // Essai job d'abord
    const job = await prisma.jobListing.findUnique({ where: { id } })
    if (job) {
      if (job.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: 'Cette annonce n\'est pas en attente' })
      }
      await prisma.jobListing.update({
        where: { id },
        data: {
          status:      'APPROVED',
          publishedAt:  now,
          reviewedAt:   now,
          reviewedBy:   adminId,
          adminNotes:   null,
        },
      })
      return res.json({ success: true, message: 'Offre d\'emploi approuvée' })
    }

    // Essai immobilier
    const re = await prisma.realEstateListing.findUnique({ where: { id } })
    if (re) {
      if (re.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: 'Cette annonce n\'est pas en attente' })
      }

      // Move images from temp/ to real-estate/
      const images = re.images || []
      const movedImages = await Promise.all(
        images.map(async (img) => {
          try {
            // Extract public_id from URL — e.g. "madinatti/temp/abc123"
            const urlParts = img.url.split('/upload/')
            const withVersion = urlParts[1] // e.g. "v1234567/madinatti/temp/abc123.jpg"
            const withoutVersion = withVersion.replace(/^v\d+\//, '') // "madinatti/temp/abc123.jpg"
            const oldPublicId = withoutVersion.replace(/\.[^/.]+$/, '') // remove extension

            const newPublicId = oldPublicId.replace('madinatti/temp', 'madinatti/real-estate')

            const result = await cloudinary.uploader.rename(oldPublicId, newPublicId)
            return { ...img, url: result.secure_url }
          } catch (err) {
            console.error('Failed to move image:', img.url, err.message)
            return img // keep original if move fails, don't block approval
          }
        })
      )

      await prisma.realEstateListing.update({
        where: { id },
        data: {
          status:      'APPROVED',
          publishedAt:  now,
          reviewedAt:   now,
          reviewedBy:   adminId,
          adminNotes:   null,
          images:       movedImages,
        },
      })
      return res.json({ success: true, message: 'Annonce immobilière approuvée' })
    }

    res.status(404).json({ success: false, message: 'Annonce introuvable' })
  } catch (error) {
    console.error('admin approveListing error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/listings/:id/reject
// Body: { adminNote }
// ─────────────────────────────────────────────────────────────────────────────
const rejectListing = async (req, res) => {
  try {
    const { id } = req.params
    const { adminNote = '' } = req.body
    const adminId = req.user.userId
    const now = new Date()

    // Essai job
    const job = await prisma.jobListing.findUnique({ where: { id } })
    if (job) {
      await prisma.jobListing.update({
        where: { id },
        data: {
          status:     'REJECTED',
          adminNotes:  adminNote,
          reviewedAt:  now,
          reviewedBy:  adminId,
        },
      })

      // Créer un message business
      await prisma.businessMessage.create({
        data: {
          userId:       job.userId,
          type:         'REJECTION',
          targetType:   'JOB',
          targetId:     id,
          targetTitle:  job.title,
          adminMessage: adminNote || '',
        },
      })

      return res.json({ success: true, message: 'Offre d\'emploi refusée' })
    }

    // Essai immobilier
    const re = await prisma.realEstateListing.findUnique({ where: { id } })
    if (re) {
      // Delete images from Cloudinary temp folder
      const images = re.images || []
      await Promise.all(
        images.map(async (img) => {
          try {
            const urlParts = img.url.split('/upload/')
            const withVersion = urlParts[1]
            const withoutVersion = withVersion.replace(/^v\d+\//, '')
            const publicId = withoutVersion.replace(/\.[^/.]+$/, '')
            await cloudinary.uploader.destroy(publicId)
          } catch (err) {
            console.error('Failed to delete image:', img.url, err.message)
            // don't block rejection if delete fails
          }
        })
      )

      await prisma.realEstateListing.update({
        where: { id },
        data: {
          status:     'REJECTED',
          adminNotes:  adminNote,
          reviewedAt:  now,
          reviewedBy:  adminId,
        },
      })

      // Créer un message business
      await prisma.businessMessage.create({
        data: {
          userId:       re.userId,
          type:         'REJECTION',
          targetType:   'REAL_ESTATE',
          targetId:     id,
          targetTitle:  re.title,
          adminMessage: adminNote || '',
        },
      })

      return res.json({ success: true, message: 'Annonce immobilière refusée' })
    }

    res.status(404).json({ success: false, message: 'Annonce introuvable' })
  } catch (error) {
    console.error('admin rejectListing error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
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
    res.json({ success: true, data: [] })
  } catch (error) {
    console.error('admin getReports error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/reports/:id
// Body: { action: 'dismiss' | 'delete' }
// NOTE: Placeholder until Report model is added.
// ─────────────────────────────────────────────────────────────────────────────
const handleReport = async (req, res) => {
  try {
    const { id } = req.params
    const { action } = req.body
 
    if (!['dismiss', 'delete'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action invalide. Utilisez dismiss ou delete.' })
    }
 
    // Real implementation once Report model is added:
    // if (action === 'dismiss') {
    //   await prisma.report.update({ where: { id }, data: { status: 'DISMISSED' } })
    // } else if (action === 'delete') {
    //   const report = await prisma.report.findUnique({ where: { id } })
    //   // Delete the listing too
    //   await prisma.report.update({ where: { id }, data: { status: 'DELETED' } })
    // }
 
    res.json({ success: true, message: `Signalement ${action === 'dismiss' ? 'ignoré' : 'traité'}` })
  } catch (error) {
    console.error('admin handleReport error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query params: search, role, page, limit
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)
 
    const where = {
      ...(search && {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role: { name: role } }),
    }
 
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id:       true,
          name:     true,
          email:    true,
          city:     true,
          avatar:   true,
          isActive: true,
          createdAt: true,
          role: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ])
 
    const normalized = users.map((u) => ({
      ...u,
      role: u.role?.name || 'citizen',
    }))
 
    res.json({
      success: true,
      data: normalized,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      take,
        totalPages: Math.ceil(total / take),
      },
    })
  } catch (error) {
    console.error('admin getUsers error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle
// Flips isActive. Cannot toggle admin users.
// ─────────────────────────────────────────────────────────────────────────────
const toggleUser = async (req, res) => {
  try {
    const { id } = req.params
 
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    })
 
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' })
    }
 
    if (user.role?.name === 'admin') {
      return res.status(403).json({ success: false, message: 'Impossible de désactiver un compte admin' })
    }
 
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    })
 
    res.json({
      success:  true,
      isActive: updated.isActive,
      message:  updated.isActive ? 'Compte réactivé' : 'Compte désactivé',
    })
  } catch (error) {
    console.error('admin toggleUser error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/businesses
// Returns business users with their listing stats
// ─────────────────────────────────────────────────────────────────────────────
const getBusinesses = async (req, res) => {
  try {
    const businessRole = await prisma.role.findUnique({ where: { name: 'business' } })
 
    if (!businessRole) {
      return res.json({ success: true, data: [] })
    }
 
    const businesses = await prisma.user.findMany({
      where: { roleId: businessRole.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id:             true,
        name:           true,
        email:          true,
        city:           true,
        isActive:       true,
        companyName:    true,
        companyLogo:    true,
        companyWebsite: true,
        createdAt:      true,
        subscriptions: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: {
            status:    true,
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
    })
 
    const normalized = businesses.map((b) => {
      // Combine job + real estate listings
      const allListings = [
        ...b.jobListings.map((l) => ({ status: l.status })),
        ...b.realEstateListings.map((l) => ({
          status: l.status,
        })),
      ]
 
      const activeSub = b.subscriptions[0]
      const plan = activeSub?.plan?.name || 'Standard'
 
      return {
        id:               b.id,
        name:             b.companyName || b.name,
        email:            b.email,
        city:             b.city || '—',
        isActive:         b.isActive,
        plan,
        joinedAt:         b.createdAt,
        totalListings:    allListings.length,
        pendingListings:  allListings.filter((l) => l.status === 'PENDING').length,
        publishedListings: allListings.filter((l) => l.status === 'APPROVED').length,
        rejectedListings: allListings.filter((l) => l.status === 'REJECTED').length,
      }
    })
 
    res.json({ success: true, data: normalized })
  } catch (error) {
    console.error('admin getBusinesses error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utility — convert a name to a slug.
 * e.g. "Informatique & Tech" → "informatique-tech"
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/categories
// Query: parentSlug (e.g. "emploi" | "immobilier") — optional filter
// Returns parent categories with their children and listing counts.
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { parentSlug } = req.query

    const where = parentSlug
      ? { parentId: null, slug: parentSlug }
      : { parentId: null }

    const parents = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                jobListings: true,
                realEstateListings: true,
              },
            },
          },
        },
        _count: {
          select: {
            jobListings: true,
            realEstateListings: true,
          },
        },
      },
    })

    res.json({ success: true, data: parents })
  } catch (error) {
    console.error('admin getCategories error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/categories
// Body: { name, parentId }
// Creates a new child category under a given parent.
// ─────────────────────────────────────────────────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, parentId } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' })
    }
    if (!parentId) {
      return res.status(400).json({ success: false, message: 'parentId est requis' })
    }

    const parent = await prisma.category.findUnique({ where: { id: parentId } })
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Catégorie parente introuvable' })
    }

    const slug = `${parent.slug}-${toSlug(name.trim())}`

    // Check for slug collision
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Une catégorie avec ce nom existe déjà' })
    }

    const category = await prisma.category.create({
      data: {
        name:     name.trim(),
        slug,
        isActive: true,
        parentId,
      },
    })

    res.status(201).json({ success: true, data: category })
  } catch (error) {
    console.error('admin createCategory error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id
// Body: { name }
// Renames a category and regenerates its slug.
// ─────────────────────────────────────────────────────────────────────────────
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom est requis' })
    }

    const cat = await prisma.category.findUnique({ where: { id } })
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' })
    }

    // Rebuild slug: if it's a child, prefix with parent slug
    let newSlug
    if (cat.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: cat.parentId } })
      newSlug = `${parent.slug}-${toSlug(name.trim())}`
    } else {
      newSlug = toSlug(name.trim())
    }

    // Check collision (exclude self)
    const collision = await prisma.category.findFirst({
      where: { slug: newSlug, NOT: { id } },
    })
    if (collision) {
      return res.status(409).json({ success: false, message: 'Une catégorie avec ce nom existe déjà' })
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug: newSlug },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('admin updateCategory error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id/toggle
// Flips isActive. Toggling a parent also cascades to children.
// ─────────────────────────────────────────────────────────────────────────────
const toggleCategoryActive = async (req, res) => {
  try {
    const { id } = req.params

    const cat = await prisma.category.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    })
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' })
    }

    const newValue = !cat.isActive

    // Update the category itself
    await prisma.category.update({ where: { id }, data: { isActive: newValue } })

    // Cascade to children if it's a parent
    if (cat.children.length > 0) {
      await prisma.category.updateMany({
        where: { parentId: id },
        data: { isActive: newValue },
      })
    }

    res.json({
      success:  true,
      isActive: newValue,
      message:  newValue ? 'Catégorie activée' : 'Catégorie désactivée',
    })
  } catch (error) {
    console.error('admin toggleCategoryActive error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/categories/:id
// Blocks deletion if the category has linked job or real-estate listings.
// ─────────────────────────────────────────────────────────────────────────────
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobListings:        true,
            realEstateListings: true,
            children:           true,
          },
        },
      },
    })
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Catégorie introuvable' })
    }

    const totalListings = cat._count.jobListings + cat._count.realEstateListings
    if (totalListings > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer : ${totalListings} annonce(s) sont liées à cette catégorie. Désactivez-la à la place.`,
      })
    }

    if (cat._count.children > 0) {
      return res.status(409).json({
        success: false,
        message: 'Impossible de supprimer une catégorie parente qui a des sous-catégories.',
      })
    }

    await prisma.category.delete({ where: { id } })

    res.json({ success: true, message: 'Catégorie supprimée' })
  } catch (error) {
    console.error('admin deleteCategory error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

module.exports = {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
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
}
 