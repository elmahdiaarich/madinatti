'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cities } from 'morocco-cities';

const ALL_CITIES = cities.map((c) => ({ name: c.name, region: c.region_name }));

// Derive all regions directly from the morocco-cities library so the list is
// always complete and the value always exactly matches what's stored in the DB.
const ALL_REGIONS = [...new Set(cities.map((c) => c.region_name))]
  .sort((a, b) => a.localeCompare(b, 'fr'))
  .map((region) => ({ label: region, value: region }));

// Strip diacritics so typing "Kenitra" matches "Kénitra", "Sale" matches "Salé", etc.
const normalize = (str) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function LocationCombobox({ value, onChange, placeholder = 'Ville ou région...' }) {
  const [inputValue, setInputValue]   = useState(value?.label || '');
  const [open, setOpen]               = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);

  // Sync when value changes from outside
  useEffect(() => {
    setInputValue(value?.label || '');
  }, [value?.label]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = useCallback((e) => {
    const q = e.target.value;
    setInputValue(q);
    // Clear selection when user types something new
    if (value) onChange(null);

    if (q.length < 2) {
      setSuggestions([]);
      setOpen(true);
      return;
    }

    const q_lower = normalize(q);
    const matched = ALL_CITIES
      .filter((c) => normalize(c.name).includes(q_lower))
      .slice(0, 8);
    setSuggestions(matched);
    setOpen(true);
  }, [value, onChange]);

  const selectCity = (city) => {
    setInputValue(city.name);
    setOpen(false);
    onChange({ type: 'city', label: city.name, raw: city.name });
  };

  const selectRegion = (chip) => {
    setInputValue(chip.label);
    setOpen(false);
    onChange({ type: 'region', label: chip.label, raw: chip.value });
  };

  const showChips       = open && inputValue.length < 2;
  const showSuggestions = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* Input */}
      <div className="flex items-center gap-2 h-full">
        <svg
          className="w-4 h-4 text-gray-300 shrink-0"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-700 bg-transparent py-2 min-w-0"
        />
      </div>

      {/* Dropdown */}
      {open && (showChips || showSuggestions) && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg overflow-y-auto"
          style={{ minWidth: '260px', maxHeight: '320px' }}
        >
          {/* Region list */}
          {showChips && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 pt-3 pb-1">
                Toutes les régions
              </p>
              {ALL_REGIONS.map((chip) => (
                <button
                  key={chip.value}
                  onMouseDown={(e) => { e.preventDefault(); selectRegion(chip); }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                    value?.raw === chip.value
                      ? 'bg-gray-100 font-semibold text-gray-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* City suggestions */}
          {showSuggestions && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 pt-3 pb-1">
                Villes
              </p>
              {suggestions.map((city) => (
                <button
                  key={`${city.name}-${city.region}`}
                  onMouseDown={(e) => { e.preventDefault(); selectCity(city); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-800">{city.name}</span>
                  <span className="text-gray-400 text-xs ml-auto truncate max-w-[120px]">{city.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
