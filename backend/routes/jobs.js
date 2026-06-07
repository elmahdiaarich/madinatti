const express = require('express');
const router = express.Router();
const { getJobs, getJobById, getFiltersCount, createJob } = require('../controllers/jobController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
 
router.get('/', getJobs);
router.get('/filters-count', getFiltersCount);
router.get('/:id', getJobById);
 
// ── Business only ──────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('business'), createJob);
 
module.exports = router;
 