'use client';

import { useState, useEffect, useMemo } from 'react';
import { cities } from 'morocco-cities';
import { carsService } from '@/services/carsService';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr'));

const LISTING_TYPES = [
  { value: 'SALE', label: 'Vente' },
  { value: 'RENT', label: 'Location' },
];

const CONDITIONS = [
  { value: 'NEW',     label: 'Neuf' },
  { value: 'USED',    label: 'Occasion' },
  { value: 'DAMAGED', label: 'Accidenté' },
];

const FUEL_TYPES = [
  { value: 'PETROL',   label: 'Essence' },
  { value: 'DIESEL',   label: 'Diesel' },
  { value: 'ELECTRIC', label: 'Électrique' },
  { value: 'HYBRID',   label: 'Hybride' },
  { value: 'LPG',      label: 'GPL' },
];

const TRANSMISSIONS = [
  { value: 'MANUAL',         label: 'Manuelle' },
  { value: 'AUTOMATIC',      label: 'Automatique' },
  { value: 'SEMI_AUTOMATIC', label: 'Semi-auto' },
];

const BODY_TYPES = [
  { value: 'SEDAN',       label: 'Berline' },
  { value: 'SUV',         label: 'SUV' },
  { value: 'HATCHBACK',   label: 'Citadine' },
  { value: 'COUPE',       label: 'Coupé' },
  { value: 'CONVERTIBLE', label: 'Cabriolet' },
  { value: 'WAGON',       label: 'Break' },
  { value: 'VAN',         label: 'Van' },
  { value: 'PICKUP',      label: 'Pickup' },
  { value: 'MINIVAN',     label: 'Minivan' },
];

// ── Sub-components (same pattern as RealEstateFilter) ─────────────────────────

