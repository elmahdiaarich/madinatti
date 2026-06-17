const prisma = require('../config/db');

// ── Helper — used by other controllers to create notifications ────────────────
const createNotification = async (userId, type, title, body, link = null) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, link }
    });
  } catch (error) {
    console.error('createNotification error:', error);
  }
};

// ── GET /api/notifications ────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const page  = parseInt(req.query.page  || '1');
    const limit = parseInt(req.query.limit || '20');
    const skip  = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Introuvable' });
    if (notif.userId !== userId) return res.status(403).json({ success: false, message: 'Accès refusé' });

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };