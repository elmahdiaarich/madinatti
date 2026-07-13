// ─────────────────────────────────────────────────────────────────────────
// NOTE ON THE OLD BUG:
// `morocco-cities` does NOT export `citiesWithRegion` — it only exports
// `cities` ([{ id, region_number, name, region_name, uniq_id }]) and
// `regions`. Destructuring citiesWithRegion always returned `undefined`,
// so every one of the 170 listings silently fell back to the single
// { name: "Kenitra" } entry and got placed a few hundred meters from each
// other regardless of the city name printed on the card. Fixed below with
// a small hardcoded table of real coordinates for 15 major cities.
// ─────────────────────────────────────────────────────────────────────────

// name/region + real lat/lng, since morocco-cities has no coordinates.
const CITY_COORDS = [
  { name: "Kenitra",     region: "Rabat-Salé-Kénitra",       latitude: 34.2610, longitude: -6.5802 },
  { name: "Rabat",       region: "Rabat-Salé-Kénitra",       latitude: 34.0209, longitude: -6.8416 },
  { name: "Salé",        region: "Rabat-Salé-Kénitra",       latitude: 34.0531, longitude: -6.7985 },
  { name: "Casablanca",  region: "Casablanca-Settat",        latitude: 33.5731, longitude: -7.5898 },
  { name: "Mohammedia",  region: "Casablanca-Settat",        latitude: 33.6861, longitude: -7.3830 },
  { name: "El Jadida",   region: "Casablanca-Settat",        latitude: 33.2549, longitude: -8.5058 },
  { name: "Fès",         region: "Fès-Meknès",               latitude: 34.0331, longitude: -5.0003 },
  { name: "Meknès",      region: "Fès-Meknès",               latitude: 33.8935, longitude: -5.5473 },
  { name: "Marrakech",   region: "Marrakech-Safi",           latitude: 31.6295, longitude: -7.9811 },
  { name: "Safi",        region: "Marrakech-Safi",           latitude: 32.2994, longitude: -9.2372 },
  { name: "Tanger",      region: "Tanger-Tétouan-Al Hoceïma", latitude: 35.7595, longitude: -5.8340 },
  { name: "Tétouan",     region: "Tanger-Tétouan-Al Hoceïma", latitude: 35.5785, longitude: -5.3684 },
  { name: "Agadir",      region: "Souss-Massa",              latitude: 30.4278, longitude: -9.5981 },
  { name: "Oujda",       region: "Oriental",                 latitude: 34.6805, longitude: -1.9086 },
  { name: "Béni Mellal", region: "Béni Mellal-Khénifra",     latitude: 32.3373, longitude: -6.3498 },
];

const neighborhoods = ["Centre Ville", "Agdal", "Mimosa", "Gueliz", "Hivernage"];

// Small jitter so listings in the same city aren't stacked on the exact
// same point, without drifting into a different city (~0.5-2.5km).
const jitter = (base, i) => base + (((i * 37) % 11) - 5) * 0.0045;

// Reliable placeholder photos (unsplash's own CDN sample set, always
// resolves) — swap for real business photography later. About 1 in 5
// listings gets NO images on purpose, to exercise the category-icon
// fallback on the frontend.
const PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
];

function buildImages(i) {
  if (i % 5 === 0) return []; // deliberately empty, to test the fallback icon
  const count = (i % 3) + 1; // 1-3 photos
  return Array.from({ length: count }, (_, n) => ({
    url: `${PLACEHOLDER_PHOTOS[(i + n) % PLACEHOLDER_PHOTOS.length]}?auto=format&fit=crop&w=1200&q=80&sig=${i}-${n}`,
    isCover: n === 0,
  }));
}

// Standardized on `attributes.hours` as a plain "HH:MM - HH:MM" string
// across every category that has opening hours, matching the `hours` key
// the frontend already looks for (FIELD_ICONS.hours / cfg.detail).
//
// `prix` is now a PLAIN NUMBER (was `"165 DH"` as a string before) — that's
// the actual fix for the price filter. Prisma can do `gte`/`lte` range
// comparisons on a JSON field's numeric value, but never on a string like
// "165 DH". Append the "DH" unit only when *displaying* it on the
// frontend (formatListingField), not when storing it.
function buildAttributes(cat, i, cityName) {
  switch (cat.slug) {
    case "hotels":
      return {
        evaluation: `${(i % 3) + 3}★`,
        presentation: `Hôtel de prestige à ${cityName}.`,
      };
    case "prive":
      return { evaluation: `${(i % 2) + 3}★` };
    case "wellness-spa":
    case "hammam":
      return { hours: "09:00 - 22:00", prix: 150 + i * 15 };
    case "restaurant":
    case "cafe":
      return { hours: "06:30 - 00:00", prix: 45 + i * 5 };
    case "cinema":
      return { hours: "10:00 - 23:30" };
    case "musee":
      return { hours: "09:00 - 17:00", prix: 20 + i * 5 };
    case "mosquee":
      return { presentation: "Ouverte aux heures de prière." };
    case "piscine-publique":
    case "plage":
      return { hours: "08:00 - 19:00" };
    case "zoo":
      return { hours: "09:00 - 18:00", prix: 30 + i * 5 };
    case "hopitaux":
      return { hours: "Urgences 24h/24" };
    case "jardin":
    case "foret":
    case "terrains-proximite":
      return { hours: "08:00 - 20:00" };
    case "magazine":
    case "carte-touristique":
      return {};
    default:
      return {};
  }
}

async function seedTourismListings(prisma, roles, categories) {
  console.log("=== Starting Touristic Listings Seeding ===");

  const tourismCats = categories.tourisme;

  if (!tourismCats || Object.keys(tourismCats).length === 0) {
    console.error("❌ No tourism categories found in passed seed data!");
    return;
  }

  // Wipe existing tourism listings first so re-running the seed doesn't
  // pile up duplicates on top of the old broken/clustered data.
  const tourismCategoryIds = Object.values(tourismCats).map((c) => c.id);
  const { count: deletedCount } = await prisma.touristicListing.deleteMany({
    where: { categoryId: { in: tourismCategoryIds } },
  });
  console.log(`🗑️  Deleted ${deletedCount} existing touristic listings.`);

  let totalCreated = 0;

  for (const slug of Object.keys(tourismCats)) {
    const cat = tourismCats[slug];
    console.log(`🌱 Seeding 10 real listings for: ${cat.name}...`);
    const bulkData = [];

    for (let i = 1; i <= 10; i++) {
      const geoSource = CITY_COORDS[i % CITY_COORDS.length];
      const cityName = geoSource.name;
      const regionName = geoSource.region;
      const neighborhood = neighborhoods[i % neighborhoods.length];

      const fileUrl = (cat.slug === 'magazine' || cat.slug === 'carte-touristique')
        ? `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
        : null;

      bulkData.push({
        categoryId: cat.id,
        name: `${cat.name} ${cityName} ${i}`,
        slug: `${cat.slug}-${cityName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${i}`,
        description: `Profitez d'un moment unique au sein de notre établissement (${cat.name}) idéalement situé au quartier ${neighborhood} de ${cityName}.`,
        city: cityName,
        region: regionName,
        neighborhood,
        latitude: jitter(geoSource.latitude, i),
        longitude: jitter(geoSource.longitude, i),
        contactPhone: `0539${i}88776`,
        contactEmail: `info-${cat.slug}${i}@madinatti.ma`,
        fileUrl,
        images: buildImages(i),
        attributes: buildAttributes(cat, i, cityName),
        isActive: true,
        isFeatured: i % 3 === 0,
      });
    }

    await prisma.touristicListing.createMany({
      data: bulkData,
      skipDuplicates: true,
    });
    totalCreated += bulkData.length;
  }

  console.log(`🎉 ${totalCreated} touristic listings seeded across ${Object.keys(tourismCats).length} categories!`);
}

module.exports = { seedTourismListings };