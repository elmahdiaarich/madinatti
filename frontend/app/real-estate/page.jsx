"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import { realEstateService } from "@/services/realEstateService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import RealEstateCard from "@/components/real-estate/RealEstateCard";
import RealEstateFilter from "@/components/real-estate/RealEstateFilter";
import { cities } from "morocco-cities";
import { useSearchParams } from "next/navigation";
import BusinessAccountGate from "@/components/shared/BusinessAccountGate";
import InlineRegisterSection from "@/components/real-estate/InlineRegisterSection";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import AdPlaceholder from "@/components/shared/AdPlaceholder";
import { Suspense } from "react";

const CATEGORIES = [
  { label: "Tous", listingType: null },
  { label: "Vente", listingType: "SALE" },
  { label: "Location", listingType: "RENT" },
];

const PROPERTY_TABS = [
  { label: "Tous", value: null },
  { label: "Appartements", value: "APARTMENT" },
  { label: "Villas", value: "VILLA" },
  { label: "Maisons", value: "HOUSE" },
  { label: "Studios", value: "STUDIO" },
  { label: "Terrains", value: "LAND" },
  { label: "Bureaux", value: "OFFICE" },
];

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

const LISTING_TYPES = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

// ─── Small local debounce hook (no extra dependency needed) ─────────────────
// Returns a stable function; calling it repeatedly only fires `fn` once,
// `delay`ms after the last call. Used so the search box doesn't refetch
// the API on every keystroke.
function useDebouncedCallback(fn, delay = 400) {
  const fnRef = useRef(fn);
  const timeoutRef = useRef(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  };
}

