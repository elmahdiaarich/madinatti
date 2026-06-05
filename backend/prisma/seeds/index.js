const { PrismaClient } = require('@prisma/client')
const { seedRoles }      = require('./roles.seed')
const { seedPlans }      = require('./plans.seed')
const { seedCategories } = require('./categories.seed')
const { seedJobs }       = require('./jobs.seed')

const prisma = new PrismaClient()

async function main() {
  const roles      = await seedRoles(prisma)       // { citizen, business, admin }
  await seedPlans(prisma)
  const categories = await seedCategories(prisma)  // { catInfo, catMarketing, ... }
  await seedJobs(prisma, roles, categories)        // users business + job listings
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())