'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { OptionRow } from '@/components/shared/FilterDropdown';

const CONTRACT_OPTIONS = [
  { value: 'CDI',           label: 'CDI' },
  { value: 'CDD',           label: 'CDD' },
  { value: 'STAGE',         label: 'Stage' },
  { value: 'FREELANCE',     label: 'Freelance' },
  { value: 'INTERIM',       label: 'Intérim' },
  { value: 'ALTERNANCE',    label: 'Alternance' },
  { value: 'ANAPEC',        label: 'Anapec' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
  { value: 'STATUTAIRE',    label: 'Statutaire' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2',      label: 'Débutant < 2 ans' },
  { value: 'MID_2_TO_5',         label: 'Entre 2 et 5 ans' },
  { value: 'SENIOR_5_TO_10',     label: 'Entre 5 et 10 ans' },
  { value: 'EXPERT_PLUS_10',     label: '> 10 ans' },
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

const EMPTY_FILTERS = {
  contractType:    '',
  experienceLevel: '',
  educationLevel:  '',
  salarySpecified: false,
};

export default function JobFilter({ onFilter }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [filters,      setFilters]      = useState(EMPTY_FILTERS);
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const emitClean = (obj) => {
    const clean = {};
    Object.keys(obj).forEach((k) => {
      if (obj[k] !== '' && obj[k] !== false) clean[k] = obj[k];
    });
    onFilter(clean);
  };

  const updateFilter = (key, value) => {
    const next = { ...filtersRef.current, [key]: value };
    filtersRef.current = next;
    setFilters(next);
    emitClean(next);
  };

  const handleResetAll = () => {
    filtersRef.current = EMPTY_FILTERS;
    setFilters(EMPTY_FILTERS);
    setDropdownOpen(false);
    onFilter({});
  };

  const anyActive = !!(
    filters.contractType ||
    filters.experienceLevel ||
    filters.educationLevel ||
    filters.salarySpecified
  );

  // ─── Shared filters panel ────────────────────────────────────────────────────
  const FiltersPanel = () => (
    <div className="space-y-4">
      {/* Salary toggle */}
      <div
        onClick={() => updateFilter('salarySpecified', !filters.salarySpecified)}
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
          filters.salarySpecified ? 'bg-[#E8F5D0]' : 'hover:bg-gray-50'
        }`}
      >
        <span className="text-sm font-medium text-gray-700">💰 Salaire affiché uniquement</span>
        <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
          filters.salarySpecified ? 'bg-[#A7D129]' : 'bg-gray-200'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
            filters.salarySpecified ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </div>
      </div>

      {/* Contract type */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Type de contrat</p>
        <div className="space-y-1">
          {CONTRACT_OPTIONS.map((o) => (
            <OptionRow
              key={o.value}
              label={o.label}
              isChecked={filters.contractType === o.value}
              onClick={() => updateFilter('contractType', filters.contractType === o.value ? '' : o.value)}
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
              onClick={() => updateFilter('experienceLevel', filters.experienceLevel === o.value ? '' : o.value)}
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
              onClick={() => updateFilter('educationLevel', filters.educationLevel === o.value ? '' : o.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">

      {/* ══ DESKTOP (sm+) — icon button + dropdown ══ */}
      <div className="hidden sm:block">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="Filtres avancés"
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
            anyActive
              ? 'border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#2D5016]/40 hover:text-[#2D5016]'
          }`}
        >
          <SlidersHorizontal size={15} className="shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">Filtres avancés</span>
          {anyActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />
          )}
        </button>

        {/* Click-outside backdrop */}
        {dropdownOpen && (
          <div className="fixed inset-0 z-[99]" onClick={() => setDropdownOpen(false)} />
        )}

        {/* Dropdown panel */}
        {dropdownOpen && (
          <div className="absolute left-0 top-[calc(100%+6px)] w-80 max-h-[70vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl z-[100] p-4">
            <FiltersPanel />
            {anyActive && (
              <button
                type="button"
                onClick={handleResetAll}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ══ MOBILE (below sm) — pill button + left drawer ══ */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Filtres avancés"
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
            anyActive
              ? 'border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]'
              : 'border-gray-300 bg-gray-50 text-gray-600'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filtres
          {anyActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#A7D129] border-2 border-white" />
          )}
        </button>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-[200]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="absolute top-0 left-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <span className="font-bold text-gray-800 text-sm">Filtres avancés</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4">
                <FiltersPanel />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                {anyActive && (
                  <button
                    type="button"
                    onClick={() => { handleResetAll(); setDrawerOpen(false); }}
                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                  >
                    Réinitialiser
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition"
                >
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