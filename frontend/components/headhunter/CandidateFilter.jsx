'use client';

import { useState, useEffect, useMemo } from 'react';
import { headhunterService } from '@/services/headhunterService';
import { useAuth } from '@/context/AuthContext';
import {
  buildRegionOptions,
  buildCityOptions,
  FilterOption,
  FilterSection,
  FilterHeader,
  ToggleRow,
} from '@/components/shared/FilterPanel';

const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' }, { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERIM', label: 'Intérim' }, { value: 'ALTERNANCE', label: 'Alternance' },
  { value: 'ANAPEC', label: 'Anapec' }, { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
];

const EDUCATION_OPTIONS = [
  { value: 'BEFORE_BAC', label: 'Qualification avant Bac' }, { value: 'BAC', label: 'Bac' },
  { value: 'BAC_PLUS_1', label: 'Bac+1' }, { value: 'BAC_PLUS_2', label: 'Bac+2' },
  { value: 'BAC_PLUS_3', label: 'Bac+3' }, { value: 'BAC_PLUS_4', label: 'Bac+4' },
  { value: 'BAC_PLUS_5_PLUS', label: 'Bac+5 et plus' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2', label: 'Débutant < 2 ans' },
  { value: 'MID_2_TO_5', label: 'Entre 2 et 5 ans' },
  { value: 'SENIOR_5_TO_10', label: 'Entre 5 et 10 ans' },
  { value: 'EXPERT_PLUS_10', label: '> 10 ans' },
];

export default function CandidateFilter({ onFilter }) {
  const { token } = useAuth();
  const [open, setOpen] = useState({ educationLevel: true, experienceLevel: false, contractType: false, region: false, city: false });
  const [selected, setSelected] = useState({});
  const [availableOnly, setAvailableOnly] = useState(true);
  const [counts, setCounts] = useState(null);

  const selectedRegion = (selected.region || [])[0] || null;
  const selectedCity = (selected.city || [])[0] || null;

  useEffect(() => {
    if (!token) return;
    headhunterService.getFiltersCount(token).then((json) => { if (json.success) setCounts(json.data); }).catch(() => {});
  }, [token]);

  const regionOptions = useMemo(() => buildRegionOptions(), []);
  const cityOptions = useMemo(() => buildCityOptions(selectedRegion), [selectedRegion]);

  const toggleSection = (key) => setOpen((p) => ({ ...p, [key]: !p[key] }));

  const emit = (newSelected, newAvailableOnly) => {
    const filters = {};
    ['educationLevel', 'experienceLevel', 'contractType'].forEach((k) => {
      const vals = newSelected[k] || [];
      filters[k] = vals.length > 0 ? vals[0] : undefined;
    });
    const city = (newSelected.city || [])[0];
    const region = (newSelected.region || [])[0];
    filters.city = city || undefined;
    filters.region = !city && region ? region : undefined;
    filters.availableOnly = newAvailableOnly ? 'true' : undefined;
    onFilter(filters);
  };

  const handleCheck = (key, value) => {
    const current = (selected[key] || [])[0];
    let newVal;
    if (key === 'region') {
      newVal = { ...selected, region: current === value ? [] : [value], city: [] };
    } else {
      newVal = { ...selected, [key]: current === value ? [] : [value] };
    }
    setSelected(newVal);
    emit(newVal, availableOnly);
  };

  const handleAvailableToggle = () => {
    const next = !availableOnly;
    setAvailableOnly(next);
    emit(selected, next);
  };

  const handleReset = () => {
    setSelected({});
    setAvailableOnly(true);
    onFilter({ availableOnly: 'true' });
  };

  const totalSelected = Object.values(selected).flat().length;

  const staticSections = [
    { key: 'educationLevel', label: "Niveau d'études", icon: '🎓', options: EDUCATION_OPTIONS, countsMap: counts?.educationLevel || {} },
    { key: 'experienceLevel', label: "Niveau d'expérience", icon: '💼', options: EXPERIENCE_OPTIONS, countsMap: counts?.experienceLevel || {} },
    { key: 'contractType', label: 'Contrat recherché', icon: '📄', options: CONTRACT_OPTIONS, countsMap: counts?.contractType || {} },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <FilterHeader title="Filtrer les candidats" totalSelected={totalSelected} onReset={handleReset} />

      <ToggleRow icon="✅" label="Disponibles uniquement" checked={availableOnly} onToggle={handleAvailableToggle} />

      {staticSections.map((section) => (
        <FilterSection key={section.key} icon={section.icon} label={section.label} badge={(selected[section.key] || []).length} isOpen={open[section.key]} onToggle={() => toggleSection(section.key)}>
          <div className="px-3 pb-3 space-y-0.5">
            {section.options.map((opt) => (
              <FilterOption key={opt.value} label={opt.label} count={section.countsMap?.[opt.value]}
                isChecked={(selected[section.key] || []).includes(opt.value)} onClick={() => handleCheck(section.key, opt.value)} />
            ))}
          </div>
        </FilterSection>
      ))}

      <FilterSection icon="🗺️" label="Région" badge={selectedRegion ? 1 : 0} isOpen={open.region} onToggle={() => toggleSection('region')}>
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {regionOptions.map((opt) => (
            <FilterOption key={opt.value} label={opt.label} isChecked={selectedRegion === opt.value} onClick={() => handleCheck('region', opt.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection icon="📍" label={selectedRegion ? `Ville — ${selectedRegion}` : 'Ville'} badge={selectedCity ? 1 : 0} isOpen={open.city} onToggle={() => toggleSection('city')}>
        <div className="px-3 pb-3 space-y-0.5 max-h-52 overflow-y-auto">
          {cityOptions.map((opt) => (
            <FilterOption key={opt.value} label={opt.label} isChecked={selectedCity === opt.value} onClick={() => handleCheck('city', opt.value)} />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}