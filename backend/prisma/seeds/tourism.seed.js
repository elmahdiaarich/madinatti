// ─────────────────────────────────────────────────────────────────────────
// Uses morocco-cities for city → region mapping (needed for the "same
// region as searched city" boost). Coordinates still come from the
// hardcoded CITY_COORDS table below, since morocco-cities has no lat/lng.
// ─────────────────────────────────────────────────────────────────────────
const { cities: MOROCCO_CITIES } = require("morocco-cities");

const CITY_COORDS = [
  { name: "Kenitra",     latitude: 34.2610, longitude: -6.5802 },
  { name: "Rabat",       latitude: 34.0209, longitude: -6.8416 },
  { name: "Salé",        latitude: 34.0531, longitude: -6.7985 },
  { name: "Casablanca",  latitude: 33.5731, longitude: -7.5898 },
  { name: "Mohammedia",  latitude: 33.6861, longitude: -7.3830 },
  { name: "El Jadida",   latitude: 33.2549, longitude: -8.5058 },
  { name: "Fès",         latitude: 34.0331, longitude: -5.0003 },
  { name: "Meknès",      latitude: 33.8935, longitude: -5.5473 },
  { name: "Marrakech",   latitude: 31.6295, longitude: -7.9811 },
  { name: "Safi",        latitude: 32.2994, longitude: -9.2372 },
  { name: "Tanger",      latitude: 35.7595, longitude: -5.8340 },
  { name: "Tétouan",     latitude: 35.5785, longitude: -5.3684 },
  { name: "Agadir",      latitude: 30.4278, longitude: -9.5981 },
  { name: "Oujda",       latitude: 34.6805, longitude: -1.9086 },
  { name: "Béni Mellal", latitude: 32.3373, longitude: -6.3498 },
];

function regionFor(cityName) {
  const match = MOROCCO_CITIES.find((c) => c.name === cityName);
  return match?.region_name || "Inconnue";
}

const neighborhoods = ["Centre Ville", "Agdal", "Mimosa", "Gueliz", "Hivernage"];

const jitter = (base, i) => base + (((i * 37) % 11) - 5) * 0.0045;

const PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
];

// Google's public GTV sample bucket — small, free, commonly used as
// royalty-free placeholder video assets. Good enough for seed/dev data;
// swap for real uploads before going to prod.
const SAMPLE_VIDEOS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://file-examples.com/storage/fe1c2b6e6b6e2a2c4b1f7b4/2017/04/file_example_MP4_480_1_5MG.mp4",
];

function buildImages(i) {
  if (i % 5 === 0) return [];
  const count = (i % 3) + 1;
  return Array.from({ length: count }, (_, n) => ({
    url: `${PLACEHOLDER_PHOTOS[(i + n) % PLACEHOLDER_PHOTOS.length]}?auto=format&fit=crop&w=1200&q=80&sig=${i}-${n}`,
    isCover: n === 0,
  }));
}

// Roughly 1 in 3 listings gets a promo video, so the UI's video badge /
// gallery-first-slide logic actually gets exercised in dev.
function buildVideo(cat, i) {
  if (cat.slug === "magazine" || cat.slug === "carte-touristique") return null;
  if (i % 3 !== 0) return null;
  return SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length];
}

function buildSocials(cat, i) {
  // Skip socials for categories where they don't make sense (mosques,
  // hospitals) to keep the seed data realistic.
  if (["mosquee", "hopitaux"].includes(cat.slug)) {
    return { facebook: null, instagram: null, website: null };
  }
  const handle = `${cat.slug}${i}`;
  return {
    facebook: `https://facebook.com/${handle}`,
    instagram: `https://instagram.com/${handle}`,
    website: `https://${handle}.ma`,
  };
}

