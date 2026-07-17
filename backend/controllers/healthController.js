const { HEALTH_SUBCATEGORIES } = require('../config/healthCategories');
const healthPlaces = require('../services/healthPlaces');
const { validatePlaceSearch, validatePlacePayload } = require('../utils/healthValidator');

function getSubcategories(req, res) {
  res.json({ success: true, data: HEALTH_SUBCATEGORIES });
}

async function getPlaces(req, res) {
  const parsed = validatePlaceSearch(req.query);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await healthPlaces.searchPlaces(parsed.value);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('health getPlaces error:', error.message);
    res.status(500).json({ success: false, message: 'Recherche Sante indisponible.' });
  }
}

async function getPlaceById(req, res) {
  try {
    const place = await healthPlaces.getPlaceById(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Etablissement introuvable.' });
    res.json({ success: true, data: place });
  } catch (error) {
    console.error('health getPlaceById error:', error.message);
    res.status(500).json({ success: false, message: 'Detail Sante indisponible.' });
  }
}

async function createPlace(req, res) {
  const parsed = validatePlacePayload(req.body);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const created = await healthPlaces.createPlace(req.body, req.user);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('health createPlace error:', error.message);
    res.status(500).json({ success: false, message: 'Creation impossible.' });
  }
}

async function listAdminPlaces(req, res) {
  try {
    const result = await healthPlaces.listAdminPlaces(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('health listAdminPlaces error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement impossible.' });
  }
}

async function updatePlace(req, res) {
  const parsed = validatePlacePayload(req.body, { partial: true });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const updated = await healthPlaces.updatePlace(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Etablissement introuvable.' });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Acces refuse.' });
    console.error('health updatePlace error:', error.message);
    res.status(500).json({ success: false, message: 'Modification impossible.' });
  }
}

async function deletePlace(req, res) {
  try {
    await healthPlaces.deletePlace(req.params.id);
    res.json({ success: true, message: 'Etablissement supprime.' });
  } catch (error) {
    console.error('health deletePlace error:', error.message);
    res.status(500).json({ success: false, message: 'Suppression impossible.' });
  }
}

async function importPlaces(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier CSV/XLSX requis.' });
  try {
    const result = await healthPlaces.importPlaces(req.file.buffer, req.user);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('health importPlaces error:', error.message);
    res.status(500).json({ success: false, message: 'Import impossible.' });
  }
}

function downloadImportTemplate(req, res) {
  const csv = [
    'Categorie,Nom,Quartier,Ville,Contact,Type horaire,Heure ouverture,Heure fermeture,Heure ouverture 2,Heure fermeture 2,Photos,Site web,Latitude,Longitude',
    'Pharmacie,Pharmacie Exemple,Centre,Kenitra,0537000000,Horaire continu,08:00,20:00,,,https://example.com/photo.jpg,https://example.com,34.2610,-6.5802',
    'Clinique,Clinique Exemple,Maamora,Kenitra,0537000001,Horaire normal,09:00,12:30,15:00,18:00,,https://example.com,34.2500,-6.5700',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="modele-import-sante.csv"');
  res.send(csv);
}

async function moderatePlace(req, res) {
  try {
    const status = req.body.status;
    if (!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, errors: { status: 'Statut invalide.' } });
    }
    const updated = await healthPlaces.moderatePlace(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('health moderatePlace error:', error.message);
    res.status(500).json({ success: false, message: 'Moderation impossible.' });
  }
}

async function claimPlace(req, res) {
  try {
    const updated = await healthPlaces.updatePlace(req.params.id, { status: 'PENDING' }, req.user);
    res.json({ success: true, data: updated, message: 'Demande de revendication recue.' });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Acces refuse.' });
    res.status(500).json({ success: false, message: 'Revendication impossible.' });
  }
}

module.exports = {
  getSubcategories,
  listAdminPlaces,
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  importPlaces,
  downloadImportTemplate,
  moderatePlace,
  claimPlace,
};
