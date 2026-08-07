const { PRICING_PLANS } = require('../../config/pricingPlans');

async function seedPlans(prisma) {
  for (const plan of PRICING_PLANS) {
    await prisma.plan.upsert({
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
    });
  }

  console.log('Plans created');
}

module.exports = { seedPlans };
