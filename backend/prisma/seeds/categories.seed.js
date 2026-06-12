// prisma/seeds/categories.seed.js

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
];

async function seedCategories(prisma) {
  console.log('🌱 Seeding categories...');

  const result = { emploi: {}, immobilier: {} };

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