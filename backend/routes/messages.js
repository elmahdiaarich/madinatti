/**
 * backend/routes/messages.js
 */

const express    = require('express')
const router     = express.Router()
const authMiddleware = require('../middlewares/authMiddleware')
const { getMessages, markAsRead, markAllAsRead } = require('../controllers/messageController')

// Toutes les routes nécessitent d'être connecté
router.use(authMiddleware)

// GET  /api/messages              — liste paginée + unreadCount
router.get('/', getMessages)

// PATCH /api/messages/read-all    — marquer tout comme lu  (AVANT /:id/read)
router.patch('/read-all', markAllAsRead)

// PATCH /api/messages/:id/read    — marquer un message comme lu
router.patch('/:id/read', markAsRead)

module.exports = router
