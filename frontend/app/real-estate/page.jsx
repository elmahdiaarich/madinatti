'use client';

import { useEffect, useState } from 'react';
import { realEstateService } from '@/services/realEstateService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import RealEstateCard from '@/components/real-estate/RealEstateCard';
import RealEstateFilter from '@/components/real-estate/RealEstateFilter';
import { cities } from 'morocco-cities';

const CATEGORIES = [
  { label: 'Tous',     listingType: null   },
  { label: 'Vente',    listingType: 'SALE' },
  { label: 'Location', listingType: 'RENT' },
];

const PROPERTY_TABS = [
  { label: 'Tous',         value: null        },
  { label: 'Appartements', value: 'APARTMENT' },
  { label: 'Villas',       value: 'VILLA'     },
  { label: 'Maisons',      value: 'HOUSE'     },
  { label: 'Studios',      value: 'STUDIO'    },
  { label: 'Terrains',     value: 'LAND'      },
  { label: 'Bureaux',      value: 'OFFICE'    },
];

// ─── Villes par région (morocco-cities) — used by the alert modal ────────────
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

const LISTING_TYPES = [
  { value: 'SALE', label: 'Vente' },
  { value: 'RENT', label: 'Location' },
];

// ─── ALERT MODAL COMPONENT (mirrors jobs/page.jsx pattern) ───────────────────
function AlertModal({ token, onClose }) {
  const [form, setForm] = useState({
    listingType: '',
    categoryId:  '',
    region:      '',
    city:        '',
    minPrice:    '',
    maxPrice:    '',
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  // Fetch real estate categories (already filtered to module: 'immobilier' server-side)
  useEffect(() => {
    realEstateService.getCategories()
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const handleRegionChange = (region) => {
    setForm((f) => ({ ...f, region, city: '' }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const filters = {
        ...(form.listingType && { listingType: form.listingType }),
        ...(form.categoryId  && { categoryId:  form.categoryId }),
        ...(form.region      && { region:      form.region }),
        ...(form.city        && { city:        form.city }),
        ...(form.minPrice    && { minPrice:    form.minPrice }),
        ...(form.maxPrice    && { maxPrice:    form.maxPrice }),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ module: 'immobilier', filters }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erreur'); return; }
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🔔 Créer une alerte</h2>
            <p className="text-xs text-gray-400 mt-0.5">Soyez notifié dès qu'une annonce correspond</p>
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

              {/* Listing type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type d'annonce</label>
                <select
                  value={form.listingType}
                  onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Tous types</option>
                  {LISTING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Category (type de bien) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type de bien</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Tous les types de bien</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Region (morocco-cities) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Région</label>
                <select
                  value={form.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* City — only shown if region selected and has cities */}
              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                  >
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price range */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix (MAD)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={form.minPrice}
                    onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={form.maxPrice}
                    onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
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
                {saving ? 'Enregistrement...' : "Créer l'alerte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RealEstatePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [listings, setListings]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ page: 1, limit: 12 });
  const [activeType, setActiveType] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      console.log(user);
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

  const handleTypeTab = (cat) => {
    setActiveType(cat.listingType);
    setActiveProp(null);
    setFilters({ page: 1, limit: 12, ...(cat.listingType && { listingType: cat.listingType }) });
  };

  const handlePropTab = (prop) => {
    setActiveProp(prop.value);
    setFilters((p) => ({
      ...p, page: 1,
      ...(prop.value ? { propertyType: prop.value } : { propertyType: undefined }),
    }));
  };

  const handlePageChange = (n) => {
    setFilters((p) => ({ ...p, page: n }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishClick = () => {
    if (user.role === 'business') {
      router.push('/dashboard/listings/real-estate/create');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TYPE TABS */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 pt-2.5 pb-0 flex flex-col gap-0">
          <div className="flex gap-1.5 flex-wrap pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleTypeTab(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeType === cat.listingType
                  ? 'bg-[#2D5016] text-white shadow-sm'
                  : 'bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          {user?.role == "business" && (
            <button
              onClick={handlePublishClick}
              className="ml-auto inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-150 hover:scale-105 active:scale-100 group shrink-0 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Publier une annonce
            </button>
          )}
          {user?.role === 'citizen' && (
            <button
              onClick={() => setShowAlertModal(true)}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150 shrink-0"
            >
              🔔 Créer une alerte
            </button>
          )}
          </div>
          <div className="flex gap-1 flex-wrap pb-2.5">
            {PROPERTY_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => handlePropTab(tab)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                  activeProp === tab.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6">

        {/* SIDEBAR */}
        <aside className="w-[260px] shrink-0">
          <div className="sticky top-[88px] overflow-y-auto max-h-[calc(100vh-88px)]">
            <RealEstateFilter onFilter={handleFilter} />
          </div>
        </aside>

        {/* GRID */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {pagination
                ? <><span className="font-semibold text-gray-800">{pagination.total}</span> annonces trouvées</>
                : <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              }
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-[220px] bg-gray-100" />
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
              <p className="text-lg font-semibold text-gray-700">Aucune annonce trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((l) => (
                <RealEstateCard
                  key={l.id}
                  listing={l}
                  initialFavorited={favoritedIds.has(l.id)}
                />
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
              >‹</button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? 'bg-primary-dark text-white shadow-sm'
                      : 'bg-white text-primary-dark border border-gray-200 hover:border-primary-dark hover:bg-orange-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >›</button>
            </div>
          )}
        </main>
      </div>

      {/* ALERT MODAL */}
      {showAlertModal && (
        <AlertModal
          token={token}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
}