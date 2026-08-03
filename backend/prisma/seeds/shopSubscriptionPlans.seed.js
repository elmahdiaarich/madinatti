const { SHOP_SUBSCRIPTION_PLANS } = require('../../config/shopSubscriptionPlans');

async function seedShopSubscriptionPlans(prisma) {
  console.log('Seeding shop subscription plans...');
  for (const plan of SHOP_SUBSCRIPTION_PLANS) {
    await prisma.shopSubscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        displayedPrice: plan.displayedPrice,
        billingPeriod: plan.billingPeriod,
        listingLimit: plan.listingLimit,
        features: plan.features,
        active: true,
        displayOrder: plan.displayOrder,
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        displayedPrice: plan.displayedPrice,
        billingPeriod: plan.billingPeriod,
        listingLimit: plan.listingLimit,
        features: plan.features,
        active: true,
        displayOrder: plan.displayOrder,
      },
    });
  }
  console.log(`  ${SHOP_SUBSCRIPTION_PLANS.length} shop plan(s) ready.`);
}

module.exports = { seedShopSubscriptionPlans, SHOP_SUBSCRIPTION_PLANS };
