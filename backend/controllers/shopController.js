const shopService = require('../services/shopService');
const { validateShopPayload, SHOP_STATUSES, SHOP_SUBSCRIPTION_STATUSES } = require('../utils/shopValidator');

async function getPlans(req, res) {
  try {
    const data = await shopService.listPlans();
    res.json({ success: true, data });
  } catch (error) {
    console.error('shops getPlans error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement des formules impossible.' });
  }
}

async function createShop(req, res) {
  const parsed = validateShopPayload(req.body);
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });
  try {
    const data = await shopService.createShop(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    console.error('shops createShop error:', error.message);
    res.status(500).json({ success: false, message: 'Creation boutique impossible.' });
  }
}

async function getMyShops(req, res) {
  try {
    const data = await shopService.listMyShops(req.user);
    res.json({ success: true, data });
  } catch (error) {
    console.error('shops getMyShops error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement boutiques impossible.' });
  }
}

async function getDashboard(req, res) {
  try {
    const data = await shopService.getMyDashboard(req.user);
    res.json({ success: true, data });
  } catch (error) {
    console.error('shops getDashboard error:', error.message);
    res.status(500).json({ success: false, message: 'Dashboard boutique indisponible.' });
  }
}

async function getPublicShop(req, res) {
  try {
    const data = await shopService.getPublicShop(req.params.slug);
    if (!data) return res.status(404).json({ success: false, message: 'Boutique introuvable.' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('shops getPublicShop error:', error.message);
    res.status(500).json({ success: false, message: 'Boutique indisponible.' });
  }
}

async function updateShop(req, res) {
  const parsed = validateShopPayload(req.body, { partial: true });
  if (!parsed.valid) return res.status(400).json({ success: false, errors: parsed.errors });
  try {
    const data = await shopService.updateShop(req.params.id, req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ success: false, message: 'Acces refuse.' });
    console.error('shops updateShop error:', error.message);
    res.status(500).json({ success: false, message: 'Modification impossible.' });
  }
}

async function updateAccountBoutique(req, res) {
  try {
    const data = await shopService.updateAccountBoutique(req.body, req.user);
    res.json({ success: true, data });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    console.error('shops updateAccountBoutique error:', error.message);
    res.status(500).json({ success: false, message: 'Personnalisation boutique impossible.' });
  }
}

async function paymentAction(req, res) {
  const data = await shopService.simulatedPaymentAction(req.params.action || 'payment');
  res.json({ success: true, data });
}

async function changePlan(req, res) {
  try {
    const data = await shopService.changePlan(req.params.id, req.body.planId, req.user);
    res.json({ success: true, data });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Changement de formule impossible.' });
  }
}

async function listAdminShops(req, res) {
  try {
    const result = await shopService.listAdminShops(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('shops listAdminShops error:', error.message);
    res.status(500).json({ success: false, message: 'Chargement admin boutiques impossible.' });
  }
}

async function adminUpdateShop(req, res) {
  if (req.body.status && !SHOP_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ success: false, errors: { status: 'Statut boutique invalide.' } });
  }
  if (req.body.subscriptionStatus && !SHOP_SUBSCRIPTION_STATUSES.includes(req.body.subscriptionStatus)) {
    return res.status(400).json({ success: false, errors: { subscriptionStatus: 'Statut abonnement invalide.' } });
  }
  try {
    const data = await shopService.adminUpdateShop(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    console.error('shops adminUpdateShop error:', error.message);
    res.status(500).json({ success: false, message: 'Modification admin impossible.' });
  }
}

module.exports = {
  getPlans,
  createShop,
  getMyShops,
  getDashboard,
  getPublicShop,
  updateShop,
  updateAccountBoutique,
  paymentAction,
  changePlan,
  listAdminShops,
  adminUpdateShop,
};
