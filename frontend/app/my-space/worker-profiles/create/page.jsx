'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { workerProfilesService } from '../../../../services/WorkerProfilesService';
import { cities } from 'morocco-cities';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
const MAX_PROFILES = 5;
const DAYS = [
  { key: 'mon', label: 'Lundi' }, { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' }, { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' }, { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' },
];

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const inputCls = "w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm";

// ── Reusable multi-photo uploader (grid + remove), same pattern as cars ──
function PhotoGridUploader({ images, onChange, token, multiple = true, maxFiles = 6 }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`);
      return;
    }
    if (!multiple && images.length + files.length > 1) {
      setUploadError('Une seule photo autorisée ici.');
      return;
    }
    if (images.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} photos.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));

    try {
      const res = await fetch(`${API_URL}/upload/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error('Échec du téléchargement');
      const newImages = json.files.map((f) => ({ url: f.url }));
      onChange(multiple ? [...images, ...newImages] : newImages);
    } catch {
      setUploadError("Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
          uploading ? 'border-[#A7D129] bg-[#E8F5D0]/40 cursor-wait'
          : uploadError ? 'border-red-300 bg-red-50 hover:border-red-400'
          : 'border-gray-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5'
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">Envoi en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            <span className="text-2xl">📷</span>
            <p className="text-sm font-semibold">Cliquez pour choisir {multiple ? 'des photos' : 'une photo'}</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo{multiple ? ` — jusqu'à ${maxFiles} photos` : ''}</p>
          </div>
        )}
      </div>

      {uploadError && <p className="text-xs text-red-500">⚠ {uploadError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 w-20 h-20">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button type="button" onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Availability picker — day toggle + start/end hour ──
function AvailabilityPicker({ availability, onChange }) {
  const isEnabled = (day) => Array.isArray(availability[day]);

  const toggleDay = (day) => {
    const next = { ...availability };
    if (isEnabled(day)) delete next[day];
    else next[day] = [9, 18];
    onChange(next);
  };

  const setHour = (day, index, value) => {
    const next = { ...availability };
    const range = [...(next[day] || [9, 18])];
    range[index] = Number(value);
    next[day] = range;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(({ key, label }) => {
        const enabled = isEnabled(key);
        const range = availability[key] || [9, 18];
        return (
          <div key={key} className="flex items-center gap-3 py-1.5">
            <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
              <input type="checkbox" checked={enabled} onChange={() => toggleDay(key)}
                className="w-4 h-4 accent-[#2D5016]" />
              <span className={`text-sm ${enabled ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{label}</span>
            </label>
            {enabled && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>de</span>
                <select value={range[0]} onChange={(e) => setHour(key, 0, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h</option>)}
                </select>
                <span>à</span>
                <select value={range[1]} onChange={(e) => setHour(key, 1, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h}h</option>)}
                </select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateWorkerProfilePage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToTask = searchParams.get('returnToTask');
  const presetCategorySlug = searchParams.get('categorySlug');

  const [checkingCap, setCheckingCap] = useState(true);
  const [atCap, setAtCap] = useState(false);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    headline: '', description: '', categoryId: '',
    region: '', city: '', pricingUnit: 'HOUR', rate: '', isNegotiable: false,
    yearsExperience: '', serviceRadius: '',
  });
  const [photo, setPhoto] = useState([]);          // single-item array for the uploader
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [availability, setAvailability] = useState({});

  const sectionRefs = {
    headline: useRef(null), description: useRef(null), categoryId: useRef(null),
    region: useRef(null), city: useRef(null), rate: useRef(null),
  };
  const ERROR_ORDER = ['headline', 'description', 'categoryId', 'region', 'city', 'rate'];

  useEffect(() => {
    if (!token) return;
    workerProfilesService.getMyWorkerProfiles(token)
      .then((res) => setAtCap((res.data ?? []).length >= MAX_PROFILES))
      .finally(() => setCheckingCap(false));
  }, [token]);

  useEffect(() => {
    fetch(`${API_URL}/categories?module=mini-jobs`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCategories(d.data);
          if (presetCategorySlug) {
            const match = d.data.find((c) => c.slug === presetCategorySlug);
            if (match) set('categoryId', match.id);
          }
        }
      })
      .catch(() => {});
  }, [presetCategorySlug]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const handleRegionChange = (region) => { set('region', region); set('city', ''); };

  const validate = () => {
    const e = {};
    if (!form.headline.trim()) e.headline = 'Le titre est requis';
    if (!form.description.trim() || form.description.trim().length < 20) e.description = 'Décrivez votre service (20 caractères min)';
    if (!form.categoryId) e.categoryId = 'Choisissez une catégorie';
    if (!form.region) e.region = 'Choisissez une région';
    if (!form.city) e.city = 'Choisissez une ville';
    if (!form.isNegotiable && !form.rate) e.rate = 'Indiquez un tarif ou cochez "à négocier"';
    setErrors(e);
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      if (firstKey && sectionRefs[firstKey]?.current) {
        sectionRefs[firstKey].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await workerProfilesService.createWorkerProfile({
        headline: form.headline,
        description: form.description,
        categoryId: form.categoryId,
        region: form.region,
        city: form.city,
        pricingUnit: form.pricingUnit,
        rate: form.isNegotiable ? null : Number(form.rate),
        isNegotiable: form.isNegotiable,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        serviceRadius: form.serviceRadius ? Number(form.serviceRadius) : null,
        photo: photo[0]?.url || null,
        portfolioImages,
        availability: Object.keys(availability).length > 0 ? availability : null,
      }, token);

      toast.success('Profil créé ! Il est en attente de validation.', { title: 'Profil créé ✦', duration: 5000 });

      if (returnToTask) {
        router.push(`/mini-jobs/tasks/${returnToTask}`);
      } else {
        router.push('/my-space/worker-profiles');
      }
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingCap) {
    return <div className="p-8 text-sm text-gray-400">Chargement…</div>;
  }

  if (atCap) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center flex flex-col items-center gap-3">
        <div className="text-4xl">🚫</div>
        <h1 className="text-lg font-bold text-gray-900">Limite de profils atteinte</h1>
        <p className="text-sm text-gray-500">
          Vous avez déjà {MAX_PROFILES} profils prestataire. Supprimez-en un depuis
          "Mes profils prestataire" pour en créer un nouveau.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Créer un profil prestataire</h1>
      <p className="text-sm text-gray-400 mb-6">
        Votre profil sera visible publiquement après validation par un administrateur.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div ref={sectionRefs.headline}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
          <input value={form.headline} onChange={(e) => set('headline', e.target.value)}
            placeholder="Ex: Plombier expérimenté, interventions rapides" className={inputCls} />
          {errors.headline && <p className="text-red-500 text-xs mt-1">⚠ {errors.headline}</p>}
        </div>

        <div ref={sectionRefs.description}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={5} placeholder="Décrivez votre service, votre expérience..." className={`${inputCls} resize-none`} />
          {errors.description && <p className="text-red-500 text-xs mt-1">⚠ {errors.description}</p>}
        </div>

        <div ref={sectionRefs.categoryId}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie *</label>
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
            <option value="">Choisir une catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">⚠ {errors.categoryId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div ref={sectionRefs.region}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Région *</label>
            <select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} className={inputCls}>
              <option value="">Choisir une région</option>
              {Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr')).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-1">⚠ {errors.region}</p>}
          </div>
          <div ref={sectionRefs.city}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville *</label>
            <select value={form.city} onChange={(e) => set('city', e.target.value)} disabled={!form.region} className={inputCls}>
              <option value="">{form.region ? 'Choisir une ville' : "← Choisissez d'abord une région"}</option>
              {(citiesByRegion[form.region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.city && <p className="text-red-500 text-xs mt-1">⚠ {errors.city}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unité de tarification</label>
            <select value={form.pricingUnit} onChange={(e) => set('pricingUnit', e.target.value)} className={inputCls}>
              <option value="HOUR">Par heure</option>
              <option value="DAY">Par jour</option>
              <option value="TASK">Par forfait</option>
            </select>
          </div>
          <div ref={sectionRefs.rate}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tarif (MAD)</label>
            <input type="number" value={form.rate} onChange={(e) => set('rate', e.target.value)}
              disabled={form.isNegotiable} placeholder="Ex: 100" className={inputCls} />
            {errors.rate && <p className="text-red-500 text-xs mt-1">⚠ {errors.rate}</p>}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={form.isNegotiable}
            onChange={(e) => set('isNegotiable', e.target.checked)}
            className="w-4 h-4 accent-[#2D5016]" />
          Prix à négocier
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Années d'expérience</label>
            <input type="number" value={form.yearsExperience} onChange={(e) => set('yearsExperience', e.target.value)}
              placeholder="Ex: 5" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rayon d'intervention (km)</label>
            <input type="number" value={form.serviceRadius} onChange={(e) => set('serviceRadius', e.target.value)}
              placeholder="Ex: 15" className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo de profil (couverture)</label>
          <PhotoGridUploader images={photo} onChange={setPhoto} token={token} multiple={false} maxFiles={1} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Portfolio (optionnel, jusqu'à 6 photos)</label>
          <PhotoGridUploader images={portfolioImages} onChange={setPortfolioImages} token={token} multiple={true} maxFiles={6} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Disponibilité (optionnel)</label>
          <AvailabilityPicker availability={availability} onChange={setAvailability} />
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
          {submitting ? 'Création...' : '✦ Créer le profil'}
        </button>
      </div>
    </div>
  );
}