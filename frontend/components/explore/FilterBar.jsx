// frontend/components/explore/FilterBar.jsx
"use client";

import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";

const PRICE_RANGES = [
  { value: "", label: "Tous les prix" },
  { value: "low", label: "Économique" },
  { value: "mid", label: "Moyen" },
  { value: "high", label: "Premium" },
];

const RATINGS = [
  { value: "", label: "Toutes les notes" },
  { value: "4", label: "4+" },
  { value: "3", label: "3+" },
];

// Works out which filter widgets to show: only the ones declared for the
// active category, or the union of all filters when "Tous" is selected.
function getActiveFilterKeys(activeCategory) {
  if (activeCategory === "all") {
    const all = new Set();
    Object.values(TOURISM_CATEGORIES).forEach((cfg) => (cfg.filters || []).forEach((f) => all.add(f)));
    return [...all];
  }
  return TOURISM_CATEGORIES[activeCategory]?.filters || [];
}

export default function FilterBar({ activeCategory, filters, onChange }) {
  const keys = getActiveFilterKeys(activeCategory);
  if (keys.length === 0) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value || undefined });

  return (
    <div className="flex flex-wrap gap-2">
      {keys.includes("rating") && (
        <select
          value={filters.rating || ""}
          onChange={(e) => set("rating", e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/80"
        >
          {RATINGS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      )}
      {keys.includes("priceRange") && (
        <select
          value={filters.priceRange || ""}
          onChange={(e) => set("priceRange", e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/80"
        >
          {PRICE_RANGES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      )}
      {keys.includes("location") && (
        <input
          type="text"
          placeholder="Quartier / localisation"
          value={filters.location || ""}
          onChange={(e) => set("location", e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black/80"
        />
      )}
    </div>
  );
}