function FilterSkeleton() {
  return (
    <div className="px-4 pb-3 space-y-1.5 animate-pulse">
      {[80, 60, 70, 50, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 shrink-0" />
          <div className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function FilterOption({ label, isChecked, onClick }) {
  return (
    <label onClick={onClick}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 text-sm ${
        isChecked ? 'bg-[#2D5016] text-white' : 'text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016]'
      }`}
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-[#A7D129] border-[#A7D129]' : 'border-gray-300'}`}>
        {isChecked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="leading-snug flex-1 truncate">{label}</span>
    </label>
  );
}

function FilterSection({ icon, label, badge, isOpen, onToggle, children }) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {badge > 0 && (
            <span className="text-[10px] bg-[#A7D129] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{badge}</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CarFilter({ onFilter }) {
  const [open, setOpen] = useState({
    listingType:  true,
    condition:    true,
    category:     false,
    make:         false,
    model:        false,
    fuelType:     false,
    transmission: false,
    bodyType:     false,
    price:        false,
    year:         false,
    mileage:      false,
    region:       false,
    city:         false,
  });

  const [selected, setSelected] = useState({
    listingType:  [],
    condition:    [],
    category:     [],
    make:         [],
    model:        [],
    fuelType:     [],
    transmission: [],
    bodyType:     [],
    region:       [],
    city:         [],
  });

  const [priceRange,   setPriceRange]   = useState({ min: '', max: '' });
  const [yearRange,    setYearRange]    = useState({ min: '', max: '' });
  const [maxMileage,   setMaxMileage]   = useState('');
  const [categories,   setCategories]   = useState([]);
  const [catalog,      setCatalog]      = useState([]);
  const [loadingCats,  setLoadingCats]  = useState(true);

  const selectedRegion = selected.region[0] || null;
  const selectedCity   = selected.city[0]   || null;

  useEffect(() => {
    carsService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingCats(false));

    carsService.getCatalog()
      .then((res) => setCatalog(res.data || []))
      .catch(() => setCatalog([]));
  }, []);

  const regionOptions = useMemo(() => ALL_REGIONS.map((r) => ({ value: r, label: r })), []);

  const cityOptions = useMemo(() => {
    const pool = selectedRegion ? citiesByRegion[selectedRegion] || [] : Object.values(citiesByRegion).flat();
    return [...pool].sort((a, b) => a.localeCompare(b, 'fr')).map((c) => ({ value: c, label: c }));
  }, [selectedRegion]);

  const selectedMake = selected.make[0] || '';
  const selectedModel = selected.model[0] || '';
  const modelOptions = useMemo(() => {
    const found = catalog.find((item) => item.make === selectedMake);
    return found?.models || [];
  }, [catalog, selectedMake]);

  const emitFilters = (newSelected, newPrice, newYear, newMileage) => {
    const f = {};
    if (newSelected.listingType[0])  f.listingType  = newSelected.listingType[0];
    if (newSelected.condition[0])    f.condition     = newSelected.condition[0];
    if (newSelected.category[0])     f.categoryId    = newSelected.category[0];
    if (newSelected.make[0])         f.make          = newSelected.make[0];
    if (newSelected.model[0])        f.model         = newSelected.model[0];
    if (newSelected.fuelType[0])     f.fuelType      = newSelected.fuelType[0];
    if (newSelected.transmission[0]) f.transmission  = newSelected.transmission[0];
    if (newSelected.bodyType[0])     f.bodyType      = newSelected.bodyType[0];
    if (newSelected.city[0])         f.city          = newSelected.city[0];
    else if (newSelected.region[0])  f.region        = newSelected.region[0];
    if (newPrice.min)   f.minPrice   = newPrice.min;
    if (newPrice.max)   f.maxPrice   = newPrice.max;
    if (newYear.min)    f.minYear    = newYear.min;
    if (newYear.max)    f.maxYear    = newYear.max;
    if (newMileage)     f.maxMileage = newMileage;
    onFilter(f);
  };

  const toggleSection = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  const handleCheck = (key, value) => {
    let newSelected;
    if (!value) {
      newSelected = key === 'make'
        ? { ...selected, make: [], model: [] }
        : { ...selected, [key]: [] };
    } else if (key === 'region') {
      newSelected = { ...selected, region: selected.region[0] === value ? [] : [value], city: [] };
    } else if (key === 'make') {
      newSelected = { ...selected, make: selected.make[0] === value ? [] : [value], model: [] };
    } else {
      newSelected = { ...selected, [key]: selected[key][0] === value ? [] : [value] };
    }
    setSelected(newSelected);
    emitFilters(newSelected, priceRange, yearRange, maxMileage);
  };

  const handlePriceChange = (field, val) => {
    const newPrice = { ...priceRange, [field]: val };
    setPriceRange(newPrice);
    emitFilters(selected, newPrice, yearRange, maxMileage);
  };

  const handleYearChange = (field, val) => {
    const newYear = { ...yearRange, [field]: val };
    setYearRange(newYear);
    emitFilters(selected, priceRange, newYear, maxMileage);
  };

  const handleMileageChange = (val) => {
    setMaxMileage(val);
    emitFilters(selected, priceRange, yearRange, val);
  };

  const handleReset = () => {
    const empty = { listingType: [], condition: [], category: [], make: [], model: [], fuelType: [], transmission: [], bodyType: [], region: [], city: [] };
    setSelected(empty);
    setPriceRange({ min: '', max: '' });
    setYearRange({ min: '', max: '' });
    setMaxMileage('');
    onFilter({});
  };

  const totalSelected =
    Object.values(selected).flat().length +
    (priceRange.min || priceRange.max ? 1 : 0) +
    (yearRange.min  || yearRange.max  ? 1 : 0) +
    (maxMileage ? 1 : 0);

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent transition';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-white font-semibold text-sm">Filtrer les annonces</span>
          {totalSelected > 0 && (
            <span className="bg-[#A7D129] text-white text-xs rounded-full px-2 py-0.5 font-bold">{totalSelected}</span>
          )}
        </div>
        {totalSelected > 0 && (
          <button onClick={handleReset} className="text-white/70 hover:text-white text-xs underline transition-colors">Réinitialiser</button>
        )}
      </div>

      {/* Type d'annonce */}
      <FilterSection icon="🏷️" label="Type d'annonce" badge={selected.listingType.length} isOpen={open.listingType} onToggle={() => toggleSection('listingType')}>
        <div className="px-3 pb-3 space-y-0.5">
          {LISTING_TYPES.map((t) => (
            <FilterOption key={t.value} label={t.label} isChecked={selected.listingType[0] === t.value} onClick={() => handleCheck('listingType', t.value)} />
          ))}
        </div>
      </FilterSection>

      {/* État */}
      <FilterSection icon="🔍" label="État du véhicule" badge={selected.condition.length} isOpen={open.condition} onToggle={() => toggleSection('condition')}>
        <div className="px-3 pb-3 space-y-0.5">
          {CONDITIONS.map((c) => (
            <FilterOption key={c.value} label={c.label} isChecked={selected.condition[0] === c.value} onClick={() => handleCheck('condition', c.value)} />
          ))}
        </div>
      </FilterSection>

      {/* Catégorie */}
      <FilterSection icon="🚗" label="Catégorie" badge={selected.category.length} isOpen={open.category} onToggle={() => toggleSection('category')}>
        {loadingCats ? <FilterSkeleton /> : categories.length === 0 ? (
          <p className="px-4 pb-3 text-xs text-gray-400 italic">Aucune catégorie disponible</p>
        ) : (
          <div className="px-3 pb-3 space-y-0.5">
            {categories.map((cat) => (
              <FilterOption key={cat.id} label={cat.name} isChecked={selected.category[0] === cat.id} onClick={() => handleCheck('category', cat.id)} />
            ))}
          </div>
        )}
      </FilterSection>

      <FilterSection icon="🏷" label="Marque" badge={selectedMake ? 1 : 0} isOpen={open.make} onToggle={() => toggleSection('make')}>
        <div className="px-3 pb-3">
          <select value={selectedMake} onChange={(e) => handleCheck('make', e.target.value)} className={inp}>
            <option value="">Toutes les marques</option>
            {catalog.map((item) => (
              <option key={item.make} value={item.make}>{item.make}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <FilterSection icon="🔎" label="Modèle" badge={selectedModel ? 1 : 0} isOpen={open.model} onToggle={() => toggleSection('model')}>
        <div className="px-3 pb-3">
          <select
            value={selectedModel}
            onChange={(e) => handleCheck('model', e.target.value)}
            disabled={!selectedMake}
            className={`${inp} disabled:bg-gray-50 disabled:text-gray-400`}
          >
            <option value="">{selectedMake ? 'Tous les modèles' : 'Choisissez une marque'}</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Carburant */}
      <FilterSection icon="⛽" label="Carburant" badge={selected.fuelType.length} isOpen={open.fuelType} onToggle={() => toggleSection('fuelType')}>
        <div className="px-3 pb-3 space-y-0.5">
          {FUEL_TYPES.map((f) => (
            <FilterOption key={f.value} label={f.label} isChecked={selected.fuelType[0] === f.value} onClick={() => handleCheck('fuelType', f.value)} />
          ))}
        </div>
      </FilterSection>

      {/* Boîte de vitesse */}
      <FilterSection icon="⚙️" label="Boîte de vitesse" badge={selected.transmission.length} isOpen={open.transmission} onToggle={() => toggleSection('transmission')}>
        <div className="px-3 pb-3 space-y-0.5">
          {TRANSMISSIONS.map((t) => (
            <FilterOption key={t.value} label={t.label} isChecked={selected.transmission[0] === t.value} onClick={() => handleCheck('transmission', t.value)} />
          ))}
        </div>
      </FilterSection>

      {/* Carrosserie */}
      <FilterSection icon="🚙" label="Carrosserie" badge={selected.bodyType.length} isOpen={open.bodyType} onToggle={() => toggleSection('bodyType')}>
        <div className="px-3 pb-3 space-y-0.5">
          {BODY_TYPES.map((b) => (
            <FilterOption key={b.value} label={b.label} isChecked={selected.bodyType[0] === b.value} onClick={() => handleCheck('bodyType', b.value)} />
          ))}
        </div>
      </FilterSection>

      {/* Prix */}
      <FilterSection icon="💰" label="Prix (MAD)" badge={priceRange.min || priceRange.max ? 1 : 0} isOpen={open.price} onToggle={() => toggleSection('price')}>
        <div className="px-3 pb-3 flex gap-2">
          <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => handlePriceChange('min', e.target.value)} className={inp} />
          <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => handlePriceChange('max', e.target.value)} className={inp} />
        </div>
      </FilterSection>

      {/* Année */}
      <FilterSection icon="📅" label="Année" badge={yearRange.min || yearRange.max ? 1 : 0} isOpen={open.year} onToggle={() => toggleSection('year')}>
        <div className="px-3 pb-3 flex gap-2">
          <input type="number" placeholder="De" value={yearRange.min} onChange={(e) => handleYearChange('min', e.target.value)} className={inp} />
          <input type="number" placeholder="À"  value={yearRange.max} onChange={(e) => handleYearChange('max', e.target.value)} className={inp} />
        </div>
      </FilterSection>

      {/* Kilométrage */}
      <FilterSection icon="🛣️" label="Kilométrage max" badge={maxMileage ? 1 : 0} isOpen={open.mileage} onToggle={() => toggleSection('mileage')}>
        <div className="px-3 pb-3">
          <input type="number" placeholder="Ex: 100000" value={maxMileage} onChange={(e) => handleMileageChange(e.target.value)} className={inp} />
        </div>
      </FilterSection>

      {/* Région */}
      <FilterSection icon="🗺️" label="Région" badge={selectedRegion ? 1 : 0} isOpen={open.region} onToggle={() => toggleSection('region')}>
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {regionOptions.map((opt) => (
            <FilterOption key={opt.value} label={opt.label} isChecked={selectedRegion === opt.value} onClick={() => handleCheck('region', opt.value)} />
          ))}
        </div>
      </FilterSection>

      {/* Ville */}
      <FilterSection icon="📍" label={selectedRegion ? `Ville — ${selectedRegion}` : 'Ville'} badge={selectedCity ? 1 : 0} isOpen={open.city} onToggle={() => toggleSection('city')}>
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {cityOptions.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400 italic">{selectedRegion ? 'Aucune ville dans cette région' : 'Aucune ville disponible'}</p>
          ) : (
            cityOptions.map((opt) => (
              <FilterOption key={opt.value} label={opt.label} isChecked={selectedCity === opt.value} onClick={() => handleCheck('city', opt.value)} />
            ))
          )}
        </div>
      </FilterSection>
    </div>
  );
}
