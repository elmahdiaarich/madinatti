"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cities } from "morocco-cities";
import { Search, ChevronDown, X, MapPin, Home, Tag, SlidersHorizontal } from "lucide-react";
import SearchableDropdown from "@/components/real-estate/SearchableDropdown";
import { FilterDropdown, OptionRow } from "@/components/shared/FilterDropdown";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

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

// Reverse lookup: city name → region name, so picking a city directly
// (without choosing a region first) can still resolve/display its region.
const cityToRegion = cities.reduce((acc, city) => {
  acc[city.name] = city.region_name;
  return acc;
}, {});

const ALL_CITIES = cities
  .map((c) => c.name)
  .sort((a, b) => a.localeCompare(b, "fr"));

const ROOM_OPTIONS = [
  { value: "1", label: "1+ pièce" },
  { value: "2", label: "2+ pièces" },
  { value: "3", label: "3+ pièces" },
  { value: "4", label: "4+ pièces" },
  { value: "5", label: "5+ pièces" },
];

const PROPERTY_TYPES = [
  { label: "Appartements", value: "APARTMENT" },
  { label: "Villas", value: "VILLA" },
  { label: "Maisons", value: "HOUSE" },
  { label: "Studios", value: "STUDIO" },
  { label: "Terrains", value: "LAND" },
  { label: "Bureaux", value: "OFFICE" },
];

