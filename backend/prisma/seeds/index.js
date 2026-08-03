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
const { seedHealthPlaces } = require('./health.seed');
const { seedEvents } = require('./events.seed');
const { seedEventFormTemplates } = require('./eventFormTemplates.seed');
const { seedShopSubscriptionPlans } = require('./shopSubscriptionPlans.seed');

const prisma = new PrismaClient();

async function main() {
  const roles      = await seedRoles(prisma);
  await seedUsers(prisma, roles);  
  await seedPlans(prisma);
  const categories = await seedCategories(prisma);
  await seedEventFormTemplates(prisma);
  await seedShopSubscriptionPlans(prisma);

const jobCategories = {
    catInfo:              categories.emploi['informatique'],
    catIndustrie:         categories.emploi['industrie'],
    catBTP:                categories.emploi['btp'],
    catEnergie:            categories.emploi['energie'],
    catMarketing:          categories.emploi['marketing'],
    catFinance:            categories.emploi['finance'],
    catRH:                 categories.emploi['rh'],
    catVente:              categories.emploi['vente'],
    catRelationClient:     categories.emploi['relation-client'],
    catTourismeHotellerie: categories.emploi['tourisme-hotellerie'],
    catSante:              categories.emploi['sante'],
    catLogistique:         categories.emploi['logistique'],
    catJuridique:          categories.emploi['juridique'],
    catEnseignement:       categories.emploi['enseignement'],
    catTextileCuir:        categories.emploi['textile-cuir'],
    catAgriculture:        categories.emploi['agriculture'],
  };

  
  await seedJobs(prisma, roles, jobCategories);
  await seedRealEstate(prisma, roles, categories);
  await seedCars(prisma, roles, categories);

  
  await seedTourismListings(prisma, roles, categories); 
  await seedJobs(prisma, roles, jobCategories);
  await seedRealEstate(prisma, roles, categories);
  await seedCars(prisma, roles, categories);

  await seedWorkerProfiles(prisma, categories);   
  await seedTaskRequests(prisma, categories);     
  await seedProfessionalSpaceListings(prisma, roles, categories);
  await seedHealthPlaces(prisma, categories);
  await seedEvents(prisma, categories);

}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
