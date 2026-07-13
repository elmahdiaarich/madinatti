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
];

async function seedCategories(prisma) {
  console.log('🌱 Seeding categories...');
  const result = { emploi: {}, immobilier: {}, automobile: {}, tourisme: {} };

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