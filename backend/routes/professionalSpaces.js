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

router.get('/', getAllListings);
router.get('/:id', getListingById);
router.post('/', authMiddleware, createProfessionalSpaceListing);
router.put('/:id', authMiddleware, updateProfessionalSpaceListing);
router.delete('/:id', authMiddleware, deleteProfessionalSpaceListing);

module.exports = router;