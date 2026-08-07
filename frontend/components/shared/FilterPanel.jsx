'use client';

import { cities } from 'morocco-cities';

// ─── Données région/ville partagées — construites une seule fois ─────────────
export const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

export const ALL_REGIONS = Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr'));

// ─── Helpers pour construire les options région/ville ─────────────────────────
// countsMap est optionnel : si fourni, filtre/trie par count ; sinon liste brute triée.
export function buildRegionOptions(countsMap) {
  return ALL_REGIONS.map((regionName) => ({
    value: regionName,
    label: regionName,
    count: countsMap?.[regionName],
  })).filter((r) => r.count === undefined || r.count > 0);
}

export function buildCityOptions(selectedRegion, countsMap) {
  const regionCities = selectedRegion
    ? (citiesByRegion[selectedRegion] || [])
    : Object.values(citiesByRegion).flat();

  return regionCities
    .map((cityName) => ({
      value: cityName,
      label: cityName,
      count: countsMap?.[cityName],
    }))
    .filter((c) => c.count === undefined || c.count > 0)
    .sort((a, b) => {
      if (a.count !== undefined && b.count !== undefined) return b.count - a.count;
      return a.label.localeCompare(b.label, 'fr');
    });
}

// ─── Skeleton de chargement ────────────────────────────────────────────────────
export function FilterSkeleton() {
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

// ─── Une option de filtre (checkbox stylée) ────────────────────────────────────
export function FilterOption({ label, count, isChecked, onClick }) {
  return (
    <label
      onClick={onClick}
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
      <span className="leading-snug flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center shrink-0 transition-colors
          ${isChecked ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {count.toLocaleString('fr-MA')}
        </span>
      )}
    </label>
  );
}

// ─── Une section pliable ───────────────────────────────────────────────────────
export function FilterSection({ icon, label, badge, isOpen, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {badge > 0 && (
            <span className="text-[10px] bg-[#A7D129] text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {badge}
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
      {isOpen && children}
    </div>
  );
}

// ─── En-tête dégradé avec compteur + réinitialiser ─────────────────────────────
export function FilterHeader({ icon, title, totalSelected, onReset }) {
  return (
    <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1f] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-white font-semibold text-sm">{title}</span>
        {totalSelected > 0 && (
          <span className="bg-[#A7D129] text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {totalSelected}
          </span>
        )}
      </div>
      {totalSelected > 0 && (
        <button
          onClick={onReset}
          className="text-white/70 hover:text-white text-xs underline transition-colors"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}

// ─── Ligne toggle (switch on/off) ──────────────────────────────────────────────
export function ToggleRow({ icon, label, checked, onToggle }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
          checked ? 'bg-[#2D5016]' : 'bg-gray-200'
        }`}
      >
        <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`} />
      </button>
    </div>
  );
}