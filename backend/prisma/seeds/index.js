const { PrismaClient } = require('@prisma/client');
const { seedRoles }      = require('./roles.seed');
const { seedPlans }      = require('./plans.seed');
const { seedCategories } = require('./categories.seed');
const { seedJobs }       = require('./jobs.seed');
const { seedRealEstate } = require('./realEstate.seed');
const { seedCars } = require('./cars.seed');   // add this import


const prisma = new PrismaClient();

async function main() {
  const roles      = await seedRoles(prisma);
  await seedPlans(prisma);
  const categories = await seedCategories(prisma);

  // ── Job categories (module: emploi, keyed by slug) ─────────────────────────
  const jobCategories = {
    catInfo:         categories.emploi['informatique'],
    catMarketing:    categories.emploi['marketing'],
    catFinance:      categories.emploi['finance'],
    catRH:           categories.emploi['rh'],
    catBTP:          categories.emploi['btp'],
    catVente:        categories.emploi['vente'],
    catSante:        categories.emploi['sante'],
    catLogistique:   categories.emploi['logistique'],
    catJuridique:    categories.emploi['juridique'],
    catEnseignement: categories.emploi['enseignement'],
  };

  await seedJobs(prisma, roles, jobCategories);
  await seedRealEstate(prisma, roles, categories);
  await seedCars(prisma, roles, categories);    // add this line

}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());