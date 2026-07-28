const EVENTS = [
  {
    slug: 'festival-musique-kenitra-2026',
    title: 'Festival Musique Kenitra',
    shortDescription: 'Scene locale, concerts gratuits et restauration sur place.',
    description: 'Un festival musical en plein air avec artistes locaux, food court et espace familles.',
    categorySlug: 'concert-musique',
    organizerName: 'Association Culture Kenitra',
    organizerPhone: '0612000001',
    eventMode: 'IN_PERSON',
    venueName: 'Place administrative',
    address: 'Centre Ville, Kenitra',
    city: 'Kenitra',
    province: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    latitude: 34.261,
    longitude: -6.5802,
    startsAt: '2026-08-15T19:00:00.000Z',
    endsAt: '2026-08-15T23:30:00.000Z',
    isFree: true,
    status: 'PUBLISHED',
    featured: true,
    verified: true,
  },
  {
    slug: 'marche-artisans-maamora',
    title: 'Marche des artisans Maamora',
    shortDescription: 'Marche hebdomadaire de produits locaux et artisanat.',
    description: 'Chaque samedi, artisans et producteurs locaux exposent leurs creations au quartier Maamora.',
    categorySlug: 'marche-souk',
    organizerName: 'Cooperative Maamora',
    eventMode: 'IN_PERSON',
    venueName: 'Esplanade Maamora',
    address: 'Maamora, Kenitra',
    city: 'Kenitra',
    province: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    latitude: 34.2504,
    longitude: -6.5711,
    startsAt: '2026-08-01T09:00:00.000Z',
    endsAt: '2026-08-01T14:00:00.000Z',
    recurrenceType: 'WEEKLY',
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA',
    recurrenceEndsAt: '2026-12-31T23:59:00.000Z',
    isFree: true,
    status: 'PUBLISHED',
    verified: true,
  },
  {
    slug: 'salon-emploi-rabat-tech',
    title: 'Salon emploi Rabat Tech',
    shortDescription: 'Rencontres entreprises, startups et candidats tech.',
    description: 'Une journee pour rencontrer les recruteurs et assister a des conferences autour des metiers du numerique.',
    categorySlug: 'entrepreneuriat-emploi',
    organizerName: 'Rabat Digital Jobs',
    organizerEmail: 'contact@example.com',
    eventMode: 'HYBRID',
    venueName: 'Technopark Rabat',
    address: 'Rabat',
    city: 'Rabat',
    province: 'Rabat',
    region: 'Rabat-Sale-Kenitra',
    latitude: 34.0209,
    longitude: -6.8416,
    onlineUrl: 'https://example.com/live',
    startsAt: '2026-09-10T09:00:00.000Z',
    endsAt: '2026-09-10T18:00:00.000Z',
    isFree: false,
    priceMin: 50,
    priceMax: 150,
    ticketUrl: 'https://example.com/tickets',
    status: 'PUBLISHED',
    verified: true,
  },
  {
    slug: 'projection-cinema-annulee',
    title: 'Projection cinema annulee',
    shortDescription: 'Exemple de statut annule pour tester les avertissements.',
    description: 'Cette fiche sert a verifier l affichage clair des evenements annules.',
    categorySlug: 'cinema-projection',
    organizerName: 'Cinema Test',
    eventMode: 'IN_PERSON',
    venueName: 'Salle Test',
    address: 'Kenitra',
    city: 'Kenitra',
    province: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    latitude: 34.2672,
    longitude: -6.589,
    startsAt: '2026-08-20T18:00:00.000Z',
    endsAt: '2026-08-20T20:00:00.000Z',
    isFree: true,
    status: 'CANCELLED',
    verified: true,
  },
];

async function seedEvents(prisma, categories) {
  console.log('Seeding events...');
  let count = 0;
  for (const item of EVENTS) {
    const categoryId = categories.events?.[item.categorySlug]?.id;
    if (!categoryId) continue;
    const { categorySlug, ...data } = item;
    await prisma.event.upsert({
      where: { slug: item.slug },
      update: {
        ...data,
        categoryId,
        startsAt: new Date(item.startsAt),
        endsAt: new Date(item.endsAt),
        recurrenceEndsAt: item.recurrenceEndsAt ? new Date(item.recurrenceEndsAt) : null,
        publishedAt: item.status === 'PUBLISHED' ? new Date() : null,
      },
      create: {
        ...data,
        categoryId,
        startsAt: new Date(item.startsAt),
        endsAt: new Date(item.endsAt),
        recurrenceEndsAt: item.recurrenceEndsAt ? new Date(item.recurrenceEndsAt) : null,
        publishedAt: item.status === 'PUBLISHED' ? new Date() : null,
        createdById: await ensureSeedAdmin(prisma),
      },
    });
    count += 1;
  }
  console.log(`  ${count} event(s) ready.`);
}

async function ensureSeedAdmin(prisma) {
  const role = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrateur' },
  });
  const user = await prisma.user.upsert({
    where: { email: 'events.admin@madinatti.ma' },
    update: {},
    create: {
      name: 'Admin Evenements',
      email: 'events.admin@madinatti.ma',
      password: null,
      roleId: role.id,
      profileCompleted: true,
      isActive: true,
    },
  });
  return user.id;
}

module.exports = { seedEvents };
