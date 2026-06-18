"use client";

import { useState, useEffect, useMemo } from "react";
import { cities } from "morocco-cities";
import { realEstateService } from "@/services/realEstateService";

// ─── Build region → cities map once ──────────────────────────────────────────
const citiesByRegion = cities.reduce((acc, city) => {
  const region = city.region_name;
  if (!acc[region]) acc[region] = [];
  acc[region].push(city.name);
  return acc;
}, {});

const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) =>
  a.localeCompare(b, "fr")
);

const LISTING_TYPES = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

const ROOM_OPTIONS = [
  { value: "1", label: "1+ pièce" },
  { value: "2", label: "2+ pièces" },
  { value: "3", label: "3+ pièces" },
  { value: "4", label: "4+ pièces" },
  { value: "5", label: "5+ pièces" },
];

// ─── Sub-components (same pattern as JobFilter) ───────────────────────────────

function FilterSkeleton() {
  return (
    <div className="px-4 pb-3 space-y-1.5 animate-pulse">
      {[80, 60, 70, 50, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 shrink-0" />
          <div className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function FilterOption({ label, count, isChecked, onClick }) {
  return (
    <label
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 text-sm
        ${
          isChecked
            ? "bg-[#2D5016] text-white"
            : "text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016]"
        }`}
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
        ${isChecked ? "bg-[#A7D129] border-[#A7D129]" : "border-gray-300"}`}
      >
        {isChecked && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span className="leading-snug flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center shrink-0 transition-colors
          ${
            isChecked
              ? "bg-white/25 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count.toLocaleString("fr-MA")}
        </span>
      )}
    </label>
  );
}

function FilterSection({ icon, label, badge, isOpen, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {badge > 0 && (
            <span className="text-[10px] bg-[#A7D129] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RealEstateFilter({ onFilter }) {
  const [open, setOpen] = useState({
    listingType: true,
    propertyType: true,
    price: false,
    rooms: false,
    region: false,
    city: false,
  });

  const [selected, setSelected] = useState({
    listingType: [],
    propertyType: [],
    rooms: [],
    region: [],
    city: [],
  });

  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Derived single-selected values
  const selectedRegion = selected.region[0] || null;
  const selectedCity = selected.city[0] || null;

  // ─── Fetch real estate categories from API ─────────────────────────────
  useEffect(() => {
    realEstateService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  // ─── Region / city options from morocco-cities ─────────────────────────
  const regionOptions = useMemo(
    () =>
      ALL_REGIONS.map((r) => ({ value: r, label: r })),
    []
  );

  const cityOptions = useMemo(() => {
    const pool = selectedRegion
      ? citiesByRegion[selectedRegion] || []
      : Object.values(citiesByRegion).flat();
    return [...pool]
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((c) => ({ value: c, label: c }));
  }, [selectedRegion]);

  // ─── Emit filters upward ───────────────────────────────────────────────
  const emitFilters = (newSelected, newPrice) => {
    const f = {};

    const listingType = newSelected.listingType[0];
    const propertyType = newSelected.propertyType[0];
    const rooms = newSelected.rooms[0];
    const city = newSelected.city[0];
    const region = newSelected.region[0];

    if (listingType) f.listingType = listingType;
    if (propertyType) f.categoryId = propertyType;
    if (rooms) f.rooms = rooms;
    if (city) f.city = city;
    else if (region) f.city = region; // fallback: filter by region name as city

    if (newPrice.min) f.minPrice = newPrice.min;
    if (newPrice.max) f.maxPrice = newPrice.max;

    onFilter(f);
  };

  // ─── Toggle helpers ────────────────────────────────────────────────────
  const toggleSection = (key) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleCheck = (key, value) => {
    const current = selected[key][0];
    let newSelected;

    if (key === "region") {
      const isSame = current === value;
      newSelected = {
        ...selected,
        region: isSame ? [] : [value],
        city: [],
      };
    } else {
      newSelected = {
        ...selected,
        [key]: current === value ? [] : [value],
      };
    }

    setSelected(newSelected);
    emitFilters(newSelected, priceRange);
  };

  const handlePriceChange = (field, val) => {
    const newPrice = { ...priceRange, [field]: val };
    setPriceRange(newPrice);
    // Emit on change (debounce not needed for sidebar apply pattern,
    // but we emit live to stay consistent with the rest of the filter)
    emitFilters(selected, newPrice);
  };

  const handleReset = () => {
    const empty = {
      listingType: [],
      propertyType: [],
      rooms: [],
      region: [],
      city: [],
    };
    setSelected(empty);
    setPriceRange({ min: "", max: "" });
    onFilter({});
  };

  const totalSelected =
    Object.values(selected).flat().length +
    (priceRange.min || priceRange.max ? 1 : 0);

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          <span className="text-white font-semibold text-sm">
            Filtrer les annonces
          </span>
          {totalSelected > 0 && (
            <span className="bg-[#A7D129] text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {totalSelected}
            </span>
          )}
        </div>
        {totalSelected > 0 && (
          <button
            onClick={handleReset}
            className="text-white/70 hover:text-white text-xs underline transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Type d'annonce (Vente / Location) */}
      <FilterSection
        icon="🏷️"
        label="Type d'annonce"
        badge={selected.listingType.length}
        isOpen={open.listingType}
        onToggle={() => toggleSection("listingType")}
      >
        <div className="px-3 pb-3 space-y-0.5">
          {LISTING_TYPES.map((t) => (
            <FilterOption
              key={t.value}
              label={t.label}
              isChecked={selected.listingType[0] === t.value}
              onClick={() => handleCheck("listingType", t.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Type de bien */}
      <FilterSection
        icon="🏠"
        label="Type de bien"
        badge={selected.propertyType.length}
        isOpen={open.propertyType}
        onToggle={() => toggleSection("propertyType")}
      >
        {loadingCats ? (
          <FilterSkeleton />
        ) : categories.length === 0 ? (
          <p className="px-4 pb-3 text-xs text-gray-400 italic">
            Aucune catégorie disponible
          </p>
        ) : (
          <div className="px-3 pb-3 space-y-0.5">
            {categories.map((cat) => (
              <FilterOption
                key={cat.id}
                label={cat.name}
                isChecked={selected.propertyType[0] === cat.id}
                onClick={() => handleCheck("propertyType", cat.id)}
              />
            ))}
          </div>
        )}
      </FilterSection>

      {/* Prix */}
      <FilterSection
        icon="💰"
        label="Prix (MAD)"
        badge={priceRange.min || priceRange.max ? 1 : 0}
        isOpen={open.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="px-3 pb-3 flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange("min", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent transition"
          />
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange("max", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent transition"
          />
        </div>
      </FilterSection>

      {/* Pièces */}
      <FilterSection
        icon="🛏️"
        label="Pièces min."
        badge={selected.rooms.length}
        isOpen={open.rooms}
        onToggle={() => toggleSection("rooms")}
      >
        <div className="px-3 pb-3 space-y-0.5">
          {ROOM_OPTIONS.map((r) => (
            <FilterOption
              key={r.value}
              label={r.label}
              isChecked={selected.rooms[0] === r.value}
              onClick={() => handleCheck("rooms", r.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Région */}
      <FilterSection
        icon="🗺️"
        label="Région"
        badge={selectedRegion ? 1 : 0}
        isOpen={open.region}
        onToggle={() => toggleSection("region")}
      >
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {regionOptions.map((opt) => (
            <FilterOption
              key={opt.value}
              label={opt.label}
              isChecked={selectedRegion === opt.value}
              onClick={() => handleCheck("region", opt.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Ville */}
      <FilterSection
        icon="📍"
        label={selectedRegion ? `Ville — ${selectedRegion}` : "Ville"}
        badge={selectedCity ? 1 : 0}
        isOpen={open.city}
        onToggle={() => toggleSection("city")}
      >
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {cityOptions.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400 italic">
              {selectedRegion
                ? "Aucune ville dans cette région"
                : "Aucune ville disponible"}
            </p>
          ) : (
            cityOptions.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                isChecked={selectedCity === opt.value}
                onClick={() => handleCheck("city", opt.value)}
              />
            ))
          )}
        </div>
      </FilterSection>
    </div>
  );
}