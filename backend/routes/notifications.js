const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/',              getNotifications);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);

module.exports = router;