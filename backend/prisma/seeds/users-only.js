const prisma = require('../../config/db');
const { seedRoles } = require('./roles.seed');
const { seedUsers } = require('./users.seed');

async function main() {
  const roles = await seedRoles(prisma);
  await seedUsers(prisma, roles);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
