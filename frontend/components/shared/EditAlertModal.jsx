'use client';
import { useState } from 'react';
import { alertService } from '@/services/alertService';
import { ALL_REGIONS, citiesByRegion } from '@/components/shared/FilterPanel';

const CONTRACT_OPTIONS = ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM', 'ALTERNANCE', 'ANAPEC', 'TEMPS_PARTIEL'];

export default function EditAlertModal({ alert, token, onClose, onSaved }) {
  const f = alert.filters || {};
  const [form, setForm] = useState({
    keyword: f.keyword || '',
    contractType: f.contractType || '',
    region: f.region || '',
    city: f.city || '',
    minPrice: f.minPrice || '',
    maxPrice: f.maxPrice || '',
    make: f.make || '',
    model: f.model || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cityOptions = form.region ? (citiesByRegion[form.region] || []).slice().sort((a, b) => a.localeCompare(b, 'fr')) : [];

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const filters = { ...f };
      if (alert.module === 'emploi') {
        filters.keyword = form.keyword || undefined;
        filters.contractType = form.contractType || undefined;
      }
      if (alert.module === 'immobilier' || alert.module === 'automobile') {
        filters.minPrice = form.minPrice || undefined;
        filters.maxPrice = form.maxPrice || undefined;
      }
      if (alert.module === 'automobile') {
        filters.make = form.make || undefined;
        filters.model = form.model || undefined;
      }
      filters.region = form.region || undefined;
      filters.city = form.city || undefined;
      Object.keys(filters).forEach((k) => { if (filters[k] === undefined) delete filters[k]; });

      const res = await alertService.update(alert.id, filters, token);
      onSaved(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">✏️ Modifier l'alerte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          {alert.module === 'emploi' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot-clé</label>
                <input type="text" value={form.keyword} onChange={(e) => setForm((s) => ({ ...s, keyword: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type de contrat</label>
                <select value={form.contractType} onChange={(e) => setForm((s) => ({ ...s, contractType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] bg-white">
                  <option value="">Tous les contrats</option>
                  {CONTRACT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          {(alert.module === 'immobilier' || alert.module === 'automobile') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix min</label>
                <input type="number" value={form.minPrice} onChange={(e) => setForm((s) => ({ ...s, minPrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix max</label>
                <input type="number" value={form.maxPrice} onChange={(e) => setForm((s) => ({ ...s, maxPrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129]" />
              </div>
            </div>
          )}

          {alert.module === 'automobile' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Marque</label>
                <input type="text" value={form.make} onChange={(e) => setForm((s) => ({ ...s, make: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Modèle</label>
                <input type="text" value={form.model} onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129]" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Région</label>
            <select value={form.region} onChange={(e) => setForm((s) => ({ ...s, region: e.target.value, city: '' }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] bg-white">
              <option value="">Toutes les régions</option>
              {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.region && cityOptions.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
              <select value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] bg-white">
                <option value="">Toutes les villes</option>
                {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}