'use client';

import { useState } from 'react';

const LISTING_TYPES  = [
  { value: 'SALE', label: 'Vente' },
  { value: 'RENT', label: 'Location' },
];
const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'VILLA',     label: 'Villa'       },
  { value: 'HOUSE',     label: 'Maison'      },
  { value: 'STUDIO',    label: 'Studio'      },
  { value: 'LAND',      label: 'Terrain'     },
  { value: 'OFFICE',    label: 'Bureau'      },
  { value: 'SHOP',      label: 'Commerce'    },
];

export default function RealEstateFilter({ onFilter }) {
  const [form, setForm] = useState({
    listingType:  '',
    propertyType: '',
    minPrice:     '',
    maxPrice:     '',
    rooms:        '',
    city:         '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleApply = () => {
    const clean = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '')
    );
    onFilter(clean);
  };

  const handleReset = () => {
    setForm({ listingType: '', propertyType: '', minPrice: '', maxPrice: '', rooms: '', city: '' });
    onFilter({});
  };

  const label = 'block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5';
  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition';
  const select = input + ' bg-white cursor-pointer';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <h3 className="font-extrabold text-gray-800 text-sm">Filtres</h3>

      {/* Type d'annonce */}
      <div>
        <p className={label}>Type</p>
        <div className="flex gap-2">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => set('listingType', form.listingType === t.value ? '' : t.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                form.listingType === t.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-mint'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien */}
      <div>
        <p className={label}>Type de bien</p>
        <select className={select} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
          <option value="">Tous</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div>
        <p className={label}>Ville</p>
        <input
          className={input}
          placeholder="ex: Casablanca"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
        />
      </div>

      {/* Prix */}
      <div>
        <p className={label}>Prix (MAD)</p>
        <div className="flex gap-2">
          <input className={input} placeholder="Min" type="number" value={form.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
          <input className={input} placeholder="Max" type="number" value={form.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
        </div>
      </div>

      {/* Pièces */}
      <div>
        <p className={label}>Pièces min.</p>
        <select className={select} value={form.rooms} onChange={(e) => set('rooms', e.target.value)}>
          <option value="">Peu importe</option>
          {[1,2,3,4,5].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-orange-600 transition"
        >
          Appliquer
        </button>
        <button
          onClick={handleReset}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}