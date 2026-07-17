'use strict';

const path = require('path');
// __dirname = backend/jobs, donc on remonte d'un cran pour trouver backend/.env
// peu importe le répertoire depuis lequel le script est lancé.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { runFetch } = require('./newsFetcher');

(async () => {
  console.log('[testFetch] Démarrage du fetch manuel...');
  await runFetch();
  console.log('[testFetch] Terminé. Vérifie news_articles et fetch_logs dans Prisma Studio.');
  process.exit(0);
})();