// prisma/seeds/realEstate.seed.js

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

  // ── 3. Listings data ──────────────────────────────────────────────────────
  // `city` must match a name in morocco-cities so getRegion() resolves correctly.
  const listings = [
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
      + '-' + Date.now().toString(36);

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
        publishedAt:  new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`  ✅ ${data.listingType} · ${data.propertyType} · [${region ?? '⚠️ no region'}] · ${data.title.slice(0, 45)}`);
  }

  console.log('🎉 Done seeding real estate listings!\n');
}

module.exports = { seedRealEstate };