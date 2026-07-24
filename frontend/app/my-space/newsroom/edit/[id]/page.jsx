'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../../../services/pressService';
import { cities } from 'morocco-cities';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const inputCls = "w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm";

// Même composant que create (mode single-image) — copie verbatim
function PhotoGridUploader({ images, onChange, token }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) { setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`); return; }
    if (images.length + files.length > 1) { setUploadError('Une seule photo autorisée.'); return; }

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
      onChange(json.files.map((f) => ({ url: f.url })));
    } catch {
      setUploadError("Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = () => onChange([]);

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
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">Envoi en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            <span className="text-2xl">📷</span>
            <p className="text-sm font-semibold">Cliquez pour changer la photo</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo</p>
          </div>
        )}
      </div>

      {uploadError && <p className="text-xs text-red-500">⚠ {uploadError}</p>}

      {images.length > 0 && (
        <div className="relative group rounded-xl overflow-hidden border-2 border-gray-200 w-24 h-24">
          <img src={images[0].url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button type="button" onClick={remove}
              className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditNewsArticlePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(null);
  const [region, setRegion] = useState('');
  const [image, setImage] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    pressService.getMyArticles()
      .then((res) => {
        const article = (res.data ?? []).find((a) => a.id === id);
        if (!article) { setNotFound(true); return; }
        setForm({
          title: article.title,
          description: article.description,
          language: article.language,
          city: article.city || '',
          categoryId: article.categoryId || '',
        });
        setImage(article.imageUrl ? [{ url: article.imageUrl }] : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/press/categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, [id, token]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
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
    if (!form.description.trim() || form.description.trim().length < 30) e.description = 'Description trop courte';
    if (!image[0]?.url) e.image = 'Une photo est requise';
    setErrors(e);
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      await pressService.updateArticle(id, {
        title: form.title,
        description: form.description,
        language: form.language,
        city: form.city || null,
        categoryId: form.categoryId || null,
        imageUrl: image[0]?.url,
      });

      toast.success('Article mis à jour ! Il repasse en attente de validation.', { title: 'Modifié ✦', duration: 5000 });
      router.push('/my-space/newsroom');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-gray-400">Chargement…</div>;

  if (notFound || !form) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center flex flex-col items-center gap-3">
        <div className="text-4xl">🔍</div>
        <h1 className="text-lg font-bold text-gray-900">Article introuvable</h1>
        <p className="text-sm text-gray-500">Cet article n'existe pas ou ne vous appartient pas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Modifier l'article</h1>
      <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6">
        ⚠ Toute modification repasse l'article en attente de validation par un administrateur.
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={6} className={`${inputCls} resize-none`} />
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
            <select value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls}>
              <option value="">{form.city || 'Choisir une ville'}</option>
              {(citiesByRegion[region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo *</label>
          <PhotoGridUploader images={image} onChange={setImage} token={token} />
          {errors.image && <p className="text-red-500 text-xs mt-1">⚠ {errors.image}</p>}
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
          {submitting ? 'Mise à jour...' : '✦ Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}