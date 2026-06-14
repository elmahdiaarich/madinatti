const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.jobListing.deleteMany({});
  console.log('Deleted all job listings');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
