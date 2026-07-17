'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const pressController = require('../controllers/pressController');

// ── PUBLIC ──────────────────────────────────────────────────────────────────
// /cities and /favorites/me must be declared BEFORE /:id (same wildcard trap as tourism.js)
router.get('/', pressController.getAllArticles);
router.get('/cities', pressController.getDistinctCities);
router.get('/categories', pressController.getCategories);

// ── AUTHENTICATED ───────────────────────────────────────────────────────────
router.get('/favorites/me', authMiddleware, pressController.getUserFavorites);
router.post('/favorites/:id/toggle', authMiddleware, pressController.toggleFavorite);

// ── PUBLIC (wildcard, must stay LAST) ───────────────────────────────────────
router.get('/:id', pressController.getArticleById);

module.exports = router;