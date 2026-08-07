// frontend/components/explore/FilterBar.jsx
"use client";

import { MapPin, Star, Tag, Clock } from "lucide-react";
import { cities as MOROCCO_CITIES } from "morocco-cities";
import SearchableDropdown from "./SearchableDropdown";

const PRICE_RANGES = [
  { value: "low", label: "Économique" },
  { value: "mid", label: "Moyen" },
  { value: "high", label: "Premium" },
];

const RATINGS = [
  { value: "4", label: "4+" },
  { value: "3", label: "3+" },
];

// Deduplicated, alphabetically sorted city names from the package.
const CITY_OPTIONS = [...new Set(MOROCCO_CITIES.map((c) => c.name))].sort((a, b) =>
  a.localeCompare(b)
);

// The "Ville" dropdown uses the official (accented) morocco-cities names,
// but real listing data may store city names without accents / different
// casing (e.g. "Kenitra" vs "Kénitra"). Normalize before matching so the
// dependent "Quartier" dropdown actually finds its options.
export function normalizeCityKey(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * neighborhoodsByCity: { [normalizedCityKey]: string[] } — distinct
 * neighborhoods available for each city, derived from listing data by the
 * parent (the "morocco-cities" package itself has no neighborhood data).
 */

// ... PRICE_RANGES, RATINGS, CITY_OPTIONS, normalizeCityKey unchanged ...

export default function FilterBar({ filters, onChange, neighborhoodsByCity = {} }) {
  const set = (key, value) => {
    const next = { ...filters, [key]: value || undefined };
    if (key === "city") next.neighborhood = undefined;
    onChange(next);
  };

  const neighborhoodOptions = filters.city
    ? neighborhoodsByCity[normalizeCityKey(filters.city)] || []
    : [];

  return (
    <>
      <SearchableDropdown
        label="Évaluation"
        icon={Star}
        value={filters.rating}
        options={RATINGS}
        onSelect={(v) => set("rating", v)}
        searchable={false}
        emptyLabel="Toutes les notes"
        width="w-40"
      />

      <SearchableDropdown
        label="Ville"
        icon={MapPin}
        value={filters.city}
        options={CITY_OPTIONS}
        onSelect={(v) => set("city", v)}
        emptyLabel="Toutes les villes"
        placeholder="Tapez pour chercher une ville..."
        width="w-44"
      />

      <SearchableDropdown
        label="Quartier"
        icon={MapPin}
        value={filters.neighborhood}
        options={neighborhoodOptions}
        onSelect={(v) => set("neighborhood", v)}
        disabled={!filters.city || neighborhoodOptions.length === 0}
        emptyLabel={filters.city ? "Tous les quartiers" : "Choisissez une ville d'abord"}
        placeholder="Tapez pour chercher un quartier..."
        width="w-44"
      />

      <SearchableDropdown
        label="Prix"
        icon={Tag}
        value={filters.priceRange}
        options={PRICE_RANGES}
        onSelect={(v) => set("priceRange", v)}
        searchable={false}
        emptyLabel="Tous les prix"
        width="w-40"
      />

      <button
        type="button"
        onClick={() => set("openOnly", filters.openOnly ? undefined : "true")}
        className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
          filters.openOnly
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-black/10 text-black/60 hover:border-[var(--color-primary)] hover:text-black"
        }`}
      >
        <Clock size={13} />
        Ouvert maintenant
      </button>
    </>
  );
}