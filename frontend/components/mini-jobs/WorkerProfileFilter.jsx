// frontend\components\mini-jobs\WorkerProfileFilter.jsx
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cities } from 'morocco-cities';
import { SlidersHorizontal, X, Search, Star, ChevronDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr'));

const RATING_OPTIONS = [
  { value: '', label: 'Toutes les notes' },
  { value: '4', label: '4.0 et plus' },
  { value: '4.5', label: '4.5 et plus' },
];

const CATEGORY_COLLAPSED_COUNT = 8;

function FilterSection({ title, summary, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-semibold text-gray-500">{title}</span>
        <span className="flex items-center gap-1.5">
          {!open && summary && (
            <span className="text-xs font-semibold text-primary-sage">{summary}</span>
          )}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function WorkerProfileFilter({ onFilter }) {
  const [categories, setCategories] = useState([]);
  const [categorySlug, setCategorySlug] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minRating, setMinRating] = useState('');

  const didMount = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/categories?module=mini-jobs`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const citiesInRegion = region
    ? [...(citiesByRegion[region] || [])].sort((a, b) => a.localeCompare(b, 'fr'))
    : [];

  const emit = (overrides = {}) => {
    const filters = { categorySlug, region, city, minRate, maxRate, minRating, ...overrides };
    const cleaned = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) cleaned[k] = v; });
    onFilter(cleaned);
  };

  // Price and rate are free-typed, so auto-apply after a short pause instead
  // of requiring an explicit "Appliquer" click — matches the instant-apply
  // behavior of category/region/rating.
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const t = setTimeout(() => emit(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRate, maxRate]);

  const handleCategory = (slug) => {
    const next = categorySlug === slug ? '' : slug;
    setCategorySlug(next);
    emit({ categorySlug: next });
  };

  const handleRegion = (r) => {
    setRegion(r); setCity('');
    emit({ region: r, city: '' });
  };

  const handleCity = (c) => {
    setCity(c);
    emit({ city: c });
  };

  const handleRating = (v) => {
    setMinRating(v);
    emit({ minRating: v });
  };

  const handleReset = () => {
    setCategorySlug(''); setCategorySearch(''); setRegion(''); setCity('');
    setMinRate(''); setMaxRate(''); setMinRating('');
    onFilter({});
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.trim().toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const visibleCategories = categoryExpanded
    ? filteredCategories
    : filteredCategories.slice(0, CATEGORY_COLLAPSED_COUNT);

  const selectedCategoryName = categories.find((c) => c.slug === categorySlug)?.name;

  const activeChips = [
    selectedCategoryName ? { key: 'category', label: selectedCategoryName, clear: () => handleCategory(categorySlug) } : null,
    city ? { key: 'city', label: city, clear: () => handleCity('') } : null,
    !city && region ? { key: 'region', label: region, clear: () => handleRegion('') } : null,
    (minRate || maxRate) ? {
      key: 'price',
      label: `${minRate || '0'} – ${maxRate || '∞'} MAD`,
      clear: () => { setMinRate(''); setMaxRate(''); emit({ minRate: '', maxRate: '' }); },
    } : null,
    minRating ? { key: 'rating', label: `Note ${minRating}+`, clear: () => handleRating('') } : null,
  ].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-primary-dark px-4 py-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-white font-semibold text-sm">
          <SlidersHorizontal size={14} />
          Filtrer les prestataires
          {activeChips.length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-dark text-[10px] font-bold">
              {activeChips.length}
            </span>
          )}
        </span>
        {activeChips.length > 0 && (
          <button onClick={handleReset} className="text-white/70 hover:text-white text-xs underline">
            Réinitialiser
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {activeChips.map((chip) => (
            <span key={chip.key}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-primary-mint text-primary-dark text-xs font-semibold">
              {chip.label}
              <button onClick={chip.clear} aria-label="Retirer ce filtre" className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="px-4">
        <FilterSection title="Catégorie" defaultOpen>
          {categories.length > CATEGORY_COLLAPSED_COUNT && (
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Rechercher une catégorie"
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          )}

          <div
            className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {visibleCategories.map((c) => (
              <button key={c.slug} onClick={() => handleCategory(c.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                  ${categorySlug === c.slug
                    ? 'border-primary bg-primary text-primary-dark'
                    : 'border-gray-200 text-gray-600 hover:border-primary/50'}`}>
                {c.name}
              </button>
            ))}
            {filteredCategories.length === 0 && (
              <p className="text-xs text-gray-400 py-1">Aucune catégorie trouvée</p>
            )}
          </div>

          {filteredCategories.length > CATEGORY_COLLAPSED_COUNT && (
            <button
              onClick={() => setCategoryExpanded((v) => !v)}
              className="mt-2 text-xs font-semibold text-primary-sage hover:text-primary-dark"
            >
              {categoryExpanded ? 'Voir moins' : `Voir les ${filteredCategories.length - CATEGORY_COLLAPSED_COUNT} autres`}
            </button>
          )}
        </FilterSection>

        <FilterSection title="Région, ville" summary={city || region}>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Région</p>
          <select value={region} onChange={(e) => handleRegion(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary">
            <option value="">Toutes les régions</option>
            {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          {region && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Ville</p>
              <select value={city} onChange={(e) => handleCity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-primary">
                <option value="">Toutes les villes</option>
                {citiesInRegion.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </FilterSection>

        <FilterSection title="Note minimum" summary={minRating ? `${minRating}+` : ''}>
          <div className="flex flex-col gap-1">
            {RATING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-0.5">
                <input
                  type="radio"
                  name="minRating"
                  checked={minRating === opt.value}
                  onChange={() => handleRating(opt.value)}
                  className="accent-primary-dark w-3.5 h-3.5"
                />
                {opt.value && <Star size={13} className="fill-primary text-primary -ml-0.5" />}
                {opt.label}
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Tarif (MAD)" summary={(minRate || maxRate) ? `${minRate || '0'} – ${maxRate || '∞'}` : ''}>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={minRate} onChange={(e) => setMinRate(e.target.value)}
              placeholder="Min" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
            <input type="number" value={maxRate} onChange={(e) => setMaxRate(e.target.value)}
              placeholder="Max" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Les résultats se mettent à jour automatiquement.</p>
        </FilterSection>
      </div>
    </div>
  );
}