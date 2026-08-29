"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cities } from "morocco-cities";
import { Search, MapPin, Car as CarIcon, X, SlidersHorizontal } from "lucide-react";
import SearchableDropdown from "@/components/real-estate/SearchableDropdown";
import { FilterDropdown, OptionRow } from "@/components/shared/FilterDropdown";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { carsService } from "@/services/carsService";

const citiesByRegion = cities.reduce((acc, city) => {
  const region = city.region_name;
  if (!acc[region]) acc[region] = [];
  acc[region].push(city.name);
  return acc;
}, {});

const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, "fr"));

const cityToRegion = cities.reduce((acc, city) => {
  acc[city.name] = city.region_name;
  return acc;
}, {});

const ALL_CITIES = cities.map((c) => c.name).sort((a, b) => a.localeCompare(b, "fr"));

const CONDITIONS = [
  { label: "Neuf", value: "NEW" },
  { label: "Occasion", value: "USED" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { label: "Essence", value: "PETROL" },
  { label: "Diesel", value: "DIESEL" },
  { label: "Électrique", value: "ELECTRIC" },
  { label: "Hybride", value: "HYBRID" },
  { label: "GPL", value: "LPG" },
];

const TRANSMISSIONS = [
  { label: "Manuelle", value: "MANUAL" },
  { label: "Automatique", value: "AUTOMATIC" },
  { label: "Semi-auto", value: "SEMI_AUTOMATIC" },
];

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
  condition: "",
  make: "",
  model: "",
  fuelType: "",
  transmission: "",
  minPrice: "",
  maxPrice: "",
  minYear: "",
  maxYear: "",
  maxMileage: "",
};

function ResponsiveLabel({ full, short }) {
  return (
    <>
      <span className="hidden lg:inline">{full}</span>
      <span className="lg:hidden">{short}</span>
    </>
  );
}

