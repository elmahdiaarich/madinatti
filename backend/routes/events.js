const express = require('express');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const eventController = require('../controllers/eventController');

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const softAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    req.user = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
};

router.get('/categories', eventController.getCategories);
router.get('/mine', authMiddleware, eventController.getMyEvents);
router.get('/favorites/me', authMiddleware, eventController.getFavoriteEvents);
router.get('/admin', authMiddleware, roleMiddleware('admin'), eventController.getAdminEvents);
router.post('/admin/import-csv', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), eventController.importCsv);
router.post('/admin/import-ics', authMiddleware, roleMiddleware('admin'), importUpload.single('file'), eventController.importIcs);
router.patch('/admin/:id/status', authMiddleware, roleMiddleware('admin'), eventController.updateStatus);

router.get('/', softAuth, eventController.getEvents);
router.post('/', authMiddleware, roleMiddleware('citizen', 'business', 'admin'), eventController.createEvent);
router.get('/:id/occurrences', softAuth, eventController.getOccurrences);
router.get('/:idOrSlug', softAuth, eventController.getEventByIdOrSlug);
router.patch('/:id', authMiddleware, roleMiddleware('citizen', 'business', 'admin'), eventController.updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware('citizen', 'business', 'admin'), eventController.deleteEvent);
router.post('/:id/favorite', authMiddleware, eventController.addFavorite);
router.delete('/:id/favorite', authMiddleware, eventController.removeFavorite);

module.exports = router;
