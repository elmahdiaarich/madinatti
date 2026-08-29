const { cities: moroccoCities } = require('morocco-cities')
const prisma = require('../../config/db');

// ─── Build city → region lookup from morocco-cities ───────────────────────────
// Keyed by city name for O(1) lookup when populating listings.
const cityToRegion = moroccoCities.reduce((acc, c) => {
  acc[c.name] = c.region_name;
  return acc;
}, {});

// Helper: given a city name, return the matching region_name (or null).
const getRegion = (cityName) => cityToRegion[cityName] ?? null;

async function seedRealEstate(prisma, roles, categories) {
  console.log('🏠 Seeding real estate listings...');

  // ── 1. Get or create a business user ─────────────────────────────────────
  const businessRole = await prisma.role.findFirst({ where: { name: 'business' } });

  let user = await prisma.user.findFirst({ where: { role: { name: 'business' } } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name:        'Agence Immobilière Demo',
        email:       'agence@demo.ma',
        password:    '$2b$10$demohashedpassword',
        phone:       '+212600000001',
        city:        'Casablanca',
        roleId:      businessRole.id,
        companyName: 'Agence Demo Immo',
        companyLogo: null,
        isActive:    true,
      },
    });
  }

  // ── 2. Resolve immobilier categories ─────────────────────────────────────
  const catAppartement = categories.immobilier['appartement'];
  const catVilla       = categories.immobilier['villa'];
  const catMaison      = categories.immobilier['maison'];
  const catStudio      = categories.immobilier['studio'];
  const catTerrain     = categories.immobilier['terrain'];
  const catBureau      = categories.immobilier['bureau'];

  if (!catAppartement) {
    console.warn('⚠️  Immobilier categories not found. Run categories seed first.');
    return;
  }

  // ── 3a. Hand-crafted flagship listings ────────────────────────────────────
  // `city` must match a name in morocco-cities so getRegion() resolves correctly.
  const handcraftedListings = [
    {
      title:        'Bel appartement 3 pièces - Maarif Casablanca',
      description:  'Superbe appartement de 85m² situé au cœur du quartier Maarif.\n- Séjour spacieux avec double exposition\n- 2 chambres avec placards\n- Cuisine équipée\n- Balcon avec vue dégagée\n\nParking inclus. Résidence sécurisée avec gardien.',
      listingType:  'SALE',
      propertyType: 'APARTMENT',
      categoryId:   catAppartement.id,
      price:        1_250_000,
      surface:      85,
      rooms:        3,
      bathrooms:    1,
      floor:        4,
      city:         'Casablanca',
      location:     'Maarif, Casablanca',
      latitude:     33.5892,
      longitude:    -7.6197,
      contactPhone: '+212600000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', isCover: false },
        { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', isCover: false },
      ],
      features:    { parking: true, ascenseur: true, gardien: true, balcon: true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Villa moderne 5 chambres avec piscine - Ain Diab',
      description:  'Villa de standing de 320m² sur un terrain de 600m² dans le quartier résidentiel d\'Ain Diab.\n- Grand salon avec cheminée\n- 5 chambres dont une suite parentale\n- Piscine privée chauffée\n- Jardin paysager\n- Garage 2 voitures',
      listingType:  'SALE',
      propertyType: 'VILLA',
      categoryId:   catVilla.id,
      price:        8_500_000,
      surface:      320,
      rooms:        7,
      bathrooms:    3,
      floor:        0,
      city:         'Casablanca',
      location:     'Ain Diab, Casablanca',
      latitude:     33.5950,
      longitude:    -7.6900,
      contactPhone: '+212600000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', isCover: false },
      ],
      features:    { piscine: true, jardin: true, garage: '2 voitures', cheminée: true, gardien: true },
      status:      'APPROVED',
      publishedAt: new Date(),
      isFeatured:  true,
    },
    {
      title:        'Studio meublé à louer - Centre ville Rabat',
      description:  'Studio entièrement meublé de 35m² idéal pour étudiant ou jeune professionnel.\n- Coin cuisine équipé\n- Salle de bain moderne\n- Internet fibre inclus\n- Proche tramway',
      listingType:  'RENT',
      propertyType: 'STUDIO',
      categoryId:   catStudio.id,
      price:        3_200,
      surface:      35,
      rooms:        1,
      bathrooms:    1,
      floor:        2,
      city:         'Rabat',
      location:     'Centre ville, Rabat',
      latitude:     34.0132,
      longitude:    -6.8326,
      contactPhone: '+212600000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', isCover: true },
      ],
      features:    { meublé: true, internet: 'fibre', 'proche tramway': true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Appartement 2 chambres à louer - Agdal Rabat',
      description:  'Bel appartement de 75m² dans la résidence Agdal Green.\n- 2 chambres\n- Salon lumineux\n- Cuisine moderne\n- Parking sous-sol\n- Piscine résidence',
      listingType:  'RENT',
      propertyType: 'APARTMENT',
      categoryId:   catAppartement.id,
      price:        7_500,
      surface:      75,
      rooms:        3,
      bathrooms:    2,
      floor:        3,
      city:         'Rabat',
      location:     'Agdal, Rabat',
      latitude:     33.9894,
      longitude:    -6.8508,
      contactPhone: '+212600000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', isCover: false },
      ],
      features:    { parking: true, piscine: 'résidence', ascenseur: true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Maison 4 chambres à vendre - Kénitra',
      description:  'Belle maison individuelle de 180m² sur terrain de 250m².\n- 4 chambres\n- Grand salon marocain + salon européen\n- Cuisine équipée\n- Terrasse 40m²\n- Quartier calme et résidentiel',
      listingType:  'SALE',
      propertyType: 'HOUSE',
      categoryId:   catMaison.id,
      price:        1_800_000,
      surface:      180,
      rooms:        6,
      bathrooms:    2,
      floor:        0,
      city:         'Kénitra',
      location:     'Résidentiel, Kénitra',
      latitude:     34.2610,
      longitude:    -6.5802,
      contactPhone: '+212600000003',
      images: [
        { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', isCover: false },
      ],
      features:    { terrasse: '40m²', garage: true, 'salon marocain': true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Bureau 60m² à louer - Technopark Casablanca',
      description:  'Bureau moderne de 60m² en open space dans le Technopark.\n- Climatisation centrale\n- Salles de réunion partagées\n- Accès 24h/24\n- Parking visiteurs',
      listingType:  'RENT',
      propertyType: 'OFFICE',
      categoryId:   catBureau.id,
      price:        9_000,
      surface:      60,
      rooms:        1,
      bathrooms:    1,
      floor:        1,
      city:         'Casablanca',
      location:     'Technopark, Casablanca',
      latitude:     33.5731,
      longitude:    -7.6298,
      contactPhone: '+212600000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', isCover: true },
      ],
      features:    { climatisation: true, 'salle de réunion': true, 'accès 24h': true, parking: true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Terrain constructible 500m² - Route de Marrakech',
      description:  'Terrain constructible de 500m² avec titre foncier.\n- Viabilisé (eau, électricité, assainissement)\n- Zone résidentielle R+2 autorisé\n- Façade 20m\n- Proche des commodités',
      listingType:  'SALE',
      propertyType: 'LAND',
      categoryId:   catTerrain.id,
      price:        950_000,
      surface:      500,
      rooms:        null,
      bathrooms:    null,
      floor:        null,
      city:         'Casablanca',
      location:     'Route de Marrakech, Casablanca',
      latitude:     33.5200,
      longitude:    -7.6100,
      contactPhone: '+212600000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', isCover: true },
      ],
      features:    { 'titre foncier': true, viabilisé: true, 'R+2 autorisé': true },
      status:      'APPROVED',
      publishedAt: new Date(),
    },
    {
      title:        'Appartement standing - Vue mer - Tanger',
      description:  'Magnifique appartement de 120m² avec vue panoramique sur la mer.\n- 3 chambres\n- Grande terrasse 30m²\n- Résidence sécurisée avec piscine\n- Finitions haut de gamme\n- Parking double',
      listingType:  'SALE',
      propertyType: 'APARTMENT',
      categoryId:   catAppartement.id,
      price:        3_200_000,
      surface:      120,
      rooms:        4,
      bathrooms:    2,
      floor:        6,
      city:         'Tanger',
      location:     'Malabata, Tanger',
      latitude:     35.7595,
      longitude:    -5.8340,
      contactPhone: '+212600000004',
      images: [
        { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', isCover: true  },
        { url: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800', isCover: false },
        { url: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', isCover: false },
      ],
      features:    { 'vue mer': true, terrasse: '30m²', piscine: 'résidence', parking: 'double', gardien: true },
      status:      'APPROVED',
      publishedAt: new Date(),
      isFeatured:  true,
    },
  ];

  // ── 3b. Generated listings ─────────────────────────────────────────────────
  // Templated combinations of city / neighbourhood / property type to reach
  // a healthy catalogue size for demo/dev purposes without hand-writing every
  // single record. Each still resolves a real `city` from morocco-cities.
  const IMAGE_POOL = {
    APARTMENT: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800',
    ],
    VILLA: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
    ],
    HOUSE: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    ],
    STUDIO: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    ],
    LAND: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    ],
    OFFICE: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    ],
  };

  const PROPERTY_CATEGORY = {
    APARTMENT: catAppartement,
    VILLA:     catVilla,
    HOUSE:     catMaison,
    STUDIO:    catStudio,
    LAND:      catTerrain,
    OFFICE:    catBureau,
  };

  // city + a couple of plausible neighbourhoods each (kept generic on purpose),
  // plus an approximate city-centre coordinate so we can scatter listings
  // realistically across the whole country rather than clustering them.
  const CITY_AREAS = [
    { city: 'Casablanca', areas: ['Bourgogne', 'Racine', 'Californie', 'Sidi Belyout'], lat: 33.5731, lng: -7.5898 },
    { city: 'Rabat',      areas: ['Hay Riad', 'Hassan', 'Souissi', "L'Océan"],          lat: 34.0209, lng: -6.8416 },
    { city: 'Marrakech',  areas: ['Guéliz', 'Hivernage', 'Palmeraie', 'Targa'],         lat: 31.6295, lng: -7.9811 },
    { city: 'Fès',        areas: ['Ville Nouvelle', 'Saiss', 'Route Immouzer'],         lat: 34.0181, lng: -5.0078 },
    { city: 'Tanger',     areas: ['Iberia', 'Marshan', 'Boukhalef'],                    lat: 35.7595, lng: -5.8340 },
    { city: 'Agadir',     areas: ['Founty', 'Talborjt', 'Sonaba'],                      lat: 30.4278, lng: -9.5981 },
    { city: 'Meknès',     areas: ['Hamria', 'Marjane', 'Ville Nouvelle'],               lat: 33.8935, lng: -5.5473 },
    { city: 'Oujda',      areas: ['Centre ville', 'Al Qods'],                           lat: 34.6814, lng: -1.9086 },
    { city: 'Kénitra',    areas: ['Centre ville', 'Mimosas'],                           lat: 34.2610, lng: -6.5802 },
    { city: 'El Jadida',  areas: ['Centre ville', 'Bord de mer'],                       lat: 33.2549, lng: -8.5061 },
    { city: 'Tétouan',    areas: ['Centre ville', 'Martil road'],                       lat: 35.5785, lng: -5.3684 },
    { city: 'Safi',       areas: ['Centre ville'],                                      lat: 32.2994, lng: -9.2372 },
    { city: 'Essaouira',  areas: ['Médina', 'Quartier des Dunes'],                      lat: 31.5085, lng: -9.7595 },
    { city: 'Ouarzazate', areas: ['Centre ville', 'Quartier Administratif'],            lat: 30.9189, lng: -6.8934 },
    { city: 'Chefchaouen',areas: ['Médina', 'Centre ville'],                            lat: 35.1688, lng: -5.2636 },
    { city: 'Al Hoceima', areas: ['Centre ville', 'Bord de mer'],                       lat: 35.2517, lng: -3.9372 },
    { city: 'Nador',      areas: ['Centre ville', 'Port'],                              lat: 35.1740, lng: -2.9287 },
    { city: 'Beni Mellal',areas: ['Centre ville', 'Zaouia'],                            lat: 32.3373, lng: -6.3498 },
    { city: 'Errachidia', areas: ['Centre ville'],                                      lat: 31.9314, lng: -4.4244 },
    { city: 'Laâyoune',   areas: ['Centre ville'],                                      lat: 27.1418, lng: -13.1873 },
    { city: 'Dakhla',     areas: ['Centre ville', 'Bord de mer'],                       lat: 23.7185, lng: -15.9370 },
  ];

  const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'LAND', 'OFFICE'];

  const PROPERTY_LABEL_FR = {
    APARTMENT: 'Appartement',
    VILLA:     'Villa',
    HOUSE:     'Maison',
    STUDIO:    'Studio',
    LAND:      'Terrain',
    OFFICE:    'Bureau',
  };

  // Simple deterministic pseudo-random generator so the seed is reproducible.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const randInt = (min, max) => Math.floor(min + rand() * (max - min + 1));

  const generatedListings = [];
  const TARGET_TOTAL = 50; // 8 handcrafted + generated, comfortably over the 45 minimum

  let idx = 0;
  while (handcraftedListings.length + generatedListings.length < TARGET_TOTAL) {
    idx += 1;
    const propertyType = pick(PROPERTY_TYPES);
    const category = PROPERTY_CATEGORY[propertyType];
    if (!category) continue; // skip silently if that category wasn't seeded

    const { city, areas, lat: cityLat, lng: cityLng } = pick(CITY_AREAS);
    const area = pick(areas);
    const listingType = pick(['SALE', 'RENT']);

    // Small random jitter (~ up to ±0.04°, roughly ±4km) around the city
    // centre so pins don't all stack on the exact same point on the map.
    const latitude  = Math.round((cityLat + (rand() - 0.5) * 0.08) * 10000) / 10000;
    const longitude = Math.round((cityLng + (rand() - 0.5) * 0.08) * 10000) / 10000;

    let surface, rooms, bathrooms, floor, priceBase;
    switch (propertyType) {
      case 'APARTMENT':
        surface   = randInt(45, 160);
        rooms     = randInt(1, 5);
        bathrooms = randInt(1, 2);
        floor     = randInt(0, 8);
        priceBase = surface * randInt(9000, 16000);
        break;
      case 'VILLA':
        surface   = randInt(200, 500);
        rooms     = randInt(5, 9);
        bathrooms = randInt(2, 4);
        floor     = 0;
        priceBase = surface * randInt(15000, 26000);
        break;
      case 'HOUSE':
        surface   = randInt(90, 250);
        rooms     = randInt(3, 7);
        bathrooms = randInt(1, 3);
        floor     = 0;
        priceBase = surface * randInt(7000, 13000);
        break;
      case 'STUDIO':
        surface   = randInt(20, 45);
        rooms     = 1;
        bathrooms = 1;
        floor     = randInt(0, 6);
        priceBase = surface * randInt(8000, 14000);
        break;
      case 'LAND':
        surface   = randInt(150, 1200);
        rooms     = null;
        bathrooms = null;
        floor     = null;
        priceBase = surface * randInt(1200, 3500);
        break;
      case 'OFFICE':
        surface   = randInt(30, 200);
        rooms     = randInt(1, 4);
        bathrooms = randInt(1, 2);
        floor     = randInt(0, 10);
        priceBase = surface * randInt(9000, 15000);
        break;
    }

    // Rent listings: derive a monthly rent instead of a purchase price.
    const price = listingType === 'RENT'
      ? Math.max(2000, Math.round((priceBase * 0.005) / 100) * 100)
      : Math.round(priceBase / 1000) * 1000;

    const verb = listingType === 'SALE' ? 'à vendre' : 'à louer';
    const label = PROPERTY_LABEL_FR[propertyType];
    const title = `${label} ${rooms ? rooms + ' pièces ' : ''}${verb} - ${area}, ${city}`.replace(/\s+/g, ' ').trim();

    const descriptionLines = [
      `${label} de ${surface}m² situé à ${area}, ${city}.`,
    ];
    if (rooms)     descriptionLines.push(`- ${rooms} pièce(s)`);
    if (bathrooms) descriptionLines.push(`- ${bathrooms} salle(s) de bain`);
    if (propertyType === 'LAND') descriptionLines.push('- Terrain viabilisé, idéal pour construction');
    descriptionLines.push('- Quartier bien desservi, proche des commodités');

    const imgPool = IMAGE_POOL[propertyType] ?? IMAGE_POOL.APARTMENT;
    const images = [
      { url: pick(imgPool), isCover: true },
      { url: pick(imgPool), isCover: false },
    ];

    const daysAgo = randInt(0, 45);

    generatedListings.push({
      title,
      description:  descriptionLines.join('\n'),
      listingType,
      propertyType,
      categoryId:   category.id,
      price,
      surface,
      rooms,
      bathrooms,
      floor,
      city,
      location:     `${area}, ${city}`,
      latitude,
      longitude,
      contactPhone: '+212600000001',
      images,
      features: {
        parking: rand() > 0.5,
        ascenseur: propertyType === 'APARTMENT' ? rand() > 0.4 : undefined,
        gardien: rand() > 0.6,
      },
      status:      'APPROVED',
      publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      isFeatured:  rand() > 0.85,
    });
  }

  const listings = [...handcraftedListings, ...generatedListings];
  console.log(`  📦 Prepared ${listings.length} listings (${handcraftedListings.length} handcrafted + ${generatedListings.length} generated)`);

  // ── 4. Upsert each listing ────────────────────────────────────────────────
  for (const data of listings) {
    const slug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);

    // Resolve region automatically from morocco-cities
    const region = getRegion(data.city);
    if (!region) {
      console.warn(`  ⚠️  No region found for city "${data.city}" — check spelling against morocco-cities`);
    }

    await prisma.realEstateListing.create({
      data: {
        userId:       user.id,
        categoryId:   data.categoryId,
        title:        data.title,
        slug,
        description:  data.description,
        listingType:  data.listingType,
        propertyType: data.propertyType,
        price:        data.price,
        surface:      data.surface   ?? null,
        rooms:        data.rooms     ?? null,
        bathrooms:    data.bathrooms ?? null,
        floor:        data.floor     ?? null,
        city:         data.city,
        region:       region,           // ← populated from morocco-cities
        location:     data.location,
        latitude:     data.latitude  ?? null,
        longitude:    data.longitude ?? null,
        contactPhone: data.contactPhone,
        images:       data.images,
        features:     data.features,
        status:       data.status,
        isActive:     true,
        isFeatured:   data.isFeatured ?? false,
        publishedAt:  data.publishedAt ?? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`  ✅ ${data.listingType} · ${data.propertyType} · [${region ?? '⚠️ no region'}] · ${data.title.slice(0, 45)}`);
  }

  console.log(`🎉 Done seeding ${listings.length} real estate listings!\n`);
}

module.exports = { seedRealEstate };