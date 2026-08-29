const prisma = require('../config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_MODULES = ['emploi', 'immobilier', 'automobile', 'headhunter'];
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

  if (module === 'headhunter') {
    return (
      (existing.categorySlug    || null) === (incoming.categorySlug    || null) &&
      (existing.educationLevel  || null) === (incoming.educationLevel  || null) &&
      (existing.experienceLevel || null) === (incoming.experienceLevel || null) &&
      (existing.contractType    || null) === (incoming.contractType    || null) &&
      (existing.region          || null) === (incoming.region          || null) &&
      (existing.city            || null) === (incoming.city            || null) &&
      (existing.search          || null) === (incoming.search          || null)
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
      return res.status(400).json({ success: false, message: 'module invalide (emploi | immobilier | automobile | headhunter)' });
    }
    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({ success: false, message: 'filters requis' });
    }

    // Le plafond ne compte que les alertes actives (une alerte en pause
    // libère de la place), mais le check de doublon regarde TOUTES les
    // alertes du module (actives + en pause) pour éviter qu'un utilisateur
    // recrée par erreur une alerte qu'il avait simplement mise en pause.
    const allAlerts = await prisma.alert.findMany({
      where: { userId, module: mod },
    });
    const activeCount = allAlerts.filter((a) => a.isActive).length;

    if (activeCount >= MAX_ALERTS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_ALERTS} alertes actives autorisées par module`,
      });
    }

    const duplicate = allAlerts.some((a) =>
      isDuplicateFilter(a.filters, filters, mod)
    );
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Une alerte identique existe déjà (active ou en pause)' });
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

// ─── PUT /api/alerts/:id ────────────────────────────────────────────────────
// Body: { filters: { ... } } — modifie les critères sans supprimer/recréer.

const updateAlert = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { filters } = req.body;

    if (!filters || typeof filters !== 'object') {
      return res.status(400).json({ success: false, message: 'filters requis' });
    }

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte introuvable' });
    if (alert.userId !== userId) return res.status(403).json({ success: false, message: 'Accès refusé' });

    const others = await prisma.alert.findMany({
      where: { userId, module: alert.module, NOT: { id } },
    });
    const duplicate = others.some((a) => isDuplicateFilter(a.filters, filters, alert.module));
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Une alerte identique existe déjà' });
    }

    const updated = await prisma.alert.update({ where: { id }, data: { filters } });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updateAlert error:', error);
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

// ─── PATCH /api/alerts/:id/toggle ──────────────────────────────────────────────
// Active/désactive une alerte sans la supprimer — pour l'utilisateur qui ne veut
// plus être notifié temporairement sans perdre ses critères de recherche.

const toggleAlert = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert)              return res.status(404).json({ success: false, message: 'Alerte introuvable' });
    if (alert.userId !== userId) return res.status(403).json({ success: false, message: 'Accès refusé' });

    const updated = await prisma.alert.update({
      where: { id },
      data: { isActive: !alert.isActive },
    });

    res.json({ success: true, isActive: updated.isActive });
  } catch (error) {
    console.error('toggleAlert error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = { getMyAlerts, createAlert, updateAlert, deleteAlert, toggleAlert };