const touristicService = require('../services/touristicService');

const getAllListings = async (req, res) => {
  try {
    const { categorySlug, city, neighborhood, search, page, limit, ...dynamicAttributes } = req.query;
    const filters = { categorySlug, city, neighborhood, search, page, limit, attributes: dynamicAttributes };
    const { listings, pagination } = await touristicService.getTouristicListings(filters);

    // Flatten the joined category relation down to its slug so the
    // frontend can key straight into TOURISM_CATEGORIES[item.category].
    const data = listings.map((item) => ({
      ...item,
      category: item.category?.slug,
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

    // Same flattening here so the detail page gets a consistent shape.
    res.status(200).json({
      success: true,
      data: { ...listing, category: listing.category?.slug },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du lieu' });
  }
};

const createTouristicListing = async (req, res) => {
  try {
    const listing = await touristicService.createTouristicListing(req.body, req.user.id);
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du lieu' });
  }
};

const updateTouristicListing = async (req, res) => {
  try {
    const listing = await touristicService.updateTouristicListing(req.params.id, req.body);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
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

module.exports = { getAllListings, getListingById, createTouristicListing, updateTouristicListing, deleteTouristicListing };