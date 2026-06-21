// frontend/constants/pricingPlans.js
//
// Plan unifié : le quota d'annonces est partagé entre jobs ET immobilier.
// Le module (jobs | immobilier | vehicules) sert uniquement au wording contextuel dans PricingModal.

export const unifiedPlans = [
  {
    id: 'gratuit',
    label: 'Gratuit',
    price: 0,
    period: null,
    subtitle: 'Pour démarrer sans engagement',
    features: [
      { text: '2 annonces actives (jobs + immo)', included: true },
      { text: 'Visibilité standard', included: true },
      { text: 'Expiration 7 jours', included: true },
      { text: 'Mise en avant', included: false },
      { text: 'Badge vérifié', included: false },
    ],
  },
  {
    id: 'boost',
    label: 'Boost',
    price: 49,
    period: 'annonce',
    subtitle: 'Boostez une annonce ponctuellement',
    features: [
      { text: '1 annonce boostée (jobs ou immo)', included: true },
      { text: 'Mise en avant 20 jours', included: true },
      { text: 'Visibilité prioritaire dans les résultats', included: true },
      { text: 'Sans engagement', included: true },
      { text: 'Badge vérifié', included: false },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 129,
    period: 'mois',
    subtitle: 'Pour les professionnels actifs',
    recommended: true,
    features: [
      { text: '10 annonces actives (jobs + immo)', included: true },
      { text: 'Mise en avant dans les résultats', included: true },
      { text: 'Badge vérifié', included: true },
      { text: 'Statistiques de vues', included: true },
      { text: 'Expiration 60 jours', included: true },
    ],
  },
  {
    id: 'vip',
    label: 'VIP',
    price: 299,
    period: 'mois',
    subtitle: 'Visibilité maximale, zéro limite',
    features: [
      { text: 'Annonces illimitées (jobs + immo)', included: true },
      { text: 'Sponsoring en tête de liste', included: true },
      { text: 'Photos & médias illimités', included: true },
      { text: 'Chat avec candidats / prospects', included: true },
      { text: 'Statistiques détaillées', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Expiration 90 jours', included: true },
    ],
  },
];

// Rétrocompat — si tu as encore des imports de pricingPlans.jobs / .immobilier ailleurs,
// ils pointent tous vers le plan unifié.
export const pricingPlans = {
  jobs:       unifiedPlans,
  immobilier: unifiedPlans,
  vehicules:  unifiedPlans,
};