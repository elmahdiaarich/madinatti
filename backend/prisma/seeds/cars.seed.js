// prisma/seeds/cars.seed.js

const { cities: moroccoCities } = require('morocco-cities');

// ─── Build city → region lookup ───────────────────────────────────────────────
const cityToRegion = moroccoCities.reduce((acc, c) => {
  acc[c.name] = c.region_name;
  return acc;
}, {});

const getRegion = (cityName) => cityToRegion[cityName] ?? null;

async function seedCars(prisma, roles, categories) {
  console.log('🚗 Seeding car listings...');

  // ── 1. Get or create a business user ─────────────────────────────────────
  const businessRole = await prisma.role.findFirst({ where: { name: 'business' } });

  let user = await prisma.user.findFirst({ where: { email: 'autocenter@demo.ma' } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name:        'Auto Center Demo',
        email:       'autocenter@demo.ma',
        password:    '$2b$10$demohashedpassword',
        phone:       '+212600000010',
        city:        'Casablanca',
        roleId:      businessRole.id,
        companyName: 'Auto Center Maroc',
        companyLogo: null,
        isActive:    true,
      },
    });
  }

  // ── 2. Resolve automobile categories ─────────────────────────────────────
  const catVoiture    = categories.automobile?.['voitures'];
  const catMoto       = categories.automobile?.['motos'];
  const catUtilitaire = categories.automobile?.['utilitaires'];
  const catCamion     = categories.automobile?.['camions'];

  if (!catVoiture) {
    console.warn('⚠️  Automobile categories not found. Run categories seed first.');
    return;
  }

  // ── 3. Listings data ──────────────────────────────────────────────────────
  const listings = [
    {
      title:        'Toyota Corolla 2020 - Très bon état',
      description:  'Toyota Corolla 2020 en excellent état.\n- Première main\n- Entretien chez concessionnaire\n- Climatisation automatique\n- Caméra de recul\n- Régulateur de vitesse\n\nVidange faite récemment. Prête à circuler.',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catVoiture.id,
      make:         'Toyota',
      model:        'Corolla',
      year:         2020,
      mileage:      45000,
      fuelType:     'PETROL',
      transmission: 'AUTOMATIC',
      bodyType:     'SEDAN',
      color:        'Blanc',
      doors:        4,
      seats:        5,
      engineSize:   1.6,
      horsePower:   132,
      price:        185000,
      isNegotiable: true,
      city:         'Casablanca',
      location:     'Maarif, Casablanca',
      latitude:     33.5892,
      longitude:    -7.6197,
      contactPhone: '+212600000010',
      images: [
        { url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', isCover: false },
      ],
      features: { climatisation: 'automatique', 'caméra recul': true, régulateur: true, bluetooth: true },
      status:      'APPROVED',
      publishedAt: new Date(),
      isFeatured:  true,
    },
    {
      title:        'Dacia Duster 4x4 2021 - Diesel',
      description:  'Dacia Duster 4x4 2021 en parfait état.\n- Moteur diesel 1.5 dCi 115ch\n- Transmission intégrale\n- GPS intégré\n- Sièges chauffants\n- Jantes alliage 17"',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catVoiture.id,
      make:         'Dacia',
      model:        'Duster',
      year:         2021,
      mileage:      32000,
      fuelType:     'DIESEL',
      transmission: 'MANUAL',
      bodyType:     'SUV',
      color:        'Gris',
      doors:        5,
      seats:        5,
      engineSize:   1.5,
      horsePower:   115,
      price:        210000,
      isNegotiable: false,
      city:         'Rabat',
      location:     'Agdal, Rabat',
      latitude:     33.9894,
      longitude:    -6.8508,
      contactPhone: '+212600000010',
      images: [
        { url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800', isCover: false },
      ],
      features: { '4x4': true, gps: true, 'sièges chauffants': true, 'jantes alliage': '17"' },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Volkswagen Golf 7 2019 - Full options',
      description:  'Golf 7 1.4 TSI full options.\n- Toit ouvrant panoramique\n- Système Apple CarPlay / Android Auto\n- Freinage automatique d\'urgence\n- Détecteur d\'angle mort\n- Phares LED',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catVoiture.id,
      make:         'Volkswagen',
      model:        'Golf',
      year:         2019,
      mileage:      68000,
      fuelType:     'PETROL',
      transmission: 'AUTOMATIC',
      bodyType:     'HATCHBACK',
      color:        'Noir',
      doors:        5,
      seats:        5,
      engineSize:   1.4,
      horsePower:   150,
      price:        220000,
      isNegotiable: true,
      city:         'Tanger',
      location:     'Centre ville, Tanger',
      latitude:     35.7595,
      longitude:    -5.8340,
      contactPhone: '+212600000011',
      images: [
        { url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800', isCover: false },
      ],
      features: { 'toit ouvrant': true, carplay: true, 'freinage urgence': true, 'phares LED': true },
      status:      'APPROVED',
      publishedAt: new Date(),
      isFeatured:  true,
    },
    {
      title:        'Renault Clio 5 à louer - Casablanca',
      description:  'Renault Clio 5 2022 disponible à la location courte ou longue durée.\n- Kilométrage illimité\n- Assurance tous risques incluse\n- Livraison possible\n- Idéale pour déplacements professionnels',
      listingType:  'RENT',
      condition:    'USED',
      categoryId:   catVoiture.id,
      make:         'Renault',
      model:        'Clio',
      year:         2022,
      mileage:      15000,
      fuelType:     'PETROL',
      transmission: 'MANUAL',
      bodyType:     'HATCHBACK',
      color:        'Rouge',
      doors:        5,
      seats:        5,
      engineSize:   1.0,
      horsePower:   90,
      price:        350,           // price per day
      isNegotiable: false,
      city:         'Casablanca',
      location:     'Ain Sebaa, Casablanca',
      latitude:     33.6050,
      longitude:    -7.5500,
      contactPhone: '+212600000010',
      images: [
        { url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800', isCover: true },
      ],
      features: { 'km illimité': true, assurance: 'tous risques', livraison: true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'BMW Série 3 2018 - Sport Line',
      description:  'BMW 318i Sport Line en excellent état.\n- Pack sport extérieur\n- Jantes 18" M\n- Sièges sport en cuir\n- Système iDrive avec écran tactile\n- Entretien BMW jusqu\'à 100 000 km',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catVoiture.id,
      make:         'BMW',
      model:        'Série 3',
      year:         2018,
      mileage:      88000,
      fuelType:     'PETROL',
      transmission: 'AUTOMATIC',
      bodyType:     'SEDAN',
      color:        'Bleu',
      doors:        4,
      seats:        5,
      engineSize:   2.0,
      horsePower:   136,
      price:        310000,
      isNegotiable: true,
      city:         'Marrakech',
      location:     'Guéliz, Marrakech',
      latitude:     31.6295,
      longitude:    -8.0083,
      contactPhone: '+212600000012',
      images: [
        { url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800', isCover: false },
      ],
      features: { 'pack sport': true, 'cuir': true, idrive: true, 'jantes M': '18"' },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Yamaha MT-07 2021 - Moto Roadster',
      description:  'Yamaha MT-07 2021 en parfait état.\n- 689cc bicylindre\n- 73ch\n- 3 modes de conduite\n- Traction control\n- Très maniable en ville',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catMoto?.id ?? catVoiture.id,
      make:         'Yamaha',
      model:        'MT-07',
      year:         2021,
      mileage:      8000,
      fuelType:     'PETROL',
      transmission: 'MANUAL',
      bodyType:     'OTHER',
      color:        'Noir',
      doors:        null,
      seats:        2,
      engineSize:   0.7,
      horsePower:   73,
      price:        95000,
      isNegotiable: false,
      city:         'Casablanca',
      location:     'Hay Hassani, Casablanca',
      latitude:     33.5500,
      longitude:    -7.6600,
      contactPhone: '+212600000010',
      images: [
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', isCover: true },
      ],
      features: { 'traction control': true, '3 modes conduite': true, 'ABS': true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Mercedes Sprinter utilitaire 2019',
      description:  'Mercedes Sprinter 314 CDI long 2019.\n- Aménagé atelier mobile\n- 3 places\n- Climatisation\n- GPS\n- Excellent état général\n\nIdéal pour artisans ou livraisons.',
      listingType:  'SALE',
      condition:    'USED',
      categoryId:   catUtilitaire?.id ?? catVoiture.id,
      make:         'Mercedes',
      model:        'Sprinter',
      year:         2019,
      mileage:      120000,
      fuelType:     'DIESEL',
      transmission: 'MANUAL',
      bodyType:     'VAN',
      color:        'Blanc',
      doors:        4,
      seats:        3,
      engineSize:   2.1,
      horsePower:   143,
      price:        320000,
      isNegotiable: true,
      city:         'Kénitra',
      location:     'Zone industrielle, Kénitra',
      latitude:     34.2610,
      longitude:    -6.5802,
      contactPhone: '+212600000013',
      images: [
        { url: 'https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=800', isCover: true },
      ],
      features: { 'aménagé': true, climatisation: true, gps: true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Hyundai Tucson 2022 - Neuf de stock',
      description:  'Hyundai Tucson 2022 neuf, jamais immatriculé.\n- Motorisation 1.6 T-GDI 150ch\n- Pack Premium complet\n- Toit panoramique\n- Écran 10.25" tactile\n- Garantie constructeur 5 ans',
      listingType:  'SALE',
      condition:    'NEW',
      categoryId:   catVoiture.id,
      make:         'Hyundai',
      model:        'Tucson',
      year:         2022,
      mileage:      0,
      fuelType:     'PETROL',
      transmission: 'AUTOMATIC',
      bodyType:     'SUV',
      color:        'Gris',
      doors:        5,
      seats:        5,
      engineSize:   1.6,
      horsePower:   150,
      price:        380000,
      isNegotiable: false,
      city:         'Casablanca',
      location:     'Sidi Maarouf, Casablanca',
      latitude:     33.5400,
      longitude:    -7.6400,
      contactPhone: '+212600000010',
      images: [
        { url: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', isCover: false },
      ],
      features: { 'toit panoramique': true, 'garantie 5 ans': true, 'pack premium': true, 'écran tactile': '10.25"' },
      status:      'APPROVED',
      publishedAt: new Date(),
      isFeatured:  true,
    },
  ];

  // ── 4. Upsert each listing ────────────────────────────────────────────────
  for (const data of listings) {
    const slug =
      `${data.make} ${data.model} ${data.title}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      + '-' + Date.now().toString(36);

    const region = getRegion(data.city);
    if (!region) {
      console.warn(`  ⚠️  No region found for city "${data.city}" — check spelling against morocco-cities`);
    }

    await prisma.carListing.create({
      data: {
        userId:       user.id,
        categoryId:   data.categoryId,
        title:        data.title,
        slug,
        description:  data.description,
        listingType:  data.listingType,
        condition:    data.condition,
        make:         data.make,
        model:        data.model,
        year:         data.year,
        mileage:      data.mileage      ?? null,
        fuelType:     data.fuelType,
        transmission: data.transmission,
        bodyType:     data.bodyType,
        color:        data.color        ?? null,
        doors:        data.doors        ?? null,
        seats:        data.seats        ?? null,
        engineSize:   data.engineSize   ?? null,
        horsePower:   data.horsePower   ?? null,
        price:        data.price,
        isNegotiable: data.isNegotiable ?? false,
        city:         data.city,
        region,
        location:     data.location,
        latitude:     data.latitude     ?? null,
        longitude:    data.longitude    ?? null,
        contactPhone: data.contactPhone ?? null,
        images:       data.images,
        features:     data.features,
        status:       data.status,
        isActive:     true,
        isFeatured:   data.isFeatured   ?? false,
        publishedAt:  data.publishedAt,
      },
    });

    console.log(`  ✅ ${data.listingType} · ${data.condition} · ${data.make} ${data.model} · [${region ?? '⚠️ no region'}] · ${data.title.slice(0, 40)}`);
  }

  console.log('🎉 Done seeding car listings!\n');
}

module.exports = { seedCars };