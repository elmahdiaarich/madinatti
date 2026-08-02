'use strict';
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const journalistMiddleware = require('../middlewares/journalistMiddleware');
const pressController = require('../controllers/pressController');
const { createListingLimiter } = require('../middlewares/rateLimiter');
// ── PUBLIC ──────────────────────────────────────────────────────────────────
// /cities and /favorites/me must be declared BEFORE /:id (same wildcard trap as tourism.js)
router.get('/', pressController.getAllArticles);
router.get('/cities', pressController.getDistinctCities);
router.get('/categories', pressController.getCategories);
// ── AUTHENTICATED ───────────────────────────────────────────────────────────
router.get('/favorites/me', authMiddleware, pressController.getUserFavorites);
router.post('/favorites/:id/toggle', authMiddleware, pressController.toggleFavorite);
// ── JOURNALIST ───────────────────────────────────────────────────────────────
// Image déjà uploadée en amont via /api/upload/images (pattern identique à WorkerProfile.photo)
router.get('/mine/list', authMiddleware, journalistMiddleware, pressController.getMyArticles);
router.post('/', createListingLimiter, authMiddleware, journalistMiddleware, pressController.createArticle);
router.put('/:id', createListingLimiter, authMiddleware, journalistMiddleware, pressController.updateArticle);
router.delete('/:id', authMiddleware, journalistMiddleware, pressController.deleteArticle);
router.post('/categories', authMiddleware, journalistMiddleware, pressController.createJournalistCategory);
// ── PUBLIC (wildcard, must stay LAST) ───────────────────────────────────────
router.get('/:id', pressController.getArticleById);
module.exports = router;