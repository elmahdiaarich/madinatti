const { PrismaClient } = require('@prisma/client');

const { seedTourismListings } = require('./tourism.seed'); // 1. Import the tourism seeder
const { seedUsers }           = require('./users.seed');
const { seedRoles }           = require('./roles.seed');
const { seedPlans }           = require('./plans.seed');
const { seedCategories }      = require('./categories.seed');
const { seedJobs }            = require('./jobs.seed');
const { seedRealEstate }      = require('./realEstate.seed');
const { seedCars }            = require('./cars.seed');
const { seedWorkerProfiles }  = require('./workerProfiles.seed');   
const { seedTaskRequests }    = require('./taskRequests.seed');     
const { seedProfessionalSpaceListings } = require('./professionalSpaces.seed');


const prisma = new PrismaClient();

async function main() {
  const roles      = await seedRoles(prisma);
  await seedUsers(prisma, roles);  
  await seedPlans(prisma);
  const categories = await seedCategories(prisma);

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

  // Run existing module seeders
  // await seedJobs(prisma, roles, jobCategories);
  // await seedRealEstate(prisma, roles, categories);
  // await seedCars(prisma, roles, categories);

  // 2. Execute Tourism listings, passing the roles and newly created categories
  // await seedTourismListings(prisma, roles, categories); 
  // await seedJobs(prisma, roles, jobCategories);
  // await seedRealEstate(prisma, roles, categories);
  // await seedCars(prisma, roles, categories);

  // await seedWorkerProfiles(prisma, categories);   
  // await seedTaskRequests(prisma, categories);     
  await seedProfessionalSpaceListings(prisma, roles, categories);

}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());