const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  getOverview,
  getViewsTimeline,
  getTopListings,
  getBoostImpact,
} = require('../controllers/statsController');
 
router.use(authMiddleware, roleMiddleware('business'));
 
router.get('/overview', getOverview);
router.get('/views-timeline', getViewsTimeline);
router.get('/top-listings', getTopListings);
router.get('/boost-impact', getBoostImpact);
 
module.exports = router;