export default function CarFilter({ onFilter, initialFilters = {}, isMobile, onClose, extraActions }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);

  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    ...Object.fromEntries(Object.keys(EMPTY_FILTERS).map((k) => [k, initialFilters[k] || ""])),
  });

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    const next = {
      ...EMPTY_FILTERS,
      ...Object.fromEntries(Object.keys(EMPTY_FILTERS).map((k) => [k, initialFilters[k] || ""])),
    };
    const isDifferent = Object.keys(next).some((k) => next[k] !== filtersRef.current[k]);
    if (isDifferent) {
      filtersRef.current = next;
      setFilters(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  useEffect(() => {
    carsService.getCatalog().then((d) => setCatalog(d.data || [])).catch(() => setCatalog([]));
  }, []);

  const cityOptions = useMemo(() => {
    if (!filters.region) return ALL_CITIES;
    return (citiesByRegion[filters.region] || []).sort((a, b) => a.localeCompare(b, "fr"));
  }, [filters.region]);

  const makeOptions = useMemo(() => catalog.map((item) => item.make), [catalog]);
  const modelOptions = useMemo(() => {
    const found = catalog.find((item) => item.make === filters.make);
    return found?.models || [];
  }, [catalog, filters.make]);

  const emitClean = (obj) => {
    const clean = {};
    Object.keys(obj).forEach((k) => {
      if (obj[k]) clean[k] = obj[k];
    });
    onFilter(clean);
  };

  const debouncedEmit = useDebouncedCallback(emitClean, 400);

  const updateFilter = (key, value, { immediate = false } = {}) => {
    const prev = filtersRef.current;
    const next = { ...prev, [key]: value };

    if (key === "region") next.city = "";
    if (key === "city" && value) {
      const resolvedRegion = cityToRegion[value];
      if (resolvedRegion) next.region = resolvedRegion;
    }
    if (key === "make") next.model = "";

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
    filters.minPrice || filters.maxPrice ||
    filters.minYear || filters.maxYear ||
    filters.maxMileage || filters.fuelType || filters.transmission
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
    const yearLabel = formatRange(filters.minYear, filters.maxYear, "");
    if (yearLabel) parts.push(yearLabel.trim());
    if (filters.maxMileage) parts.push(`≤${filters.maxMileage}km`);
    if (filters.fuelType) parts.push(FUEL_TYPES.find((f) => f.value === filters.fuelType)?.label);
    if (filters.transmission) parts.push(TRANSMISSIONS.find((t) => t.value === filters.transmission)?.label);
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
          <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30" />
          <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30" />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Année</p>
        <div className="flex gap-2">
          <input type="number" placeholder="De" value={filters.minYear} onChange={(e) => updateFilter("minYear", e.target.value)} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30" />
          <input type="number" placeholder="À" value={filters.maxYear} onChange={(e) => updateFilter("maxYear", e.target.value)} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30" />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Kilométrage max</p>
        <input type="number" placeholder="Ex: 100000" value={filters.maxMileage} onChange={(e) => updateFilter("maxMileage", e.target.value)} className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#A7D129]/30" />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Carburant</p>
        <div className="space-y-1">
          {FUEL_TYPES.map((f) => (
            <OptionRow
              key={f.value}
              label={f.label}
              isChecked={filters.fuelType === f.value}
              onClick={() => updateFilter("fuelType", filters.fuelType === f.value ? "" : f.value, { immediate: true })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Boîte de vitesse</p>
        <div className="space-y-1">
          {TRANSMISSIONS.map((t) => (
            <OptionRow
              key={t.value}
              label={t.label}
              isChecked={filters.transmission === t.value}
              onClick={() => updateFilter("transmission", filters.transmission === t.value ? "" : t.value, { immediate: true })}
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
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${isActive ? "bg-[#2D5016] text-white shadow-sm" : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"}`}
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
        <div className="flex flex-nowrap items-stretch gap-2 lg:gap-3">
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

          <div className="flex-1 min-w-0 basis-24 lg:basis-40">
            <SearchableDropdown
              label={<ResponsiveLabel full="Marque" short="Marque" />}
              icon={CarIcon}
              value={filters.make}
              options={makeOptions}
              onSelect={(val) => updateFilter("make", val, { immediate: true })}
              placeholder="Rechercher une marque..."
            />
          </div>

          <div className={`flex-1 min-w-0 basis-24 lg:basis-40 ${!filters.make ? "opacity-50 pointer-events-none" : ""}`}>
            <SearchableDropdown
              label="Modèle"
              icon={CarIcon}
              value={filters.model}
              options={modelOptions}
              onSelect={(val) => updateFilter("model", val, { immediate: true })}
              placeholder={filters.make ? "Rechercher un modèle..." : "Choisir une marque"}
            />
          </div>

          <FilterDropdown
            label={advancedLabel()}
            icon={SlidersHorizontal}
            active={advancedActive}
            isOpen={openMenu === "advanced"}
            onToggle={() => setOpenMenu(openMenu === "advanced" ? null : "advanced")}
            onClose={() => setOpenMenu((c) => (c === "advanced" ? null : c))}
            width="w-80"
            align="right"
            className="shrink-0 min-w-0 basis-20 lg:basis-52 max-w-[9rem] lg:max-w-[13rem]"
          >
            {advancedFiltersBody}
          </FilterDropdown>

          {extraActions && <div className="flex-none">{extraActions}</div>}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            {listingTypePills}
            {CONDITIONS.map((c) => {
              const isActive = filters.condition === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => updateFilter("condition", isActive ? "" : c.value, { immediate: true })}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${isActive ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

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
            className={`relative shrink-0 w-11 h-11 rounded-full border flex items-center justify-center transition-colors ${anyActive ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-gray-400 bg-gray-50 text-gray-600"}`}
          >
            <SlidersHorizontal size={16} />
            {anyActive && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />}
          </button>
        </div>

        <div
          className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2.5 -mx-4 px-4"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
        >
          {CONDITIONS.map((c) => {
            const isActive = filters.condition === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => updateFilter("condition", isActive ? "" : c.value, { immediate: true })}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? "bg-[#2D5016] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="font-bold text-gray-800 text-sm">Filtres</span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" aria-label="Fermer">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Transaction</p>
                {listingTypePills}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">État</p>
                <div className="flex flex-wrap gap-1.5">
                  {CONDITIONS.map((c) => {
                    const isActive = filters.condition === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => updateFilter("condition", isActive ? "" : c.value, { immediate: true })}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${isActive ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Région</p>
                <SearchableDropdown label="Région" icon={MapPin} value={filters.region} options={ALL_REGIONS} onSelect={(val) => updateFilter("region", val, { immediate: true })} placeholder="Rechercher une région..." />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ville</p>
                <SearchableDropdown label="Ville" icon={MapPin} value={filters.city} options={cityOptions} onSelect={(val) => updateFilter("city", val, { immediate: true })} placeholder="Rechercher une ville..." />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Marque</p>
                <SearchableDropdown label="Marque" icon={CarIcon} value={filters.make} options={makeOptions} onSelect={(val) => updateFilter("make", val, { immediate: true })} placeholder="Rechercher une marque..." />
              </div>

              <div className={!filters.make ? "opacity-50 pointer-events-none" : ""}>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Modèle</p>
                <SearchableDropdown label="Modèle" icon={CarIcon} value={filters.model} options={modelOptions} onSelect={(val) => updateFilter("model", val, { immediate: true })} placeholder={filters.make ? "Rechercher un modèle..." : "Choisir une marque"} />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Filtres avancés</p>
                {advancedFiltersBody}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
              {anyActive && (
                <button type="button" onClick={handleResetAll} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                  Réinitialiser
                </button>
              )}
              <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition">
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}