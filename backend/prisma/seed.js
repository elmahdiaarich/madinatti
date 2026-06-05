const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ── Logo helper — Google Favicons (gratuit, sans compte) ──
const logo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

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
  console.log('✅ Roles created')

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
  console.log('✅ Plans created')
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
    create: { id: 'standard', name: 'Standard', price: 0, durationDays: 0, maxListings: 3, maxPhotos: 3, canBoost: false, canSponsor: false, hasBadge: false, hasStatistics: false, hasChat: false }
  })
  await prisma.plan.upsert({
    where: { id: 'premium_tier1' },
    update: {},
    create: { id: 'premium_tier1', name: 'Premium Tier 1', price: 99, durationDays: 30, maxListings: 10, maxPhotos: 10, canBoost: true, canSponsor: false, hasBadge: true, hasStatistics: true, hasChat: true }
  })
  await prisma.plan.upsert({
    where: { id: 'premium_tier2' },
    update: {},
    create: { id: 'premium_tier2', name: 'Premium Tier 2', price: 199, durationDays: 30, maxListings: 999, maxPhotos: 999, canBoost: true, canSponsor: true, hasBadge: true, hasStatistics: true, hasChat: true }
  })
  console.log('✅ Plans created')

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
  // REALSTATE
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

  // ── ADMIN ─────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@madinatti.ma' },
    update: {},
    create: { name: 'Admin', email: 'admin@madinatti.ma', password: hashedPassword, roleId: admin.id, isActive: true, emailVerifiedAt: new Date() }
  })
  console.log('✅ Admin created')

  // ── CATEGORIES ────────────────────────────────────────────
  const catInfo        = await prisma.category.upsert({ where: { slug: 'informatique' },  update: {}, create: { name: 'Informatique & Tech',        slug: 'informatique'  } })
  const catMarketing   = await prisma.category.upsert({ where: { slug: 'marketing' },     update: {}, create: { name: 'Marketing & Communication',   slug: 'marketing'     } })
  const catFinance     = await prisma.category.upsert({ where: { slug: 'finance' },       update: {}, create: { name: 'Finance & Comptabilité',      slug: 'finance'       } })
  const catRH          = await prisma.category.upsert({ where: { slug: 'rh' },            update: {}, create: { name: 'Ressources Humaines',          slug: 'rh'            } })
  const catBTP         = await prisma.category.upsert({ where: { slug: 'btp' },           update: {}, create: { name: 'BTP & Travaux',               slug: 'btp'           } })
  const catVente       = await prisma.category.upsert({ where: { slug: 'vente' },         update: {}, create: { name: 'Vente & Commerce',            slug: 'vente'         } })
  const catSante       = await prisma.category.upsert({ where: { slug: 'sante' },         update: {}, create: { name: 'Santé & Médical',             slug: 'sante'         } })
  const catLogistique  = await prisma.category.upsert({ where: { slug: 'logistique' },    update: {}, create: { name: 'Logistique & Transport',      slug: 'logistique'    } })
  const catJuridique   = await prisma.category.upsert({ where: { slug: 'juridique' },     update: {}, create: { name: 'Juridique & Droit',           slug: 'juridique'     } })
  const catEnseignement= await prisma.category.upsert({ where: { slug: 'enseignement' },  update: {}, create: { name: 'Enseignement & Formation',    slug: 'enseignement'  } })
  console.log('✅ Categories created')

  // ── USERS BUSINESS ────────────────────────────────────────
  // Le logo est sur l'User (companyLogo), PAS sur JobListing
  const testPassword = await bcrypt.hash('password123', 10)

  const citoyen = await prisma.user.upsert({
    where: { email: 'citoyen@madinatti.ma' },
    update: {},
    create: { name: 'Youssef Bennani', email: 'citoyen@madinatti.ma', password: testPassword, roleId: citizen.id, isActive: true, emailVerifiedAt: new Date() }
  })

  const e1 = await prisma.user.upsert({
    where: { email: 'capgemini@madinatti.ma' },
    update: {},
    create: { name: 'Sara Moussaoui', email: 'capgemini@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Capgemini Maroc', companyLogo: logo('capgemini.com'), companyWebsite: 'https://capgemini.com' }
  })

  const e2 = await prisma.user.upsert({
    where: { email: 'oracle@madinatti.ma' },
    update: {},
    create: { name: 'Hassan Ouali', email: 'oracle@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Oracle Maroc', companyLogo: logo('oracle.com'), companyWebsite: 'https://oracle.com' }
  })

  const e3 = await prisma.user.upsert({
    where: { email: 'iam@madinatti.ma' },
    update: {},
    create: { name: 'Nadia Berrada', email: 'iam@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Maroc Telecom', companyLogo: logo('iam.ma'), companyWebsite: 'https://iam.ma' }
  })

  const e4 = await prisma.user.upsert({
    where: { email: 'attijariwafa@madinatti.ma' },
    update: {},
    create: { name: 'Mehdi Chraibi', email: 'attijariwafa@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Attijariwafa Bank', companyLogo: logo('attijariwafabank.com'), companyWebsite: 'https://attijariwafabank.com' }
  })

  const e5 = await prisma.user.upsert({
    where: { email: 'ocp@madinatti.ma' },
    update: {},
    create: { name: 'Yassine Kettani', email: 'ocp@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'OCP Group', companyLogo: logo('ocpgroup.ma'), companyWebsite: 'https://ocpgroup.ma' }
  })

  const e6 = await prisma.user.upsert({
    where: { email: 'deloitte@madinatti.ma' },
    update: {},
    create: { name: 'Amal Tazi', email: 'deloitte@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Deloitte Maroc', companyLogo: logo('deloitte.com'), companyWebsite: 'https://deloitte.com' }
  })

  const e7 = await prisma.user.upsert({
    where: { email: 'pwc@madinatti.ma' },
    update: {},
    create: { name: 'Rachid Bensouda', email: 'pwc@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'PwC Maroc', companyLogo: logo('pwc.com'), companyWebsite: 'https://pwc.com' }
  })

  const e8 = await prisma.user.upsert({
    where: { email: 'amazon@madinatti.ma' },
    update: {},
    create: { name: 'Fatima Zouheir', email: 'amazon@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Amazon Web Services', companyLogo: logo('aws.amazon.com'), companyWebsite: 'https://aws.amazon.com' }
  })

  const e9 = await prisma.user.upsert({
    where: { email: 'bmce@madinatti.ma' },
    update: {},
    create: { name: 'Karim Sqalli', email: 'bmce@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'Bank of Africa', companyLogo: logo('bankofafrica.ma'), companyWebsite: 'https://bankofafrica.ma' }
  })

  const e10 = await prisma.user.upsert({
    where: { email: 'masen@madinatti.ma' },
    update: {},
    create: { name: 'Omar Fassi', email: 'masen@madinatti.ma', password: testPassword, roleId: business.id, isActive: true, emailVerifiedAt: new Date(), companyName: 'MASEN', companyLogo: logo('masen.ma'), companyWebsite: 'https://masen.ma' }
  })

  console.log('✅ Users business created (logos sur User via Google Favicons)')

  // ── JOB LISTINGS ──────────────────────────────────────────
  // ⚠️  Pas de companyLogo ici — le logo vient de user.companyLogo
  const jobsData = [
    // ── INFORMATIQUE ──────────────────────────────────────
    { title: 'Développeur Full Stack React / Node.js',    user: e1, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 8000,  salaryMax: 12000, isFeatured: true,
      description: 'Développeur Full Stack passionné pour rejoindre notre équipe Agile.\n\nMissions :\n- Développer des fonctionnalités front-end avec React.js\n- Concevoir des APIs REST avec Node.js / Express\n- Travailler en méthode Agile Scrum\n\nProfil :\n- 2 ans expérience minimum\n- Maîtrise React, Node.js, PostgreSQL', skills: ['React', 'Node.js', 'PostgreSQL', 'Git'] },

    { title: 'Développeur Mobile Flutter',                user: e1, category: catInfo,        location: 'Casablanca', contractType: 'CDD',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 7000,  salaryMax: 9000,  isFeatured: false,
      description: 'Mission 6 mois — Application mobile cross-platform.\n\nMissions :\n- Développer une app Flutter iOS/Android\n- Intégrer des APIs REST\n- Publier sur App Store et Google Play\n\nProfil :\n- Expérience Flutter/Dart requise\n- Connaissance Firebase appréciée', skills: ['Flutter', 'Dart', 'Firebase', 'REST API'] },

    { title: 'Ingénieur DevOps',                          user: e2, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 15000, salaryMax: 22000, isFeatured: true,
      description: 'Ingénieur DevOps senior pour notre infrastructure cloud.\n\nMissions :\n- Gérer les pipelines CI/CD\n- Administrer les clusters Kubernetes\n- Automatiser les déploiements cloud AWS\n\nProfil :\n- 5+ ans expérience DevOps\n- Certifications AWS/Azure souhaitées', skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'] },

    { title: 'Architecte Solutions Cloud',                user: e8, category: catInfo,        location: 'Rabat',      contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'EXPERT_PLUS_10',  salaryMin: 25000, salaryMax: 35000, isFeatured: true,
      description: 'Architecte Cloud pour accompagner nos clients grands comptes.\n\nMissions :\n- Concevoir des architectures cloud scalables\n- Accompagner la migration vers AWS\n- Définir les patterns d\'architecture\n\nProfil :\n- 10+ ans expérience\n- Certifié AWS Solutions Architect', skills: ['AWS', 'GCP', 'Azure', 'Architecture', 'Microservices'] },

    { title: 'Data Scientist',                            user: e2, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 12000, salaryMax: 18000, isFeatured: false,
      description: 'Data Scientist pour notre division Analytics.\n\nMissions :\n- Analyser des volumes importants de données\n- Construire des modèles prédictifs ML\n- Présenter des insights aux stakeholders\n\nProfil :\n- Maîtrise Python, R, SQL\n- Expérience Machine Learning', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Power BI'] },

    { title: 'Développeur Frontend Angular',              user: e3, category: catInfo,        location: 'Rabat',      contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 8000,  salaryMax: 11000, isFeatured: false,
      description: 'Développeur Frontend Angular pour nos applications internes.\n\nMissions :\n- Développer et maintenir des interfaces Angular\n- Collaborer avec les équipes backend\n- Optimiser les performances\n\nProfil :\n- 2+ ans Angular\n- Connaissance TypeScript', skills: ['Angular', 'TypeScript', 'RxJS', 'HTML/CSS'] },

    { title: 'Administrateur Réseaux & Sécurité',         user: e3, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_4',    experienceLevel: 'MID_2_TO_5',       salaryMin: 9000,  salaryMax: 13000, isFeatured: false,
      description: 'Administrateur systèmes et réseaux.\n\nMissions :\n- Gérer l\'infrastructure réseau\n- Assurer la sécurité des systèmes\n- Superviser les sauvegardes\n\nProfil :\n- Certification CCNA ou équivalent\n- Expérience firewall, VPN', skills: ['Cisco', 'Firewall', 'VPN', 'Linux', 'Active Directory'] },

    { title: 'Développeur Backend Python / Django',       user: e1, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 7000,  salaryMax: 11000, isFeatured: false,
      description: 'Développeur backend Python pour notre plateforme fintech.\n\nMissions :\n- Développer des APIs RESTful avec Django\n- Gérer la base de données PostgreSQL\n- Assurer la qualité du code\n\nProfil :\n- 2-4 ans Python/Django\n- Bonne connaissance SQL', skills: ['Python', 'Django', 'PostgreSQL', 'Redis'] },

    { title: 'Technicien Support IT',                     user: e1, category: catInfo,        location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_2',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 4500,  salaryMax: 6500,  isFeatured: false,
      description: 'Support technique niveau 1 et 2.\n\nMissions :\n- Assistance utilisateurs\n- Résolution d\'incidents\n- Maintenance du parc informatique\n\nProfil :\n- BTS ou DUT informatique\n- Bon relationnel', skills: ['Windows', 'Active Directory', 'Ticketing', 'Hardware'] },

    { title: 'Stagiaire Développeur Web',                 user: e1, category: catInfo,        location: 'Casablanca', contractType: 'STAGE',        educationLevel: 'BAC_PLUS_2',    experienceLevel: 'STUDENT_FRESH_GRAD', salaryMin: 2000, salaryMax: 3000,  isFeatured: false,
      description: 'Stage de fin d\'études en développement web.\n\nMissions :\n- Participer au développement de projets clients\n- Apprendre les bonnes pratiques\n- Travailler en équipe agile\n\nProfil :\n- Étudiant Bac+2/Bac+3\n- Bases HTML/CSS/JS', skills: ['HTML', 'CSS', 'JavaScript', 'React'] },

    { title: 'Développeur Web — Alternance',              user: e1, category: catInfo,        location: 'Casablanca', contractType: 'ALTERNANCE',   educationLevel: 'BAC_PLUS_3',    experienceLevel: 'STUDENT_FRESH_GRAD', salaryMin: 3000, salaryMax: 4000,  isFeatured: false,
      description: 'Contrat d\'alternance développeur web.\n\nMissions :\n- Développement de fonctionnalités\n- Participation aux sprints Agile\n- Apprentissage en milieu professionnel\n\nProfil :\n- En formation Bac+3/+4 développement\n- Motivé et curieux', skills: ['JavaScript', 'React', 'Node.js', 'Git'] },

    // ── MARKETING ─────────────────────────────────────────
    { title: 'Chargé(e) de Marketing Digital',            user: e3, category: catMarketing,   location: 'Rabat',      contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 5000,  salaryMax: 7000,  isFeatured: false,
      description: 'Chargé Marketing Digital pour nos campagnes digitales.\n\nMissions :\n- Gérer les réseaux sociaux\n- Créer du contenu engageant\n- Analyser les performances des campagnes\n\nProfil :\n- Maîtrise des outils digitaux\n- Créatif et analytique', skills: ['Social Media', 'SEO', 'Copywriting', 'Google Analytics'] },

    { title: 'Community Manager Freelance',               user: e3, category: catMarketing,   location: 'Rabat',      contractType: 'FREELANCE',   educationLevel: 'BAC_PLUS_2',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 3000,  salaryMax: 5000,  isFeatured: false,
      description: 'Community manager freelance pour nos marques.\n\nMissions :\n- Animer les communautés en ligne\n- Créer du contenu viral\n- Modérer commentaires et messages\n\nProfil :\n- Maîtrise Facebook, Instagram, TikTok\n- Sens créatif développé', skills: ['Facebook', 'Instagram', 'TikTok', 'Canva'] },

    { title: 'Responsable Communication & Relations Presse', user: e3, category: catMarketing, location: 'Rabat',     contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 12000, salaryMax: 16000, isFeatured: false,
      description: 'Responsable Communication corporate.\n\nMissions :\n- Développer la stratégie de communication\n- Gérer les relations avec les médias\n- Superviser la production de contenus\n\nProfil :\n- 5+ ans en communication corporate\n- Excellent rédactionnel', skills: ['Relations Presse', 'Communication Corporate', 'Rédaction', 'Événementiel'] },

    { title: 'Chef de Projet Marketing',                  user: e4, category: catMarketing,   location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 10000, salaryMax: 14000, isFeatured: false,
      description: 'Chef de Projet Marketing pour nos campagnes nationales.\n\nMissions :\n- Piloter les campagnes marketing\n- Coordonner avec les agences créatives\n- Mesurer les ROI\n\nProfil :\n- Bac+5 marketing/commerce\n- Expérience bancaire appréciée', skills: ['Gestion de projet', 'Marketing Mix', 'CRM', 'Budgeting'] },

    { title: 'Graphiste / Motion Designer',               user: e6, category: catMarketing,   location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_2',    experienceLevel: 'MID_2_TO_5',       salaryMin: 5000,  salaryMax: 8000,  isFeatured: false,
      description: 'Graphiste créatif pour notre pôle communication.\n\nMissions :\n- Créer des visuels pour les réseaux sociaux\n- Réaliser des animations motion design\n- Respecter les chartes graphiques\n\nProfil :\n- Maîtrise Adobe Suite\n- Portfolio solide', skills: ['Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro'] },

    // ── FINANCE ───────────────────────────────────────────
    { title: 'Analyste Financier',                        user: e4, category: catFinance,     location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 12000, salaryMax: 17000, isFeatured: true,
      description: 'Analyste Financier — Direction des Risques.\n\nMissions :\n- Analyse des états financiers\n- Modélisation financière\n- Reporting mensuel à la direction\n\nProfil :\n- Grande école de commerce\n- Maîtrise Excel avancé', skills: ['Analyse Financière', 'Excel', 'Modélisation', 'PowerPoint'] },

    { title: 'Contrôleur de Gestion',                     user: e3, category: catFinance,     location: 'Rabat',      contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 11000, salaryMax: 15000, isFeatured: false,
      description: 'Contrôleur de gestion pour la direction financière.\n\nMissions :\n- Élaborer les budgets et forecasts\n- Analyser les écarts\n- Produire les tableaux de bord\n\nProfil :\n- Bac+5 Finance/Gestion\n- 3+ ans en contrôle de gestion', skills: ['Contrôle de gestion', 'SAP', 'Excel', 'Budget', 'Reporting'] },

    { title: 'Auditeur Interne',                          user: e4, category: catFinance,     location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 10000, salaryMax: 14000, isFeatured: false,
      description: 'Auditeur interne — Direction Audit & Contrôle.\n\nMissions :\n- Réaliser des missions d\'audit\n- Évaluer les dispositifs de contrôle\n- Rédiger les rapports d\'audit\n\nProfil :\n- Formation audit/finance\n- Certifié CIA apprécié', skills: ['Audit', 'Contrôle Interne', 'Risques', 'Rédaction'] },

    { title: 'Comptable Senior',                          user: e6, category: catFinance,     location: 'Fès',        contractType: 'CDI',         educationLevel: 'BAC_PLUS_4',    experienceLevel: 'MID_2_TO_5',       salaryMin: 7000,  salaryMax: 10000, isFeatured: false,
      description: 'Comptable senior pour cabinet d\'audit.\n\nMissions :\n- Tenue de la comptabilité générale\n- Déclarations fiscales\n- Supervision équipe junior\n\nProfil :\n- DSCG ou équivalent\n- Maîtrise Sage', skills: ['Comptabilité', 'Fiscalité', 'Sage', 'Excel'] },

    { title: 'Responsable Paie',                          user: e7, category: catFinance,     location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 7000,  salaryMax: 9000,  isFeatured: false,
      description: 'Responsable Paie pour portefeuille de clients PME.\n\nMissions :\n- Établir les bulletins de salaire\n- Déclarations CNSS et IR\n- Conseil en droit social\n\nProfil :\n- Maîtrise du Code du travail marocain\n- Logiciel paie (Sage Paie)', skills: ['Paie', 'CNSS', 'Droit Social', 'Sage Paie'] },

    { title: 'Comptable — Temps Partiel',                 user: e7, category: catFinance,     location: 'Rabat',      contractType: 'TEMPS_PARTIEL', educationLevel: 'BAC_PLUS_2',  experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 2500,  salaryMax: 4000,  isFeatured: false,
      description: 'Comptable temps partiel (20h/semaine).\n\nMissions :\n- Saisie comptable\n- Rapprochements bancaires\n- Classement et archivage\n\nProfil :\n- BTS Comptabilité\n- Disponible matin ou après-midi', skills: ['Comptabilité', 'Sage', 'Excel', 'Saisie'] },

    // ── RH ────────────────────────────────────────────────
    { title: 'Responsable RH',                            user: e5, category: catRH,          location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 9000,  salaryMax: 13000, isFeatured: false,
      description: 'Responsable RH groupe industriel.\n\nMissions :\n- Recrutement et intégration\n- Paie et déclarations sociales\n- Politique de formation\n\nProfil :\n- Bac+5 GRH ou équivalent\n- 5+ ans expérience RH', skills: ['Recrutement', 'Paie', 'Droit du travail', 'GPEC'] },

    { title: 'Chargé(e) de Recrutement',                  user: e1, category: catRH,          location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 5500,  salaryMax: 7500,  isFeatured: false,
      description: 'Chargé Recrutement pour nos profils IT.\n\nMissions :\n- Sourcing et sélection de candidats\n- Conduite d\'entretiens\n- Gestion des offres et contrats\n\nProfil :\n- Première expérience en recrutement\n- Bonne connaissance des métiers IT', skills: ['Recrutement', 'LinkedIn Recruiter', 'ATS', 'Entretien'] },

    { title: 'Responsable Formation & Développement RH',  user: e4, category: catRH,          location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 12000, salaryMax: 16000, isFeatured: false,
      description: 'Responsable Formation & Développement des Compétences.\n\nMissions :\n- Élaborer le plan de formation\n- Gérer les organismes de formation\n- Piloter les projets de développement RH\n\nProfil :\n- 5+ ans en formation corporate', skills: ['Ingénierie de Formation', 'GPEC', 'LMS', 'Budget Formation'] },

    { title: 'Stagiaire RH — Recrutement',                user: e3, category: catRH,          location: 'Rabat',      contractType: 'STAGE',        educationLevel: 'BAC_PLUS_2',    experienceLevel: 'STUDENT_FRESH_GRAD', salaryMin: 2000, salaryMax: 2500,  isFeatured: false,
      description: 'Stage RH au sein de notre Direction RH.\n\nMissions :\n- Participer aux campagnes de recrutement\n- Gérer les candidatures\n- Préparer les supports d\'intégration\n\nProfil :\n- Étudiant Bac+2/3 GRH', skills: ['Recrutement', 'RH', 'Excel', 'Communication'] },

    { title: 'RH Anapec — Assistant RH',                  user: e3, category: catRH,          location: 'Casablanca', contractType: 'ANAPEC',       educationLevel: 'BAC_PLUS_2',    experienceLevel: 'STUDENT_FRESH_GRAD', salaryMin: 2800, salaryMax: 3200,  isFeatured: false,
      description: 'Poste dans le cadre du contrat Idmaj ANAPEC.\n\nMissions :\n- Appui à la gestion administrative du personnel\n- Suivi des dossiers collaborateurs\n- Archivage et classement\n\nProfil :\n- Jeune diplômé Bac+2\n- Inscrit à l\'ANAPEC', skills: ['Administration RH', 'Excel', 'Communication'] },

    // ── BTP ───────────────────────────────────────────────
    { title: 'Ingénieur Génie Civil',                     user: e5, category: catBTP,         location: 'Marrakech',  contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 10000, salaryMax: 15000, isFeatured: false,
      description: 'Ingénieur génie civil pour nos projets infrastructure.\n\nMissions :\n- Superviser les chantiers\n- Élaborer les plans techniques\n- Assurer conformité aux normes\n\nProfil :\n- Diplôme ingénieur GC\n- 3+ ans en chantier', skills: ['AutoCAD', 'Gestion de chantier', 'Béton armé', 'Revit'] },

    { title: 'Chef de Chantier',                          user: e5, category: catBTP,         location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'SENIOR_5_TO_10',   salaryMin: 8000,  salaryMax: 12000, isFeatured: false,
      description: 'Chef de Chantier — projets résidentiels et commerciaux.\n\nMissions :\n- Coordonner les équipes sur chantier\n- Suivre l\'avancement des travaux\n- Assurer la sécurité\n\nProfil :\n- Expérience prouvée en conduite de chantier', skills: ['Gestion de chantier', 'Planification', 'Sécurité BTP', 'MS Project'] },

    { title: 'Architecte DESA',                           user: e5, category: catBTP,         location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 9000,  salaryMax: 14000, isFeatured: false,
      description: 'Architecte pour nos projets résidentiels haut de gamme.\n\nMissions :\n- Conception de projets résidentiels\n- Suivi de chantier\n- Relation client\n\nProfil :\n- DESA Architecture\n- Maîtrise AutoCAD, Revit, SketchUp', skills: ['AutoCAD', 'Revit', 'SketchUp', 'ArchiCAD'] },

    { title: 'Électricien Industriel',                    user: e5, category: catBTP,         location: 'Tanger',     contractType: 'CDI',         educationLevel: 'BAC',           experienceLevel: 'MID_2_TO_5',       salaryMin: 5000,  salaryMax: 7000,  isFeatured: false,
      description: 'Électricien industriel pour site de production.\n\nMissions :\n- Installation et maintenance électrique\n- Dépannage des équipements\n- Respect des normes sécurité\n\nProfil :\n- BEP/BAC électrotechnique\n- Habilitation électrique', skills: ['Électricité industrielle', 'Automates', 'Maintenance', 'Normes NF'] },

    { title: 'Ingénieur Automaticien — Intérim',          user: e5, category: catBTP,         location: 'Tanger',     contractType: 'INTERIM',     educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 8000,  salaryMax: 11000, isFeatured: false,
      description: 'Mission intérim 3 mois — Automaticien.\n\nMissions :\n- Programmation automates Siemens\n- Dépannage lignes de production\n- Documentation technique\n\nProfil :\n- DUT/BTS Automatisme\n- Expérience Siemens S7', skills: ['Siemens S7', 'TIA Portal', 'Automatisme', 'SCADA'] },

    // ── VENTE ─────────────────────────────────────────────
    { title: 'Commercial Terrain B2B',                    user: e3, category: catVente,       location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_2',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 5000,  salaryMax: 9000,  isFeatured: false,
      description: 'Commercial terrain portefeuille entreprises.\n\nMissions :\n- Prospection et développement du portefeuille\n- Vente de solutions télécom B2B\n- Fidélisation des clients\n\nProfil :\n- Permis B requis\n- Bon négociateur', skills: ['Vente B2B', 'Négociation', 'CRM', 'Prospection'] },

    { title: 'Responsable Agence Bancaire',               user: e4, category: catVente,       location: 'Meknès',     contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 12000, salaryMax: 16000, isFeatured: false,
      description: 'Responsable Agence Bancaire réseau particuliers.\n\nMissions :\n- Manager l\'équipe de l\'agence\n- Développer le PNB\n- Assurer la conformité réglementaire\n\nProfil :\n- 5+ ans en banque de détail\n- Leadership confirmé', skills: ['Management', 'Banque', 'Commerce', 'Conformité'] },

    { title: 'Conseiller Clientèle Bancaire',             user: e9, category: catVente,       location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 5500,  salaryMax: 7500,  isFeatured: false,
      description: 'Conseiller Clientèle Particuliers.\n\nMissions :\n- Accueil et conseil des clients\n- Vente de produits bancaires\n- Gestion du portefeuille clients\n\nProfil :\n- Bac+3 Banque/Finance\n- Sens du service client', skills: ['Relation client', 'Vente', 'Produits bancaires', 'CRM'] },

    { title: 'Key Account Manager',                       user: e2, category: catVente,       location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 18000, salaryMax: 28000, isFeatured: true,
      description: 'Key Account Manager grands comptes.\n\nMissions :\n- Gérer et développer les grands comptes\n- Vente de licences et services\n- Coordination avec les équipes techniques\n\nProfil :\n- 5+ ans vente logiciels B2B\n- Réseau grands comptes établi', skills: ['Vente B2B', 'Négociation grands comptes', 'CRM Salesforce', 'ERP'] },

    { title: 'Commercial Anapec — Chargé de Clientèle',  user: e3, category: catVente,       location: 'Casablanca', contractType: 'ANAPEC',      educationLevel: 'BAC_PLUS_2',    experienceLevel: 'STUDENT_FRESH_GRAD', salaryMin: 2800, salaryMax: 3500,  isFeatured: false,
      description: 'Poste Idmaj ANAPEC — Chargé de clientèle.\n\nMissions :\n- Accueil et conseil clientèle\n- Vente de services\n- Gestion des réclamations\n\nProfil :\n- Jeune diplômé Bac+2\n- Inscrit à l\'ANAPEC', skills: ['Relation client', 'Vente', 'Communication'] },

    // ── SANTÉ ─────────────────────────────────────────────
    { title: 'Médecin Généraliste',                       user: e5, category: catSante,       location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 15000, salaryMax: 25000, isFeatured: false,
      description: 'Médecin généraliste pour clinique privée.\n\nMissions :\n- Consultations de médecine générale\n- Suivi des patients\n- Coordination avec les spécialistes\n\nProfil :\n- Doctorat en médecine\n- Inscrit au conseil de l\'Ordre', skills: ['Médecine générale', 'Diagnostic', 'Urgences'] },

    { title: 'Infirmier(ère) Diplômé(e) d\'État',         user: e5, category: catSante,       location: 'Rabat',      contractType: 'CDI',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 5000,  salaryMax: 7000,  isFeatured: false,
      description: 'Infirmier pour service médecine interne.\n\nMissions :\n- Soins infirmiers\n- Suivi des patients\n- Administration des traitements\n\nProfil :\n- Diplôme d\'État infirmier\n- Bon sens relationnel', skills: ['Soins infirmiers', 'Urgences', 'Prise en charge'] },

    { title: 'Pharmacien Responsable',                    user: e5, category: catSante,       location: 'Fès',        contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 10000, salaryMax: 15000, isFeatured: false,
      description: 'Pharmacien responsable officine.\n\nMissions :\n- Délivrance des médicaments\n- Conseil patients\n- Gestion des stocks\n\nProfil :\n- Docteur en Pharmacie\n- Inscrit à l\'Ordre des Pharmaciens', skills: ['Pharmacologie', 'Conseil', 'Gestion stocks'] },

    // ── LOGISTIQUE ────────────────────────────────────────
    { title: 'Responsable Logistique Supply Chain',       user: e5, category: catLogistique,  location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 12000, salaryMax: 16000, isFeatured: false,
      description: 'Responsable Logistique Supply Chain groupe.\n\nMissions :\n- Piloter la chaîne logistique\n- Optimiser les coûts de transport\n- Manager l\'équipe entrepôt\n\nProfil :\n- Bac+5 Logistique\n- 5+ ans expérience', skills: ['Supply Chain', 'WMS', 'Transport', 'Management'] },

    { title: 'Gestionnaire de Stock',                     user: e5, category: catLogistique,  location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_2',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 4500,  salaryMax: 6500,  isFeatured: false,
      description: 'Gestionnaire de Stock entrepôt logistique.\n\nMissions :\n- Réception et contrôle des marchandises\n- Inventaires tournants\n- Gestion WMS\n\nProfil :\n- BTS Logistique\n- Expérience entrepôt', skills: ['WMS', 'Inventaire', 'FIFO', 'ERP SAP'] },

    { title: 'Agent de Transit Douanier',                 user: e5, category: catLogistique,  location: 'Tanger',     contractType: 'CDI',         educationLevel: 'BAC_PLUS_2',    experienceLevel: 'MID_2_TO_5',       salaryMin: 6000,  salaryMax: 9000,  isFeatured: false,
      description: 'Agent de transit import/export port de Tanger.\n\nMissions :\n- Gestion des formalités douanières\n- Suivi des dossiers import/export\n- Relation avec les autorités portuaires\n\nProfil :\n- BTS Commerce International\n- Connaissance réglementation douanière', skills: ['Transit', 'Douane', 'Incoterms', 'Import/Export'] },

    { title: 'Chauffeur Livreur',                         user: e5, category: catLogistique,  location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BEFORE_BAC',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 3500,  salaryMax: 4500,  isFeatured: false,
      description: 'Chauffeur livreur tournées urbaines.\n\nMissions :\n- Livraisons B2C et B2B\n- Gestion des colis\n- Relation clients\n\nProfil :\n- Permis B (+ 2 ans)\n- Bonne connaissance du Grand Casablanca', skills: ['Livraison', 'Permis B', 'GPS', 'Service client'] },

    // ── JURIDIQUE ─────────────────────────────────────────
    { title: 'Juriste d\'Entreprise',                     user: e4, category: catJuridique,   location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 11000, salaryMax: 15000, isFeatured: false,
      description: 'Juriste Entreprise — Direction Juridique.\n\nMissions :\n- Rédaction et analyse de contrats\n- Veille juridique et réglementaire\n- Conseil aux opérationnels\n\nProfil :\n- Master 2 Droit des affaires\n- Expérience en banque ou cabinet', skills: ['Droit des affaires', 'Contrats', 'Compliance', 'OHADA'] },

    { title: 'Assistant Juridique',                       user: e7, category: catJuridique,   location: 'Rabat',      contractType: 'CDD',         educationLevel: 'BAC_PLUS_3',    experienceLevel: 'JUNIOR_LESS_2',    salaryMin: 4000,  salaryMax: 6000,  isFeatured: false,
      description: 'Assistant juridique pour cabinet d\'avocat.\n\nMissions :\n- Rédaction d\'actes et correspondances\n- Recherches juridiques\n- Suivi des dossiers contentieux\n\nProfil :\n- Licence en droit\n- Rigueur et discrétion', skills: ['Droit civil', 'Rédaction juridique', 'Veille', 'Word'] },

    { title: 'Responsable Compliance & AML',              user: e4, category: catJuridique,   location: 'Casablanca', contractType: 'CDI',         educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'SENIOR_5_TO_10',  salaryMin: 15000, salaryMax: 20000, isFeatured: false,
      description: 'Responsable Conformité & Lutte Anti-Blanchiment.\n\nMissions :\n- Piloter le dispositif LCB-FT\n- Former les équipes\n- Reporting à Bank Al-Maghrib\n\nProfil :\n- Expert compliance bancaire\n- Certifié CAMS apprécié', skills: ['Compliance', 'AML', 'KYC', 'Réglementation BAM'] },

    // ── ENSEIGNEMENT ──────────────────────────────────────
    { title: 'Formateur Développement Web',               user: e1, category: catEnseignement, location: 'Casablanca', contractType: 'CDI',        educationLevel: 'BAC_PLUS_3',    experienceLevel: 'MID_2_TO_5',       salaryMin: 7000,  salaryMax: 10000, isFeatured: false,
      description: 'Formateur développement web pour école de coding.\n\nMissions :\n- Animer des formations HTML/CSS/JS/React\n- Accompagner les apprenants\n- Créer des supports pédagogiques\n\nProfil :\n- 3+ ans dev web\n- Pédagogie et patience', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Pédagogie'] },

    { title: 'Professeur de Mathématiques',               user: e5, category: catEnseignement, location: 'Marrakech',  contractType: 'CDI',        educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 5000,  salaryMax: 8000,  isFeatured: false,
      description: 'Professeur de mathématiques lycée privé.\n\nMissions :\n- Enseigner les maths tronc commun et terminale\n- Préparer aux examens nationaux\n- Suivi pédagogique des élèves\n\nProfil :\n- Master Mathématiques\n- Expérience enseignement', skills: ['Mathématiques', 'Pédagogie', 'Baccalauréat'] },

    { title: 'Coordinateur Pédagogique',                  user: e5, category: catEnseignement, location: 'Casablanca', contractType: 'CDI',        educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 7000,  salaryMax: 10000, isFeatured: false,
      description: 'Coordinateur Pédagogique centre de formation.\n\nMissions :\n- Coordonner les activités pédagogiques\n- Superviser les formateurs\n- Assurer la qualité des formations\n\nProfil :\n- Expérience ingénierie pédagogique', skills: ['Ingénierie pédagogique', 'Management', 'E-learning', 'Qualité'] },

    { title: 'Ingénieur Énergie Renouvelable',            user: e10, category: catBTP,         location: 'Ouarzazate', contractType: 'CDI',        educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 12000, salaryMax: 18000, isFeatured: true,
      description: 'Ingénieur spécialisé énergies renouvelables.\n\nMissions :\n- Concevoir des installations solaires photovoltaïques\n- Suivre les chantiers éoliens\n- Rédiger les études de faisabilité\n\nProfil :\n- Ingénieur énergie/électrotechnique\n- Connaissance des normes CEI', skills: ['Énergie solaire', 'AutoCAD', 'PVsyst', 'Gestion de projet'] },

    { title: 'Ingénieur Mines & Géologie',                user: e5, category: catBTP,         location: 'Khouribga',  contractType: 'CDI',        educationLevel: 'BAC_PLUS_5_PLUS', experienceLevel: 'MID_2_TO_5',      salaryMin: 14000, salaryMax: 20000, isFeatured: false,
      description: 'Ingénieur mines pour nos opérations d\'extraction.\n\nMissions :\n- Superviser les opérations minières\n- Réaliser les études géologiques\n- Assurer la sécurité des sites\n\nProfil :\n- Diplôme ingénieur mines ou géologie\n- Expérience en mine à ciel ouvert', skills: ['Géologie', 'MineSight', 'Explosifs', 'Sécurité minière'] },
  ]

  // ── CRÉER LES JOBS ────────────────────────────────────────
  let count = 0
  for (const job of jobsData) {
    await prisma.jobListing.create({
      data: {
        userId:              job.user.id,        // ← logo via user.companyLogo
        categoryId:          job.category.id,
        title:               job.title,
        companyName:         job.user.companyName, // ← cohérent avec le user
        location:            job.location,
        contractType:        job.contractType,
        educationLevel:      job.educationLevel,
        experienceLevel:     job.experienceLevel,
        salaryMin:           job.salaryMin,
        salaryMax:           job.salaryMax,
        salaryPeriod:        'MONTHLY',
        description:         job.description,
        skills:              job.skills,
        status:              'PUBLISHED',
        isFeatured:          job.isFeatured ?? false,
        publishedAt:         new Date(),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    count++
  }

  console.log(`✅ ${count} Job listings created`)
  console.log('')
  console.log('📋 Comptes de test :')
  console.log('   admin@madinatti.ma        / admin123')
  console.log('   citoyen@madinatti.ma      / password123')
  console.log('   capgemini@madinatti.ma    / password123  (Capgemini)')
  console.log('   oracle@madinatti.ma       / password123  (Oracle)')
  console.log('   iam@madinatti.ma          / password123  (Maroc Telecom)')
  console.log('   attijariwafa@madinatti.ma / password123  (Attijariwafa Bank)')
  console.log('   ocp@madinatti.ma          / password123  (OCP Group)')
  console.log('   deloitte@madinatti.ma     / password123  (Deloitte)')
  console.log('   pwc@madinatti.ma          / password123  (PwC)')
  console.log('   amazon@madinatti.ma       / password123  (AWS)')
  console.log('   bmce@madinatti.ma         / password123  (Bank of Africa)')
  console.log('   masen@madinatti.ma        / password123  (MASEN)')
  console.log('')
  console.log('🌱 Seed terminé avec succès !')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })