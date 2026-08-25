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
import { ChevronDown, Bell } from "lucide-react";
import SplitMapLayout from "@/components/shared/SplitMapLayout";
import RealEstateMap from "@/components/real-estate/RealEstateMap";
import StickyFilterBar from "@/components/shared/StickyFilterBar";
import SortSelect from "@/components/shared/SortSelect";
import Pagination from "@/components/shared/Pagination";
// import AlertModalShell from "@/components/shared/AlertModalShell";

const LISTING_TYPES = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

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
      .catch(() => { });
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const heroParams = [
    "region",
    "city",
    "categoryId",
    "listingType",
    "propertyType",
    "search",
  ];
  const hasHeroFilters = heroParams.some((k) => searchParams.get(k));

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 12 };
    if (searchParams.get("region")) init.region = searchParams.get("region");
    if (searchParams.get("city")) init.city = searchParams.get("city");
    if (searchParams.get("categoryId"))
      init.categoryId = searchParams.get("categoryId");
    if (searchParams.get("listingType"))
      init.listingType = searchParams.get("listingType");
    if (searchParams.get("propertyType"))
      init.propertyType = searchParams.get("propertyType");
    if (searchParams.get("search")) init.search = searchParams.get("search");
    return init;
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [fromHero, setFromHero] = useState(hasHeroFilters);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showBusinessGate, setShowBusinessGate] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
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
    window.history.replaceState({}, "", "/real-estate");
  };

  const handleFilter = (updatedFilters) => {
    setFromHero(false);
    setFilters({ ...updatedFilters, page: 1, limit: 12 });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="min-h-screen">
      {/* TOP BAR */}
      <StickyFilterBar>
        <RealEstateFilter
          onFilter={handleFilter}
          initialFilters={filters}
          extraActions={
            !authLoading && user?.role === "citizen" ? (
              <button
                onClick={() => setShowAlertModal(true)}
                aria-label="Créer une alerte"
                className="flex items-center justify-center gap-2 border border-gray-400 bg-gray-50 rounded-full md:rounded-3xl w-11 h-11 md:w-auto md:h-auto md:px-3 md:py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                <Bell size={16} className="text-gray-400 md:hidden" />
                <Bell size={14} className="text-gray-400 hidden md:block" />
                <span className="hidden md:inline">Alerte</span>
              </button>
            ) : null
          }
        />
      </StickyFilterBar>

      {/* MAIN */}
      <div className="relative flex justify-center gap-4 mb-4">
        {/* Side-rail ads — only where there's real empty margin (2xl+ screens).
            Sticky (not fixed) so they scroll along with the page and settle
            near the top instead of floating over unrelated content lower down. */}

        <div className="w-full pl-5 flex gap-4">
          {/* SIDEBAR (desktop) */}
          {/* <aside className="hidden md:block w-[260px] shrink-0"> */}
          {/* Not sticky for now — the outer nav is already sticky, so a sticky
                filter panel here ends up mostly hidden behind it. Revisit once
                the nav height is finalized / not sticky on its own. */}
          {/* <RealEstateFilter onFilter={handleFilter} />
          </aside> */}

          {/* Mobile drawer */}
          {showFilterDrawer && (
            <div className="md:hidden fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowFilterDrawer(false)}
              />
              <div className="absolute top-0 left-0 h-full w-[85%] max-w-[340px] bg-gray-50 shadow-2xl overflow-y-auto animate-slide-in-left">
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
                  <span className="font-bold text-gray-800 text-sm">
                    Filtres
                  </span>
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
            <SplitMapLayout
              map={
                <RealEstateMap
                  listings={listings}
                  hoveredListingId={hoveredListingId}
                  selectedListingId={selectedListingId}
                  onSelectListing={setSelectedListingId}
                />
              }
            >

              <>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
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

                  <div className="flex items-center gap-3">
                    {!authLoading && (!user ||
                      user?.role === "business" ||
                      user?.role === "citizen") && (
                        <button
                          onClick={handlePublishClick}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#2D5016] text-white font-bold text-xs md:text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current shrink-0"
                          >
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                          Publier
                        </button>
                      )}
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

                    <SortSelect
                      value={filters.sort || "newest"}
                      onChange={(value) => {
                        setFilters((prev) => {
                          const next = { ...prev, page: 1 };
                          if (value === "newest") delete next.sort;
                          else next.sort = value;
                          return next;
                        });
                      }}
                      options={[
                        { value: "newest", label: "Plus récent" },
                        { value: "price_asc", label: "Prix croissant" },
                        { value: "price_desc", label: "Prix décroissant" },
                      ]}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-6 gap-y-4">
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
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-x-6 gap-y-4">
                    {listings.map((l) => (
                      <Fragment key={l.id}>
                        <RealEstateCard
                          listing={l}
                          initialFavorited={favoritedIds.has(l.id)}
                        />
                      </Fragment>
                    ))}
                  </div>
                )}

                <Pagination
                  page={pagination?.page}
                  totalPages={pagination?.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            </SplitMapLayout>
          </main>
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
