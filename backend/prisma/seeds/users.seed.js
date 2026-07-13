// backend/prisma/seeds/users.seed.js
const bcrypt = require('bcryptjs');

const CITIZENS = [
  { name: 'Yassine El Amrani', email: 'yassine.elamrani@madinatti.ma', city: 'Casablanca', phone: '0612345601' },
  { name: 'Salma Bennani',     email: 'salma.bennani@madinatti.ma',    city: 'Rabat',      phone: '0612345602' },
  { name: 'Omar Idrissi',      email: 'omar.idrissi@madinatti.ma',     city: 'Marrakech',  phone: '0612345603' },
  { name: 'Fatima Zahra Alaoui', email: 'fz.alaoui@madinatti.ma',      city: 'Fès',        phone: '0612345604' },
  { name: 'Karim Tazi',        email: 'karim.tazi@madinatti.ma',       city: 'Tanger',     phone: '0612345605' },
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
  return created;
}

module.exports = { seedUsers };