const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getAllListings,
  getListingById,
  createProfessionalSpaceListing,
  updateProfessionalSpaceListing,
  deleteProfessionalSpaceListing,
} = require('../controllers/professionalSpaceController');
const favoriteController = require('../controllers/favoriteController');

router.post('/favorites/:id/toggle', authMiddleware, favoriteController.toggleFavorite('PROFESSIONAL_SPACE'));
router.get('/favorites/me', authMiddleware, favoriteController.getUserFavorites('PROFESSIONAL_SPACE'));
router.get('/', getAllListings);
router.get('/:id', getListingById);
router.post('/', authMiddleware, createProfessionalSpaceListing);
router.put('/:id', authMiddleware, updateProfessionalSpaceListing);
router.delete('/:id', authMiddleware, deleteProfessionalSpaceListing);

module.exports = router;