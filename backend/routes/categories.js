const express = require('express');
const router = express.Router();
const { handleGetCategories } = require('../controllers/categoryController');

router.get('/', handleGetCategories);

module.exports = router;