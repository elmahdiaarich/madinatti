"use client";

import { useEffect, useState, Suspense } from "react";
import { carsService } from "@/services/carsService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import CarCard from "@/components/cars/CarCard";
import CarFilter from "@/components/cars/CarFilter";
import BusinessAccountGate from "@/components/shared/BusinessAccountGate";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";
import StickyFilterBar from "@/components/shared/StickyFilterBar";
import SplitMapLayout from "@/components/shared/SplitMapLayout";
import MultiPinMap from "@/components/shared/maps/MultiPinMap";
import SortSelect from "@/components/shared/SortSelect";
import Pagination from "@/components/shared/Pagination";
import { cities } from "morocco-cities";
import { Bell } from "lucide-react";

const citiesByRegion = cities.reduce((acc, c) => {
  if (!acc[c.region_name]) acc[c.region_name] = [];
  acc[c.region_name].push(c.name);
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
    make: "",
    model: "",
    condition: "",
  });
  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    carsService.getCategories().then((d) => setCategories(d.data || [])).catch(() => { });
    carsService.getCatalog().then((d) => setCatalog(d.data || [])).catch(() => setCatalog([]));
  }, []);

  const modelOptions = catalog.find((item) => item.make === form.make)?.models || [];

  const handleRegionChange = (region) => setForm((f) => ({ ...f, region, city: "" }));

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
        ...(form.make && { make: form.make.trim() }),
        ...(form.model && { model: form.model.trim() }),
        ...(form.condition && { condition: form.condition }),
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ module: "automobile", filters }),
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

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🔔 Créer une alerte</h2>
            <p className="text-xs text-gray-400 mt-0.5">Soyez notifié dès qu'un véhicule correspond</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une notification pour chaque nouvelle annonce correspondante.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type d'annonce</label>
                <select value={form.listingType} onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value }))} className={inputStyle}>
                  <option value="">Tous types</option>
                  <option value="SALE">Vente</option>
                  <option value="RENT">Location</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Catégorie de véhicule</label>
                <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputStyle}>
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Marque</label>
                  <select value={form.make} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value, model: "" }))} className={inputStyle}>
                    <option value="">Toutes</option>
                    {catalog.map((item) => <option key={item.make} value={item.make}>{item.make}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Modèle</label>
                  <select value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} disabled={!form.make} className={inputStyle}>
                    <option value="">{form.make ? "Tous" : "Choisir marque"}</option>
                    {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">État du véhicule</label>
                <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} className={inputStyle}>
                  <option value="">Tous états</option>
                  <option value="NEW">Neuf</option>
                  <option value="USED">Occasion</option>
                  <option value="DAMAGED">Accidenté</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Région</label>
                <select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} className={inputStyle}>
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                  <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputStyle}>
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix (MAD)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={form.minPrice} onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))} className={inputStyle} />
                  <input type="number" placeholder="Max" value={form.maxPrice} onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))} className={inputStyle} />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                {saving ? "Enregistrement..." : "Créer l'alerte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────
function CarsPageContent() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 12 };
    ["region", "city", "listingType", "condition", "make", "model", "search", "categoryId"].forEach((k) => {
      if (searchParams.get(k)) init[k] = searchParams.get(k);
    });
    return init;
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showBusinessGate, setShowBusinessGate] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredPinId, setHoveredPinId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const hoveredListingId = hoveredCardId || hoveredPinId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sortBy, sortDir] = (filters.sort || "createdAt_desc").split("_");
        const [res, favRes] = await Promise.all([
          carsService.getListings({ ...filters, sortBy, sortDir }),
          token ? carsService.getFavorites(token).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
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

  // Map pins — same filters minus page/limit/sort, full result set (uncapped by pagination)
  useEffect(() => {
    const { page, limit, sort, ...mapFilters } = filters;
    carsService
      .getMapPins(mapFilters)
      .then((res) => setMapPins(res.pins || []))
      .catch((err) => {
        console.error(err);
        setMapPins([]);
      });
  }, [filters]);

  const handleFilter = (updatedFilters) => {
    setFilters({ ...updatedFilters, page: 1, limit: 12 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (n) => {
    setFilters((p) => ({ ...p, page: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublishClick = () => {
    if (!user) {
      document.getElementById("inline-register")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (user.role === "business") {
      router.push("/dashboard/listings/cars/create");
    } else if (user.role === "citizen") {
      router.push("/my-space/cars/create");
    } else {
      setShowBusinessGate(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* TOP BAR */}
      <StickyFilterBar>
        <CarFilter
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
        <div className="w-full flex gap-4">
          {/* Mobile drawer — CarFilter renders its own drawer via isMobile prop already,
              so no separate wrapper needed here unlike real-estate's version. */}

          {/* GRID + MAP */}
          <main className="flex-1 min-w-0">
            <SplitMapLayout
              map={
                <MultiPinMap
                  items={mapPins}
                  hoveredItemId={hoveredListingId}
                  focusItemId={hoveredCardId}
                  selectedItemId={selectedListingId}
                  onSelectItem={setSelectedListingId}
                  onHoverItem={setHoveredPinId}
                  getHref={(item) => `/cars/${item.id}`}
                />
              }
            >
              <>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2 px-5 md:px-6">
                  <p className="text-sm text-gray-500">
                    {pagination ? (
                      <>
                        <span className="font-semibold text-gray-800">{pagination.total}</span> annonces trouvées
                      </>
                    ) : (
                      <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
                    )}
                  </p>

                  <div className="flex items-center gap-3">
                    {!authLoading && (!user || user?.role === "business" || user?.role === "citizen") && (
                      <button
                        onClick={handlePublishClick}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-[#2D5016] text-white font-bold text-xs md:text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all"
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current shrink-0">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Publier
                      </button>
                    )}

                    <SortSelect
                      value={filters.sort || "createdAt_desc"}
                      onChange={(value) => {
                        setFilters((prev) => ({ ...prev, page: 1, sort: value }));
                      }}
                      options={[
                        { value: "createdAt_desc", label: "Plus récents" },
                        { value: "price_asc", label: "Prix croissant" },
                        { value: "price_desc", label: "Prix décroissant" },
                        { value: "year_desc", label: "Année décroissante" },
                        { value: "mileage_asc", label: "Km croissant" },
                      ]}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-6 gap-y-4 px-5 md:px-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
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
                    <div className="text-5xl mb-4">🚗</div>
                    <p className="text-lg font-semibold text-gray-700">Aucune annonce trouvée</p>
                    <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-6 gap-y-4 px-5 md:px-6">
                    {listings.map((l) => (
                      <div
                        key={l.id}
                        onMouseEnter={() => setHoveredCardId(l.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                      >
                        <CarCard listing={l} initialFavorited={favoritedIds.has(l.id)} />
                      </div>
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

      {showAlertModal && <AlertModal token={token} onClose={() => setShowAlertModal(false)} />}

      {showBusinessGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          style={{ animation: "fadeIn 0.15s ease-out" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBusinessGate(false); }}
        >
          <div style={{ animation: "slideUp 0.2s ease-out" }}>
            <BusinessAccountGate onClose={() => setShowBusinessGate(false)} />
          </div>
        </div>
      )}

      {!user && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inline-register" />
        </div>
      )}
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement des véhicules..." />}>
      <CarsPageContent />
    </Suspense>
  );
}