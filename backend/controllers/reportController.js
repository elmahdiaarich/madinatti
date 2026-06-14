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

    const validTargets = ['REAL_ESTATE', 'JOB', 'USER']
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

    // Le rapport principal
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true, role: { select: { name: true } } } },
      },
    })
    if (!report) return res.status(404).json({ success: false, message: 'Signalement introuvable' })

    // Tous les reporters sur la même cible
    const allReporters = await prisma.report.findMany({
      where: { targetId: report.targetId, targetType: report.targetType },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
      },
    })

    // Propriétaire de l'annonce + info annonce
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
    }

    // Nombre d'autres annonces du propriétaire
    let ownerListingsCount = 0
    if (owner?.id) {
      const [jobs, res2] = await Promise.all([
        prisma.jobListing.count({ where: { userId: owner.id } }),
        prisma.realEstateListing.count({ where: { userId: owner.id } }),
      ])
      ownerListingsCount = jobs + res2
    }

    res.json({
      success: true,
      data: {
        report,
        allReporters,
        listingInfo,
        owner,
        ownerListingsCount,
      },
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

    // Remettre l'annonce en ligne
    if (report.targetType === 'JOB') {
      await prisma.jobListing.updateMany({ where: { id: report.targetId }, data: { status: 'APPROVED' } })
    } else if (report.targetType === 'REAL_ESTATE') {
      await prisma.realEstateListing.updateMany({ where: { id: report.targetId }, data: { status: 'APPROVED' } })
    }

    // Clôturer TOUS les rapports sur cette cible en REJECTED
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
    }

    // Clôturer tous les rapports sur cette cible en RESOLVED
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

    // Récupérer le userId de l'annonce
    let ownerId = null
    if (report.targetType === 'JOB') {
      const job = await prisma.jobListing.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = job?.userId
    } else if (report.targetType === 'REAL_ESTATE') {
      const re = await prisma.realEstateListing.findUnique({ where: { id: report.targetId }, select: { userId: true } })
      ownerId = re?.userId
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
    }

    if (!owner?.email) {
      return res.status(404).json({ success: false, message: 'Email du propriétaire introuvable' })
    }

    // Créer un message interne BusinessMessage (si le propriétaire a un compte)
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
    }

    // Envoyer l'email (si échoue en local, on ne bloque pas le processus)
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

module.exports = { createReport, getReports, getReportById, updateReport, getReportStats,
                   dismissReport, removeListingFromReport, suspendOwner, contactOwner }

