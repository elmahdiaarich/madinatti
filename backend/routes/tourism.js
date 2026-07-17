const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const touristicController = require('../controllers/touristicController');

const favoriteController = require('../controllers/favoriteController');

router.post('/favorites/:id/toggle', authMiddleware, favoriteController.toggleFavorite('TOURISM'));
router.get('/favorites/me', authMiddleware, favoriteController.getUserFavorites('TOURISM'));
// -------------------------------------------------------------
// PUBLIC ROUTES (Anyone can browse tourism listings)
// -------------------------------------------------------------
// Replace lines 10-11 in backend/routes/tourism.js with this:
router.get('/', touristicController.getAllListings);
router.get('/neighborhoods', touristicController.getDistinctNeighborhoods); // MUST go before /:id
router.get('/:id', touristicController.getListingById);

// -------------------------------------------------------------
// ADMIN-ONLY ROUTES (Protected by your middlewares)
// -------------------------------------------------------------
router.post('/', authMiddleware, roleMiddleware('admin'), touristicController.createTouristicListing);
router.put('/:id', authMiddleware, roleMiddleware('admin'), touristicController.updateTouristicListing);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), touristicController.deleteTouristicListing);

//download route
router.patch('/:id/download', touristicController.trackDownload);


module.exports = router;
