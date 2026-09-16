'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { OptionRow } from '@/components/shared/FilterDropdown';

const CONTRACT_OPTIONS = [
  { value: 'CDI',          label: 'CDI' },
  { value: 'CDD',          label: 'CDD' },
  { value: 'STAGE',        label: 'Stage' },
  { value: 'FREELANCE',    label: 'Freelance' },
  { value: 'INTERIM',      label: 'Intérim' },
  { value: 'ALTERNANCE',   label: 'Alternance' },
  { value: 'ANAPEC',       label: 'Anapec' },
  { value: 'TEMPS_PARTIEL',label: 'Temps partiel' },
];

const EDUCATION_OPTIONS = [
  { value: 'BEFORE_BAC',      label: 'Avant Bac' },
  { value: 'BAC',             label: 'Bac' },
  { value: 'BAC_PLUS_1',      label: 'Bac+1' },
  { value: 'BAC_PLUS_2',      label: 'Bac+2' },
  { value: 'BAC_PLUS_3',      label: 'Bac+3' },
  { value: 'BAC_PLUS_4',      label: 'Bac+4' },
  { value: 'BAC_PLUS_5_PLUS', label: 'Bac+5 et plus' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2',      label: '< 2 ans' },
  { value: 'MID_2_TO_5',         label: '2 – 5 ans' },
  { value: 'SENIOR_5_TO_10',     label: '5 – 10 ans' },
  { value: 'EXPERT_PLUS_10',     label: '> 10 ans' },
];

const EMPTY = {
  educationLevel: '', experienceLevel: '', contractType: '',
  availableOnly: true,
};

export default function CandidateFilter({ onFilter }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [filters,      setFilters]      = useState(EMPTY);
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const emitClean = (obj) => {
    const clean = {};
    Object.entries(obj).forEach(([k, v]) => {
      if (k === 'availableOnly') { if (v) clean[k] = 'true'; }
      else if (v) clean[k] = v;
    });
    onFilter(clean);
  };

  const update = (key, value, opts = {}) => {
    const next = { ...filtersRef.current, [key]: value };
    filtersRef.current = next;
    setFilters(next);
    if (opts.immediate) emitClean(next);
  };

  const handleReset = () => {
    filtersRef.current = EMPTY;
    setFilters(EMPTY);
    setDropdownOpen(false);
    onFilter({ availableOnly: 'true' });
  };

  const anyActive = !!(
    filters.educationLevel || filters.experienceLevel || filters.contractType ||
    !filters.availableOnly
  );

  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Available toggle */}
      <div
        onClick={() => update('availableOnly', !filters.availableOnly, { immediate: true })}
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
          filters.availableOnly ? 'bg-[#E8F5D0]' : 'hover:bg-gray-50'
        }`}
      >
        <span className="text-sm font-medium text-gray-700">✅ Disponibles uniquement</span>
        <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
          filters.availableOnly ? 'bg-[#A7D129]' : 'bg-gray-200'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
            filters.availableOnly ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </div>
      </div>

      {/* Contract */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Contrat recherché</p>
        <div className="space-y-1">
          {CONTRACT_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              isChecked={filters.contractType === o.value}
              onClick={() => update('contractType', filters.contractType === o.value ? '' : o.value, { immediate: true })}
            />
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Expérience</p>
        <div className="space-y-1">
          {EXPERIENCE_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              isChecked={filters.experienceLevel === o.value}
              onClick={() => update('experienceLevel', filters.experienceLevel === o.value ? '' : o.value, { immediate: true })}
            />
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Niveau d'études</p>
        <div className="space-y-1">
          {EDUCATION_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              isChecked={filters.educationLevel === o.value}
              onClick={() => update('educationLevel', filters.educationLevel === o.value ? '' : o.value, { immediate: true })}
            />
          ))}
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
          onClick={() => setDropdownOpen((v) => !v)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
            anyActive
              ? 'border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800'
          }`}
        >
          <SlidersHorizontal size={15} className="shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Filtres avancés</span>
          {anyActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />
          )}
        </button>

        {dropdownOpen && <div className="fixed inset-0 z-[99]" onClick={() => setDropdownOpen(false)} />}

        {dropdownOpen && (
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
                <span className="font-bold text-gray-800 text-sm">Filtres avancés</span>
                <button type="button" onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
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