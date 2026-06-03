const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {

  // ─── ROLES ──────────────────────────────────────────────────────────────────
  const citizenRole = await prisma.role.upsert({
    where:  { name: 'citizen' },
    update: {},
    create: { name: 'citizen',  description: 'Utilisateur citoyen' }
  })

  const businessRole = await prisma.role.upsert({
    where:  { name: 'business' },
    update: {},
    create: { name: 'business', description: 'Entreprise' }
  })

  const adminRole = await prisma.role.upsert({
    where:  { name: 'admin' },
    update: {},
    create: { name: 'admin',    description: 'Administrateur' }
  })

  console.log('✅ Roles seeded')

  // ─── PLANS ───────────────────────────────────────────────────────────────────
  await prisma.plan.upsert({
    where:  { id: 'standard' },
    update: {},
    create: {
      id: 'standard', name: 'Standard', price: 0, durationDays: 0,
      maxListings: 3, maxPhotos: 3,
      canBoost: false, canSponsor: false,
      hasBadge: false, hasStatistics: false, hasChat: false
    }
  })

  await prisma.plan.upsert({
    where:  { id: 'premium_tier1' },
    update: {},
    create: {
      id: 'premium_tier1', name: 'Premium Tier 1', price: 99, durationDays: 30,
      maxListings: 10, maxPhotos: 10,
      canBoost: true, canSponsor: false,
      hasBadge: true, hasStatistics: true, hasChat: true
    }
  })

  await prisma.plan.upsert({
    where:  { id: 'premium_tier2' },
    update: {},
    create: {
      id: 'premium_tier2', name: 'Premium Tier 2', price: 199, durationDays: 30,
      maxListings: 999, maxPhotos: 999,
      canBoost: true, canSponsor: true,
      hasBadge: true, hasStatistics: true, hasChat: true
    }
  })

  console.log('✅ Plans seeded')

  // ─── USERS ───────────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash('password123', 10)
  const hashedAdmin = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where:  { email: 'admin@yourtown.ma' },
    update: {},
    create: {
      name: 'Admin YourTown', email: 'admin@yourtown.ma',
      password: hashedAdmin, roleId: adminRole.id,
      isActive: true, emailVerifiedAt: new Date(),
      city: 'Rabat'
    }
  })

  const business1 = await prisma.user.upsert({
    where:  { email: 'immo.atlas@yourtown.ma' },
    update: {},
    create: {
      name: 'Immo Atlas', email: 'immo.atlas@yourtown.ma',
      password: hashed, roleId: businessRole.id,
      phone: '+212661000001',
      isActive: true, emailVerifiedAt: new Date(),
      city: 'Casablanca'
    }
  })

  const business2 = await prisma.user.upsert({
    where:  { email: 'dar.invest@yourtown.ma' },
    update: {},
    create: {
      name: 'Dar Invest', email: 'dar.invest@yourtown.ma',
      password: hashed, roleId: businessRole.id,
      phone: '+212661000002',
      isActive: true, emailVerifiedAt: new Date(),
      city: 'Rabat'
    }
  })

  const citizen1 = await prisma.user.upsert({
    where:  { email: 'youssef@yourtown.ma' },
    update: {},
    create: {
      name: 'Youssef Alami', email: 'youssef@yourtown.ma',
      password: hashed, roleId: citizenRole.id,
      phone: '+212661000003',
      isActive: true, emailVerifiedAt: new Date(),
      city: 'Rabat'
    }
  })

  const citizen2 = await prisma.user.upsert({
    where:  { email: 'salma@yourtown.ma' },
    update: {},
    create: {
      name: 'Salma Benali', email: 'salma@yourtown.ma',
      password: hashed, roleId: citizenRole.id,
      phone: '+212661000004',
      isActive: true, emailVerifiedAt: new Date(),
      city: 'Casablanca'
    }
  })

  console.log('✅ Users seeded')

  // ─── CATEGORIES ───────────────────────────────────────────────────────────────
  // Root
  const catRealEstate = await prisma.category.upsert({
    where:  { slug: 'real-estate' },
    update: {},
    create: { name: 'Immobilier', slug: 'real-estate', parentId: null, isActive: true }
  })

  // Leaf categories (these are the ones listings can use)
  const catApartment = await prisma.category.upsert({
    where:  { slug: 'real-estate-apartment' },
    update: {},
    create: { name: 'Appartement', slug: 'real-estate-apartment', parentId: catRealEstate.id, isActive: true }
  })

  const catVilla = await prisma.category.upsert({
    where:  { slug: 'real-estate-villa' },
    update: {},
    create: { name: 'Villa', slug: 'real-estate-villa', parentId: catRealEstate.id, isActive: true }
  })

  const catStudio = await prisma.category.upsert({
    where:  { slug: 'real-estate-studio' },
    update: {},
    create: { name: 'Studio', slug: 'real-estate-studio', parentId: catRealEstate.id, isActive: true }
  })

  const catLand = await prisma.category.upsert({
    where:  { slug: 'real-estate-land' },
    update: {},
    create: { name: 'Terrain', slug: 'real-estate-land', parentId: catRealEstate.id, isActive: true }
  })

  const catOffice = await prisma.category.upsert({
    where:  { slug: 'real-estate-office' },
    update: {},
    create: { name: 'Bureau', slug: 'real-estate-office', parentId: catRealEstate.id, isActive: true }
  })

  const catShop = await prisma.category.upsert({
    where:  { slug: 'real-estate-shop' },
    update: {},
    create: { name: 'Local commercial', slug: 'real-estate-shop', parentId: catRealEstate.id, isActive: true }
  })

  console.log('✅ Categories seeded')

  // ─── LISTINGS ─────────────────────────────────────────────────────────────────
  const listings = [
    // ── APPROVED listings (visible to public) ─────────────────────────────────
    {
      userId: business1.id, categoryId: catApartment.id,
      title: 'Appartement moderne 3 pièces - Hay Riad',
      slug: 'appartement-moderne-3-pieces-hay-riad-seed1',
      description: 'Bel appartement lumineux de 85m² au cœur de Hay Riad. Cuisine équipée, double vitrage, parking inclus.',
      listingType: 'RENT', propertyType: 'APARTMENT',
      price: 4500, surface: 85, rooms: 3, bathrooms: 1, floor: 2,
      city: 'Rabat', location: 'Hay Riad, Rabat',
      latitude: 33.9716, longitude: -6.8498,
      contactPhone: '+212661000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', isCover: true },
        { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', isCover: false }
      ],
      features: { parking: true, elevator: true, furnished: true, balcony: true, security: false },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business1.id, categoryId: catVilla.id,
      title: 'Villa avec piscine - Ain Diab Casablanca',
      slug: 'villa-piscine-ain-diab-casablanca-seed2',
      description: 'Magnifique villa de 400m² avec piscine, jardin paysager et vue sur mer. Quartier résidentiel calme.',
      listingType: 'SALE', propertyType: 'VILLA',
      price: 4800000, surface: 400, rooms: 6, bathrooms: 4, floor: 0,
      city: 'Casablanca', location: 'Ain Diab, Casablanca',
      latitude: 33.5883, longitude: -7.6714,
      contactPhone: '+212661000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800', isCover: true },
        { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', isCover: false }
      ],
      features: { pool: true, garden: true, parking: true, security: true, furnished: false },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business2.id, categoryId: catStudio.id,
      title: 'Studio meublé - Agdal Rabat',
      slug: 'studio-meuble-agdal-rabat-seed3',
      description: 'Studio entièrement meublé et équipé, idéal étudiant ou jeune actif. Proche tram et commerces.',
      listingType: 'RENT', propertyType: 'STUDIO',
      price: 2800, surface: 35, rooms: 1, bathrooms: 1, floor: 3,
      city: 'Rabat', location: 'Agdal, Rabat',
      latitude: 33.9942, longitude: -6.8504,
      contactPhone: '+212661000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', isCover: true }
      ],
      features: { furnished: true, elevator: false, wifi: true, balcony: false },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business2.id, categoryId: catApartment.id,
      title: 'Appartement 2 chambres - Maarif Casablanca',
      slug: 'appartement-2-chambres-maarif-casablanca-seed4',
      description: 'Appartement rénové de 70m² dans le quartier Maarif. Proche écoles, commerces et transports.',
      listingType: 'SALE', propertyType: 'APARTMENT',
      price: 1250000, surface: 70, rooms: 2, bathrooms: 1, floor: 1,
      city: 'Casablanca', location: 'Maarif, Casablanca',
      latitude: 33.5786, longitude: -7.6343,
      contactPhone: '+212661000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', isCover: true },
        { url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', isCover: false }
      ],
      features: { parking: false, elevator: true, furnished: false, balcony: true },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business1.id, categoryId: catOffice.id,
      title: 'Bureau open space 120m² - Casa Finance City',
      slug: 'bureau-open-space-120m2-casa-finance-city-seed5',
      description: 'Espace de bureaux moderne en open space, entièrement équipé, dans le quartier financier de Casablanca.',
      listingType: 'RENT', propertyType: 'OFFICE',
      price: 18000, surface: 120, rooms: 4, bathrooms: 2, floor: 8,
      city: 'Casablanca', location: 'Casa Finance City, Casablanca',
      latitude: 33.5367, longitude: -7.6389,
      contactPhone: '+212661000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', isCover: true }
      ],
      features: { parking: true, elevator: true, security: true, airConditioning: true },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business2.id, categoryId: catLand.id,
      title: 'Terrain constructible 500m² - Salé',
      slug: 'terrain-constructible-500m2-sale-seed6',
      description: 'Terrain nu de 500m² avec titre foncier, zone résidentielle, toutes commodités à proximité.',
      listingType: 'SALE', propertyType: 'LAND',
      price: 750000, surface: 500,
      city: 'Salé', location: 'Hay Salam, Salé',
      latitude: 34.0370, longitude: -6.7966,
      contactPhone: '+212661000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', isCover: true }
      ],
      features: { titleDeed: true, electricity: true, water: true },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business1.id, categoryId: catVilla.id,
      title: 'Villa 5 chambres - Souissi Rabat',
      slug: 'villa-5-chambres-souissi-rabat-seed7',
      description: 'Grande villa familiale dans le quartier diplomatique de Souissi. Jardin, garage 3 voitures, dépendance.',
      listingType: 'SALE', propertyType: 'VILLA',
      price: 6500000, surface: 550, rooms: 7, bathrooms: 5, floor: 0,
      city: 'Rabat', location: 'Souissi, Rabat',
      latitude: 33.9917, longitude: -6.8270,
      contactPhone: '+212661000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', isCover: true }
      ],
      features: { garden: true, parking: true, security: true, pool: false, furnished: false },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },
    {
      userId: business2.id, categoryId: catShop.id,
      title: 'Local commercial 60m² - Centre Agdal',
      slug: 'local-commercial-60m2-centre-agdal-seed8',
      description: 'Local commercial en rez-de-chaussée sur axe passant, vitrine sur rue, idéal commerce ou restauration.',
      listingType: 'RENT', propertyType: 'SHOP',
      price: 9500, surface: 60, floor: 0,
      city: 'Rabat', location: 'Centre Agdal, Rabat',
      latitude: 33.9901, longitude: -6.8512,
      contactPhone: '+212661000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800', isCover: true }
      ],
      features: { storefront: true, storage: true, airConditioning: false },
      status: 'APPROVED', isActive: true, publishedAt: new Date(),
      reviewedBy: adminUser.id, reviewedAt: new Date(),
    },

    // ── PENDING listings (waiting for admin review) ────────────────────────────
    {
      userId: business1.id, categoryId: catApartment.id,
      title: 'Appartement neuf 4 pièces - Témara',
      slug: 'appartement-neuf-4-pieces-temara-seed9',
      description: 'Appartement dans résidence fermée avec piscine, neuf, jamais habité. Livraison immédiate.',
      listingType: 'SALE', propertyType: 'APARTMENT',
      price: 980000, surface: 110, rooms: 4, bathrooms: 2, floor: 4,
      city: 'Témara', location: 'Centre Témara',
      latitude: 33.9275, longitude: -6.9140,
      contactPhone: '+212661000001',
      images: [
        { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', isCover: true }
      ],
      features: { pool: true, parking: true, elevator: true, security: true, furnished: false },
      status: 'PENDING', isActive: true,
    },
    {
      userId: business2.id, categoryId: catStudio.id,
      title: 'Studio vue mer - Mohammedia',
      slug: 'studio-vue-mer-mohammedia-seed10',
      description: 'Studio avec terrasse et vue panoramique sur mer. Résidence sécurisée, piscine, accès plage directe.',
      listingType: 'RENT', propertyType: 'STUDIO',
      price: 3500, surface: 42, rooms: 1, bathrooms: 1, floor: 5,
      city: 'Mohammedia', location: 'Front de mer, Mohammedia',
      latitude: 33.6861, longitude: -7.3828,
      contactPhone: '+212661000002',
      images: [
        { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', isCover: true }
      ],
      features: { seaview: true, pool: true, furnished: true, parking: false },
      status: 'PENDING', isActive: true,
    },
  ]

  for (const listing of listings) {
    await prisma.realEstateListing.upsert({
      where:  { slug: listing.slug },
      update: {},
      create: listing,
    })
  }

  console.log('✅ Listings seeded (8 APPROVED + 2 PENDING)')

  // ─── FAVORITES ────────────────────────────────────────────────────────────────
  const approvedListings = await prisma.realEstateListing.findMany({
    where:  { status: 'APPROVED' },
    select: { id: true },
    take: 3,
  })

  for (const listing of approvedListings) {
    await prisma.favorite.upsert({
      where: {
        userId_itemId_itemType: {
          userId: citizen1.id, itemId: listing.id, itemType: 'REAL_ESTATE'
        }
      },
      update: {},
      create: { userId: citizen1.id, itemId: listing.id, itemType: 'REAL_ESTATE' }
    })
  }

  console.log('✅ Favorites seeded')

  // ─── INQUIRIES ────────────────────────────────────────────────────────────────
  const firstListing = approvedListings[0]

  await prisma.propertyInquiry.upsert({
    where: { id: 'seed-inquiry-1' },
    update: {},
    create: {
      id: 'seed-inquiry-1',
      listingId:    firstListing.id,
      userId:       citizen1.id,
      message:      'Bonjour, est-ce que le logement est toujours disponible ? Je suis intéressé pour une visite cette semaine.',
      contactPhone: '+212661000003',
      contactEmail: 'youssef@yourtown.ma',
      status:       'pending',
    }
  })

  await prisma.propertyInquiry.upsert({
    where: { id: 'seed-inquiry-2' },
    update: {},
    create: {
      id: 'seed-inquiry-2',
      listingId:    firstListing.id,
      userId:       citizen2.id,
      message:      'Bonjour, les charges sont-elles incluses dans le loyer ? Merci.',
      contactEmail: 'salma@yourtown.ma',
      status:       'pending',
    }
  })

  console.log('✅ Inquiries seeded')
  console.log('')
  console.log('─────────────────────────────────────────')
  console.log('🌱 Seed complet. Comptes de test :')
  console.log('   admin@yourtown.ma     / admin123')
  console.log('   immo.atlas@yourtown.ma / password123  (business)')
  console.log('   dar.invest@yourtown.ma / password123  (business)')
  console.log('   youssef@yourtown.ma   / password123  (citizen)')
  console.log('   salma@yourtown.ma     / password123  (citizen)')
  console.log('─────────────────────────────────────────')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })