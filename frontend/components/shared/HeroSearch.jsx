'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, Tag } from 'lucide-react';
import { cities } from 'morocco-cities';
import { categoriesService } from '@/services/categoriesService';

// ── Region / city data ───────────────────────────────────────────────────────
const ALL_CITIES = cities.map((c) => ({ name: c.name, region: c.region_name }));
const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region))].sort();

const MODULES = [
  {
    label: 'Immobilier',
    value: 'immobilier',
    href: '/real-estate',
    extraField: {
      key: 'listingType',
      label: 'Type',
      options: [
        { value: 'SALE', label: 'Vente' },
        { value: 'RENT', label: 'Location' },
      ],
    },
  },
  {
    label: 'Emploi',
    value: 'emploi',
    href: '/jobs',
    extraField: {
      key: 'contractType',
      label: 'Contrat',
      options: [
        { value: 'CDI',           label: 'CDI' },
        { value: 'CDD',           label: 'CDD' },
        { value: 'STAGE',         label: 'Stage' },
        { value: 'FREELANCE',     label: 'Freelance' },
        { value: 'INTERIM',       label: 'Intérim' },
        { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
        { value: 'ALTERNANCE',    label: 'Alternance' },
      ],
    },
  },
  {
    label: 'Véhicules',
    value: 'automobile',
    href: '/cars',
    extraField: {
      key: 'listingType',
      label: 'Type',
      options: [
        { value: 'SALE', label: 'Vente' },
        { value: 'RENT', label: 'Location' },
      ],
    },
  },
  {
    label: 'Tourisme',
    value: 'tourisme',
    href: '/tourisme',
  },
  {
    label: 'Industrie',
    value: 'espaces-pro',
    href: '/industrie',
  },
];

function SelectDropdown({ label, icon: Icon, value, options, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  const filtered = query.length > 0
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : options.slice(0, 60);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const calculate = () => {
      const btn = btnRef.current.getBoundingClientRect();
      setPos({ top: btn.bottom + 6, left: btn.left });
    };
    calculate();
    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm w-full sm:w-40 transition-colors text-left
          ${disabled
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
      >
        {Icon && <Icon size={14} className="text-[var(--color-primary-sage)] flex-shrink-0" />}
        <span className="flex-1 truncate">{value || label}</span>
        <ChevronDown size={13} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: '230px',
              zIndex: 999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              <button
                type="button"
                onClick={() => { onSelect(null); setQuery(''); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
              >
                {label}
              </button>
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onSelect(opt); setQuery(''); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-[var(--color-primary-mint)] transition-colors"
                >
                  {opt}
                </button>
              ))}
              {filtered.length === 0 && query.length > 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Aucun résultat</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Simple select (short option lists) ──────────────────────────────────────
function SimpleSelect({ label, icon: Icon, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const calculate = () => {
      const btn = btnRef.current.getBoundingClientRect();
      setPos({ top: btn.bottom + 6, left: btn.left });
    };
    calculate();
    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm w-full sm:w-36 transition-colors text-left bg-gray-50 text-gray-700 hover:bg-gray-100"
      >
        {Icon && <Icon size={14} className="text-[var(--color-primary-sage)] flex-shrink-0" />}
        <span className="flex-1 truncate">{selected ? selected.label : label}</span>
        <ChevronDown size={13} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: '190px',
              zIndex: 999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
              >
                {label}
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors
                    ${value === opt.value
                      ? 'bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)] font-medium'
                      : 'text-gray-800 hover:bg-[var(--color-primary-mint)]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Category dropdown (API-driven) ───────────────────────────────────────────
function CategoryDropdown({ module, value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!module) { setCategories([]); onSelect(null); return; }
    categoriesService.getByModule(module)
      .then((res) => { if (res.success) setCategories(res.data); })
      .catch(() => {});
  }, [module]);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const calculate = () => {
      const btn = btnRef.current.getBoundingClientRect();
      setPos({ top: btn.bottom + 6, left: btn.left });
    };
    calculate();
    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const disabled = !module || categories.length === 0;
  const selected = categories.find((c) => c.id === value);

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm w-full sm:w-40 transition-colors text-left
          ${disabled
            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
      >
        <Tag size={14} className="text-[var(--color-primary-sage)] flex-shrink-0" />
        <span className="flex-1 truncate">{selected ? selected.name : 'Catégorie'}</span>
        <ChevronDown size={13} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: '210px',
              zIndex: 999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onSelect(null); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50"
              >
                Toutes catégories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { onSelect(cat); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors
                    ${value === cat.id
                      ? 'bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)] font-medium'
                      : 'text-gray-800 hover:bg-[var(--color-primary-mint)]'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Divider (desktop only) ───────────────────────────────────────────────────
function Divider() {
  return <div className="hidden sm:block w-px bg-gray-200 self-stretch my-1.5 flex-shrink-0" />;
}

// ── Main exported component ──────────────────────────────────────────────────
export default function HeroSearch() {
  const router = useRouter();

  const [activeModule, setActiveModule] = useState(MODULES[0]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [extraValue, setExtraValue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const citiesInRegion = selectedRegion
    ? ALL_CITIES.filter((c) => c.region === selectedRegion).map((c) => c.name).sort()
    : ALL_CITIES.map((c) => c.name).sort();

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setSelectedCity(null);
  };

  const handleModuleSwitch = (mod) => {
    setActiveModule(mod);
    setSelectedCategory(null);
    setExtraValue(null);
  };

    const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedRegion)                        params.set('region', selectedRegion);
    if (selectedCity)                          params.set('city', selectedCity);
    if (selectedCategory) {
      params.set('categoryId', selectedCategory.id);
      params.set('categorySlug', selectedCategory.slug);
      params.set('category', selectedCategory.name);
    }
    if (extraValue && activeModule.extraField)  params.set(activeModule.extraField.key, extraValue);
    if (searchQuery.trim())                    params.set('search', searchQuery.trim());
    router.push(`${activeModule.href}?${params.toString()}`);
  };

  const quickTags = [
    { label: 'Appartement à Casablanca', module: 'immobilier', city: 'Casablanca' },
    { label: 'Emploi à Rabat',           module: 'emploi',     city: 'Rabat' },
    { label: 'Voiture à Casablanca',     module: 'automobile', city: 'Casablanca' },
    { label: 'Villa à Marrakech',        module: 'immobilier', city: 'Marrakech' },
  ];

  const handleQuickTag = (tag) => {
    const mod = MODULES.find((m) => m.value === tag.module) || MODULES[0];
    setActiveModule(mod);
    setSelectedRegion(null);
    setSelectedCity(tag.city);
    setSelectedCategory(null);
    setExtraValue(null);
    setSearchQuery('');
  };

  return (
    <div>
      {/* Module tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {MODULES.map((mod) => (
          <button
            key={mod.value}
            type="button"
            onClick={() => handleModuleSwitch(mod)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
              ${activeModule.value === mod.value
                ? 'bg-white text-[var(--color-primary-dark)] shadow'
                : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
              }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-4xl bg-white rounded-2xl p-2 shadow-xl">

        {/* Desktop/tablet: wrapping row */}
        <div className="hidden sm:flex items-center gap-0.5 flex-wrap">
          <SelectDropdown
            label="Région"
            icon={MapPin}
            value={selectedRegion}
            options={REGIONS}
            onSelect={handleRegionSelect}
          />
          <Divider />
          <SelectDropdown
            label="Ville"
            icon={MapPin}
            value={selectedCity}
            options={citiesInRegion}
            onSelect={setSelectedCity}
          />
          <Divider />
          <CategoryDropdown
            module={activeModule.value}
            value={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />
          {activeModule.extraField && (
            <>
              <Divider />
              <SimpleSelect
                label={activeModule.extraField.label}
                value={extraValue}
                options={activeModule.extraField.options}
                onSelect={setExtraValue}
              />
            </>
          )}
          <Divider />
          <input
            type="text"
            placeholder="Mot-clé, titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
          />
          <button
            type="submit"
            className="flex-none bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-sage)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ml-1 whitespace-nowrap"
          >
            <Search size={15} />
            Rechercher
          </button>
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col gap-2 sm:hidden">
          <SelectDropdown
            label="Région"
            icon={MapPin}
            value={selectedRegion}
            options={REGIONS}
            onSelect={handleRegionSelect}
          />
          <SelectDropdown
            label="Ville"
            icon={MapPin}
            value={selectedCity}
            options={citiesInRegion}
            onSelect={setSelectedCity}
          />
          <CategoryDropdown
            module={activeModule.value}
            value={selectedCategory?.id}
            onSelect={setSelectedCategory}
          />
          {activeModule.extraField && (
            <SimpleSelect
              label={activeModule.extraField.label}
              value={extraValue}
              options={activeModule.extraField.options}
              onSelect={setExtraValue}
            />
          )}
          <input
            type="text"
            placeholder="Mot-clé, titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 rounded-xl outline-none placeholder-gray-400 border border-gray-200"
          />
          <button
            type="submit"
            className="w-full bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-sage)] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Search size={15} />
            Rechercher
          </button>
        </div>
      </form>

      {/* Quick tags */}
      <div className="flex flex-wrap gap-2 mt-5">
        {quickTags.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleQuickTag(tag)}
            className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors text-white"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}