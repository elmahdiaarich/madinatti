// backend/prisma/seeds/taskRequests.seed.js
async function seedTaskRequests(prisma, categories) {
  console.log('🌱 Seeding task requests...');

  const mj = categories['mini-jobs'];
  const {
    babysitting, plomberie, electricite, menage, jardinage, demenagement, bricolage,
  } = mj;

  if (!babysitting || !plomberie || !electricite || !menage || !jardinage || !demenagement || !bricolage) {
    console.warn('[taskRequests.seed] Catégories mini-jobs manquantes.');
    return;
  }

  const citizens = await prisma.user.findMany({
    where: { role: { name: 'citizen' } },
    take: 10,
  });
  if (citizens.length === 0) {
    console.warn('[taskRequests.seed] Aucun utilisateur citizen trouvé — seed ignoré.');
    return;
  }
  const ownerAt = (i) => citizens[i % citizens.length].id;

  const inTwoDays   = new Date(Date.now() + 2  * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(Date.now() + 3  * 24 * 60 * 60 * 1000);
  const inFiveDays  = new Date(Date.now() + 5  * 24 * 60 * 60 * 1000);
  const nextWeek    = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000);
  const in10Days    = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const yesterday   = new Date(Date.now() - 1  * 24 * 60 * 60 * 1000);
  const lastWeek    = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  const tasks = [
    // ── OPEN ─────────────────────────────────────────────────────────────
    {
      userId: ownerAt(0), categoryId: menage.id,
      title: 'Ménage complet appartement 3 pièces',
      description: 'Besoin d\'un ménage en profondeur avant l\'arrivée de la famille, cuisine et salle de bain incluses.',
      city: 'Casablanca', budget: 250, neededDate: inThreeDays, status: 'OPEN',
    },
    {
      userId: ownerAt(1), categoryId: jardinage.id,
      title: 'Taille de haie et entretien jardin',
      description: 'Jardin de 100m², haie à tailler, pelouse à tondre, quelques plantations à arroser.',
      city: 'Rabat', budget: 300, neededDate: nextWeek, status: 'OPEN',
    },
    {
      userId: ownerAt(2), categoryId: babysitting.id,
      title: 'كنقلقو ليا شي واحدة تشوف الدراري ليلة السبت',
      description: 'عندي 2 د الدراري، عمرهم 4 و 7 سنين. باغيا واحدة عندها تجربة، من 7 ديال المسا حتى منتصف الليل.',
      city: 'Casablanca', budget: 150, neededDate: inTwoDays, status: 'OPEN',
    },
    {
      userId: ownerAt(3), categoryId: plomberie.id,
      title: 'Fuite d\'eau urgente sous l\'évier',
      description: 'Fuite qui empire depuis hier, besoin d\'une intervention rapide avant que ça n\'abîme le sol.',
      city: 'Marrakech', budget: 200, neededDate: inTwoDays, status: 'OPEN',
    },
    {
      userId: ownerAt(4), categoryId: electricite.id,
      title: 'باغي نصاوب الضو ديال الصالون',
      description: 'الضو طاح و مكايخدمش، خاصو شي واحد يجي يشوف شنو الطرا.',
      city: 'Fès', budget: 180, neededDate: inFiveDays, status: 'OPEN',
    },
    {
      userId: ownerAt(0), categoryId: bricolage.id,
      title: 'Montage de meubles IKEA',
      description: 'Montage d\'une armoire et d\'un bureau, outils fournis si besoin.',
      city: 'Rabat', budget: 150, neededDate: in10Days, status: 'OPEN',
    },
    {
      userId: ownerAt(1), categoryId: demenagement.id,
      title: 'خاصني عاون فـ الديمينجمان ديال استوديو',
      description: 'كاين شي بضاعة ماشي بزاف، طابق تاني بلا مصعد.',
      city: 'Tanger', budget: 350, neededDate: nextWeek, status: 'OPEN',
    },

    // ── IN_PROGRESS ──────────────────────────────────────────────────────
    {
      userId: ownerAt(2), categoryId: demenagement.id,
      title: 'Aide déménagement studio',
      description: 'Déménagement d\'un studio meublé, 2ème étage sans ascenseur, quelques cartons et un canapé.',
      city: 'Marrakech', budget: 400, neededDate: nextWeek, status: 'IN_PROGRESS',
    },
    {
      userId: ownerAt(3), categoryId: menage.id,
      title: 'باغي ندير نظافة شاملة قبل العيد',
      description: 'نظافة كاملة ديال الدار، بما فيها الكوزينة و الحمام.',
      city: 'Casablanca', budget: 220, neededDate: inFiveDays, status: 'IN_PROGRESS',
    },

    // ── COMPLETED ────────────────────────────────────────────────────────
    {
      userId: ownerAt(4), categoryId: bricolage.id,
      title: 'Montage de meubles IKEA',
      description: 'Montage d\'une armoire et d\'un bureau, outils fournis si besoin.',
      city: 'Casablanca', budget: 150, neededDate: yesterday, status: 'COMPLETED',
    },
    {
      userId: ownerAt(0), categoryId: plomberie.id,
      title: 'صلاح التسريب ديال الحمام',
      description: 'كان تسريب صغير خصو تصليح، تم بنجاح.',
      city: 'Rabat', budget: 120, neededDate: lastWeek, status: 'COMPLETED',
    },

    // ── CANCELLED ────────────────────────────────────────────────────────
    {
      userId: ownerAt(1), categoryId: jardinage.id,
      title: 'Entretien jardin — annulé',
      description: 'Finalement géré en interne, demande annulée.',
      city: 'Fès', budget: 200, neededDate: lastWeek, status: 'CANCELLED',
    },
  ];

  let created = 0;
  for (const task of tasks) {
    const exists = await prisma.taskRequest.findFirst({
      where: { userId: task.userId, title: task.title, status: task.status },
    });
    if (!exists) {
      await prisma.taskRequest.create({ data: task });
      created++;
    }
  }
  console.log(`  ✅ ${created} demande(s) de tâche créée(s) (${tasks.length - created} déjà existantes).`);
}

module.exports = { seedTaskRequests };