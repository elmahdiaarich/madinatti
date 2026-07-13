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
];

async function seedCategories(prisma) {
  console.log('🌱 Seeding categories...');
  const result = { emploi: {}, immobilier: {}, automobile: {}, 'mini-jobs': {} };
  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: { name: cat.name, module: cat.module, isActive: true },
      create: { name: cat.name, slug: cat.slug, module: cat.module, isActive: true },
    });
    result[cat.module][cat.slug] = record;
    console.log(`  ✅ [${cat.module}] ${record.name} (${record.slug})`);
  }
  console.log('🎉 Done seeding categories!\n');
  return result;
}

module.exports = { seedCategories };