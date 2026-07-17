// backend/controllers/favoriteController.js
const favoriteService = require('../services/favoriteService');

const toggleFavorite = (itemType) => async (req, res) => {
  try {
    const { id } = req.params;
    const result = await favoriteService.toggleFavorite(req.user.userId, id, itemType);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[toggleFavorite ${itemType}]`, err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getUserFavorites = (itemType) => async (req, res) => {
  try {
    const listings = await favoriteService.getUserFavorites(req.user.userId, itemType);
    return res.json({ success: true, data: listings });
  } catch (err) {
    console.error(`[getUserFavorites ${itemType}]`, err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
};