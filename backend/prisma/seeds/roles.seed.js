const bcrypt = require('bcryptjs')

async function seedRoles(prisma) {
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
  console.log('✅ Roles created')

  // ── ADMIN USER ─────────────────────────────────────────
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
  console.log('✅ Admin user created')

  return { citizen, business, admin }
}

module.exports = { seedRoles }