// ─── ALERT MODAL COMPONENT ───────────────────────────────────────────────────
function AlertModal({ token, onClose }) {
  const [form, setForm] = useState({
    listingType: "",
    categoryId: "",
    region: "",
    city: "",
    minPrice: "",
    maxPrice: "",
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    realEstateService
      .getCategories()
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, []);

  const handleRegionChange = (region) => {
    setForm((f) => ({ ...f, region, city: "" }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const filters = {
        ...(form.listingType && { listingType: form.listingType }),
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.region && { region: form.region }),
        ...(form.city && { city: form.city }),
        ...(form.minPrice && { minPrice: form.minPrice }),
        ...(form.maxPrice && { maxPrice: form.maxPrice }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ module: "immobilier", filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              🔔 Créer une alerte
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Soyez notifié dès qu'une annonce correspond
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une notification pour chaque nouvelle annonce
              correspondante.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Type d'annonce
                </label>
                <select
                  value={form.listingType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, listingType: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Tous types</option>
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Type de bien
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Tous les types de bien</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Région
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Ville
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                  >
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Prix (MAD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={form.minPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minPrice: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={form.maxPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Créer l'alerte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RealEstatePageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const heroParams = ["region", "city", "categoryId", "listingType", "search"];
  const hasHeroFilters = heroParams.some((k) => searchParams.get(k));

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 12 };
    if (searchParams.get("region")) init.region = searchParams.get("region");
    if (searchParams.get("city")) init.city = searchParams.get("city");
    if (searchParams.get("categoryId"))
      init.categoryId = searchParams.get("categoryId");
    if (searchParams.get("listingType"))
      init.listingType = searchParams.get("listingType");
    if (searchParams.get("search")) init.search = searchParams.get("search");
    return init;
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [fromHero, setFromHero] = useState(hasHeroFilters);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showBusinessGate, setShowBusinessGate] = useState(false);

  // Local, uncontrolled-feeling search text so the input updates instantly
  // while the actual filter/API call is debounced.
  const [searchText, setSearchText] = useState(filters.search || "");

  const debouncedSearch = useDebouncedCallback((value) => {
    handleFilter({ search: value || undefined });
  }, 450);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [res, favRes] = await Promise.all([
          realEstateService.getListings(filters),
          token
            ? realEstateService.getFavorites(token).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);
        setListings(res.listings);
        setPagination(res.pagination);
        setFavoritedIds(new Set((favRes.data ?? []).map((l) => l.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, token]);

  const handleResetAll = () => {
    setFilters({ page: 1, limit: 12 });
    setFromHero(false);
    setSearchText("");
    window.history.replaceState({}, "", "/real-estate");
  };

  const handleFilter = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({ page: 1, limit: 12 });
      setFromHero(false);
      window.history.replaceState({}, "", "/real-estate");
      return;
    }
    setFromHero(false);
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters, page: 1 };
      Object.keys(merged).forEach((k) => {
        if (merged[k] === undefined) delete merged[k];
      });
      return merged;
    });
  };

  const handleTypeTab = (cat) => {
    setActiveType(cat.listingType);
    setActiveProp(null);
    setFilters({
      page: 1,
      limit: 12,
      ...(cat.listingType && { listingType: cat.listingType }),
    });
  };

  const handlePropTab = (prop) => {
    setActiveProp(prop.value);
    setFilters((p) => {
      const merged = { ...p, page: 1 };
      if (prop.value) {
        merged.propertyType = prop.value;
      } else {
        delete merged.propertyType;
      }
      return merged;
    });
  };

  const handlePageChange = (n) => {
    setFilters((p) => ({ ...p, page: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublishClick = () => {
    if (!user) {
      document
        .getElementById("inline-register")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (user.role === "business") {
      router.push("/dashboard/listings/real-estate/create");
    } else if (user.role === "citizen") {
      router.push("/my-space/real-estate/create");
    } else {
      setShowBusinessGate(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 static md:sticky md:top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 pt-2.5 pb-0 flex flex-col gap-0">

          {/* ── MOBILE ONLY: category tabs (Tous / Vente / Location) ── */}
          <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar pb-2 px-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleTypeTab(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  activeType === cat.listingType
                    ? "bg-[#2D5016] text-white shadow-sm"
                    : "bg-[#E8F5D0] text-[#2D5016]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── MOBILE ONLY: search bar + filter button + alert bell ── */}
          <div className="md:hidden flex items-center gap-2 w-full pb-2.5">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2.5">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Ville, quartier..."
                value={searchText}
                onChange={handleSearchChange}
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400 min-w-0"
              />
            </div>

            <button
              onClick={() => setShowFilterDrawer(true)}
              className="shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              aria-label="Filtrer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
            </button>

            {user?.role === "citizen" && (
              <button
                onClick={() => setShowAlertModal(true)}
                className="shrink-0 w-10 h-10 rounded-full border border-[#A7D129] flex items-center justify-center text-base hover:bg-[#E8F5D0] transition"
                aria-label="Créer une alerte"
              >
                🔔
              </button>
            )}
          </div>

          {/* ── MOBILE ONLY: property type tabs, single row, no wrap, foggy edges ── */}
          <div className="md:hidden relative -mx-4 px-4 pb-2.5">
            <div
              className="flex gap-1.5 overflow-x-auto no-scrollbar"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)",
              }}
              onWheel={(e) => {
                // let a plain mouse wheel (vertical delta) scroll this row horizontally too
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              {PROPERTY_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handlePropTab(tab)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                    activeProp === tab.value
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: category tabs — desktop only */}
          <div className="hidden md:flex gap-1.5 flex-wrap pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleTypeTab(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeType === cat.listingType
                    ? "bg-[#2D5016] text-white shadow-sm"
                    : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Row 2: property type tabs (desktop) + action buttons */}
          <div className="flex items-center justify-between pb-2.5 gap-2 flex-wrap">
            <div className="hidden md:flex gap-1 flex-wrap">
              {PROPERTY_TABS.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handlePropTab(tab)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                    activeProp === tab.value
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action buttons — right side (desktop) */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {user?.role === "citizen" && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150"
                >
                  🔔 Créer une alerte
                </button>
              )}
              {(!user ||
                user?.role === "business" ||
                user?.role === "citizen") && (
                <button
                  onClick={handlePublishClick}
                  className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-150 hover:scale-105 active:scale-100 group cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5 fill-current shrink-0"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Publier une annonce
                </button>
              )}
            </div>

            {/* Publish button — mobile only, full width-ish, since alert bell already moved to search row */}
            {(!user ||
              user?.role === "business" ||
              user?.role === "citizen") && (
              <button
                onClick={handlePublishClick}
                className="md:hidden inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-150"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-current shrink-0"
                >
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
                Publier une annonce
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="relative flex justify-center gap-4">
        {/* Side-rail ads — only where there's real empty margin (2xl+ screens).
            Sticky (not fixed) so they scroll along with the page and settle
            near the top instead of floating over unrelated content lower down. */}
        <div className="hidden 2xl:block w-[160px] shrink-0">
          <div className="sticky top-24">
            <AdPlaceholder variant="rail" />
          </div>
        </div>

        <div className="max-w-[1400px] w-full px-4 py-6 flex gap-6">
          {/* SIDEBAR (desktop) */}
          <aside className="hidden md:block w-[260px] shrink-0">
            {/* Not sticky for now — the outer nav is already sticky, so a sticky
                filter panel here ends up mostly hidden behind it. Revisit once
                the nav height is finalized / not sticky on its own. */}
            <RealEstateFilter onFilter={handleFilter} />
          </aside>

        {/* Mobile drawer */}
        {showFilterDrawer && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowFilterDrawer(false)}
            />
            <div className="absolute top-0 left-0 h-full w-[85%] max-w-[340px] bg-gray-50 shadow-2xl overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
                <span className="font-bold text-gray-800 text-sm">Filtres</span>
                <button
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 pb-0">
                <RealEstateFilter
                  isMobile
                  onFilter={handleFilter}
                  onClose={() => setShowFilterDrawer(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* GRID */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {pagination ? (
                <>
                  <span className="font-semibold text-gray-800">
                    {pagination.total}
                  </span>{" "}
                  annonces trouvées
                </>
              ) : (
                <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              )}
            </p>

            {fromHero && (
              <div className="flex items-center gap-3 bg-[#E8F5D0] border border-[#A7D129] rounded-full px-4 py-1.5">
                <span className="text-xs font-medium text-[#2D5016]">
                  Filtres appliqués depuis la recherche
                </span>
                <button
                  onClick={handleResetAll}
                  className="text-xs font-bold text-[#2D5016] hover:text-red-600 transition-colors underline underline-offset-2"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          {/* Mobile banner ad */}
          <div className="md:hidden mb-4">
            <AdPlaceholder variant="mobile-banner" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-[260px] bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🏠</div>
              <p className="text-lg font-semibold text-gray-700">
                Aucune annonce trouvée
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Essayez de modifier vos filtres
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l, i) => (
                <Fragment key={l.id}>
                  <RealEstateCard
                    listing={l}
                    initialFavorited={favoritedIds.has(l.id)}
                  />
                  {(i + 1) % 6 === 0 && (
                    <AdPlaceholder variant="grid" />
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ‹
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? "bg-primary-dark text-white shadow-sm"
                      : "bg-white text-primary-dark border border-gray-200 hover:border-primary-dark hover:bg-orange-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ›
              </button>
            </div>
          )}
        </main>
        </div>

        <div className="hidden 2xl:block w-[160px] shrink-0">
          <div className="sticky top-24">
            <AdPlaceholder variant="rail" />
          </div>
        </div>
      </div>

      {/* ALERT MODAL */}
      {showAlertModal && (
        <AlertModal token={token} onClose={() => setShowAlertModal(false)} />
      )}

      {/* BUSINESS GATE MODAL */}
      {showBusinessGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          style={{ animation: "fadeIn 0.15s ease-out" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBusinessGate(false);
          }}
        >
          <div style={{ animation: "slideUp 0.2s ease-out" }}>
            <BusinessAccountGate onClose={() => setShowBusinessGate(false)} />
          </div>
        </div>
      )}

      {/* INLINE REGISTER — visiteurs only */}
      {!user && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inline-register" />
        </div>
      )}
    </div>
  );
}

export default function RealEstatePage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner message="Chargement des annonces immobilières..." />
      }
    >
      <RealEstatePageContent />
    </Suspense>
  );
}