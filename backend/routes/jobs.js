const express = require('express');
const router = express.Router();
const { getJobs, getJobById, getFiltersCount } = require('../controllers/jobController');

router.get('/', getJobs);
router.get('/filters-count', getFiltersCount);
router.get('/:id', getJobById);

module.exports = router;