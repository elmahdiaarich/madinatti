const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const touristicController = require('../controllers/touristicController');

// -------------------------------------------------------------
// PUBLIC ROUTES (Anyone can browse tourism listings)
// -------------------------------------------------------------
router.get('/', touristicController.getAllListings);
router.get('/:id', touristicController.getListingById);

// -------------------------------------------------------------
// ADMIN-ONLY ROUTES (Protected by your middlewares)
// -------------------------------------------------------------
router.post('/', authMiddleware, roleMiddleware('admin'), touristicController.createTouristicListing);
router.put('/:id', authMiddleware, roleMiddleware('admin'), touristicController.updateTouristicListing);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), touristicController.deleteTouristicListing);

module.exports = router;
