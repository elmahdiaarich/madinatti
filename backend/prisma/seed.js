const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {

  // Roles
  const citizen = await prisma.role.upsert({
    where: { name: 'citizen' },
    update: {},
    create: { name: 'citizen', description: 'Utilisateur citoyen' }
  })

  const business = await prisma.role.upsert({
    where: { name: 'business' },
    update: {},
    create: { name: 'business', description: 'Entreprise' }
  })

  const admin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrateur' }
  })

  // Plans
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

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@madinatti.ma' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@madinatti.ma',
      password: hashedPassword,
      roleId: admin.id,
      isActive: true,
      emailVerifiedAt: new Date()
    }
  })

  console.log('Seed terminé avec succès')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })