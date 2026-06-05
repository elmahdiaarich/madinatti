'use client';

import { useState } from 'react';

const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERIM', label: 'Intérim' },
  { value: 'ALTERNANCE', label: 'Alternance' },
  { value: 'ANAPEC', label: 'Anapec' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
  { value: 'STATUTAIRE', label: 'Statutaire' },
];

const EDUCATION_OPTIONS = [
  { value: 'BEFORE_BAC', label: 'Qualification avant Bac' },
  { value: 'BAC', label: 'Bac' },
  { value: 'BAC_PLUS_1', label: 'Bac+1' },
  { value: 'BAC_PLUS_2', label: 'Bac+2' },
  { value: 'BAC_PLUS_3', label: 'Bac+3' },
  { value: 'BAC_PLUS_4', label: 'Bac+4' },
  { value: 'BAC_PLUS_5_PLUS', label: 'Bac+5 et plus' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2', label: 'Débutant < 2 ans' },
  { value: 'MID_2_TO_5', label: 'Entre 2 et 5 ans' },
  { value: 'SENIOR_5_TO_10', label: 'Entre 5 et 10 ans' },
  { value: 'EXPERT_PLUS_10', label: '> 10 ans' },
];

const LOCATION_OPTIONS = [
  'Casablanca', 'Rabat', 'Tanger', 'Fès',
  'Marrakech', 'Meknès', 'Agadir', 'Oujda', 'Safi',
];

const SECTIONS = [
  { key: 'contractType', label: 'Types de contrat', icon: '📄', options: CONTRACT_OPTIONS },
  { key: 'experienceLevel', label: "Niveau d'expérience", icon: '💼', options: EXPERIENCE_OPTIONS },
  { key: 'educationLevel', label: "Niveau d'études", icon: '🎓', options: EDUCATION_OPTIONS },
  { key: 'location', label: 'Région', icon: '📍', options: LOCATION_OPTIONS.map(v => ({ value: v, label: v })) },
];

function FilterSection({ section, selected, onChange, isOpen, onToggle }) {
  const selectedCount = (selected[section.key] || []).length;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{section.icon}</span>
          <span className="text-sm font-semibold text-gray-800">{section.label}</span>
          {selectedCount > 0 && (
            <span className="text-xs bg-[#A7D129] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {selectedCount}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 space-y-1">
          {section.options.map((opt) => {
            const isChecked = (selected[section.key] || []).includes(opt.value);
            return (
              <label
                key={opt.value}
                onClick={() => onChange(section.key, opt.value)} // 👈 ICI le fix
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm
                  ${isChecked ? 'bg-[#E8F5D0] text-[#2D5016]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                  ${isChecked ? 'bg-[#A7D129] border-[#A7D129]' : 'border-gray-300'}`}>
                  {isChecked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="leading-snug">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JobFilter({ onFilter }) {
  const [open, setOpen] = useState({ contractType: true, experienceLevel: false, educationLevel: false, location: false });
  const [selected, setSelected] = useState({});

  const toggleSection = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

 const handleCheck = (key, value) => {
  const current = selected[key] || [];
  const updated = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  const newSelected = { ...selected, [key]: updated };
  setSelected(newSelected);

  // Construit les filtres proprement
  const filters = {};
  Object.entries(newSelected).forEach(([k, vals]) => {
    if (vals && vals.length > 0) filters[k] = vals[0];
    else filters[k] = undefined; // 👈 undefined pour effacer le filtre
  });
  onFilter(filters);
};

  const totalSelected = Object.values(selected).flat().length;

  const handleReset = () => {
    setSelected({});
    onFilter({});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
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

      {/* Sections */}
      {SECTIONS.map((section) => (
        <FilterSection
          key={section.key}
          section={section}
          selected={selected}
          onChange={handleCheck}
          isOpen={open[section.key]}
          onToggle={() => toggleSection(section.key)}
        />
      ))}
    </div>
  );
}