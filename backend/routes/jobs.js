const express = require('express');
const router = express.Router();
const { getJobs, getJobById } = require('../controllers/jobController');

router.get('/', getJobs);
router.get('/:id', getJobById);

module.exports = router;