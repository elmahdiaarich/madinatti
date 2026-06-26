const prisma = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_MODULES = ['emploi', 'immobilier', 'automobile'];
const MAX_ALERTS    = 5;

/** Returns true if two filter objects are considered identical for a given module. */
function isDuplicateFilter(existing, incoming, module) {
  if (module === 'emploi') {
    return (
      (existing.categorySlug || null) === (incoming.categorySlug || null) &&
      (existing.region       || null) === (incoming.region       || null) &&
      (existing.city         || null) === (incoming.city         || null) &&
      (existing.contractType || null) === (incoming.contractType || null) &&
      (existing.keyword      || null) === (incoming.keyword      || null) &&
      (existing.remote       || null) === (incoming.remote       || null)
    );
  }

  if (module === 'immobilier') {
    return (
      (existing.categoryId   || null) === (incoming.categoryId   || null) &&
      (existing.listingType  || null) === (incoming.listingType  || null) &&
      (existing.region       || null) === (incoming.region       || null) &&
      (existing.city         || null) === (incoming.city         || null) &&
      (existing.minPrice     || null) === (incoming.minPrice     || null) &&
      (existing.maxPrice     || null) === (incoming.maxPrice     || null)
    );
  }

  if (module === 'automobile') {
    return (
      (existing.categoryId   || null) === (incoming.categoryId   || null) &&
      (existing.listingType  || null) === (incoming.listingType  || null) &&
      (existing.region       || null) === (incoming.region       || null) &&
      (existing.city         || null) === (incoming.city         || null) &&
      (existing.minPrice     || null) === (incoming.minPrice     || null) &&
      (existing.maxPrice     || null) === (incoming.maxPrice     || null) &&
      (existing.make          || null) === (incoming.make          || null) &&
      (existing.model         || null) === (incoming.model         || null) &&
      (existing.condition     || null) === (incoming.condition     || null)
    );
  }

  return false;
}

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
// Query: ?module=emploi|immobilier|automobile   (omit to get ALL alerts)

const getMyAlerts = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const mod    = req.query.module;

    const where = {
      userId,
      ...(mod && VALID_MODULES.includes(mod) ? { module: mod } : {}),
    };

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('getMyAlerts error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── POST /api/alerts ─────────────────────────────────────────────────────────
// Body: { module: 'emploi'|'immobilier'|'automobile', filters: { ... } }

const createAlert = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { module: mod, filters } = req.body;

    // Validate
    if (!mod || !VALID_MODULES.includes(mod)) {
      return res.status(400).json({ success: false, message: 'module invalide (emploi | immobilier | automobile)' });
    }
    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({ success: false, message: 'filters requis' });
    }

    // Count existing active alerts for this module
    const existingAlerts = await prisma.alert.findMany({
      where: { userId, module: mod, isActive: true },
    });

    if (existingAlerts.length >= MAX_ALERTS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_ALERTS} alertes autorisées par module`,
      });
    }

    // Duplicate check
    const duplicate = existingAlerts.some((a) =>
      isDuplicateFilter(a.filters, filters, mod)
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Une alerte identique existe déjà' });
    }

    const alert = await prisma.alert.create({
      data: { userId, module: mod, filters, isActive: true },
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    console.error('createAlert error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── DELETE /api/alerts/:id ───────────────────────────────────────────────────

const deleteAlert = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert)              return res.status(404).json({ success: false, message: 'Alerte introuvable' });
    if (alert.userId !== userId) return res.status(403).json({ success: false, message: 'Accès refusé' });

    await prisma.alert.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAlert error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getMyAlerts, createAlert, deleteAlert };