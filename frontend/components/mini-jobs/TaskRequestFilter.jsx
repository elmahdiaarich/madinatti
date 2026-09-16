'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cities } from 'morocco-cities';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { OptionRow } from '@/components/shared/FilterDropdown';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr'));

const EMPTY = { categorySlug: '', region: '', city: '', minBudget: '', maxBudget: '' };

export default function TaskRequestFilter({ onFilter }) {
  const [open,           setOpen]           = useState(false);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [categories,     setCategories]     = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [filters,        setFilters]        = useState(EMPTY);
  const filtersRef = useRef(filters);
  const didMount   = useRef(false);

  useEffect(() => { filtersRef.current = filters; }, [filters]);

  useEffect(() => {
    fetch(`${API_URL}/categories?module=mini-jobs`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  // Debounce budget inputs
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const t = setTimeout(() => emitClean(filtersRef.current), 500);
    return () => clearTimeout(t);
  }, [filters.minBudget, filters.maxBudget]); // eslint-disable-line

  const emitClean = (obj) => {
    const clean = {};
    Object.entries(obj).forEach(([k, v]) => { if (v) clean[k] = v; });
    onFilter(clean);
  };

  const update = (key, value, opts = {}) => {
    const next = { ...filtersRef.current, [key]: value };
    if (key === 'region') next.city = '';
    filtersRef.current = next;
    setFilters(next);
    if (opts.immediate) emitClean(next);
  };

  const handleReset = () => {
    filtersRef.current = EMPTY;
    setFilters(EMPTY);
    setCategorySearch('');
    setOpen(false);
    onFilter({});
  };

  const citiesInRegion = filters.region
    ? [...(citiesByRegion[filters.region] || [])].sort((a, b) => a.localeCompare(b, 'fr'))
    : [];

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.trim().toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const anyActive = Object.values(filters).some((v) => v !== '');

  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Catégorie</p>
        {categories.length > 8 && (
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full border border-gray-100 bg-gray-50 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-gray-300"
            />
          </div>
        )}
        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
          {filteredCategories.map((c) => (
            <OptionRow
              key={c.slug}
              label={c.name}
              isChecked={filters.categorySlug === c.slug}
              onClick={() => update('categorySlug', filters.categorySlug === c.slug ? '' : c.slug, { immediate: true })}
            />
          ))}
          {filteredCategories.length === 0 && (
            <p className="text-xs text-gray-400 py-1">Aucune catégorie trouvée</p>
          )}
        </div>
      </div>

      {/* Region */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Région</p>
        <select
          value={filters.region}
          onChange={(e) => update('region', e.target.value, { immediate: true })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
        >
          <option value="">Toutes les régions</option>
          {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* City */}
      {filters.region && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Ville</p>
          <select
            value={filters.city}
            onChange={(e) => update('city', e.target.value, { immediate: true })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-gray-400"
          >
            <option value="">Toutes les villes</option>
            {citiesInRegion.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Budget range */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Budget (MAD)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.minBudget}
            onChange={(e) => update('minBudget', e.target.value)}
            placeholder="Min"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <input
            type="number"
            value={filters.maxBudget}
            onChange={(e) => update('maxBudget', e.target.value)}
            placeholder="Max"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">

      {/* ══ DESKTOP button ══ */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
            anyActive
              ? 'border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800'
          }`}
        >
          <SlidersHorizontal size={15} className="shrink-0" />
          <span className="hidden lg:inline">Filtrer les demandes</span>
          {anyActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />
          )}
        </button>

        {open && <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />}

        {open && (
          <div className="absolute left-0 top-[calc(100%+6px)] w-80 max-h-[75vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl z-[100] p-4">
            <FiltersPanel />
            {anyActive && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ MOBILE button ══ */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
            anyActive ? 'border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]' : 'border-gray-300 bg-gray-50 text-gray-600'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtres
          {anyActive && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />}
        </button>

        {drawerOpen && (
          <div className="fixed inset-0 z-[200]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <span className="font-bold text-gray-800 text-sm">Filtrer les demandes</span>
                <button type="button" onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4"><FiltersPanel /></div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                {anyActive && (
                  <button type="button" onClick={() => { handleReset(); setDrawerOpen(false); }}
                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                    Réinitialiser
                  </button>
                )}
                <button type="button" onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition">
                  Voir les résultats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}