"use client";

import { useEffect, useState, Suspense } from "react";
import { carsService } from "@/services/carsService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CarCard   from "@/components/cars/CarCard";
import CarFilter from "@/components/cars/CarFilter";
import BusinessAccountGate from "@/components/shared/BusinessAccountGate";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";
import { cities } from "morocco-cities";

const LISTING_TYPE_TABS = [
  { label: "Tous",     value: null },
  { label: "Vente",    value: "SALE" },
  { label: "Location", value: "RENT" },
];

const CONDITION_TABS = [
  { label: "Tous",      value: null },
  { label: "Neuf",      value: "NEW" },
  { label: "Occasion",  value: "USED" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { value: "PETROL",    label: "Essence" },
  { value: "DIESEL",    label: "Diesel" },
  { value: "ELECTRIC",  label: "Électrique" },
  { value: "HYBRID",    label: "Hybride" },
  { value: "LPG",       label: "GPL" },
];

const TRANSMISSIONS = [
  { value: "MANUAL",         label: "Manuelle" },
  { value: "AUTOMATIC",      label: "Automatique" },
  { value: "SEMI_AUTOMATIC", label: "Semi-auto" },
];

const BODY_TYPES = [
  { value: "SEDAN",       label: "Berline" },
  { value: "SUV",         label: "SUV" },
  { value: "HATCHBACK",   label: "Citadine" },
  { value: "COUPE",       label: "Coupé" },
  { value: "CONVERTIBLE", label: "Cabriolet" },
  { value: "WAGON",       label: "Break" },
  { value: "VAN",         label: "Van" },
  { value: "PICKUP",      label: "Pickup" },
  { value: "MINIVAN",     label: "Minivan" },
];

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Plus récents" },
  { value: "price_asc",      label: "Prix croissant" },
  { value: "price_desc",     label: "Prix décroissant" },
  { value: "year_desc",      label: "Année décroissante" },
  { value: "mileage_asc",    label: "Km croissant" },
];

