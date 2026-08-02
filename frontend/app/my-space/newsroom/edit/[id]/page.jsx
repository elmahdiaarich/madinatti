'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../../../services/pressService';
import { cities } from 'morocco-cities';
import VideoUploader from '@/components/press/VideoUploader';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
const LANG_STORAGE_KEY = 'madinatti_journalist_press_lang';

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const inputCls = "w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm";

// ── Traductions du formulaire journaliste (identiques à create/page.jsx) ──
const LABELS = {
  FR: {
    loading: 'Chargement…',
    notFoundTitle: 'Article introuvable',
    notFoundBody: "Cet article n'existe pas ou ne vous appartient pas.",
    pageTitle: "Modifier l'article",
    pageSubtitle: 'Les modifications sont republiées immédiatement.',
    contentTypeLabel: 'Type de contenu',
    typeText: 'Texte',
    typeVideo: 'Vidéo',
    titleLabel: 'Titre *',
    descriptionLabel: 'Description *',
    descriptionLabelOptional: 'Description (optionnelle)',
    remaining: (n) => `${n} restants`,
    minReached: 'min. atteint',
    categoryLabel: 'Catégorie',
    categoryNone: 'Aucune',
    newCategoryPlaceholder: 'Nouvelle catégorie...',
    createCategoryButton: '+ Créer',
    regionLabel: 'Région',
    regionPlaceholder: 'Choisir une région',
    cityLabel: 'Ville',
    cityPlaceholder: 'Choisir une ville',
    photoLabel: 'Photo *',
    videoLabel: 'Vidéo *',
    submitButton: '✦ Enregistrer les modifications',
    submitting: 'Mise à jour...',
    toastSuccessTitle: 'Modifié ✦',
    toastSuccessBody: 'Article mis à jour !',
    toastGenericError: 'Erreur lors de la mise à jour',
    errTitleRequired: 'Le titre est requis',
    errDescriptionShort: 'Description trop courte',
    errImageRequired: 'Une photo est requise',
    errVideoRequired: 'Une vidéo est requise',
    categoryAlreadyExists: (name) => `"${name}" existe déjà — sélectionnée automatiquement.`,
    categoryCreated: 'Catégorie créée.',
    categoryCreateError: 'Erreur lors de la création de la catégorie',
  },
  AR: {
    loading: 'جارٍ التحميل…',
    notFoundTitle: 'المقال غير موجود',
    notFoundBody: 'هذا المقال غير موجود أو لا ينتمي إليك.',
    pageTitle: 'تعديل المقال',
    pageSubtitle: 'يتم إعادة نشر التعديلات فوراً.',
    contentTypeLabel: 'نوع المحتوى',
    typeText: 'نص',
    typeVideo: 'فيديو',
    titleLabel: 'العنوان *',
    descriptionLabel: 'الوصف *',
    descriptionLabelOptional: 'الوصف (اختياري)',
    remaining: (n) => `${n} متبقٍ`,
    minReached: 'تم بلوغ الحد الأدنى',
    categoryLabel: 'التصنيف',
    categoryNone: 'بدون',
    newCategoryPlaceholder: 'تصنيف جديد...',
    createCategoryButton: '+ إنشاء',
    regionLabel: 'الجهة',
    regionPlaceholder: 'اختر جهة',
    cityLabel: 'المدينة',
    cityPlaceholder: 'اختر مدينة',
    photoLabel: 'صورة *',
    videoLabel: 'فيديو *',
    submitButton: '✦ حفظ التعديلات',
    submitting: 'جارٍ التحديث...',
    toastSuccessTitle: 'تم التعديل ✦',
    toastSuccessBody: 'تم تحديث المقال!',
    toastGenericError: 'خطأ أثناء التحديث',
    errTitleRequired: 'العنوان مطلوب',
    errDescriptionShort: 'الوصف قصير جداً',
    errImageRequired: 'الصورة مطلوبة',
    errVideoRequired: 'الفيديو مطلوب',
    categoryAlreadyExists: (name) => `"${name}" موجود بالفعل — تم اختياره تلقائياً.`,
    categoryCreated: 'تم إنشاء التصنيف.',
    categoryCreateError: 'خطأ أثناء إنشاء التصنيف',
  },
};

