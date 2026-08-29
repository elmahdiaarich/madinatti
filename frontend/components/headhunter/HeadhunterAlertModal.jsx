'use client';
import { useState, useEffect } from 'react';
import { alertService } from '@/services/alertService';
import { ALL_REGIONS, citiesByRegion } from '@/components/shared/FilterPanel';

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
const CONTRACT_OPTIONS = ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM', 'ALTERNANCE', 'ANAPEC', 'TEMPS_PARTIEL'];

export default function HeadhunterAlertModal({ token, initialFilters = {}, alertId = null, onClose, onSaved }) {
  const [form, setForm] = useState({
    search: initialFilters.search || '',
    categorySlug: initialFilters.categorySlug || '',
    educationLevel: initialFilters.educationLevel || '',
    experienceLevel: initialFilters.experienceLevel || '',
    contractType: initialFilters.contractType || '',
    region: initialFilters.region || '',
    city: initialFilters.city || '',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);
  const isEditing = !!alertId;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const cityOptions = form.region ? (citiesByRegion[form.region] || []).slice().sort((a, b) => a.localeCompare(b, 'fr')) : [];

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const filters = {};
      Object.entries(form).forEach(([k, v]) => { if (v) filters[k] = v; });
      if (isEditing) {
        const res = await alertService.update(alertId, filters, token);
        onSaved?.(res.data);
        onClose();
        return;
      }
      await alertService.create('headhunter', filters, token);
      setSaved(true);
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      setError(err?.response?.data?.message || (isEditing ? 'Erreur lors de la modification.' : 'Erreur lors de la création.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEditing ? "✏️ Modifier l'alerte" : "🔔 Créer une alerte candidat"}</h2>
            {!isEditing && <p className="text-xs text-gray-400 mt-0.5">Soyez notifié dès qu'un candidat correspond à vos critères</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot-clé</label>
                <input
                  type="text"
                  placeholder="ex: développeur React, comptable..."
                  value={form.search}
                  onChange={(e) => setForm((f) => ({ ...f, search: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Métier</label>
                <select value={form.categorySlug} onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Tous les métiers</option>
                  {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Niveau d'études</label>
                <select value={form.educationLevel} onChange={(e) => setForm((f) => ({ ...f, educationLevel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Tous niveaux</option>
                  {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Niveau d'expérience</label>
                <select value={form.experienceLevel} onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Toutes expériences</option>
                  {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type de contrat</label>
                <select value={form.contractType} onChange={(e) => setForm((f) => ({ ...f, contractType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Tous contrats</option>
                  {CONTRACT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Région</label>
                <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value, city: '' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Toutes les régions</option>
                  {ALL_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.region && cityOptions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                  <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
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
                {saving ? 'Enregistrement...' : (isEditing ? 'Enregistrer' : "Créer l'alerte")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}