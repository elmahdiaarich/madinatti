// frontend/constants/tourismCategories.js
//
// Single source of truth for how each tourism category is displayed:
// - card: fields shown on the listing card (grid view)
// - detail: fields shown on the detail page (in addition to name/images/map)
// - filters: which filter control(s) appear in the filter bar when this
//   category (or "all") is active
// - cardVariant: "pdf" | "map" switches PlaceCard to a special layout
//
// Field values are read from the listing straight from the API response.
// Backend-known fields live at the top level (name, city, neighborhood,
// contactPhone, rating, isFeatured, latitude, longitude, images). Anything
// category-specific (opening hours, price range, description, pdf link...)
// is expected under `attributes` (jsonb) and is normalized by
// getListingField() below so components never touch `attributes` directly.

import {
  Building2, Key, Sparkles, Droplet, FileText,
  Landmark, Clapperboard, UtensilsCrossed, Coffee, Trees,
  Dumbbell, Waves, Umbrella, Cross, PawPrint, Map,
} from "lucide-react";
// Replace lines 23-76 in frontend/constants/tourismCategories.js with this corrected configuration:
export const TOURISM_CATEGORIES = {
  hotels: {
    label: "Hôtels",
    icon: Building2,
    card: ["name", "contactPhone"],
    detail: ["description"],
    filters: ["rating"],
  },
  prive: { // Matches database 'prive'
    label: "Privé (Appartement + maison)",
    icon: Key,
    card: ["name", "neighborhood"],
    detail: ["description"],
    filters: ["location"],
  },
  "wellness-spa": { // Matches database 'wellness-spa'
    label: "Wellness / SPA",
    icon: Sparkles,
    card: ["name", "contactPhone", "hours"],
    detail: ["description", "priceRange"],
    filters: ["priceRange"],
  },
  hammam: { // Matches database 'hammam'
    label: "Hammam",
    icon: Droplet,
    card: ["name", "photoCount"],
    detail: ["description", "hours", "priceRange"],
    filters: ["priceRange"],
  },
  magazine: {
    label: "Magazine des touristes",
    icon: FileText,
    cardVariant: "pdf",
    card: ["name"],
  },
  mosquee: { label: "Mosquée", icon: Landmark, card: ["name", "neighborhood"], detail: ["description"], filters: [] },
  musee: { label: "Musée", icon: Building2, card: ["name", "hours"], detail: ["description"], filters: [] },
  cinema: { label: "Cinéma", icon: Clapperboard, card: ["name", "hours"], detail: ["description", "contactPhone"], filters: [] },
  restaurant: { label: "Restaurant", icon: UtensilsCrossed, card: ["name", "contactPhone"], detail: ["description", "priceRange"], filters: ["priceRange", "rating"] },
  cafe: { label: "Café", icon: Coffee, card: ["name", "hours"], detail: ["description", "priceRange"], filters: ["priceRange"] },
  jardin: { label: "Jardin", icon: Trees, card: ["name", "neighborhood"], detail: ["description", "hours"], filters: [] },
  foret: { label: "Forêt", icon: Trees, card: ["name", "neighborhood"], detail: ["description"], filters: [] },
  "terrains-proximite": { // Matches database 'terrains-proximite'
    label: "Terrains de proximité",
    icon: Dumbbell,
    card: ["name", "neighborhood"],
    detail: ["description", "priceRange"],
    filters: [],
  },
  "piscine-publique": { // Matches database 'piscine-publique'
    label: "Piscine publique",
    icon: Waves,
    card: ["name", "hours"],
    detail: ["description", "priceRange"],
    filters: ["priceRange"],
  },
  plage: { label: "Plage", icon: Umbrella, card: ["name", "neighborhood"], detail: ["description"], filters: [] },
  hopitaux: { label: "Hôpitaux", icon: Cross, card: ["name", "contactPhone"], detail: ["description"], filters: [] },
  zoo: { label: "Zoo", icon: PawPrint, card: ["name", "hours"], detail: ["description", "priceRange"], filters: ["priceRange"] },
  "carte-touristique": { // Matches database 'carte-touristique'
    label: "Carte touristique de la ville",
    icon: Map,
    cardVariant: "map",
    card: ["name"],
  },
};

// Human labels for every field key used above, used by the detail page and
// (if needed) card fallback labels.
export const FIELD_LABELS = {
  name: "Nom",
  city: "Ville",
  neighborhood: "Quartier",
  contactPhone: "Contact",
  rating: "Évaluation",
  hours: "Horaire",
  priceRange: "Prix",
  description: "Présentation",
  location: "Localisation",
  photoCount: "Photos",
  pdfUrl: "Magazine (PDF)",
};

// Reads a field off a listing, checking top-level model fields first and
// falling back to the `attributes` jsonb blob for category-specific data.
const TOP_LEVEL_FIELDS = new Set([
  "id", "category", "name", "city", "neighborhood", "contactPhone",
  "rating", "isFeatured", "latitude", "longitude", "images",
]);

export function getListingField(listing, key) {
  if (!listing) return undefined;
  if (key === "photoCount") return listing.images?.length || listing.attributes?.photoCount;
  if (TOP_LEVEL_FIELDS.has(key)) return listing[key];
  return listing.attributes?.[key];
}

export function formatListingField(key, value) {
  if (value === undefined || value === null || value === "") return null;
  if (key === "photoCount") return `${value} photo${value > 1 ? "s" : ""}`;
  if (key === "rating") return `${Number(value).toFixed(1)} / 5`;
  return String(value);
}

export const CATEGORY_LIST = Object.entries(TOURISM_CATEGORIES).map(([slug, cfg]) => ({
  slug,
  ...cfg,
}));