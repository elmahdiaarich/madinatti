'use client';

import { useState } from 'react';

const STATUS_OPTIONS = [
  { label: 'Tous les statuts', value: '' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Approuvée', value: 'APPROVED' },
  { label: 'Rejetée', value: 'REJECTED' },
];

const LISTING_TYPE_LABELS = { SALE: 'Vente', RENT: 'Location' };
const PROPERTY_TYPE_LABELS = {
  APARTMENT: 'Appartement', VILLA: 'Villa', HOUSE: 'Maison',
  STUDIO: 'Studio', LAND: 'Terrain', OFFICE: 'Bureau', SHOP: 'Commerce',
};

export default function ListingFilters({ onChange, showStatus = true, listings = [] }) {
  const [filters, setFilters] = useState({
    status: '', listingType: '', city: '', search: '',
  });

  // Derive unique values from actual listings
  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))].sort();
  const listingTypes = [...new Set(listings.map(l => l.listingType).filter(Boolean))];

  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const empty = { status: '', listingType: '', city: '', search: '' };
    setFilters(empty);
    onChange(empty);
  };

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Rechercher par titre..."
          className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Status */}
        {showStatus && (
          <select
            value={filters.status}
            onChange={e => set('status', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Listing type — only show types that exist in user's listings */}
        {listingTypes.length > 1 && (
          <select
            value={filters.listingType}
            onChange={e => set('listingType', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="">Vente & Location</option>
            {listingTypes.map(t => (
              <option key={t} value={t}>{LISTING_TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        )}

        {/* City — only cities that exist in user's listings */}
        {cities.length > 1 && (
          <select
            value={filters.city}
            onChange={e => set('city', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            <option value="">Toutes les villes</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Reset */}
        {hasActive && (
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-red-500 transition font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}