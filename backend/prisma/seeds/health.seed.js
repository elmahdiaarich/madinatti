const HEALTH_SEED_PLACES = [
  {
    slug: 'hopital-provincial-kenitra',
    name: 'Hopital Provincial de Kenitra',
    subcategory: 'hospital-clinic',
    neighborhood: 'Centre Ville',
    city: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    address: 'Centre Ville, Kenitra',
    phones: ['0537000001'],
    latitude: 34.261,
    longitude: -6.5802,
    regularHours: {
      type: 'continuous',
      slots: [{ open: '00:00', close: '23:59' }],
      weekdayDescriptions: ['Ouvert 24h/24'],
    },
    openNow: true,
  },
  {
    slug: 'clinique-maamora-kenitra',
    name: 'Clinique Maamora',
    subcategory: 'hospital-clinic',
    neighborhood: 'Maamora',
    city: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    address: 'Maamora, Kenitra',
    phones: ['0537000002'],
    latitude: 34.2504,
    longitude: -6.5711,
    regularHours: {
      type: 'normal',
      slots: [
        { open: '09:00', close: '12:30' },
        { open: '15:00', close: '18:30' },
      ],
      weekdayDescriptions: ['Horaire normal: 09:00-12:30 / 15:00-18:30'],
    },
    openNow: null,
  },
  {
    slug: 'laboratoire-centre-kenitra',
    name: 'Laboratoire Centre Kenitra',
    subcategory: 'medical-laboratory',
    neighborhood: 'Centre Ville',
    city: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    address: 'Centre Ville, Kenitra',
    phones: ['0537000003'],
    latitude: 34.2595,
    longitude: -6.582,
    regularHours: {
      type: 'continuous',
      slots: [{ open: '07:30', close: '18:00' }],
      weekdayDescriptions: ['Horaire continu: 07:30-18:00'],
    },
    openNow: null,
  },
  {
    slug: 'cabinet-dr-amal-kenitra',
    name: 'Cabinet Dr Amal',
    subcategory: 'doctor-office',
    neighborhood: 'Mimosas',
    city: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    address: 'Mimosas, Kenitra',
    phones: ['0537000004'],
    latitude: 34.2672,
    longitude: -6.589,
    regularHours: {
      type: 'normal',
      slots: [
        { open: '09:00', close: '13:00' },
        { open: '15:00', close: '19:00' },
      ],
      weekdayDescriptions: ['Horaire normal: 09:00-13:00 / 15:00-19:00'],
    },
    openNow: null,
  },
];

async function seedHealthPlaces(prisma, categories) {
  console.log('Seeding health places...');

  const healthCategories = categories.sante || {};
  let count = 0;

  for (const place of HEALTH_SEED_PLACES) {
    const category = healthCategories[place.subcategory];
    await prisma.healthPlace.upsert({
      where: { slug: place.slug },
      update: {
        ...place,
        categoryId: category?.id || null,
        source: 'MADINATI',
        status: 'APPROVED',
        isVerified: true,
      },
      create: {
        ...place,
        categoryId: category?.id || null,
        source: 'MADINATI',
        status: 'APPROVED',
        isVerified: true,
      },
    });
    count += 1;
  }

  console.log(`  ${count} health place(s) ready.`);
}

module.exports = { seedHealthPlaces };
