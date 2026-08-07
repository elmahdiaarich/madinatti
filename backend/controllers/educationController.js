const education = require('../services/educationInstitutions');
const {
  EDUCATION_INSTITUTION_TYPES,
  EDUCATION_SECTORS,
} = require('../config/educationConstants');
const {
  validateInstitutionPayload,
  validateInstitutionSearch,
} = require('../utils/educationValidator');

function getOptions(req, res) {
  res.json({
    success: true,
    data: {
      types: EDUCATION_INSTITUTION_TYPES,
      sectors: EDUCATION_SECTORS,
    },
  });
}

async function getInstitutions(req, res) {
  const parsed = validateInstitutionSearch(req.query);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await education.listInstitutions(parsed.value);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('education getInstitutions error:', error.message);
    res.status(500).json({ success: false, message: 'Recherche Education indisponible.' });
  }
}

async function getInstitutionBySlug(req, res) {
  try {
    const institution = await education.getInstitutionBySlug(req.params.slug);
    if (!institution) return res.status(404).json({ success: false, message: 'Etablissement introuvable.' });
    res.json({ success: true, data: institution });
  } catch (error) {
    console.error('education getInstitutionBySlug error:', error.message);
    res.status(500).json({ success: false, message: 'Detail Education indisponible.' });
  }
}

async function listAdminInstitutions(req, res) {
  const parsed = validateInstitutionSearch(req.query);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await education.listInstitutions(parsed.value, { admin: true });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('education listAdminInstitutions error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement impossible.' });
  }
}

async function createInstitution(req, res) {
  const parsed = validateInstitutionPayload(req.body);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const created = await education.createInstitution(req.body, req.user);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('education createInstitution error:', error.message);
    res.status(500).json({ success: false, message: 'Creation impossible.' });
  }
}

async function updateInstitution(req, res) {
  const parsed = validateInstitutionPayload(req.body, { partial: true });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const updated = await education.updateInstitution(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Etablissement introuvable.' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('education updateInstitution error:', error.message);
    res.status(500).json({ success: false, message: 'Modification impossible.' });
  }
}

async function deleteInstitution(req, res) {
  try {
    const deleted = await education.deleteInstitution(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Etablissement introuvable.' });
    res.json({ success: true, message: 'Etablissement supprime.' });
  } catch (error) {
    console.error('education deleteInstitution error:', error.message);
    res.status(500).json({ success: false, message: 'Suppression impossible.' });
  }
}

async function publishInstitution(req, res) {
  try {
    const updated = await education.publishInstitution(req.params.id, req.body.isPublished);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('education publishInstitution error:', error.message);
    res.status(500).json({ success: false, message: 'Publication impossible.' });
  }
}

async function importInstitutions(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier CSV/XLSX/JSON requis.' });
  try {
    const result = await education.importInstitutions(req.file.buffer, req.user, req.file.originalname);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('education importInstitutions error:', error.message);
    res.status(500).json({ success: false, message: 'Import impossible.' });
  }
}

async function previewImport(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier CSV/XLSX/JSON requis.' });
  try {
    const result = education.previewImport(req.file.buffer, req.file.originalname);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('education previewImport error:', error.message);
    res.status(500).json({ success: false, message: 'Preview impossible.' });
  }
}

function downloadImportTemplate(req, res) {
  const csv = [
    'Nom,Type,Secteur,Ville,Province,Region,Adresse,Telephone,Email,Site web,Latitude,Longitude,Source,Identifiant externe',
    'Universite Exemple,UNIVERSITY,PUBLIC,Rabat,Rabat,Rabat-Sale-Kenitra,Avenue Exemple,0537000000,contact@example.ma,https://example.ma,34.0209,-6.8416,Dataset officiel,univ-001',
    'Ecole Privee Exemple,PRIMARY_SCHOOL,PRIVATE,Casablanca,Casablanca,Casablanca-Settat,Rue Exemple,0522000000,,,,Dataset prive,school-001',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="modele-import-education.csv"');
  res.send(csv);
}

module.exports = {
  getOptions,
  getInstitutions,
  getInstitutionBySlug,
  listAdminInstitutions,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  publishInstitution,
  importInstitutions,
  previewImport,
  downloadImportTemplate,
};