const FUEL_LABELS  = { PETROL: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride", LPG: "GPL" };
const TRANS_LABELS = { MANUAL: "Manuelle", AUTOMATIC: "Automatique", SEMI_AUTOMATIC: "Semi-auto" };
const COND_LABELS  = { NEW: "Neuf", USED: "Occasion", DAMAGED: "Accidenté" };

const citiesByRegion = cities.reduce((acc, c) => {
  if (!acc[c.region_name]) acc[c.region_name] = [];
  acc[c.region_name].push(c.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");

// ── Car Card ──────────────────────────────────────────────────────────────────

// function CarCard({ listing, initialFavorited }) {
//   const { user } = useAuth();
//   const [favorited, setFavorited] = useState(initialFavorited);
//   const [favLoading, setFavLoading] = useState(false);

//   const cover = Array.isArray(listing.images)
//     ? listing.images.find((i) => i.isCover)?.url ?? listing.images[0]?.url
//     : null;

//   const handleFav = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!user || favLoading) return;
//     const prev = favorited;
//     setFavorited(!prev);
//     setFavLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       await carsService.toggleFavorite(listing.id, token);
//     } catch {
//       setFavorited(prev);
//     } finally {
//       setFavLoading(false);
//     }
//   };

//   return (
//     <Link href={`/cars/${listing.id}`} className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
//       <div className="relative h-[200px] bg-gray-100 overflow-hidden">
//         {cover ? (
//           <img src={cover} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
//         ) : (
//           <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">🚗</div>
//         )}
//         <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
//           <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${listing.listingType === "SALE" ? "bg-[#2D5016] text-white" : "bg-[#A7D129] text-[#2D5016]"}`}>
//             {listing.listingType === "SALE" ? "Vente" : "Location"}
//           </span>
//           {listing.condition && (
//             <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-gray-700">
//               {COND_LABELS[listing.condition]}
//             </span>
//           )}
//         </div>
//         {listing.isFeatured && (
//           <span className="absolute top-3 right-10 px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-400 text-yellow-900">À la une</span>
//         )}
//         {user && (
//           <button onClick={handleFav}
//             className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
//               favorited ? "bg-[#A7D129] text-[#2D5016]" : "bg-white/80 text-gray-400 hover:bg-[#E8F5D0] hover:text-[#2D5016]"
//             }`}
//           >
//             <svg viewBox="0 0 24 24" className="w-4 h-4" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
//             </svg>
//           </button>
//         )}
//       </div>

//       <div className="p-4">
//         <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 mb-1 group-hover:text-[#2D5016] transition-colors">
//           {listing.make} {listing.model} {listing.year}
//         </p>
//         <p className="text-xs text-gray-500 line-clamp-1 mb-3">{listing.title}</p>

//         <div className="flex flex-wrap gap-1.5 mb-3">
//           {listing.fuelType && (
//             <span className="px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-[11px] font-medium">
//               {FUEL_LABELS[listing.fuelType] ?? listing.fuelType}
//             </span>
//           )}
//           {listing.transmission && (
//             <span className="px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-[11px] font-medium">
//               {TRANS_LABELS[listing.transmission] ?? listing.transmission}
//             </span>
//           )}
//           {listing.mileage != null && (
//             <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
//               {listing.mileage.toLocaleString("fr-MA")} km
//             </span>
//           )}
//         </div>

//         <div className="flex items-center justify-between">
//           <p className="text-lg font-extrabold text-[#2D5016]">
//             {fmtPrice(listing.price)} MAD
//             {listing.listingType === "RENT" && <span className="text-xs font-normal text-gray-400">/j</span>}
//           </p>
//           {listing.isNegotiable && (
//             <span className="text-[10px] text-[#7BA428] font-semibold border border-[#A7D129] rounded-full px-2 py-0.5">Négociable</span>
//           )}
//         </div>
//         {listing.city && (
//           <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
//             <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//             </svg>
//             {listing.city}
//           </p>
//         )}
//       </div>
//     </Link>
//   );
// }

// ── Sidebar Filter ─────────────────────────────────────────────────────────────

// function CarFilter({ onFilter }) {
//   const [form, setForm] = useState({
//     make: "", model: "", minYear: "", maxYear: "",
//     minPrice: "", maxPrice: "", maxMileage: "",
//     fuelType: "", transmission: "", bodyType: "",
//     region: "", city: "",
//   });

//   const citiesInRegion = form.region ? [...(citiesByRegion[form.region] || [])].sort() : [];

//   const apply = () => {
//     const f = {};
//     Object.entries(form).forEach(([k, v]) => { if (v) f[k] = v; });
//     onFilter(f);
//   };

//   const reset = () => {
//     setForm({ make: "", model: "", minYear: "", maxYear: "", minPrice: "", maxPrice: "", maxMileage: "", fuelType: "", transmission: "", bodyType: "", region: "", city: "" });
//     onFilter({});
//   };

//   const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white";
//   const lbl = "text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block";

//   return (
//     <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
//       <p className="font-bold text-gray-800 text-sm">Filtres</p>

//       <div>
//         <label className={lbl}>Marque</label>
//         <input value={form.make} onChange={(e) => setForm((p) => ({ ...p, make: e.target.value }))} placeholder="Ex: Toyota" className={inp} />
//       </div>
//       <div>
//         <label className={lbl}>Modèle</label>
//         <input value={form.model} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} placeholder="Ex: Corolla" className={inp} />
//       </div>

//       <div>
//         <label className={lbl}>Année</label>
//         <div className="flex gap-2">
//           <input type="number" value={form.minYear} onChange={(e) => setForm((p) => ({ ...p, minYear: e.target.value }))} placeholder="De" className={inp} />
//           <input type="number" value={form.maxYear} onChange={(e) => setForm((p) => ({ ...p, maxYear: e.target.value }))} placeholder="À" className={inp} />
//         </div>
//       </div>

//       <div>
//         <label className={lbl}>Prix (MAD)</label>
//         <div className="flex gap-2">
//           <input type="number" value={form.minPrice} onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))} placeholder="Min" className={inp} />
//           <input type="number" value={form.maxPrice} onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))} placeholder="Max" className={inp} />
//         </div>
//       </div>

//       <div>
//         <label className={lbl}>Kilométrage max</label>
//         <input type="number" value={form.maxMileage} onChange={(e) => setForm((p) => ({ ...p, maxMileage: e.target.value }))} placeholder="Ex: 100000" className={inp} />
//       </div>

//       <div>
//         <label className={lbl}>Carburant</label>
//         <select value={form.fuelType} onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value }))} className={inp}>
//           <option value="">Tous</option>
//           {FUEL_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Boîte de vitesse</label>
//         <select value={form.transmission} onChange={(e) => setForm((p) => ({ ...p, transmission: e.target.value }))} className={inp}>
//           <option value="">Toutes</option>
//           {TRANSMISSIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Carrosserie</label>
//         <select value={form.bodyType} onChange={(e) => setForm((p) => ({ ...p, bodyType: e.target.value }))} className={inp}>
//           <option value="">Toutes</option>
//           {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className={lbl}>Région</label>
//         <select value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value, city: "" }))} className={inp}>
//           <option value="">Toutes</option>
//           {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
//         </select>
//       </div>

//       {form.region && citiesInRegion.length > 0 && (
//         <div>
//           <label className={lbl}>Ville</label>
//           <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inp}>
//             <option value="">Toutes</option>
//             {citiesInRegion.map((c) => <option key={c} value={c}>{c}</option>)}
//           </select>
//         </div>
//       )}

//       <button onClick={apply} className="w-full py-2.5 bg-[#2D5016] text-white font-bold rounded-xl text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition">
//         Appliquer
//       </button>
//       <button onClick={reset} className="w-full py-2 border border-gray-200 text-gray-500 font-semibold rounded-xl text-sm hover:bg-gray-50 transition">
//         Réinitialiser
//       </button>
//     </div>
//   );
// }

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    carsService
      .getCategories()
      .then((d) => {
        setCategories(d.data || []);
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
        ...(form.make && { make: form.make.trim() }),
        ...(form.model && { model: form.model.trim() }),
        ...(form.condition && { condition: form.condition }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              🔔 Créer une alerte
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Soyez notifié dès qu'un véhicule correspond
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
                  className={inputStyle}
                >
                  <option value="">Tous types</option>
                  <option value="SALE">Vente</option>
                  <option value="RENT">Location</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Catégorie de véhicule
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  className={inputStyle}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Marque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Toyota"
                    value={form.make}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, make: e.target.value }))
                    }
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Modèle
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Corolla"
                    value={form.model}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  État du véhicule
                </label>
                <select
                  value={form.condition}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, condition: e.target.value }))
                  }
                  className={inputStyle}
                >
                  <option value="">Tous états</option>
                  <option value="NEW">Neuf</option>
                  <option value="USED">Occasion</option>
                  <option value="DAMAGED">Accidenté</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Région
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className={inputStyle}
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
                    className={inputStyle}
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
                    className={inputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={form.maxPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                    className={inputStyle}
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

// ── Main Page Content ─────────────────────────────────────────────────────────
function CarsPageContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 12 };
    ["region", "city", "listingType", "condition", "make", "model", "search", "categoryId"].forEach((k) => {
      if (searchParams.get(k)) init[k] = searchParams.get(k);
    });
    return init;
  });

  const [listings, setListings]         = useState([]);
  const [pagination, setPagination]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [activeType, setActiveType]     = useState(null);
  const [activeCond, setActiveCond]     = useState(null);
  const [sort, setSort]                 = useState("createdAt_desc");
  const [showBusinessGate, setShowBusinessGate] = useState(false);
  const [showAlertModal, setShowAlertModal]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sortBy, sortDir] = sort.split("_");
        const [res, favRes] = await Promise.all([
          carsService.getListings({ ...filters, sortBy, sortDir }),
          token
            ? carsService.getFavorites(token).catch(() => ({ data: [] }))
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
  }, [filters, token, sort]);

  const handleFilter = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({ page: 1, limit: 12 });
      return;
    }
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters, page: 1 };
      Object.keys(merged).forEach((k) => { if (merged[k] === undefined) delete merged[k]; });
      return merged;
    });
  };

  const handleTypeTab = (value) => {
    setActiveType(value);
    setFilters({ page: 1, limit: 12, ...(value && { listingType: value }) });
  };

  const handleCondTab = (value) => {
    setActiveCond(value);
    setFilters((p) => ({ ...p, page: 1, ...(value ? { condition: value } : { condition: undefined }) }));
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
      router.push("/dashboard/listings/cars/create");
    } else {
      setShowBusinessGate(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TOP NAV BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 pt-2.5 pb-0 flex flex-col gap-0">

          {/* Row 1: listing type tabs */}
          <div className="flex gap-1.5 flex-wrap pb-2">
            {LISTING_TYPE_TABS.map((t) => (
              <button key={t.label} onClick={() => handleTypeTab(t.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeType === t.value
                    ? "bg-[#2D5016] text-white shadow-sm"
                    : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Row 2: condition tabs + sort + publish */}
          <div className="flex items-center justify-between pb-2.5 gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {CONDITION_TABS.map((t) => (
                <button key={t.label} onClick={() => handleCondTab(t.value)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeCond === t.value
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-[#A7D129] bg-white"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {user?.role === "citizen" && (
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150"
                >
                  🔔 Créer une alerte
                </button>
              )}

              {(user?.role === "business" || user?.role === "citizen" || !user) && (
                <button onClick={handlePublishClick}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition hover:scale-105 active:scale-100"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  Publier une annonce
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex gap-6">
        {/* SIDEBAR */}
        <aside className="w-[260px] shrink-0 hidden lg:block">
          <div className="sticky top-[88px] overflow-y-auto max-h-[calc(100vh-88px)]">
            <CarFilter onFilter={handleFilter} />
          </div>
        </aside>

        {/* GRID */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {pagination ? (
                <><span className="font-semibold text-gray-800">{pagination.total}</span> annonces trouvées</>
              ) : (
                <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              )}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-[200px] bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/3" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <CarCard key={l.id} listing={l} initialFavorited={favoritedIds.has(l.id)} />
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >‹</button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i} onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? "bg-[#2D5016] text-white shadow-sm"
                      : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129]"
                  }`}
                >{i + 1}</button>
              ))}
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >›</button>
            </div>
          )}
        </main>
      </div>

      {showBusinessGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBusinessGate(false); }}
        >
          <BusinessAccountGate onClose={() => setShowBusinessGate(false)} />
        </div>
      )}

      {showAlertModal && (
        <AlertModal token={token} onClose={() => setShowAlertModal(false)} />
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

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement des véhicules..." />}>
      <CarsPageContent />
    </Suspense>
  );
}