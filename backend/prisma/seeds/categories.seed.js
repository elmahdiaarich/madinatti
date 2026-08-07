const CATEGORIES = [
  // ── Emploi ───────────────────────────────────────────────────────────────
  { name: 'Informatique & Tech',                    slug: 'informatique',         module: 'emploi' },
  { name: 'Ingénierie & Industrie',                 slug: 'industrie',            module: 'emploi' },
  { name: 'BTP & Construction',                     slug: 'btp',                  module: 'emploi' },
  { name: 'Énergie & Environnement',                slug: 'energie',              module: 'emploi' },
  { name: 'Marketing & Communication',              slug: 'marketing',            module: 'emploi' },
  { name: 'Finance & Comptabilité',                 slug: 'finance',              module: 'emploi' },
  { name: 'Ressources Humaines',                    slug: 'rh',                   module: 'emploi' },
  { name: 'Vente & Commerce',                       slug: 'vente',                module: 'emploi' },
  { name: "Relation Client & Centres d'Appels",     slug: 'relation-client',      module: 'emploi' },
  { name: 'Tourisme & Hôtellerie',                  slug: 'tourisme-hotellerie',  module: 'emploi' },
  { name: 'Santé & Médical',                        slug: 'sante',                module: 'emploi' },
  { name: 'Logistique & Transport',                 slug: 'logistique',           module: 'emploi' },
  { name: 'Juridique',                              slug: 'juridique',            module: 'emploi' },
  { name: 'Enseignement & Formation',               slug: 'enseignement',         module: 'emploi' },
  { name: 'Textile & Cuir',                         slug: 'textile-cuir',         module: 'emploi' },
  { name: 'Agriculture & Agroalimentaire',          slug: 'agriculture',          module: 'emploi' },
  // ── Immobilier ───────────────────────────────────────────────────────────
  { name: 'Appartement', slug: 'appartement', module: 'immobilier' },
  { name: 'Villa',       slug: 'villa',       module: 'immobilier' },
  { name: 'Maison',      slug: 'maison',      module: 'immobilier' },
  { name: 'Studio',      slug: 'studio',      module: 'immobilier' },
  { name: 'Terrain',     slug: 'terrain',     module: 'immobilier' },
  { name: 'Bureau',      slug: 'bureau',      module: 'immobilier' },
  { name: 'Commerce',    slug: 'commerce',    module: 'immobilier' },
  // ── Automobile ───────────────────────────────────────────────────────────
  { name: 'Voitures',    slug: 'voitures',    module: 'automobile' },
  { name: 'Motos',       slug: 'motos',       module: 'automobile' },
  { name: 'Utilitaires', slug: 'utilitaires', module: 'automobile' },
  { name: 'Camions',     slug: 'camions',     module: 'automobile' },

  // ── Tourisme ─────────────────────────────────────────────────────────────
  { name: 'Hôtels',                   slug: 'hotels',              module: 'tourisme', displayType: 'PLACE' },
  { name: 'Privé (Appart & Maison)',  slug: 'prive',               module: 'tourisme', displayType: 'PLACE' },
  { name: 'Wellness SPA',             slug: 'wellness-spa',        module: 'tourisme', displayType: 'PLACE' },
  { name: 'Hammam',                   slug: 'hammam',              module: 'tourisme', displayType: 'PLACE' },
  { name: 'Magazine Touristique',     slug: 'magazine',            module: 'tourisme', displayType: 'DOCUMENT' },
  { name: 'Mosquée',                  slug: 'mosquee',             module: 'tourisme', displayType: 'PLACE' },
  { name: 'Musée',                    slug: 'musee',               module: 'tourisme', displayType: 'PLACE' },
  { name: 'Cinéma',                   slug: 'cinema',              module: 'tourisme', displayType: 'PLACE' },
  { name: 'Restaurant',               slug: 'restaurant',          module: 'tourisme', displayType: 'PLACE' },
  { name: 'Café',                     slug: 'cafe',                module: 'tourisme', displayType: 'PLACE' },
  { name: 'Jardin',                   slug: 'jardin',              module: 'tourisme', displayType: 'PLACE' },
  { name: 'Forêt',                    slug: 'foret',               module: 'tourisme', displayType: 'PLACE' },
  { name: 'Terrains de proximité',    slug: 'terrains-proximite',  module: 'tourisme', displayType: 'PLACE' },
  { name: 'Piscine Publique',         slug: 'piscine-publique',    module: 'tourisme', displayType: 'PLACE' },
  { name: 'Plage',                    slug: 'plage',               module: 'tourisme', displayType: 'PLACE' },
  { name: 'Hôpitaux',                 slug: 'hopitaux',            module: 'tourisme', displayType: 'PLACE' },
  { name: 'Zoo',                      slug: 'zoo',                 module: 'tourisme', displayType: 'PLACE' },
  { name: 'Carte Touristique de la Ville', slug: 'carte-touristique', module: 'tourisme', displayType: 'DOCUMENT' },
  // Sante
  { name: 'Pharmacies',               slug: 'pharmacy',             module: 'sante', displayType: 'PLACE' },
  { name: 'Hopitaux et cliniques',    slug: 'hospital-clinic',      module: 'sante', displayType: 'PLACE' },
  { name: "Laboratoires d'analyses",  slug: 'medical-laboratory',   module: 'sante', displayType: 'PLACE' },
  { name: 'Medecins et cabinets',     slug: 'doctor-office',        module: 'sante', displayType: 'PLACE' },
  { name: 'Dentistes',                slug: 'dentist',              module: 'sante', displayType: 'PLACE' },
  { name: 'Centres de radiologie',    slug: 'radiology-center',     module: 'sante', displayType: 'PLACE' },
  { name: 'Parapharmacies',           slug: 'parapharmacy',         module: 'sante', displayType: 'PLACE' },
  // Education
  { name: 'Education',                slug: 'education',            module: 'education', displayType: 'PLACE' },
  // Evenements
  { name: 'Theatre et spectacle',      slug: 'theatre-spectacle',      module: 'events', displayType: 'PLACE' },
  { name: 'Concert et musique',        slug: 'concert-musique',        module: 'events', displayType: 'PLACE' },
  { name: 'Festival',                  slug: 'festival',               module: 'events', displayType: 'PLACE' },
  { name: 'Marche et souk',            slug: 'marche-souk',            module: 'events', displayType: 'PLACE' },
  { name: 'Salon et foire',            slug: 'salon-foire',            module: 'events', displayType: 'PLACE' },
  { name: 'Exposition',                slug: 'exposition',             module: 'events', displayType: 'PLACE' },
  { name: 'Cinema et projection',      slug: 'cinema-projection',      module: 'events', displayType: 'PLACE' },
  { name: 'Conference et seminaire',   slug: 'conference-seminaire',   module: 'events', displayType: 'PLACE' },
  { name: 'Formation et atelier',      slug: 'formation-atelier',      module: 'events', displayType: 'PLACE' },
  { name: 'Sport',                     slug: 'sport',                  module: 'events', displayType: 'PLACE' },
  { name: 'Culture',                   slug: 'culture',                module: 'events', displayType: 'PLACE' },
  { name: 'Religieux',                 slug: 'religieux',              module: 'events', displayType: 'PLACE' },
  { name: 'Associatif',                slug: 'associatif',             module: 'events', displayType: 'PLACE' },
  { name: 'Famille et enfants',        slug: 'famille-enfants',        module: 'events', displayType: 'PLACE' },
  { name: 'Gastronomie',               slug: 'gastronomie',            module: 'events', displayType: 'PLACE' },
  { name: 'Mode et beaute',            slug: 'mode-beaute',            module: 'events', displayType: 'PLACE' },
  { name: 'Technologie et innovation', slug: 'technologie-innovation', module: 'events', displayType: 'PLACE' },
  { name: 'Entrepreneuriat et emploi', slug: 'entrepreneuriat-emploi', module: 'events', displayType: 'PLACE' },
  { name: 'Tourisme et patrimoine',    slug: 'tourisme-patrimoine',    module: 'events', displayType: 'PLACE' },
  { name: 'Jeux et esport',            slug: 'jeux-esport',            module: 'events', displayType: 'PLACE' },
  { name: 'Vie nocturne',              slug: 'vie-nocturne',           module: 'events', displayType: 'PLACE' },
  { name: 'Portes ouvertes',           slug: 'portes-ouvertes',        module: 'events', displayType: 'PLACE' },
  { name: 'Brocante et vide-grenier',  slug: 'brocante-vide-grenier',  module: 'events', displayType: 'PLACE' },
  { name: 'Autre',                     slug: 'autre',                  module: 'events', displayType: 'PLACE' },
  // ── Mini-jobs ────────────────────────────────────────────────────────────
  // Liste simplifiée : catégories larges et facilement identifiables par un client,
  // sans jargon métier. Les besoins proches (vitrerie, serrurerie, carrelage,
  // petit bricolage) sont regroupés sous "Bricolage & Petites Réparations", et les
  // prestations événementielles (traiteur, photo, couture) sous "Services Événementiels".
  { name: 'Ménage',                       slug: 'menage',                 module: 'mini-jobs' },
  { name: 'Plomberie',                    slug: 'plomberie',              module: 'mini-jobs' },
  { name: 'Électricité',                  slug: 'electricite',            module: 'mini-jobs' },
  { name: 'Bricolage & Petites Réparations', slug: 'bricolage',           module: 'mini-jobs' },
  { name: 'Jardinage',                    slug: 'jardinage',              module: 'mini-jobs' },
  { name: 'Déménagement',                 slug: 'demenagement',           module: 'mini-jobs' },
  { name: 'Peinture',                     slug: 'peinture',               module: 'mini-jobs' },
  { name: 'Climatisation & Chauffage',    slug: 'climatisation',          module: 'mini-jobs' },
  { name: "Garde d'enfant",               slug: 'babysitting',            module: 'mini-jobs' },  { name: 'Aide aux Personnes Âgées',     slug: 'aide-personnes-agees',   module: 'mini-jobs' },
  { name: 'Cours Particuliers',           slug: 'cours-particuliers',     module: 'mini-jobs' },
  { name: 'Coiffure & Beauté à Domicile', slug: 'coiffure-beaute',        module: 'mini-jobs' },
  { name: 'Chauffeur Privé',              slug: 'chauffeur',              module: 'mini-jobs' },
  { name: 'Livraison & Courses',          slug: 'livraison',              module: 'mini-jobs' },
  { name: 'Dépannage Informatique',       slug: 'depannage-informatique', module: 'mini-jobs' },
  { name: 'Services Événementiels',       slug: 'evenementiel',           module: 'mini-jobs' },
// ── Espaces Professionnels ─────────────────────────────────────────────────
{ name: 'Zone Industrielle',    slug: 'zone-industrielle', module: 'espaces-pro', displayType: 'PLACE' },
{ name: 'Free Zone',            slug: 'free-zone',         module: 'espaces-pro', displayType: 'PLACE' },
{ name: 'Chambre de Commerce',  slug: 'chambre-commerce',  module: 'espaces-pro', displayType: 'PLACE' },
];

async function seedCategories(prisma) {
  console.log('🌱 Seeding categories...');

  const result = { emploi: {}, immobilier: {}, automobile: {}, tourisme: {} ,'mini-jobs': {}, 'espaces-pro': {}, sante: {}, education: {}, events: {}};

  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, module: cat.module, isActive: true, displayType: cat.displayType },
      create: { name: cat.name, slug: cat.slug, module: cat.module, isActive: true, displayType: cat.displayType },
    });
    result[cat.module][cat.slug] = record;
    console.log(`  ... [${cat.module}] ${record.name} (${record.slug})`);
  }
  console.log('🎉 Done seeding categories!\n');
  return result;
}

module.exports = { seedCategories };