// Now rendered as a pill row (Tous / Vente / Location), not a dropdown.
const LISTING_TYPE_TABS = [
  { value: "", label: "Tous" },
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

const EMPTY_FILTERS = {
  search: "",
  region: "",
  city: "",
  listingType: "",
  propertyType: "",
  minPrice: "",
  maxPrice: "",
  minSurface: "",
  maxSurface: "",
  rooms: "",
};

// Small helper: renders a label that swaps to a shorter version as the
// viewport narrows, instead of the field just overflowing/scrolling.
// (Assumes SearchableDropdown/FilterDropdown just render `{label}` as-is,
// which works fine with a JSX node, not just a string.)
function ResponsiveLabel({ full, short }) {
  return (
    <>
      <span className="hidden lg:inline">{full}</span>
      <span className="lg:hidden">{short}</span>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RealEstateFilter({ onFilter, initialFilters = {}, isMobile, onClose, extraActions }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    ...Object.fromEntries(
      Object.keys(EMPTY_FILTERS).map((k) => [k, initialFilters[k] || ""])
    ),
  });

  // Always-current mirror of `filters`. updateFilter reads/writes through this
  // ref (not the `filters` closure) so that two selections landing in the same
  // tick — e.g. picking a region then immediately a city, or an "immediate"
  // pick racing a pending debounced text/number change — never build their
  // `next` object from a stale snapshot and silently clobber each other.
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Sync internal state with external initialFilters (e.g. reset / URL change)
  useEffect(() => {
    const next = {
      ...EMPTY_FILTERS,
      ...Object.fromEntries(
        Object.keys(EMPTY_FILTERS).map((k) => [k, initialFilters[k] || ""])
      ),
    };
    const isDifferent = Object.keys(next).some((k) => next[k] !== filtersRef.current[k]);
    if (isDifferent) {
      filtersRef.current = next;
      setFilters(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const cityOptions = useMemo(() => {
    if (!filters.region) return ALL_CITIES;
    return (citiesByRegion[filters.region] || []).sort((a, b) => a.localeCompare(b, "fr"));
  }, [filters.region]);

  const emitClean = (obj) => {
    const clean = {};
    Object.keys(obj).forEach((k) => {
      if (obj[k]) clean[k] = obj[k];
    });
    onFilter(clean);
  };

  const debouncedEmit = useDebouncedCallback(emitClean, 400);

  // Text/number inputs debounce; discrete selects (dropdown/pill picks) emit instantly.
  // Both branches build `next` from filtersRef.current, which is always fresh —
  // this is what actually fixes filters overriding each other instead of combining.
  const updateFilter = (key, value, { immediate = false } = {}) => {
    const prev = filtersRef.current;
    const next = { ...prev, [key]: value };

    if (key === "region") {
      next.city = ""; // reset city when region changes — city list narrows to the new region
    }
    if (key === "city" && value) {
      // Picking a city directly (with no region chosen yet, or a different
      // region than the city belongs to) auto-fills the matching region so
      // both fields stay consistent and the dropdown reflects the right context.
      const resolvedRegion = cityToRegion[value];
      if (resolvedRegion) next.region = resolvedRegion;
    }

    filtersRef.current = next;
    setFilters(next);
    if (immediate) {
      emitClean(next);
    } else {
      debouncedEmit(next);
    }
  };

  const handleResetAll = () => {
    filtersRef.current = EMPTY_FILTERS;
    setFilters(EMPTY_FILTERS);
    setOpenMenu(null);
    onFilter({});
  };

  const anyActive = Object.values(filters).some((v) => v !== "");
  const advancedActive = !!(
    filters.minPrice ||
    filters.maxPrice ||
    filters.minSurface ||
    filters.maxSurface ||
    filters.rooms
  );

  const formatRange = (min, max, unit) => {
    if (min && max) return `${min}-${max} ${unit}`;
    if (min) return `Dès ${min} ${unit}`;
    if (max) return `Jusqu'à ${max} ${unit}`;
    return null;
  };

  const advancedLabel = () => {
    const parts = [];
    const priceLabel = formatRange(filters.minPrice, filters.maxPrice, "MAD");
    if (priceLabel) parts.push(priceLabel);

    const surfaceLabel = formatRange(filters.minSurface, filters.maxSurface, "m²");
    if (surfaceLabel) parts.push(surfaceLabel);

    if (filters.rooms) {
      parts.push(ROOM_OPTIONS.find((r) => r.value === filters.rooms)?.label);
    }
    // When nothing is active, show a label that itself shrinks on small screens.
    return parts.length ? (
      <span className="truncate">{parts.join(" · ")}</span>
    ) : (
      <ResponsiveLabel full="Filtres avancés" short="Filtres" />
    );
  };

  const advancedFiltersBody = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Prix (MAD)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Surface (m²)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minSurface}
            onChange={(e) => updateFilter("minSurface", e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxSurface}
            onChange={(e) => updateFilter("maxSurface", e.target.value)}
            className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Nombre de pièces</p>
        <div className="space-y-1">
          {ROOM_OPTIONS.map((r) => (
            <OptionRow
              key={r.value}
              label={r.label}
              isChecked={filters.rooms === r.value}
              onClick={() =>
                updateFilter("rooms", filters.rooms === r.value ? "" : r.value, {
                  immediate: true,
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );

  const listingTypePills = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {LISTING_TYPE_TABS.map((tab) => {
        const isActive = filters.listingType === tab.value;
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => updateFilter("listingType", tab.value, { immediate: true })}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${isActive
              ? "bg-[#2D5016] text-white shadow-sm"
              : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"
              }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="w-full bg-white">
      {/* ══════════════════════ DESKTOP / TABLET (md+) ══════════════════════ */}
      <div className="hidden md:block">
        {/*
          Row 1: search + region + city + property type + advanced.
          FIX: previously `flex-nowrap` + `overflow-x-auto` + `shrink-0` on
          every child forced a fixed total width, so anything that didn't
          fit just scrolled off-screen instead of shrinking to fit.

          Now every field is allowed to shrink (`min-w-0`, no `shrink-0`),
          min-widths shrink progressively at each breakpoint, and the
          longer labels (Région / Type de bien / Filtres avancés) swap to
          short forms below the `lg` breakpoint via <ResponsiveLabel>.
          Nothing scrolls — everything always fits on one row.
        */}
        <div className="flex flex-nowrap items-stretch gap-2 lg:gap-3">
          {/* Search — still the widest field, but its min-width now shrinks
              with the viewport instead of forcing a scrollbar */}
          <div className="relative group flex-[2_2_140px] min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D5016] transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full bg-gray-50 border border-gray-400 rounded-3xl pl-10 pr-3 lg:pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30 transition"
            />
          </div>

          {/* Region */}
          <div className="flex-1 min-w-0 basis-24 lg:basis-40">
            <SearchableDropdown
              label={<ResponsiveLabel full="Région" short="Rég." />}
              icon={MapPin}
              value={filters.region}
              options={ALL_REGIONS}
              onSelect={(val) => updateFilter("region", val, { immediate: true })}
              placeholder="Rechercher une région..."
            />
          </div>

          {/* City */}
          <div className="flex-1 min-w-0 basis-24 lg:basis-40">
            <SearchableDropdown
              label="Ville"
              icon={MapPin}
              value={filters.city}
              options={cityOptions}
              onSelect={(val) => updateFilter("city", val, { immediate: true })}
              placeholder="Rechercher une ville..."
            />
          </div>

          {/* Property Type */}
          <div className="flex-1 min-w-0 basis-24 lg:basis-40">
            <SearchableDropdown
              label={<ResponsiveLabel full="Type de bien" short="Type" />}
              icon={Home}
              value={filters.propertyType}
              options={PROPERTY_TYPES}
              onSelect={(val) => updateFilter("propertyType", val, { immediate: true })}
            />
          </div>

          {/* Advanced filters: price + surface + rooms grouped together */}
          <FilterDropdown
            label={advancedLabel()}
            icon={SlidersHorizontal}
            active={advancedActive}
            isOpen={openMenu === "advanced"}
            onToggle={() => setOpenMenu(openMenu === "advanced" ? null : "advanced")}
            onClose={() => setOpenMenu((c) => (c === "advanced" ? null : c))}
            width="w-80"
            align="right"
            className="flex-none min-w-0 basis-20 lg:basis-52 max-w-[9rem] lg:max-w-[13rem]"
          >
            {advancedFiltersBody}
          </FilterDropdown>

          {extraActions && <div className="flex-none">{extraActions}</div>}
        </div>

        {/* Row 2: listing type pills (Tous / Vente / Location) + reset, same row */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
          {listingTypePills}

          {anyActive && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-2"
            >
              <X size={16} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════ MOBILE / SMALL TABLET (below md) ══════════════════════ */}
      <div className="md:hidden">
        {/* Compact bar: search + icon-only filter button */}
        <div className="flex items-center gap-2">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D5016] transition-colors" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full bg-gray-50 border border-gray-400 rounded-3xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30 transition"
            />
          </div>

          {extraActions}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Filtres"
            className={`relative shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition-colors
              ${anyActive
                ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]"
                : "border-gray-400 bg-gray-50 text-gray-600"
              }`}
          >
            <SlidersHorizontal size={16} />
            {anyActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />
            )}
          </button>
        </div>

        {/* Quick property-type pills, horizontally scrollable */}
        <div
          className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2.5 -mx-4 px-4"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
        >
          {PROPERTY_TYPES.map((t) => {
            const isActive = filters.propertyType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() =>
                  updateFilter("propertyType", isActive ? "" : t.value, { immediate: true })
                }
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                  ? "bg-[#2D5016] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile filter drawer — slides in from the left */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="font-bold text-gray-800 text-sm">Filtres</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Transaction</p>
                {listingTypePills}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Région</p>
                <SearchableDropdown
                  label="Région"
                  icon={MapPin}
                  value={filters.region}
                  options={ALL_REGIONS}
                  onSelect={(val) => updateFilter("region", val, { immediate: true })}
                  placeholder="Rechercher une région..."
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ville</p>
                <SearchableDropdown
                  label="Ville"
                  icon={MapPin}
                  value={filters.city}
                  options={cityOptions}
                  onSelect={(val) => updateFilter("city", val, { immediate: true })}
                  placeholder="Rechercher une ville..."
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Type de bien</p>
                <SearchableDropdown
                  label="Type de bien"
                  icon={Home}
                  value={filters.propertyType}
                  options={PROPERTY_TYPES}
                  onSelect={(val) => updateFilter("propertyType", val, { immediate: true })}
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Filtres avancés</p>
                {advancedFiltersBody}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
              {anyActive && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Réinitialiser
                </button>
              )}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}