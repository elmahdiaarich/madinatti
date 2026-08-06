function option(days, dailyPrice, originalDailyPrice = null) {
  const price = +(days * dailyPrice).toFixed(1);
  return {
    days,
    dailyPrice,
    originalDailyPrice,
    price,
    label: `${days}j`,
    priceLabel: `${dailyPrice.toFixed(1)} DH/j`,
    originalPriceLabel: originalDailyPrice ? `${originalDailyPrice.toFixed(1)} DH/j` : null,
  };
}

const PRICING_PLANS = [
  {
    id: 'gratuit',
    name: 'Gratuit',
    price: 0,
    durationDays: 7,
    maxListings: 1,
    maxPhotos: 5,
    canBoost: false,
    canSponsor: false,
    hasBadge: false,
    hasStatistics: true,
    hasChat: false,
    metadata: {
      stars: 1,
      tagline: 'Publier une annonce gratuitement',
      visibility: 'Standard',
      statistics: 'Vues',
      users: 1,
      boostsPerMonth: 0,
      support: "Centre d'aide",
      billingOptions: [option(7, 0)],
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 558,
    durationDays: 30,
    maxListings: 7,
    maxPhotos: 10,
    canBoost: true,
    canSponsor: false,
    hasBadge: false,
    hasStatistics: true,
    hasChat: false,
    metadata: {
      stars: 3,
      tagline: 'Ameliorez la visibilite de votre annonce',
      visibility: 'Amelioree',
      statistics: 'Basiques',
      users: 1,
      boostsPerMonth: 0,
      support: 'E-mail',
      billingOptions: [option(30, 18.6), option(14, 24.8)],
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 579,
    durationDays: 30,
    maxListings: 20,
    maxPhotos: 20,
    canBoost: true,
    canSponsor: false,
    hasBadge: true,
    hasStatistics: true,
    hasChat: true,
    metadata: {
      stars: 4,
      tagline: 'Plan pro avec boutique verifiee',
      professionalProfile: 'Vitrine boutique',
      verifiedBadge: 'Inclus',
      visibility: 'Prioritaire',
      statistics: 'Completes',
      users: 2,
      boostsPerMonth: 1,
      support: 'Prioritaire',
      billingOptions: [option(30, 19.3), option(14, 28.5), option(7, 41.2)],
    },
  },
  {
    id: 'max',
    name: 'Max',
    price: 1071,
    durationDays: 30,
    maxListings: 50,
    maxPhotos: 35,
    canBoost: true,
    canSponsor: true,
    hasBadge: true,
    hasStatistics: true,
    hasChat: true,
    metadata: {
      stars: 5,
      tagline: 'Visibilite maximale pour capter tous les acheteurs',
      professionalProfile: 'Vitrine premium',
      verifiedBadge: 'Renforce',
      visibility: 'Maximale',
      statistics: 'Dashboard + recommandations',
      users: 5,
      boostsPerMonth: 3,
      support: 'Prioritaire 24 h',
      promo: true,
      billingOptions: [option(30, 35.7, 42.0), option(14, 48.5, 57.1), option(7, 59.0, 65.5)],
    },
  },
];

const PLAN_IDS = PRICING_PLANS.map((plan) => plan.id);

function getPlanDefinition(planId) {
  return PRICING_PLANS.find((plan) => plan.id === planId) || null;
}

function getBillingOption(plan, durationDays) {
  const options = plan?.metadata?.billingOptions || [];
  if (!options.length) return null;
  if (durationDays === undefined || durationDays === null || durationDays === '') return options[0];
  return options.find((item) => item.days === Number(durationDays)) || null;
}

module.exports = {
  PRICING_PLANS,
  PLAN_IDS,
  getPlanDefinition,
  getBillingOption,
};
