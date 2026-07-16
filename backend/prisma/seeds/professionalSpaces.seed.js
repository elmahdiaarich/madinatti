const GENERIC_IMAGE = {
  url: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1200&q=80',
  isCover: true,
};

const seedProfessionalSpaceListings = async (prisma, roles, categories) => {
  console.log('🌱 Seeding professional space listings...');

  const catZoneIndustrielle = categories['espaces-pro']['zone-industrielle'];
  const catFreeZone         = categories['espaces-pro']['free-zone'];
  const catChambreCommerce  = categories['espaces-pro']['chambre-commerce'];

  const listings = [
    // ── Zone Industrielle (7) ───────────────────────────────────────────
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Kénitra (Bir Rami)',
      description: "Zone industrielle historique de Kénitra, accueillant des unités de production diversifiées.",
      city: 'Kénitra',
      neighborhood: 'Bir Rami',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 37 00 00',
      attributes: {
        secteurs: ['Agroalimentaire', 'Textile', 'Matériaux de construction'],
        services: ['Location de lots', 'Raccordement électrique', 'Gardiennage'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Sidi Yahya',
      description: "Zone industrielle en périphérie de Kénitra, orientée agro-industrie.",
      city: 'Sidi Yahya du Rharb',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Agro-industrie', 'Logistique'],
        services: ['Location de lots', 'Voirie'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Mghogha Kénitra',
      description: "Extension industrielle desservant les PME locales.",
      city: 'Kénitra',
      neighborhood: 'Mghogha',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Métallurgie', 'Plasturgie'],
        services: ['Location de lots', 'Sécurité'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Sidi Kacem',
      description: "Zone industrielle desservant le bassin sucrier et agro-industriel régional.",
      city: 'Sidi Kacem',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Agro-industrie', 'Sucrerie'],
        services: ['Location de lots', 'Accès ferroviaire'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Sidi Slimane',
      description: "Zone industrielle en développement, accès direct à l'autoroute Rabat-Tanger.",
      city: 'Sidi Slimane',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Agroalimentaire', 'Emballage'],
        services: ['Location de lots'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Aïn Sebbâa (annexe Kénitra)',
      description: "Extension industrielle mixte, unités légères et ateliers.",
      city: 'Kénitra',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Menuiserie', 'Mécanique'],
        services: ['Location de lots', 'Gardiennage'],
      },
    },
    {
      categoryId: catZoneIndustrielle.id,
      name: 'Zone Industrielle Salé',
      description: "Grande zone industrielle desservant l'agglomération Rabat-Salé.",
      city: 'Salé',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Industrie légère', 'Imprimerie'],
        services: ['Location de lots', 'Raccordement eau/électricité'],
      },
    },

    // ── Free Zone (7) ────────────────────────────────────────────────────
    {
      categoryId: catFreeZone.id,
      name: 'Atlantic Free Zone',
      description: "Zone franche d'exportation de référence à Kénitra, pôle automobile et aéronautique majeur.",
      city: 'Kénitra',
      neighborhood: 'Amer Seflia',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 60 00 00',
      contactEmail: 'contact@atlanticfreezone.com',
      attributes: {
        secteurs: ['Automobile', 'Aéronautique', 'Électronique'],
        services: ['Exonération fiscale', 'Domiciliation', 'Assistance investisseurs', 'Guichet unique douanier'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Kénitra Automotive City',
      description: "Extension de la zone franche dédiée à l'écosystème des équipementiers automobiles.",
      city: 'Kénitra',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Automobile', 'Sous-traitance industrielle'],
        services: ['Domiciliation', 'Formation main d\'œuvre'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Free Zone Sidi Yahya',
      description: "Zone franche secondaire en développement, orientée logistique export.",
      city: 'Sidi Yahya du Rharb',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Logistique', 'Export agroalimentaire'],
        services: ['Exonération fiscale', 'Entrepôts'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Tanger Free Zone (bureau Kénitra)',
      description: "Antenne régionale de la zone franche de Tanger, appui aux investisseurs du secteur.",
      city: 'Kénitra',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Textile', 'Électronique'],
        services: ['Domiciliation', 'Assistance investisseurs'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Free Zone Salé',
      description: "Zone franche en périphérie de Salé, orientée services et logistique.",
      city: 'Salé',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Logistique', 'Services'],
        services: ['Exonération fiscale', 'Domiciliation'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Free Zone Rabat-Salé Aéropôle',
      description: "Zone franche adossée à l'aéroport, orientée aéronautique et services logistiques.",
      city: 'Salé',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Aéronautique', 'Logistique aéroportuaire'],
        services: ['Exonération fiscale', 'Guichet unique douanier'],
      },
    },
    {
      categoryId: catFreeZone.id,
      name: 'Free Zone Sidi Slimane',
      description: "Zone franche naissante, ciblant les investisseurs agro-industriels.",
      city: 'Sidi Slimane',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Agro-industrie'],
        services: ['Exonération fiscale', 'Domiciliation'],
      },
    },

    // ── Chambre de Commerce (6) ──────────────────────────────────────────
    {
      categoryId: catChambreCommerce.id,
      name: 'Chambre de Commerce, d\'Industrie et de Services de Kénitra',
      description: "Institution représentant les entreprises locales, appui aux démarches commerciales et à l'investissement.",
      city: 'Kénitra',
      region: 'Rabat-Salé-Kénitra',
      location: 'Avenue Mohammed Diouri, Kénitra',
      contactPhone: '+212 5 37 37 12 34',
      contactEmail: 'contact@ccis-kenitra.ma',
      attributes: {
        secteurs: ['Commerce', 'Industrie', 'Services'],
        services: ['Certificats d\'origine', 'Registre de commerce', 'Formations', 'Mise en relation B2B'],
      },
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'CCIS Rabat-Salé-Kénitra (siège régional)',
      description: "Siège régional de la Chambre de Commerce, coordination des antennes provinciales.",
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      contactPhone: '+212 5 37 20 00 00',
      attributes: {
        secteurs: ['Commerce', 'Industrie', 'Services'],
        services: ['Coordination régionale', 'Statistiques économiques'],
      },
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'Chambre de Commerce Salé',
      description: "Antenne locale de la Chambre de Commerce pour la préfecture de Salé.",
      city: 'Salé',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Commerce', 'Artisanat'],
        services: ['Registre de commerce', 'Assistance entrepreneurs'],
      },
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'Chambre de Commerce Sidi Kacem',
      description: "Antenne provinciale, appui aux commerçants et industriels locaux.",
      city: 'Sidi Kacem',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Commerce', 'Agro-industrie'],
        services: ['Certificats d\'origine', 'Formations'],
      },
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'Chambre de Commerce Sidi Slimane',
      description: "Antenne provinciale de la CCIS pour la province de Sidi Slimane.",
      city: 'Sidi Slimane',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Commerce', 'Agriculture'],
        services: ['Registre de commerce', 'Mise en relation B2B'],
      },
    },
    {
      categoryId: catChambreCommerce.id,
      name: 'Chambre de Commerce Sidi Yahya du Rharb',
      description: "Antenne locale rattachée à la CCIS régionale, appui de proximité aux PME.",
      city: 'Sidi Yahya du Rharb',
      region: 'Rabat-Salé-Kénitra',
      attributes: {
        secteurs: ['Commerce', 'Agroalimentaire'],
        services: ['Assistance entrepreneurs', 'Formations'],
      },
    },
  ];

  for (const item of listings) {
    const record = await prisma.professionalSpaceListing.create({
      data: {
        ...item,
        images: [GENERIC_IMAGE],
        isActive: true,
        createdBy: roles?.adminUser?.id || undefined,
      },
    });
    console.log(`  ... [espaces-pro] ${record.name}`);
  }

  console.log('🎉 Done seeding professional space listings!\n');
};

module.exports = { seedProfessionalSpaceListings };