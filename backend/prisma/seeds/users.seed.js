// backend/prisma/seeds/users.seed.js
const bcrypt = require('bcryptjs');

const CITIZENS = [
  { name: 'Yassine El Amrani', email: 'yassine.elamrani@madinatti.ma', city: 'Casablanca', phone: '0612345601' },
  { name: 'Salma Bennani',     email: 'salma.bennani@madinatti.ma',    city: 'Rabat',      phone: '0612345602' },
  { name: 'Omar Idrissi',      email: 'omar.idrissi@madinatti.ma',     city: 'Marrakech',  phone: '0612345603' },
  { name: 'Fatima Zahra Alaoui', email: 'fz.alaoui@madinatti.ma',      city: 'Fès',        phone: '0612345604' },
  { name: 'Karim Tazi',        email: 'karim.tazi@madinatti.ma',       city: 'Tanger',     phone: '0612345605' },
];

const BUSINESSES = [
  { name: 'Agence Demo Immo', email: 'business.immo@madinatti.ma', city: 'Casablanca', phone: '0620000001', companyName: 'Agence Demo Immo', companyWebsite: 'https://example.com' },
  { name: 'Entreprise Demo Maroc', email: 'business.demo@madinatti.ma', city: 'Rabat', phone: '0620000002', companyName: 'Entreprise Demo Maroc', companyWebsite: 'https://example.com' },
  { name: 'Services Demo Tanger', email: 'business.tanger@madinatti.ma', city: 'Tanger', phone: '0620000003', companyName: 'Services Demo Tanger', companyWebsite: 'https://example.com' },
];

async function seedUsers(prisma, roles) {
  console.log('🌱 Seeding citizen users...');

  const hashedPassword = await bcrypt.hash('citizen123', 10);
  const created = [];

  for (const c of CITIZENS) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        name: c.name,
        email: c.email,
        password: hashedPassword,
        roleId: roles.citizen.id,
        city: c.city,
        phone: c.phone,
        isActive: true,
        emailVerifiedAt: new Date(),
        profileCompleted: true, // so they can post TaskRequests / WorkerProfiles right away
      },
    });
    created.push(user);
  }

  console.log(`  ✅ ${created.length} citizen(s) ready (password: "citizen123" for all).`);
  const businessPassword = process.env.SEED_BUSINESS_PASSWORD || 'business123';
  const hashedBusinessPassword = await bcrypt.hash(businessPassword, 10);
  const businessCreated = [];

  for (const business of BUSINESSES) {
    const user = await prisma.user.upsert({
      where: { email: business.email },
      update: {
        roleId: roles.business.id,
        isActive: true,
        companyName: business.companyName,
        companyWebsite: business.companyWebsite,
      },
      create: {
        name: business.name,
        email: business.email,
        password: hashedBusinessPassword,
        roleId: roles.business.id,
        city: business.city,
        phone: business.phone,
        companyName: business.companyName,
        companyWebsite: business.companyWebsite,
        isActive: true,
        emailVerifiedAt: new Date(),
        profileCompleted: true,
      },
    });
    businessCreated.push(user);
  }

  console.log(`  Business users ready: ${businessCreated.length} (password: "${businessPassword}")`);
  return created;
}

module.exports = { seedUsers };
