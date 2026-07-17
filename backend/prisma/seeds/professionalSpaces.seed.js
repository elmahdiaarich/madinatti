// backend/prisma/seeds/professionalSpaces.seed.js
const seedProfessionalSpaceListings = async (prisma, roles, categories) => {
  console.log('🌱 Seeding professional space listings with coordinates...');

  const catZoneIndustrielle = categories['espaces-pro']['zone-industrielle'];
  const catFreeZone         = categories['espaces-pro']['free-zone'];
  const catChambreCommerce  = categories['espaces-pro']['chambre-commerce'];

  const listings = [
    // ── Zone Industrielle (Kenitra, Rabat, Sale) ────────────────────────
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Kénitra (Bir Rami)',
      description: "Zone industrielle historique de Kénitra, accueillant des unités de production diversifiées et de nombreux équipementiers.",
      city: 'Kénitra',
      neighborhood: 'Bir Rami',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 37 00 00',
      contactEmail: 'contact@zibirrami-kenitra.ma',
      latitude: 34.2480,
      longitude: -6.5700,
      attributes: {
        secteurs: ['Agroalimentaire', 'Textile', 'Matériaux de construction'],
        services: ['Location de lots', 'Raccordement électrique', 'Gardiennage'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80', isCover: true }]
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Salé (Tassila)',
      description: "Grande zone industrielle dynamique desservant l'agglomération de Salé-Rabat, spécialisée dans la logistique.",
      city: 'Salé',
      neighborhood: 'Tassila',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 80 12 34',
      contactEmail: 'contact@zitsale.ma',
      latitude: 34.0450,
      longitude: -6.8000,
      attributes: {
        secteurs: ['Logistique', 'Industrie légère', 'Imprimerie'],
        services: ['Location de hangars', 'Guichet unique', 'Accès direct autoroute'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80', isCover: true }]
    },
    
    // ── Free Zone (Atlantic Free Zone & Automotive City) ──────────────────
    {
      categoryId: catFreeZone.id,
      name: 'Atlantic Free Zone (AFZ)',
      description: "Zone franche d'exportation de référence mondiale à Kénitra. Pôle majeur de l'automobile et de l'aéronautique.",
      city: 'Kénitra',
      neighborhood: 'Amer Seflia',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 60 00 00',
      contactEmail: 'invest@atlanticfreezone.com',
      latitude: 34.3160,
      longitude: -6.4950,
      attributes: {
        secteurs: ['Automobile', 'Aéronautique', 'Électronique'],
        services: ['Exonération fiscale', 'Domiciliation', 'Assistance investisseurs', 'Guichet unique douanier'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80', isCover: true }]
    },
    {
      categoryId: catFreeZone.id,
      name: 'Kénitra Automotive City',
      description: "Extension de la zone franche dédiée exclusivement aux géants équipementiers de l'automobile.",
      city: 'Kénitra',
      neighborhood: 'Amer Seflia',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 60 11 11',
      contactEmail: 'info@kac-automotive.ma',
      latitude: 34.3200,
      longitude: -6.4900,
      attributes: {
        secteurs: ['Automobile', 'Sous-traitance industrielle'],
        services: ['Domiciliation', 'Formation main d\'œuvre dédiée', 'Hébergement logistique'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80', isCover: true }]
    },

    // ── Chambre de Commerce ──────────────────────────────────────────
    {
      categoryId: catChambreCommerce.id,
      name: 'CCIS de Kénitra (Siège)',
      description: "Chambre de Commerce, d'Industrie et de Services locale représentant les PME et industries régionales.",
      city: 'Kénitra',
      region: 'Rabat-Salé-Kénitra',
      location: 'Avenue Mohammed Diouri, Kénitra',
      contactPhone: '+212 5 37 37 12 34',
      contactEmail: 'contact@ccis-kenitra.ma',
      latitude: 34.2610,
      longitude: -6.5810,
      attributes: {
        secteurs: ['Commerce', 'Industrie', 'Services'],
        services: ['Certificats d\'origine', 'Registre de commerce', 'Formations', 'Mise en relation B2B'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80', isCover: true }]
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'CCIS Rabat-Salé-Kénitra (Siège Régional)',
      description: "Siège régional centralisé pilotant les stratégies industrielles de la région.",
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 20 00 00',
      contactEmail: 'contact@ccis-rabat.ma',
      latitude: 34.0200,
      longitude: -6.8360,
      attributes: {
        secteurs: ['Commerce', 'Industrie', 'Services'],
        services: ['Coordination régionale', 'Statistiques économiques', 'Relations consulaires'],
      },
      images: [{ url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80', isCover: true }]
    }
  ];

  for (const item of listings) {
    const record = await prisma.professionalSpaceListing.create({
      data: {
        ...item,
        isActive: true,
        createdBy: roles?.adminUser?.id || undefined,
      },
    });
    console.log(`  ... [espaces-pro] ${record.name}`);
  }

  console.log('🎉 Done seeding professional space listings!\n');
};

module.exports = { seedProfessionalSpaceListings };