"use client";

import { useState } from "react";

const EMPTY_FILTERS = { status: "", listingType: "", city: "", search: "" };
const TYPE_LABELS = { SALE: "Vente", RENT: "Location" };
const SELECT_CLASS = "border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-700";

export default function ListingFilters({ onChange, showStatus = true, listings = [] }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))].sort();
  const listingTypes = [...new Set(listings.map(l => l.listingType).filter(Boolean))];

  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const empty = { ...EMPTY_FILTERS };
    setFilters(empty);
    onChange(empty);
  };

  const hasActive = Object.values(filters).some(value => value !== "");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="relative">
        <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          aria-label="Rechercher par titre"
          value={filters.search}
          onChange={e => set("search", e.target.value)}
          placeholder="Rechercher par titre..."
          className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {showStatus && (
          <select aria-label="Statut" value={filters.status} onChange={e => set("status", e.target.value)} className={SELECT_CLASS}>
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvée</option>
            <option value="REJECTED">Rejetée</option>
          </select>
        )}

        {listingTypes.length > 1 && (
          <select aria-label="Type d'annonce" value={filters.listingType} onChange={e => set("listingType", e.target.value)} className={SELECT_CLASS}>
            <option value="">Vente &amp; Location</option>
            {listingTypes.map(type => (
              <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>
            ))}
          </select>
        )}

        {cities.length > 1 && (
          <select aria-label="Ville" value={filters.city} onChange={e => set("city", e.target.value)} className={SELECT_CLASS}>
            <option value="">Toutes les villes</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        )}

        {hasActive && (
          <button type="button" onClick={reset} className="text-xs text-gray-400 hover:text-red-500 transition font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200">
            ✕ Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
