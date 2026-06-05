async function seedPlans(prisma) {
  await prisma.plan.upsert({
    where: { id: 'standard' },
    update: {},
    create: {
      id: 'standard',
      name: 'Standard',
      price: 0,
      durationDays: 0,
      maxListings: 3,
      maxPhotos: 3,
      canBoost: false,
      canSponsor: false,
      hasBadge: false,
      hasStatistics: false,
      hasChat: false
    }
  })
  await prisma.plan.upsert({
    where: { id: 'premium_tier1' },
    update: {},
    create: {
      id: 'premium_tier1',
      name: 'Premium Tier 1',
      price: 99,
      durationDays: 30,
      maxListings: 10,
      maxPhotos: 10,
      canBoost: true,
      canSponsor: false,
      hasBadge: true,
      hasStatistics: true,
      hasChat: true
    }
  })
  await prisma.plan.upsert({
    where: { id: 'premium_tier2' },
    update: {},
    create: {
      id: 'premium_tier2',
      name: 'Premium Tier 2',
      price: 199,
      durationDays: 30,
      maxListings: 999,
      maxPhotos: 999,
      canBoost: true,
      canSponsor: true,
      hasBadge: true,
      hasStatistics: true,
      hasChat: true
    }
  })
  console.log('✅ Plans created')
}

module.exports = { seedPlans }