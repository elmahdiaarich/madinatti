'use strict';

const pressService = require('../services/press');

const getAllArticles = async (req, res) => {
  try {
    const { language, city, categoryId, search, page, limit } = req.query;
    const { articles, pagination } = await pressService.getArticles({
      language,
      city,
      categoryId,
      search,
      page,
      limit,
    });

    const data = articles.map((a) => ({
      ...a,
      category: a.category?.slug ?? null,
    }));

    res.status(200).json({ success: true, count: data.length, pagination, data });
  } catch (error) {
    console.error('[press/getAllArticles]', error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de la presse" });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await pressService.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'Article introuvable' });

    res.status(200).json({
      success: true,
      data: { ...article, category: article.category?.slug ?? null },
    });
  } catch (error) {
    console.error('[press/getArticleById]', error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'article" });
  }
};

const getDistinctCities = async (req, res) => {
  try {
    const cities = await pressService.getDistinctCities(req.query.language);
    res.status(200).json({ success: true, data: cities });
  } catch (error) {
    console.error('[press/getDistinctCities]', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des villes' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await pressService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[press/getCategories]', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catégories' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const result = await pressService.toggleFavorite(req.user.userId, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[press/toggleFavorite]', error);
    res.status(500).json({ success: false, message: 'Erreur favoris' });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const data = await pressService.getUserFavorites(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[press/getUserFavorites]', error);
    res.status(500).json({ success: false, message: 'Erreur favoris' });
  }
};

module.exports = {
  getAllArticles,
  getArticleById,
  getDistinctCities,
  getCategories,
  toggleFavorite,
  getUserFavorites,
};