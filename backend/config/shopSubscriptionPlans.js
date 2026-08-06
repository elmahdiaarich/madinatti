const SHOP_SUBSCRIPTION_PLANS = [
  {
    name: 'Gratuit',
    slug: 'gratuit',
    displayedPrice: 'Gratuit',
    billingPeriod: '7j',
    listingLimit: 1,
    displayOrder: 1,
    features: [
      '1 annonce active',
      'Visibilite standard',
      'Statistiques de vues',
      'Boutique verifiee non incluse',
    ],
  },
  {
    name: 'Basic',
    slug: 'basic',
    displayedPrice: '14j: 24.8 DH/j ou 30j: 18.6 DH/j',
    billingPeriod: '14j-30j',
    listingLimit: 7,
    displayOrder: 2,
    features: [
      '3 etoiles de visibilite',
      'Ameliorez la visibilite de votre annonce',
      'Statistiques basiques',
      'Jusqu a 7 annonces actives',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    displayedPrice: '7j: 41.2 DH/j, 14j: 28.5 DH/j ou 30j: 19.3 DH/j',
    billingPeriod: '7j-30j',
    listingLimit: 20,
    displayOrder: 3,
    features: [
      '4 etoiles de visibilite',
      'Boutique verifiee incluse',
      'Badge pro sur annonces',
      'Statistiques business completes',
      'Personnalisation boutique',
    ],
  },
  {
    name: 'Max',
    slug: 'max',
    displayedPrice: 'Promo: 30j 35.7 DH/j, 14j 48.5 DH/j, 7j 59.0 DH/j',
    billingPeriod: '7j-30j',
    listingLimit: 50,
    displayOrder: 4,
    features: [
      '5 etoiles de visibilite',
      'Visibilite maximale pour capter tous les acheteurs',
      'Boutique premium',
      '3 boosts inclus',
      'Support prioritaire',
    ],
  },
];

const SHOP_SUBSCRIPTION_PLAN_SLUGS = SHOP_SUBSCRIPTION_PLANS.map((plan) => plan.slug);

module.exports = {
  SHOP_SUBSCRIPTION_PLANS,
  SHOP_SUBSCRIPTION_PLAN_SLUGS,
};
