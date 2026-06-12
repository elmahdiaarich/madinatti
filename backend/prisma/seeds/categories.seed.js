// prisma/seeds/categories.seed.js

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

const SERVICES = [
  {
    id: "emploi",
    label: "Emploi",
    categories: [
      "Offres d'emploi",
      "Formation",
      "Mini-jobs",
      "Accompagnement",
      "Demande d'emploi",
    ],
  },
  {
    id: "immobilier",
    label: "Immobilier",
    categories: [
      "Appartement",
      "Villa",
      "Maison",
      "Studio",
      "Terrain",
      "Bureau",
      "Commerce",
    ],
  },

  {
    id: "evenements",
    label: "Événements",
    categories: ["Théâtre", "Concert", "Marché", "Activités enfants", "Galerie"],
  },
  {
    id: "voitures",
    label: "Automobile",
    categories: ["Voitures occasion", "Voitures neuves", "Motos", "Auto info"],
  },
  {
    id: "tourisme",
    label: "Tourisme",
    categories: ["Hôtels", "Restaurants", "Cafés", "Musées", "Spas & Hammams"],
  },
  {
    id: "sante",
    label: "Santé",
    categories: ["Cliniques", "Médecine", "Pharmacies", "Pharmacie de garde", "Para"],
  },
  {
    id: "annonces",
    label: "Petites Annonces",
    categories: [
      "Ménage & nettoyage",
      "Garde d'enfants",
      "Cours particuliers",
      "Soins seniors",
    ],
  },
  {
    id: "presse",
    label: "Actualités",
    categories: ["Journaux", "Presse locale", "Télé locale", "Radio locale"],
  },
  {
    id: "annuaire",
    label: "Annuaire",
    categories: ["Mairie", "Police", "Bureau des impôts", "Office de tourisme"],
  },
  {
    id: "industrie",
    label: "Industrie",
    categories: ["Zone industrielle", "Free Zone", "Chambre de commerce"],
  },
  {
    id: "plan",
    label: "Plan de Ville",
    categories: ["Plan de ville", "Rues & boulevards", "Monuments", "Navigation"],
  },
];

async function seedCategories(prisma) {
  console.log("🌱 Seeding categories...");

  const result = {};

  for (const service of SERVICES) {
    const parent = await prisma.category.upsert({
      where: { slug: service.id },
      update: { name: service.label },
      create: {
        name: service.label,
        slug: service.id,
        isActive: true,
      },
    });

    console.log(`  ✅ Parent: ${parent.name} (${parent.slug})`);

    result[service.id] = { parent, children: {} };

    for (const childName of service.categories) {
      const childSlug = `${service.id}-${toSlug(childName)}`;

      const child = await prisma.category.upsert({
        where: { slug: childSlug },
        update: { name: childName },
        create: {
          name: childName,
          slug: childSlug,
          isActive: true,
          parentId: parent.id,
        },
      });

      console.log(`     └─ ${child.name} (${child.slug})`);

      result[service.id].children[toSlug(childName)] = child;
    }
  }

  console.log("🎉 Done seeding categories!\n");

  return result;
}

module.exports = { seedCategories };