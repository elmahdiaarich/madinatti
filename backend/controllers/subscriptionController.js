'use strict';

const prisma = require('../config/db');
const { PRICING_PLANS, PLAN_IDS, getPlanDefinition, getBillingOption } = require('../config/pricingPlans');

const PAYMENT_METHODS = ['card', 'bank_transfer', 'cash'];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function enrichPlan(dbPlan) {
  const definition = getPlanDefinition(dbPlan.id);
  return {
    id: dbPlan.id,
    name: dbPlan.name,
    price: toNumber(dbPlan.price),
    durationDays: dbPlan.durationDays,
    maxListings: dbPlan.maxListings,
    maxPhotos: dbPlan.maxPhotos,
    canBoost: dbPlan.canBoost,
    canSponsor: dbPlan.canSponsor,
    hasBadge: dbPlan.hasBadge,
    hasStatistics: dbPlan.hasStatistics,
    hasChat: dbPlan.hasChat,
    metadata: definition?.metadata || {},
  };
}

async function ensurePlansExist() {
  await prisma.$transaction(
    PRICING_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
          maxListings: plan.maxListings,
          maxPhotos: plan.maxPhotos,
          canBoost: plan.canBoost,
          canSponsor: plan.canSponsor,
          hasBadge: plan.hasBadge,
          hasStatistics: plan.hasStatistics,
          hasChat: plan.hasChat,
        },
        create: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          durationDays: plan.durationDays,
          maxListings: plan.maxListings,
          maxPhotos: plan.maxPhotos,
          canBoost: plan.canBoost,
          canSponsor: plan.canSponsor,
          hasBadge: plan.hasBadge,
          hasStatistics: plan.hasStatistics,
          hasChat: plan.hasChat,
        },
      }),
    ),
  );

  return prisma.plan.findMany({
    where: { id: { in: PLAN_IDS } },
  });
}

function sortPlans(plans) {
  const rank = new Map(PLAN_IDS.map((id, index) => [id, index]));
  return [...plans].sort((a, b) => rank.get(a.id) - rank.get(b.id));
}

async function getPlans(req, res) {
  try {
    const plans = await ensurePlansExist();
    res.json({ success: true, data: sortPlans(plans).map(enrichPlan) });
  } catch (error) {
    console.error('subscription getPlans error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

async function getActiveSubscription(userId) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    orderBy: { startedAt: 'desc' },
    include: { plan: true },
  });
}

async function getMySubscription(req, res) {
  try {
    const subscription = await getActiveSubscription(req.user.userId);

    res.json({
      success: true,
      data: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            startedAt: subscription.startedAt,
            expiresAt: subscription.expiresAt,
            planId: subscription.planId,
            plan: enrichPlan(subscription.plan),
          }
        : null,
    });
  } catch (error) {
    console.error('subscription getMySubscription error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

function validatePayment(price, body) {
  if (price === 0) return null;

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    return 'Veuillez choisir un moyen de paiement valide.';
  }

  if (body.paymentMethod === 'card') {
    const digits = String(body.cardNumber || '').replace(/\D/g, '');
    if (!body.cardholderName || body.cardholderName.trim().length < 3) {
      return 'Le nom du titulaire est requis.';
    }
    if (digits.length < 12 || digits.length > 19) {
      return 'Le numéro de carte est invalide.';
    }
    if (!/^\d{2}\/\d{2}$/.test(String(body.expiry || ''))) {
      return "La date d'expiration doit être au format MM/AA.";
    }
    if (!/^\d{3,4}$/.test(String(body.cvc || ''))) {
      return 'Le code CVC est invalide.';
    }
  }

  if (body.paymentMethod === 'bank_transfer' && !String(body.reference || '').trim()) {
    return 'La référence du virement est requise.';
  }

  if (body.paymentMethod === 'cash' && !String(body.phone || '').trim()) {
    return 'Le numéro de téléphone est requis pour le suivi.';
  }

  return null;
}

async function checkoutSubscription(req, res) {
  try {
    if (req.user.role !== 'business') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux comptes Business' });
    }

    const { planId, durationDays } = req.body;
    const plan = getPlanDefinition(planId);

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan invalide' });
    }

    const billingOption = getBillingOption(plan, durationDays);
    if (!billingOption) {
      return res.status(400).json({ success: false, message: 'Duree invalide' });
    }

    const error = validatePayment(billingOption.price, req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    await ensurePlansExist();

    const now = new Date();
    const expiresAt = addDays(now, billingOption.days);

    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId: req.user.userId, status: 'ACTIVE' },
        data: { status: 'REPLACED' },
      });

      return tx.subscription.create({
        data: {
          userId: req.user.userId,
          planId: plan.id,
          status: 'ACTIVE',
          startedAt: now,
          expiresAt,
        },
        include: { plan: true },
      });
    });

    const cardNumber = String(req.body.cardNumber || '').replace(/\D/g, '');
    const payment = {
      method: billingOption.price === 0 ? 'free' : req.body.paymentMethod,
      amount: billingOption.price,
      currency: 'MAD',
      status: 'CONFIRMED',
      reference:
        billingOption.price === 0
          ? `FREE-${subscription.id.slice(0, 8)}`
          : `PAY-${subscription.id.slice(0, 8)}`,
      cardLast4: req.body.paymentMethod === 'card' ? cardNumber.slice(-4) : null,
    };

    res.status(201).json({
      success: true,
      message: 'Abonnement activé',
      data: {
        id: subscription.id,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
        planId: subscription.planId,
        plan: enrichPlan(subscription.plan),
        billingOption,
      },
      payment,
    });
  } catch (error) {
    console.error('subscription checkout error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
};