// Même composant que create (mode single-image), bilingue.
function PhotoGridUploader({ images, onChange, token, language = 'FR' }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const isAR = language === 'AR';

  const T = {
    clickToChange: isAR ? 'اضغط لتغيير الصورة' : 'Cliquez pour changer la photo',
    formats: isAR ? 'JPG، PNG، WEBP — الحد الأقصى 5 ميغابايت' : 'JPG, PNG, WEBP — max 5 Mo',
    uploading: isAR ? 'جارٍ الإرسال...' : 'Envoi en cours...',
    tooLarge: isAR ? 'الحجم يتجاوز 5 ميغابايت.' : 'fichier(s) dépassent 5 Mo.',
    onlyOne: isAR ? 'صورة واحدة فقط مسموح بها.' : 'Une seule photo autorisée.',
    uploadFailed: isAR ? 'فشل الرفع. تحقق من اتصالك.' : "Échec de l'upload. Vérifiez votre connexion.",
    remove: isAR ? 'حذف' : 'Supprimer',
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) { setUploadError(`${oversized.length} ${T.tooLarge}`); return; }
    if (images.length + files.length > 1) { setUploadError(T.onlyOne); return; }

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
      setUploadError(T.uploadFailed);
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
            <p className="text-sm text-[#2D5016] font-semibold">{T.uploading}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            <span className="text-2xl">📷</span>
            <p className="text-sm font-semibold">{T.clickToChange}</p>
            <p className="text-xs text-gray-400">{T.formats}</p>
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
              {T.remove}
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
  const [video, setVideo] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Langue d'affichage du formulaire tant que l'article n'est pas encore chargé
  // (ex: écran de chargement / introuvable) — reprend la préférence mémorisée,
  // puis form.language (langue réelle de l'article) prend le relais une fois chargé.
  const [uiLanguage, setUiLanguage] = useState('FR');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'AR' || saved === 'FR') setUiLanguage(saved);
  }, []);

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
          contentType: article.contentType || 'ARTICLE',
        });
        setImage(article.imageUrl ? [{ url: article.imageUrl }] : []);
        setVideo(article.videoUrl ? { url: article.videoUrl } : null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/press/categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, [id, token]);

  // Une fois l'article chargé, la langue affichée suit sa langue réelle
  // (cohérent avec create : le journaliste écrit et relit dans la même langue).
  const activeLanguage = form?.language || uiLanguage;
  const t = LABELS[activeLanguage];
  const isAR = activeLanguage === 'AR';
  const dir = isAR ? 'rtl' : 'ltr';

  const setLanguage = (lang) => {
    set('language', lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

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
        toast.info(t.categoryAlreadyExists(cat.name));
      } else {
        toast.success(t.categoryCreated);
      }
    } catch (err) {
      toast.error(err.message || t.categoryCreateError);
    } finally {
      setCreatingCategory(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = t.errTitleRequired;
    if (form.contentType === 'ARTICLE' && (!form.description.trim() || form.description.trim().length < 30)) e.description = t.errDescriptionShort;
    if (form.contentType === 'ARTICLE' && !image[0]?.url) e.image = t.errImageRequired;
    if (form.contentType === 'VIDEO' && !video?.url) e.video = t.errVideoRequired;
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
        contentType: form.contentType,
        imageUrl: form.contentType === 'ARTICLE' ? image[0]?.url : null,
        videoUrl: form.contentType === 'VIDEO' ? video?.url : null,
      });

      toast.success(t.toastSuccessBody, { title: t.toastSuccessTitle, duration: 5000 });
      router.push('/my-space/newsroom');
    } catch (err) {
      toast.error(err.message || t.toastGenericError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div dir={dir} lang={isAR ? 'ar' : 'fr'} className="p-8 text-sm text-gray-400">
        {t.loading}
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div dir={dir} lang={isAR ? 'ar' : 'fr'} className="max-w-xl mx-auto p-8 text-center flex flex-col items-center gap-3">
        <div className="text-4xl">🔍</div>
        <h1 className="text-lg font-bold text-gray-900">{t.notFoundTitle}</h1>
        <p className="text-sm text-gray-500">{t.notFoundBody}</p>
      </div>
    );
  }

  return (
    <div dir={dir} lang={isAR ? 'ar' : 'fr'} className="max-w-2xl mx-auto p-6 lg:p-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-gray-900">{t.pageTitle}</h1>
        <div className="flex items-center gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setLanguage('FR')}
            className={`px-3 py-1.5 rounded-lg transition ${
              form.language === 'FR' ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLanguage('AR')}
            className={`px-3 py-1.5 rounded-lg transition ${
              form.language === 'AR' ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            AR
          </button>
        </div>
      </div>
      <p className="text-sm text-primary-dark/70 bg-primary-mint/40 border border-primary-sage rounded-xl px-4 py-2.5 mb-6">
        {t.pageSubtitle}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.titleLabel}</label>
          <input dir={dir} value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          {errors.title && <p className="text-red-500 text-xs mt-1">⚠ {errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {form.contentType === 'VIDEO' ? t.descriptionLabelOptional : t.descriptionLabel}
          </label>
          <textarea dir={dir} value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={form.contentType === 'VIDEO' ? 3 : 6} className={`${inputCls} resize-none`} />
          <div className="flex items-center justify-between mt-1">
            {errors.description ? (
              <p className="text-red-500 text-xs">⚠ {errors.description}</p>
            ) : <span />}
            <p className={`text-xs ${form.contentType === 'ARTICLE' && form.description.trim().length < 30 ? 'text-gray-400' : form.description.length > 7800 ? 'text-amber-600 font-medium' : 'text-[#2D5016] font-medium'}`}>
              {form.description.length} / 8000
              {form.contentType === 'ARTICLE' && ` (${form.description.trim().length < 30 ? t.remaining(30 - form.description.trim().length) : t.minReached})`}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.categoryLabel}</label>
          <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputCls}>
            <option value="">{t.categoryNone}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2 mt-2">
            <input
              dir={dir}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t.newCategoryPlaceholder}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#2D5016]"
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="text-xs font-bold text-[#2D5016] hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
            >
              {creatingCategory ? '...' : t.createCategoryButton}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.regionLabel}</label>
            <select value={region} onChange={(e) => { setRegion(e.target.value); set('city', ''); }} className={inputCls}>
              <option value="">{t.regionPlaceholder}</option>
              {Object.keys(citiesByRegion).sort((a, b) => a.localeCompare(b, 'fr')).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.cityLabel}</label>
            <select value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls}>
              <option value="">{form.city || t.cityPlaceholder}</option>
              {(citiesByRegion[region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {form.contentType === 'ARTICLE' ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.photoLabel}</label>
            <PhotoGridUploader images={image} onChange={setImage} token={token} language={activeLanguage} />
            {errors.image && <p className="text-red-500 text-xs mt-1">⚠ {errors.image}</p>}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.videoLabel}</label>
            <VideoUploader video={video} onChange={setVideo} token={token} language={activeLanguage} />
            {errors.video && <p className="text-red-500 text-xs mt-1">⚠ {errors.video}</p>}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
          {submitting ? t.submitting : t.submitButton}
        </button>
      </div>
    </div>
  );
}