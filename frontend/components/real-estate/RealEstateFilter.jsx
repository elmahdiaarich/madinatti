"use client";

import { useState, useEffect } from "react";
import { realEstateService } from "@/services/realEstateService";

const LISTING_TYPES = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

export default function RealEstateFilter({ onFilter }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    listingType: "",
    categoryId: "",
    minPrice: "",
    maxPrice: "",
    rooms: "",
    city: "",
  });

  // ── Fetch immobilier categories from API ───────────────────
  useEffect(() => {
    realEstateService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Erreur chargement catégories:", err));
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleApply = () => {
    const clean = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ""),
    );
    onFilter(clean);
  };

  const handleReset = () => {
    setForm({
      listingType: "",
      categoryId: "",
      minPrice: "",
      maxPrice: "",
      rooms: "",
      city: "",
    });
    onFilter({});
  };

  const label =
    "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const input =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition";
  const select = input + " bg-white cursor-pointer";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-primary-dark"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        <span className="text-primary-dark font-semibold text-sm">
          Filtrer les offres
        </span>
      </div>

      {/* Type d'annonce */}
      <div>
        <p className={label}>Type</p>
        <div className="flex gap-2">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() =>
                set("listingType", form.listingType === t.value ? "" : t.value)
              }
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                form.listingType === t.value
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary-mint"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de bien — fetched from API */}
      <div>
        <p className={label}>Type de bien</p>
        <select
          className={select}
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
        >
          <option value="">Tous</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
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
          onChange={(e) => set("city", e.target.value)}
        />
      </div>

      {/* Prix */}
      <div>
        <p className={label}>Prix (MAD)</p>
        <div className="flex gap-2">
          <input
            className={input}
            placeholder="Min"
            type="number"
            value={form.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
          />
          <input
            className={input}
            placeholder="Max"
            type="number"
            value={form.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Pièces */}
      <div>
        <p className={label}>Pièces min.</p>
        <select
          className={select}
          value={form.rooms}
          onChange={(e) => set("rooms", e.target.value)}
        >
          <option value="">Peu importe</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleApply}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition"
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