// Returns real, typed values for the new top-level columns instead of a
// nested JSON blob. `rating` is a plain float, `prix` a plain int (DH),
// `hours` a plain string in the same "HH:MM - HH:MM" format the admin form
// produces — no more "evaluation": "4★" string-encoding.
//
// Doc categories (magazine / carte-touristique) now get a rating and a
// starting downloadsCount too — they're a listing type just like any
// other and the card UI expects those fields to render fully.
function buildFields(cat, i) {
  switch (cat.slug) {
    case "hotels":
      return { rating: 3 + (i % 3), prix: null, hours: null, downloadsCount: 0 };
    case "prive":
      return { rating: 3 + (i % 2), prix: null, hours: null, downloadsCount: 0 };
    case "wellness-spa":
    case "hammam":
      return { rating: 3 + (i % 3), prix: 150 + i * 15, hours: "09:00 - 22:00", downloadsCount: 0 };
    case "restaurant":
    case "cafe":
      return { rating: 3 + (i % 3), prix: 45 + i * 5, hours: "06:30 - 00:00", downloadsCount: 0 };
    case "cinema":
      return { rating: 3 + (i % 3), prix: null, hours: "10:00 - 23:30", downloadsCount: 0 };
    case "musee":
      return { rating: 3 + (i % 3), prix: 20 + i * 5, hours: "09:00 - 17:00", downloadsCount: 0 };
    case "mosquee":
      return { rating: null, prix: null, hours: null, downloadsCount: 0 };
    case "piscine-publique":
    case "plage":
      return { rating: 3 + (i % 3), prix: null, hours: "08:00 - 19:00", downloadsCount: 0 };
    case "zoo":
      return { rating: 3 + (i % 3), prix: 30 + i * 5, hours: "09:00 - 18:00", downloadsCount: 0 };
    case "hopitaux":
      return { rating: 3 + (i % 3), prix: null, hours: "24h/24", downloadsCount: 0 };
    case "jardin":
    case "foret":
    case "terrains-proximite":
      return { rating: 3 + (i % 3), prix: null, hours: "08:00 - 20:00", downloadsCount: 0 };
    case "magazine":
    case "carte-touristique":
      // 3.5 - 5.0 spread so the star row actually shows variety, plus a
      // believable starting download count instead of 0 across the board.
      return {
        rating: (3.5 + ((i % 4) * 0.5)).toFixed(1),
        prix: null,
        hours: null,
        downloadsCount: 40 + i * 23,
      };
    default:
      return { rating: null, prix: null, hours: null, downloadsCount: 0 };
  }
}

async function seedTourismListings(prisma, roles, categories) {
  console.log("=== Starting Touristic Listings Seeding ===");

  const tourismCats = categories.tourisme;
  if (!tourismCats || Object.keys(tourismCats).length === 0) {
    console.error("❌ No tourism categories found in passed seed data!");
    return;
  }

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
      const regionName = regionFor(cityName);
      const neighborhood = neighborhoods[i % neighborhoods.length];
      const fields = buildFields(cat, i);
      const socials = buildSocials(cat, i);
      const lat = jitter(geoSource.latitude, i);
      const lng = jitter(geoSource.longitude, i);

      const isDoc = cat.slug === "magazine" || cat.slug === "carte-touristique";
      const fileUrl = isDoc
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
        latitude: lat,
        longitude: lng,
        mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        contactPhone: `0539${i}88776`,
        contactEmail: `info-${cat.slug}${i}@madinatti.ma`,
        fileUrl,
        images: buildImages(i),
        videoUrl: buildVideo(cat, i),
        rating: fields.rating,
        prix: fields.prix,
        hours: fields.hours,
        downloadsCount: fields.downloadsCount,
        facebook: socials.facebook,
        instagram: socials.instagram,
        website: socials.website,
        isActive: true,
        isFeatured: i % 3 === 0,
      });
    }

    await prisma.touristicListing.createMany({ data: bulkData, skipDuplicates: true });
    totalCreated += bulkData.length;
  }

  console.log(`🎉 ${totalCreated} touristic listings seeded across ${Object.keys(tourismCats).length} categories!`);
}

module.exports = { seedTourismListings };
