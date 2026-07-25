'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../../services/pressService';
import { cities } from 'morocco-cities';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const inputCls = "w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm";

// Même composant que worker-profiles/create (mode single-image)
function PhotoGridUploader({ images, onChange, token, multiple = false, maxFiles = 1 }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) { setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`); return; }
    if (!multiple && images.length + files.length > 1) { setUploadError('Une seule photo autorisée.'); return; }

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
            <p className="text-sm font-semibold">Cliquez pour choisir une photo</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo</p>
          </div>
        )}
      </div>

      {uploadError && <p className="text-xs text-red-500">⚠ {uploadError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 w-24 h-24">
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

export default function CreateNewsArticlePage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '', description: '', language: 'FR', city: '', categoryId: '',
  });
  const [region, setRegion] = useState('');
  const [image, setImage] = useState([]);
  const sectionRefs = {
    title: useRef(null), description: useRef(null), image: useRef(null),
  };
  const ERROR_ORDER = ['title', 'description', 'image'];
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const submittedRef = useRef(false);
  const imageRef = useRef(image);
  imageRef.current = image;

  // Nettoyage best-effort : si l'utilisateur quitte sans soumettre, on détruit
  // l'image temp déjà uploadée sur Cloudinary pour éviter une fuite de stockage.
  useEffect(() => {
    return () => {
      if (!submittedRef.current && imageRef.current[0]?.url?.includes('madinatti/temp')) {
        fetch(`${API_URL}/upload/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url: imageRef.current[0].url }),
        }).catch(() => {}); // best-effort, on ne bloque jamais la navigation pour ça
      }
    };
  }, [token]);

  useEffect(() => {
    fetch(`${API_URL}/press/categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const hasUnsavedData = () =>
    !submittedRef.current && (form.title.trim() || form.description.trim() || image.length > 0);

  // Avertit avant fermeture d'onglet/rafraîchissement si du contenu a été saisi
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedData()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [form.title, form.description, image]);

  const MAX_CATEGORY_NAME_LENGTH = 40;

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      toast.error(`Le nom de la catégorie ne peut pas dépasser ${MAX_CATEGORY_NAME_LENGTH} caractères.`);
      return;
    }
    setCreatingCategory(true);
    try {
      const res = await pressService.createCategory(newCategoryName.trim());
      const cat = res.data;
      setCategories((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]));
      set('categoryId', cat.id);
      setNewCategoryName('');
      if (res.alreadyExisted) {
        toast.info(`"${cat.name}" existe déjà — sélectionnée automatiquement.`);
      } else {
        toast.success('Catégorie créée.');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setCreatingCategory(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Le titre est requis';
    if (!form.description.trim() || form.description.trim().length < 30) e.description = 'Décrivez l\'article (30 caractères min)';
    if (!form.language) e.language = 'Choisissez une langue';
    if (!image[0]?.url) e.image = 'Une photo est requise';
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
      await pressService.createArticle({
        title: form.title,
        description: form.description,
        language: form.language,
        city: form.city || null,
        categoryId: form.categoryId || null,
        imageUrl: image[0]?.url,
      });

      submittedRef.current = true; // empêche le cleanup-on-unmount de détruire l'image désormais utilisée
      toast.success('Article soumis ! Il est en attente de validation.', { title: 'Article créé ✦', duration: 5000 });
      router.push('/my-space/newsroom');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Une erreur est survenue', { duration: 7000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.journalistStatus !== 'APPROVED') {
    return (
      <div className="max-w-xl mx-auto p-8 text-center flex flex-col items-center gap-3">
        <div className="text-4xl">⏳</div>
        <h1 className="text-lg font-bold text-gray-900">Compte non encore validé</h1>
        <p className="text-sm text-gray-500">
          Vous devez attendre la validation de votre compte journaliste par un administrateur avant de pouvoir publier.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Nouvel article</h1>
      <p className="text-sm text-gray-400 mb-6">
        Votre article sera visible publiquement après validation par un administrateur.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div ref={sectionRefs.title}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Ex: Inauguration du nouveau marché municipal" className={inputCls} />
          {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title}</p>}
        </div>

        <div ref={sectionRefs.description}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={6} maxLength={8000} placeholder="Contenu de l'article..." className={`${inputCls} resize-none`} />
          <div className="flex items-center justify-between mt-1">
            {errors.description ? (
              <p className="text-red-500 text-xs">⚠ {errors.description}</p>
            ) : <span />}
            <p className={`text-xs ${form.description.trim().length < 30 ? 'text-gray-400' : form.description.length > 7800 ? 'text-amber-600 font-medium' : 'text-[#2D5016] font-medium'}`}>
              {form.description.length} / 8000 ({form.description.trim().length < 30 ? `${30 - form.description.trim().length} restants` : 'min. atteint'})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Langue *</label>
            <select value={form.language} onChange={(e) => set('language', e.target.value)} className={inputCls}>
              <option value="FR">Français</option>
              <option value="AR">العربية</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie</label>
            <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
              <option value="">Aucune</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#2D5016]"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                className="text-xs font-bold text-[#2D5016] hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
              >
                {creatingCategory ? '...' : '+ Créer'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Région</label>
            <select value={region} onChange={(e) => { setRegion(e.target.value); set('city', ''); }} className={inputCls}>
              <option value="">Choisir une région</option>
              {Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr')).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville</label>
            <select value={form.city} onChange={(e) => set('city', e.target.value)} disabled={!region}
              className={`${inputCls} ${!region ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <option value="">{region ? 'Choisir une ville' : "← Choisissez d'abord une région"}</option>
              {(citiesByRegion[region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {!region && (
              <p className="text-xs text-gray-400 mt-1">Sélectionnez d'abord une région pour activer ce champ.</p>
            )}
          </div>
        </div>

        <div ref={sectionRefs.image}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo *</label>
          <PhotoGridUploader images={image} onChange={setImage} token={token} multiple={false} maxFiles={1} />
          {errors.image && <p className="text-red-500 text-xs mt-1">⚠ {errors.image}</p>}
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
          {submitting ? 'Publication...' : '✦ Soumettre l\'article'}
        </button>
      </div>
    </div>
  );
}