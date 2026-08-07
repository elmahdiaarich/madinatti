const prisma = require('../config/db');
const touristicService = require('../services/touristicService');
const { validateTouristicPayload } = require('../utils/touristicValidator');

const getAllListings = async (req, res) => {
  try {
    const { categorySlug, city, neighborhood, search, page, limit, isActive, openOnly, ...dynamicAttributes } = req.query;
    const filters = { categorySlug, city, neighborhood, search, page, limit, isActive, openOnly, attributes: dynamicAttributes };
    const { listings, pagination } = await touristicService.getTouristicListings(filters);

    const data = listings.map((item) => ({
      ...item,
      category: item.category?.slug,
      categoryDisplayType: item.category?.displayType,
    }));

    res.status(200).json({ success: true, count: data.length, pagination, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des lieux' });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await touristicService.getTouristicListingById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Lieu introuvable' });

    res.status(200).json({
      success: true,
      data: {
        ...listing,
        category: listing.category?.slug,
        categoryDisplayType: listing.category?.displayType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du lieu' });
  }
};

const createTouristicListing = async (req, res) => {
  try {
    const category = req.body.categoryId
      ? await prisma.category.findUnique({ where: { id: req.body.categoryId } })
      : null;

    if (req.body.categoryId && !category) {
      return res.status(400).json({ message: 'Catégorie introuvable', errors: { categoryId: 'Catégorie introuvable.' } });
    }

    const { valid, errors } = validateTouristicPayload(req.body, category, { isUpdate: false });
    if (!valid) {
      return res.status(400).json({ message: 'Données invalides', errors });
    }

    const listing = await touristicService.createTouristicListing(req.body, req.user.userId);
res.status(201).json({
  success: true,
  data: {
    ...listing,
    category: listing.category?.slug,
    categoryDisplayType: listing.category?.displayType,
  },
});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du lieu' });
  }
};

const updateTouristicListing = async (req, res) => {
  try {
    const existing = await touristicService.getTouristicListingById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Lieu introuvable' });

    const categoryId = req.body.categoryId || existing.categoryId;
    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    const { valid, errors } = validateTouristicPayload(req.body, category, { isUpdate: true });
    if (!valid) {
      return res.status(400).json({ message: 'Données invalides', errors });
    }

    const listing = await touristicService.updateTouristicListing(req.params.id, req.body);
res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du lieu' });
  }
};

const deleteTouristicListing = async (req, res) => {
  try {
    await touristicService.deleteTouristicListing(req.params.id);
    res.status(200).json({ success: true, message: 'Lieu supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du lieu' });
  }
};

const trackDownload = async (req, res) => {
  try {
    const listing = await touristicService.incrementDownloadCount(req.params.id);
    if (!listing.fileUrl) return res.status(404).json({ message: 'Aucun fichier' });
    res.status(200).json({ success: true, fileUrl: listing.fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du suivi du téléchargement' });
  }
};

const getDistinctNeighborhoods = async (req, res) => {
  try {
    const data = await touristicService.getDistinctNeighborhoods();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des quartiers' });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createTouristicListing,
  updateTouristicListing,
  deleteTouristicListing,
  trackDownload,
  getDistinctNeighborhoods,
};