'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  citiesByRegion,
  buildRegionOptions,
  buildCityOptions,
  FilterSkeleton,
  FilterOption,
  FilterSection,
  FilterHeader,
  ToggleRow,
} from '@/components/shared/FilterPanel';

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

export default function JobFilter({ onFilter }) {
  const [open, setOpen] = useState({
    categorySlug:    true,
    contractType:    false,
    experienceLevel: false,
    educationLevel:  false,
    region:          false,
    city:            false,
  });

  const [selected, setSelected]   = useState({});
  const [counts, setCounts]       = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [hideSalaryUnspecified, setHideSalaryUnspecified] = useState(false);

  const selectedRegion = (selected.region || [])[0] || null;
  const selectedCity   = (selected.city   || [])[0] || null;

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

  const regionOptions = useMemo(() => buildRegionOptions(counts?.region), [counts]);
  const cityOptions = useMemo(
    () => buildCityOptions(selectedRegion, counts?.city),
    [selectedRegion, counts]
  );

  const categoryOptions = counts?.categories
    ? counts.categories.map((c) => ({ value: c.slug, label: c.name, count: c.count }))
    : [];

  const toggleSection = (key) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const emitFilters = (newSelected, hideUnspecified) => {
    const filters = {};

    ['categorySlug', 'contractType', 'experienceLevel', 'educationLevel'].forEach((k) => {
      const vals = newSelected[k] || [];
      filters[k] = vals.length > 0 ? vals[0] : undefined;
    });

    const city   = (newSelected.city   || [])[0];
    const region = (newSelected.region || [])[0];
    filters.city = city   || undefined;
    filters.region   = !city && region ? region : undefined;

    if (hideUnspecified) filters.salarySpecified = true;
    else filters.salarySpecified = undefined;

    onFilter(filters);
  };

  const handleCheck = (key, value) => {
    const current = (selected[key] || [])[0];

    let newVal;
    if (key === 'region') {
      const isSame = current === value;
      newVal = { ...selected, region: isSame ? [] : [value], city: [] };
    } else {
      newVal = {
        ...selected,
        [key]: current === value ? [] : [value],
      };
    }

    setSelected(newVal);
    emitFilters(newVal, hideSalaryUnspecified);
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

  const staticSections = [
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
  ];

  const headerIcon = (
    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
    </svg>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <FilterHeader icon={headerIcon} title="Filtrer les offres" totalSelected={totalSelected} onReset={handleReset} />

      <ToggleRow icon="💰" label="Salaire affiché" checked={hideSalaryUnspecified} onToggle={handleSalaryToggle} />

      {staticSections.map((section) => (
        <FilterSection
          key={section.key}
          icon={section.icon}
          label={section.label}
          badge={(selected[section.key] || []).length}
          isOpen={open[section.key]}
          onToggle={() => toggleSection(section.key)}
        >
          {loadingCounts ? (
            <FilterSkeleton />
          ) : section.options.length === 0 ? (
            <p className="px-4 pb-3 text-xs text-gray-400 italic">Aucune option disponible</p>
          ) : (
            <div className="px-3 pb-3 space-y-0.5">
              {section.options.map((opt) => {
                const count = opt.count !== undefined ? opt.count : section.countsMap?.[opt.value];
                if (count === 0) return null;
                return (
                  <FilterOption
                    key={opt.value}
                    label={opt.label}
                    count={count}
                    isChecked={(selected[section.key] || []).includes(opt.value)}
                    onClick={() => handleCheck(section.key, opt.value)}
                  />
                );
              })}
            </div>
          )}
        </FilterSection>
      ))}

      <FilterSection
        icon="🗺️"
        label="Région"
        badge={selectedRegion ? 1 : 0}
        isOpen={open.region}
        onToggle={() => toggleSection('region')}
      >
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {regionOptions.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400 italic">Aucune région disponible</p>
          ) : (
            regionOptions.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                count={opt.count}
                isChecked={selectedRegion === opt.value}
                onClick={() => handleCheck('region', opt.value)}
              />
            ))
          )}
        </div>
      </FilterSection>

      <FilterSection
        icon="📍"
        label={selectedRegion ? `Ville — ${selectedRegion}` : 'Ville'}
        badge={selectedCity ? 1 : 0}
        isOpen={open.city}
        onToggle={() => toggleSection('city')}
      >
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {cityOptions.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400 italic">
              {selectedRegion
                ? 'Aucune ville avec des offres dans cette région'
                : 'Aucune ville disponible'}
            </p>
          ) : (
            cityOptions.map((opt) => (
              <FilterOption
                key={opt.value}
                label={opt.label}
                count={opt.count}
                isChecked={selectedCity === opt.value}
                onClick={() => handleCheck('city', opt.value)}
              />
            ))
          )}
        </div>
      </FilterSection>
    </div>
  );
}