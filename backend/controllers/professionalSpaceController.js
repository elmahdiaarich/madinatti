const { PrismaClient } = require('@prisma/client');
const professionalSpaceService = require('../services/professionalSpaceService');

const prisma = new PrismaClient();

const getAllListings = async (req, res) => {
  try {
    const { categorySlug, city, search, page, limit, isActive } = req.query;
    const filters = { categorySlug, city, search, page, limit, isActive };
    const { listings, pagination } = await professionalSpaceService.getProfessionalSpaceListings(filters);

    const data = listings.map((item) => ({
      ...item,
      category: item.category?.slug,
    }));

    res.status(200).json({ success: true, count: data.length, pagination, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des espaces' });
  }
};

const getListingById = async (req, res) => {
  try {
    const listing = await professionalSpaceService.getProfessionalSpaceListingById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Espace introuvable' });

    res.status(200).json({
      success: true,
      data: { ...listing, category: listing.category?.slug },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'espace' });
  }
};

const createProfessionalSpaceListing = async (req, res) => {
  try {
    if (req.body.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: req.body.categoryId } });
      if (!category) {
        return res.status(400).json({ message: 'Catégorie introuvable', errors: { categoryId: 'Catégorie introuvable.' } });
      }
    }

    if (!req.body.name) {
      return res.status(400).json({ message: 'Données invalides', errors: { name: 'Le nom est requis.' } });
    }

    const listing = await professionalSpaceService.createProfessionalSpaceListing(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      data: { ...listing, category: listing.category?.slug },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'espace' });
  }
};

const updateProfessionalSpaceListing = async (req, res) => {
  try {
    const existing = await professionalSpaceService.getProfessionalSpaceListingById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Espace introuvable' });

    const listing = await professionalSpaceService.updateProfessionalSpaceListing(req.params.id, req.body);
    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'espace' });
  }
};

const deleteProfessionalSpaceListing = async (req, res) => {
  try {
    await professionalSpaceService.deleteProfessionalSpaceListing(req.params.id);
    res.status(200).json({ success: true, message: 'Espace supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'espace' });
  }
};

const listAdminListings = async (req, res) => {
  try {
    const { categorySlug, city, search, page, limit, isActive } = req.query;
    const { listings, pagination } = await professionalSpaceService.getProfessionalSpaceListings(
      { categorySlug, city, search, page, limit, isActive: isActive ?? 'all' }
    );
    res.status(200).json({ success: true, pagination, data: listings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des espaces (admin)' });
  }
};

const importListings = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier CSV/XLSX requis.' });
  try {
    const result = await professionalSpaceService.importProfessionalSpaceListings(req.file.buffer, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('professionalSpace importListings error:', error.message);
    res.status(500).json({ success: false, message: 'Import impossible.' });
  }
};

const downloadImportTemplate = async (req, res) => {
  try {
    const buffer = await professionalSpaceService.buildImportTemplate();
    res.setHeader('Content-Disposition', 'attachment; filename="modele-import-industrie.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du modèle' });
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createProfessionalSpaceListing,
  updateProfessionalSpaceListing,
  deleteProfessionalSpaceListing,
  listAdminListings,       
  importListings,          
  downloadImportTemplate,  
};