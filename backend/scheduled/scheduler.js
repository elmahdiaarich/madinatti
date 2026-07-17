'use strict';

const cron = require('node-cron');
const { runFetch } = require('./pressFetcher');
const { purgeOldArticles } = require('../services/press');

function startPressScheduler() {
  // Premier fetch immédiat au démarrage — utile en dev pour ne pas attendre 1h
  runFetch().catch((err) => console.error('[scheduler] Fetch initial échoué:', err.message));

  // Puis toutes les heures, à la minute 0
  cron.schedule('0 * * * *', () => {
    console.log('[scheduler] Lancement du fetch horaire de la presse...');
    runFetch().catch((err) => console.error('[scheduler] Fetch horaire échoué:', err.message));
  });

  console.log('[scheduler] Scheduler presse démarré (toutes les heures).');

  // Purge toutes les heures à la minute 30
  cron.schedule('30 * * * *', async () => {
    try {
      console.log('[scheduler] Lancement de la purge des anciens articles de presse...');
      const deletedCount = await purgeOldArticles(30);
      console.log(`[scheduler] Purge terminée : ${deletedCount} articles supprimés.`);
    } catch (err) {
      console.error('[scheduler] Échec de la purge :', err.message);
    }
  });

  console.log('[scheduler] Scheduler purge démarré (toutes les heures à la minute 30).');
}

module.exports = { startPressScheduler };