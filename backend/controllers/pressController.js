'use strict';

const pressService = require('../services/press');

const getAllArticles = async (req, res) => {
  try {
    const { language, city, categoryId, contentType, search, page, limit } = req.query;
    const { articles, pagination } = await pressService.getArticles({
      language,
      city,
      categoryId,
      contentType,
      search,
      page,
      limit,
    });

    const data = articles.map((a) => ({
      ...a,
      category: a.category?.slug ?? null,
      authorName: a.source === 'ORIGINAL' ? (a.user?.name || null) : null,
      user: undefined,
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
      data: {
        ...article,
        category: article.category?.slug ?? null,
        authorName: article.source === 'ORIGINAL' ? (article.user?.name || null) : null,
        user: undefined, // ne pas exposer l'objet user complet publiquement
      },
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
    const categories = await pressService.getCategories(req.query.language);
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

const createArticle = async (req, res) => {
  try {
    const { title, description, city, categoryId, language, imageUrl } = req.body;
    if (!title || !description || !language) {
      return res.status(400).json({ success: false, message: 'Titre, description et langue sont requis' });
    }

    const article = await pressService.createArticle(req.user.userId, {
      title, description, imageUrl, city, categoryId, language,
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('[press/createArticle]', error);
    const status = ['IMAGE_REQUIRED', 'VIDEO_REQUIRED', 'INVALID_CONTENT_TYPE', 'TITLE_TOO_LONG', 'DESCRIPTION_TOO_LONG', 'TITLE_TOO_SHORT', 'DESCRIPTION_TOO_SHORT'].includes(error.code) ? 400 : 500;    res.status(status).json({ success: false, message: error.message || 'Erreur serveur' });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { title, description, city, categoryId, language, imageUrl } = req.body;

    const article = await pressService.updateArticle(req.params.id, req.user.userId, {
      title, description, imageUrl, city, categoryId, language,
    });

    res.status(200).json({ success: true, data: article });
  } catch (error) {
    console.error('[press/updateArticle]', error);
    const status = ['IMAGE_REQUIRED', 'VIDEO_REQUIRED', 'INVALID_CONTENT_TYPE', 'TITLE_TOO_LONG', 'DESCRIPTION_TOO_LONG'].includes(error.code) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Erreur serveur' });
  }
};

const getMyArticles = async (req, res) => {
  try {
    const data = await pressService.getMyArticles(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[press/getMyArticles]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const createJournalistCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { category, alreadyExisted } = await pressService.createCategory(name);
    res.status(201).json({ success: true, data: category, alreadyExisted });
  } catch (error) {
    console.error('[press/createJournalistCategory]', error);
    const status = error.code === 'INVALID_NAME' ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Erreur serveur' });
  }
};

module.exports = {
  getAllArticles,
  getArticleById,
  getDistinctCities,
  getCategories,
  toggleFavorite,
  getUserFavorites,
  createArticle,
  updateArticle,
  getMyArticles,
  createJournalistCategory,
};