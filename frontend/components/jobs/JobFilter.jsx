'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

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

const EDUCATION_OPTIONS = [
  { value: 'BEFORE_BAC',      label: 'Qualification avant Bac' },
  { value: 'BAC',             label: 'Bac' },
  { value: 'BAC_PLUS_1',      label: 'Bac+1' },
  { value: 'BAC_PLUS_2',      label: 'Bac+2' },
  { value: 'BAC_PLUS_3',      label: 'Bac+3' },
  { value: 'BAC_PLUS_4',      label: 'Bac+4' },
  { value: 'BAC_PLUS_5_PLUS', label: 'Bac+5 et plus' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2',      label: 'Débutant < 2 ans' },
  { value: 'MID_2_TO_5',         label: 'Entre 2 et 5 ans' },
  { value: 'SENIOR_5_TO_10',     label: 'Entre 5 et 10 ans' },
  { value: 'EXPERT_PLUS_10',     label: '> 10 ans' },
];

function FilterSkeleton() {
  return (
    <div className="px-4 pb-3 space-y-1.5 animate-pulse">
      {[80, 60, 70, 50, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <div className="w-4 h-4 rounded bg-gray-100 shrink-0" />
          <div className="h-3 bg-gray-100 rounded" style={{ width: `${w}%` }} />
          <div className="ml-auto h-4 w-8 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function JobFilter({ onFilter }) {
  const [open, setOpen] = useState({
    categorySlug:    true,
    contractType:    false,
    experienceLevel: false,
    educationLevel:  false,
    location:        false,
  });
  const [selected, setSelected]                     = useState({});
  const [counts, setCounts]                         = useState(null);
  const [loadingCounts, setLoadingCounts]           = useState(true);
  // toggle ON = cacher les offres sans salaire (n'afficher que celles avec salaire)
  const [hideSalaryUnspecified, setHideSalaryUnspecified] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res  = await fetch(`${API_URL}/jobs/filters-count`);
        if (!res.ok) throw new Error('Erreur counts');
        const json = await res.json();
        setCounts(json.data);
      } catch (err) {
        console.error('Erreur chargement des counts filtres :', err);
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchCounts();
  }, []);

  const categoryOptions = counts?.categories
    ? counts.categories.map((c) => ({ value: c.slug, label: c.name, count: c.count }))
    : [];

  const locationOptions = counts?.location
    ? Object.entries(counts.location)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([city]) => ({ value: city, label: city }))
    : [];

  const toggleSection = (key) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Émet les filtres fusionnés ───────────────────────────
  const emitFilters = (newSelected, hideUnspecified) => {
    const filters = {};
    Object.entries(newSelected).forEach(([k, vals]) => {
      if (vals && vals.length > 0) filters[k] = vals[0];
      else filters[k] = undefined;
    });
    // ON = afficher uniquement les offres AVEC salaire spécifié
    // on passe salarySpecified=true au backend qui filtrera salaryMin IS NOT NULL
    if (hideUnspecified) filters.salarySpecified = true;
    else filters.salarySpecified = undefined;
    onFilter(filters);
  };

  const handleCheck = (key, value) => {
    const current     = selected[key] || [];
    const updated     = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const newSelected = { ...selected, [key]: updated };
    setSelected(newSelected);
    emitFilters(newSelected, hideSalaryUnspecified);
  };

  const handleSalaryToggle = () => {
    const newVal = !hideSalaryUnspecified;
    setHideSalaryUnspecified(newVal);
    emitFilters(selected, newVal);
  };

  const handleReset = () => {
    setSelected({});
    setHideSalaryUnspecified(false);
    onFilter({});
  };

  const totalSelected =
    Object.values(selected).flat().length + (hideSalaryUnspecified ? 1 : 0);

  const sections = [
    {
      key: 'categorySlug',
      label: 'Secteur',
      icon: '🏢',
      options: categoryOptions,
      countsMap: counts?.categories
        ? Object.fromEntries(counts.categories.map((c) => [c.slug, c.count]))
        : {},
    },
    {
      key: 'contractType',
      label: 'Type de contrat',
      icon: '📄',
      options: CONTRACT_OPTIONS,
      countsMap: counts?.contractType || {},
    },
    {
      key: 'experienceLevel',
      label: "Niveau d'expérience",
      icon: '💼',
      options: EXPERIENCE_OPTIONS,
      countsMap: counts?.experienceLevel || {},
    },
    {
      key: 'educationLevel',
      label: "Niveau d'études",
      icon: '🎓',
      options: EDUCATION_OPTIONS,
      countsMap: counts?.educationLevel || {},
    },
    {
      key: 'location',
      label: 'Ville',
      icon: '📍',
      options: locationOptions,
      countsMap: counts?.location || {},
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-white font-semibold text-sm">Filtrer les offres</span>
          {totalSelected > 0 && (
            <span className="bg-[#A7D129] text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {totalSelected}
            </span>
          )}
        </div>
        {totalSelected > 0 && (
          <button
            onClick={handleReset}
            className="text-white/70 hover:text-white text-xs underline transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Toggle : masquer salaire non spécifié ─────────── */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💰</span>
          <span className="text-sm font-semibold text-gray-800">
            Salaire affiché
          </span>
        </div>
        <button
          onClick={handleSalaryToggle}
          className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
            hideSalaryUnspecified ? 'bg-[#2D5016]' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${
            hideSalaryUnspecified ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* ── Sections ─────────────────────────────────────── */}
      {sections.map((section) => (
        <div key={section.key}>
          <button
            onClick={() => toggleSection(section.key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{section.label}</span>
              {(selected[section.key] || []).length > 0 && (
                <span className="text-[10px] bg-[#A7D129] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {(selected[section.key] || []).length}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open[section.key] ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open[section.key] && (
            loadingCounts ? (
              <FilterSkeleton />
            ) : section.options.length === 0 ? (
              <p className="px-4 pb-3 text-xs text-gray-400 italic">Aucune option disponible</p>
            ) : (
              <div className="px-3 pb-3 space-y-0.5">
                {section.options.map((opt) => {
                  const isChecked = (selected[section.key] || []).includes(opt.value);
                  const count     = opt.count !== undefined ? opt.count : section.countsMap?.[opt.value];
                  if (count === 0) return null;

                  return (
                    <label
                      key={opt.value}
                      onClick={() => handleCheck(section.key, opt.value)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 text-sm
                        ${isChecked
                          ? 'bg-[#2D5016] text-white'
                          : 'text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016]'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                        ${isChecked ? 'bg-[#A7D129] border-[#A7D129]' : 'border-gray-300'}`}>
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="leading-snug flex-1 truncate">{opt.label}</span>
                      {count !== undefined && (
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center shrink-0 transition-colors
                          ${isChecked ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {count.toLocaleString('fr-MA')}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}