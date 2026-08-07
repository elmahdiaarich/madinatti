const prisma = require('./config/db');

async function run() {
  await prisma.jobListing.deleteMany({});
  console.log('Deleted all job listings');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
