const { PrismaClient } = require('@prisma/client');
const { seedRoles }         = require('./roles.seed');
const { seedPlans }         = require('./plans.seed');
const { seedCategories }    = require('./categories.seed');
const { seedJobs }          = require('./jobs.seed');
const { seedRealEstate }    = require('./realEstate.seed');  // 👈 add this

const prisma = new PrismaClient();

async function main() {
  // const roles      = await seedRoles(prisma);
  // await seedPlans(prisma);
  const categories = await seedCategories(prisma);
  // await seedJobs(prisma, roles, categories);
  // await seedRealEstate(prisma, roles, categories);  // 👈 add this
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());