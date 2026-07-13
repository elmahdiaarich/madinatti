const CATEGORIES = [
  // ── Emploi ───────────────────────────────────────────────────────────────
  { name: 'Informatique & Tech',       slug: 'informatique', module: 'emploi' },
  { name: 'Marketing',                 slug: 'marketing',    module: 'emploi' },
  { name: 'Finance',                   slug: 'finance',      module: 'emploi' },
  { name: 'Ressources Humaines',       slug: 'rh',           module: 'emploi' },
  { name: 'BTP & Construction',        slug: 'btp',          module: 'emploi' },
  { name: 'Vente & Commerce',          slug: 'vente',        module: 'emploi' },
  { name: 'Santé & Médical',           slug: 'sante',        module: 'emploi' },
  { name: 'Logistique & Transport',    slug: 'logistique',   module: 'emploi' },
  { name: 'Juridique',                 slug: 'juridique',    module: 'emploi' },
  { name: 'Enseignement & Formation',  slug: 'enseignement', module: 'emploi' },
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
<<<<<<< HEAD

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
=======
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
>>>>>>> e01619cb51b23d7ee9ff99ceddb3944f95f7da1d
];

async function seedCategories(prisma) {
  console.log('🌱 Seeding categories...');
<<<<<<< HEAD
  const result = { emploi: {}, immobilier: {}, automobile: {}, tourisme: {} };

=======
  const result = { emploi: {}, immobilier: {}, automobile: {}, 'mini-jobs': {} };
>>>>>>> e01619cb51b23d7ee9ff99ceddb3944f95f7da1d
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