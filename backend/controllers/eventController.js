const eventService = require('../services/eventService');
const prisma = require('../config/db');
const { validateEventListQuery, validateEventPayload, EVENT_STATUSES } = require('../utils/eventValidator');

async function getCategories(req, res) {
  try {
    const data = await eventService.getCategories();
    res.json({ success: true, data });
  } catch (error) {
    console.error('events getCategories error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement des categories impossible.' });
  }
}

async function getEvents(req, res) {
  const parsed = validateEventListQuery(req.query);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await eventService.listEvents(parsed.value, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('events getEvents error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement des evenements impossible.' });
  }
}

async function getAdminEvents(req, res) {
  const parsed = validateEventListQuery({ ...req.query, status: req.query.status || '' });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await eventService.listEvents(parsed.value, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('events getAdminEvents error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement admin impossible.' });
  }
}

async function getMyEvents(req, res) {
  const parsed = validateEventListQuery({ ...req.query, mine: true, status: req.query.status || '' });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const result = await eventService.listEvents(parsed.value, req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('events getMyEvents error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement impossible.' });
  }
}

async function getEventByIdOrSlug(req, res) {
  try {
    const event = await eventService.getEventByIdOrSlug(req.params.idOrSlug, req.user);
    if (!event) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('events getEventByIdOrSlug error:', error.message);
    res.status(500).json({ success: false, message: 'Detail indisponible.' });
  }
}

async function createEvent(req, res) {
  const parsed = await validateEventPayload(req.body, prisma);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const created = await eventService.createEvent(req.body, req.user);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('events createEvent error:', error.message);
    res.status(500).json({ success: false, message: 'Creation impossible.' });
  }
}

async function updateEvent(req, res) {
  const parsed = await validateEventPayload(req.body, prisma, { partial: true });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });

  try {
    const updated = await eventService.updateEvent(req.params.id, req.body, req.user);
    if (!updated) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Acces refuse.' });
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error('events updateEvent error:', error.message);
    res.status(500).json({ success: false, message: 'Modification impossible.' });
  }
}

async function deleteEvent(req, res) {
  try {
    const deleted = await eventService.deleteEvent(req.params.id, req.user);
    if (!deleted) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, message: 'Evenement supprime.' });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Acces refuse.' });
    console.error('events deleteEvent error:', error.message);
    res.status(500).json({ success: false, message: 'Suppression impossible.' });
  }
}

async function updateStatus(req, res) {
  if (!EVENT_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ success: false, errors: { status: 'Statut invalide.' } });
  }
  try {
    const updated = await eventService.updateStatus(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('events updateStatus error:', error.message);
    res.status(500).json({ success: false, message: 'Moderation impossible.' });
  }
}

async function getOccurrences(req, res) {
  try {
    const data = await eventService.getOccurrences(req.params.id, req.query, req.user);
    if (!data) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('events getOccurrences error:', error.message);
    res.status(500).json({ success: false, message: 'Occurrences indisponibles.' });
  }
}

async function addFavorite(req, res) {
  try {
    const result = await eventService.toggleFavorite(req.params.id, req.user.userId, true);
    if (!result) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('events addFavorite error:', error.message);
    res.status(500).json({ success: false, message: 'Favori impossible.' });
  }
}

async function removeFavorite(req, res) {
  try {
    const result = await eventService.toggleFavorite(req.params.id, req.user.userId, false);
    if (!result) return res.status(404).json({ success: false, message: 'Evenement introuvable.' });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('events removeFavorite error:', error.message);
    res.status(500).json({ success: false, message: 'Suppression favori impossible.' });
  }
}

async function getFavoriteEvents(req, res) {
  try {
    const data = await eventService.getUserFavorites(req.user.userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('events getFavoriteEvents error:', error.message);
    res.status(500).json({ success: false, message: 'Favoris indisponibles.' });
  }
}

async function importCsv(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier CSV/XLSX requis.' });
  try {
    const data = await eventService.importCsv(req.file.buffer, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('events importCsv error:', error.message);
    res.status(500).json({ success: false, message: 'Import CSV impossible.' });
  }
}

async function importIcs(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: 'Fichier ICS requis.' });
  try {
    const data = await eventService.importIcs(req.file.buffer, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('events importIcs error:', error.message);
    res.status(500).json({ success: false, message: 'Import ICS impossible.' });
  }
}

module.exports = {
  getCategories,
  getEvents,
  getAdminEvents,
  getMyEvents,
  getEventByIdOrSlug,
  createEvent,
  updateEvent,
  deleteEvent,
  updateStatus,
  getOccurrences,
  addFavorite,
  removeFavorite,
  getFavoriteEvents,
  importCsv,
  importIcs,
};
