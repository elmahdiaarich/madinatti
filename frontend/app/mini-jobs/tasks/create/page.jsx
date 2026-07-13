'use client';
import { useState, useEffect,useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { taskRequestsService } from '../../../../services/TaskRequestsService';
import { cities } from 'morocco-cities';
import MapPicker from '@/components/shared/MapPicker';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

function CreateTaskRequestContent() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', categorySlug: '',
    region: '', city: '', location: '', budget: '', neededDate: '',
    latitude: '', longitude: '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const loadCategories = () => {
    setLoadingCategories(true);
    setCategoriesError(false);
    fetch(`${API_URL}/categories?module=mini-jobs`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
        else setCategoriesError(true);
      })
      .catch(() => setCategoriesError(true))
      .finally(() => setLoadingCategories(false));
  };

  useEffect(() => { loadCategories(); }, []);

  const validateField = (key, val) => {
    switch (key) {
      case 'title':        return val.trim() ? '' : 'Le titre est requis';
      case 'description':  return val.trim().length >= 20 ? '' : 'Décrivez votre besoin (20 caractères min)';
      case 'categorySlug': return val ? '' : 'Choisissez une catégorie';
      case 'region':        return val ? '' : 'Choisissez une région';
      case 'city':          return val ? '' : 'Choisissez une ville';
      case 'neededDate':    return val ? '' : 'Choisissez une date';
      default:              return '';
    }
  };

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (touched[k] ? { ...e, [k]: validateField(k, v) } : e));
  };

  const handleBlur = (k) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((e) => ({ ...e, [k]: validateField(k, form[k]) }));
  };

  const selectCategory = (slug) => {
    setForm((f) => ({ ...f, categorySlug: slug }));
    setErrors((e) => ({ ...e, categorySlug: '' }));
    setTouched((t) => ({ ...t, categorySlug: true }));
  };

  const handleRegionChange = (region) => {
    set('region', region);
    set('city', '');
    setForm((f) => ({ ...f, latitude: '', longitude: '' }));
    setFlyTo(null);
  };

  const geocodeAddress = useCallback(async (city, address) => {
    if (!city) return;
    setGeocoding(true);
    try {
      const q = encodeURIComponent(`${address ? address + ', ' : ''}${city}, Maroc`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
        setFlyTo({ lat: parseFloat(lat), lng: parseFloat(lng), zoom: address ? 15 : 12 });
      }
    } catch {
      // silencieux — l'utilisateur peut toujours épingler manuellement sur la carte
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleCityChange = async (cityName) => {
    set('city', cityName);
    if (!cityName) return;
    await geocodeAddress(cityName, form.location || '');
  };

  useEffect(() => {
    if (!form.city || !form.location.trim()) return;
    const t = setTimeout(() => geocodeAddress(form.city, form.location), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location, form.city]);

  const validate = () => {
    const keys = ['title', 'description', 'categorySlug', 'region', 'city', 'neededDate'];
    const e = {};
    keys.forEach((k) => {
      const err = validateField(k, form[k]);
      if (err) e[k] = err;
    });
    setErrors(e);
    setTouched(Object.fromEntries(keys.map((k) => [k, true])));
    return Object.keys(e).length === 0;
  };

  const isFormComplete =
    !validateField('title', form.title) &&
    !validateField('description', form.description) &&
    !!form.categorySlug && !!form.region && !!form.city && !!form.neededDate;

  const selectedCategory = categories.find((c) => c.slug === form.categorySlug);
  const filteredCategories = categorySearch.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(categorySearch.trim().toLowerCase()))
    : categories;

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Veuillez corriger les champs en rouge avant de continuer.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await taskRequestsService.createTaskRequest({
        title: form.title,
        description: form.description,
        categorySlug: form.categorySlug,
        region: form.region,
        city: form.city,
        location: form.location || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        budget: form.budget ? Number(form.budget) : null,
        neededDate: form.neededDate,
      }, token);
      toast.success('Votre demande a été publiée !', { title: 'Demande publiée ✦', duration: 5000 });
      const created = res.data ?? res;
      router.push(created?.id ? `/mini-jobs/tasks/${created.id}` : '/mini-jobs');
    } catch (err) {
      // Dépend de err.code renvoyé par le wrapper apiFetch — à confirmer.
      if (err.code === 'PROFILE_INCOMPLETE') {
        toast.error('Complétez votre profil (téléphone, ville) avant de publier une demande.', { title: 'Profil incomplet' });
        router.push('/my-space/profile');
      } else if (err.code === 'INVALID_CATEGORY') {
        toast.error('Cette catégorie est invalide, veuillez la resélectionner.');
      } else {
        toast.error(err.message || 'Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push('/mini-jobs')} className="text-white/60 hover:text-white transition text-xs flex items-center gap-1 mb-1">
            ← Retour
          </button>
          <h1 className="text-lg font-extrabold">Publier une demande</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre de la demande *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} onBlur={() => handleBlur('title')}
              placeholder="Ex: Réparation fuite d'eau urgente"
              className={`w-full bg-white border-2 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] text-sm
                ${errors.title ? 'border-red-400' : 'border-[#2D5016] focus:border-[#A7D129]'}`} />
            {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} onBlur={() => handleBlur('description')}
              rows={5} placeholder="Décrivez précisément ce dont vous avez besoin..."
              className={`w-full bg-white border-2 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] text-sm resize-none
                ${errors.description ? 'border-red-400' : 'border-[#2D5016] focus:border-[#A7D129]'}`} />
            <div className="flex justify-between items-center mt-1">
              <span>{errors.description && <p className="text-red-500 text-xs">⚠ {errors.description}</p>}</span>
              <span className={`text-xs ${form.description.trim().length < 20 ? 'text-gray-400' : 'text-[#2D5016] font-semibold'}`}>
                {form.description.trim().length}/20 min
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Catégorie *</label>
              {selectedCategory && <span className="text-xs font-bold text-[#2D5016]">{selectedCategory.name} ✓</span>}
            </div>

            {loadingCategories ? (
              <p className="text-xs text-gray-400 py-3">Chargement des catégories...</p>
            ) : categoriesError ? (
              <div className="text-xs text-red-500 py-3 flex items-center gap-3">
                <span>Impossible de charger les catégories.</span>
                <button type="button" onClick={loadCategories} className="underline font-semibold">Réessayer</button>
              </div>
            ) : (
              <>
                {categories.length > 8 && (
                  <input value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Rechercher une catégorie..."
                    className="w-full bg-white border-2 border-gray-200 text-black rounded-xl px-4 py-2 mb-2 outline-none focus:border-[#A7D129] text-sm" />
                )}
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredCategories.map((c) => (
                    <button key={c.slug} type="button" onClick={() => selectCategory(c.slug)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all
                        ${form.categorySlug === c.slug ? 'border-[#A7D129] bg-[#E8F5D0] text-[#2D5016]' : 'border-gray-200 text-gray-600 hover:border-[#A7D129]/50'}`}>
                      {c.name}
                    </button>
                  ))}
                  {filteredCategories.length === 0 && (
                    <p className="col-span-2 text-xs text-gray-400 py-2">Aucune catégorie ne correspond.</p>
                  )}
                </div>
              </>
            )}
            {errors.categorySlug && <p className="text-red-500 text-xs mt-1">⚠ {errors.categorySlug}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Région *</label>
              <select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} onBlur={() => handleBlur('region')}
                className={`w-full bg-white border-2 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] text-sm
                  ${errors.region ? 'border-red-400' : 'border-[#2D5016] focus:border-[#A7D129]'}`}>
                <option value="">Choisir une région</option>
                {Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr')).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {errors.region && <p className="text-red-500 text-xs mt-1">⚠ {errors.region}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville *</label>
<select value={form.city} onChange={(e) => handleCityChange(e.target.value)} onBlur={() => handleBlur('city')} disabled={!form.region}                className={`w-full bg-white border-2 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] text-sm
                  ${errors.city ? 'border-red-400' : 'border-[#2D5016] focus:border-[#A7D129]'}`}>
                <option value="">{form.region ? 'Choisir une ville' : "← Choisissez d'abord une région"}</option>
                {(citiesByRegion[form.region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">⚠ {errors.city}</p>}
            </div>
          </div>

<div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Quartier / Adresse précise <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <div className="relative">
              <input value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="Ex: Maarif, face au Twin Center"
                className="w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm" />
              {geocoding && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Aide le prestataire à vous situer précisément. Vous pouvez aussi épingler la position sur la carte.
            </p>
          </div>

          {form.city && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Position sur la carte <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <MapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                flyTo={flyTo}
                onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Budget estimé (MAD) <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="number" value={form.budget} onChange={(e) => set('budget', e.target.value)}
                placeholder="Ex: 300"
                className="w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date souhaitée *</label>
              <input type="date" value={form.neededDate} min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('neededDate', e.target.value)} onBlur={() => handleBlur('neededDate')}
                className={`w-full bg-white border-2 text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] text-sm
                  ${errors.neededDate ? 'border-red-400' : 'border-[#2D5016] focus:border-[#A7D129]'}`} />
              {errors.neededDate && <p className="text-red-500 text-xs mt-1">⚠ {errors.neededDate}</p>}
            </div>
          </div>

          {isFormComplete && (
            <div className="bg-[#E8F5D0]/60 border border-[#A7D129]/30 rounded-xl p-4 text-xs text-[#2D5016] space-y-1">
              <p className="font-bold mb-1.5">Récapitulatif</p>
              <p>📌 {form.title}</p>
              <p>🏷️ {selectedCategory?.name}</p>
              <p>📍 {form.location ? `${form.location}, ` : ''}{form.city}, {form.region}</p>
              <p>📅 {fmtDateLong(form.neededDate)}</p>
              <p>💰 {form.budget ? `${Number(form.budget).toLocaleString('fr-MA')} MAD` : 'Budget à discuter'}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
            {submitting ? 'Publication...' : '✦ Publier la demande'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateTaskRequestPage() {
  return (
    <ProtectedRoute roles={['citizen']}>
      <CreateTaskRequestContent />
    </ProtectedRoute>
  );
}