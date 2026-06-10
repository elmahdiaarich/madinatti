'use client';

import { useEffect, useState } from 'react';
import { realEstateService } from '@/services/realEstateService';
import { useAuth } from '@/context/AuthContext';
import RealEstateCard from '@/components/real-estate/RealEstateCard';
import RealEstateFilter from '@/components/real-estate/RealEstateFilter';

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

export default function RealEstatePage() {
  const { user, token } = useAuth();

  const [listings, setListings]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({ page: 1, limit: 12 });
  const [activeType, setActiveType] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [favoritedIds, setFavoritedIds] = useState(new Set());

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

  const handleSearch = () => setFilters((p) => ({ ...p, search: searchInput, page: 1 }));

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-primary-dark mb-2">
            Immobilier au Maroc
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {pagination ? `${pagination.total} annonces disponibles` : 'Chargement...'}
          </p>
          <div className="flex items-center max-w-2xl mx-auto border-2 border-black rounded-full px-4 py-2.5 bg-white shadow-sm">
            <svg className="w-4 h-4 text-gray-400 shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Ville, quartier, type de bien..."
              value={searchInput}
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="ml-2 px-4 py-1.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-sage transition"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
