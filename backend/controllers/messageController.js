/**
 * backend/controllers/messageController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gère les messages internes Business (REJECTION, REPORT_CONTACT).
 *
 * GET  /api/messages            → liste paginée + unreadCount
 * PATCH /api/messages/read-all  → marquer tout comme lu
 * PATCH /api/messages/:id/read  → marquer un message comme lu
 */

const prisma = require('../config/db')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages?page=1&limit=20
// ─────────────────────────────────────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' })

    const page  = parseInt(req.query.page  || '1')
    const limit = parseInt(req.query.limit || '20')
    const skip  = (page - 1) * limit

    const [messages, total, unreadCount] = await Promise.all([
      prisma.businessMessage.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.businessMessage.count({ where: { userId } }),
      prisma.businessMessage.count({ where: { userId, isRead: false } }),
    ])

    res.json({
      success: true,
      data: messages,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('getMessages error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/messages/:id/read
// ─────────────────────────────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' })

    const { id } = req.params

    const msg = await prisma.businessMessage.findUnique({ where: { id } })
    if (!msg)             return res.status(404).json({ success: false, message: 'Message introuvable' })
    if (msg.userId !== userId) return res.status(403).json({ success: false, message: 'Accès refusé' })

    await prisma.businessMessage.update({ where: { id }, data: { isRead: true } })
    res.json({ success: true })
  } catch (error) {
    console.error('markAsRead error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/messages/read-all
// ─────────────────────────────────────────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ success: false, message: 'Non autorisé' })

    await prisma.businessMessage.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    })
    res.json({ success: true, message: 'Tous les messages marqués comme lus.' })
  } catch (error) {
    console.error('markAllAsRead error:', error)
    res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

module.exports = { getMessages, markAsRead, markAllAsRead }
