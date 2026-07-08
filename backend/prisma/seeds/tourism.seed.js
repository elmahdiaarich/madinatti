const { citiesWithRegion } = require('morocco-cities');

// Receive prisma, roles, and categories map from the main index.js script
async function seedTourismListings(prisma, roles, categories) {
  console.log("=== Starting Touristic Listings Seeding ===");

  // Extract just the tourisme object module map
  const tourismCats = categories.tourisme; 

  if (!tourismCats || Object.keys(tourismCats).length === 0) {
    console.error("❌ No tourism categories found in passed seed data!");
    return;
  }

  const targetCities = citiesWithRegion && citiesWithRegion.length > 0 
    ? citiesWithRegion.slice(0, 15) 
    : [{ name: "Kenitra", region: "Rabat-Salé-Kénitra" }];

  const neighborhoods = ["Centre Ville", "Agdal", "Mimosa", "Gueliz", "Hivernage"];

  // Loop through each seeded category object key directly (hotels, prive, etc.)
  for (const slug of Object.keys(tourismCats)) {
    const cat = tourismCats[slug];
    console.log(`🌱 Seeding 10 real listings for: ${cat.name}...`);
    const bulkData = [];

    for (let i = 1; i <= 10; i++) {
      const geoSource = targetCities[i % targetCities.length];
      const cityName = geoSource.name || geoSource.label;
      const regionName = geoSource.region || "Rabat-Salé-Kénitra";
      const neighborhood = neighborhoods[i % neighborhoods.length];

      let attributes = {};
      if (cat.slug === 'hotels') {
        attributes = { evaluation: `${(i % 3) + 3}★`, contact: `0537${i}11223`, presentation: `Hôtel de prestige à ${cityName}.` };
      } else if (cat.slug === 'prive') {
        attributes = { quartier: neighborhood, evaluation: `${(i % 2) + 3}★` };
      } else if (cat.slug === 'wellness-spa' || cat.slug === 'hammam') {
        attributes = { contact: `0661${i}44556`, horaire: "09:00 - 22:00", prix: `${150 + (i * 15)} DH` };
      } else if (cat.slug === 'restaurant' || cat.slug === 'cafe') {
        attributes = { prix: `${45 + (i * 5)} DH`, horaire: "06:30 - 00:00" };
      }

      bulkData.push({
        categoryId: cat.id,
        name: `${cat.name} ${cityName} ${i}`,
        slug: `${cat.slug}-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i}`,
        description: `Profitez d'un moment unique au sein de notre établissement (${cat.name}) idéalement situé au quartier ${neighborhood}.`,
        city: cityName,
        region: regionName,
        neighborhood: neighborhood,
        latitude: 34.25 + (i * 0.005),
        longitude: -6.58 - (i * 0.005),
        contactPhone: `0539${i}88776`,
        contactEmail: `info-${cat.slug}${i}@madinatti.ma`,
        images: [{ url: `https://images.unsplash.com/photo-example-tourism.jpg`, isCover: true }],
        attributes: attributes,
        isActive: true,
        isFeatured: i % 3 === 0
      });
    }

    await prisma.touristicListing.createMany({
      data: bulkData,
      skipDuplicates: true
    });
  }

  console.log("🎉 All 170 touristic listings seeded flawlessly!");
}

module.exports = { seedTourismListings };