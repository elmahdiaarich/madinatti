'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { pressService } from '../../../../services/pressService';
import { cities } from 'morocco-cities';
import VideoUploader from '@/components/press/VideoUploader';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
const LANG_STORAGE_KEY = 'madinatti_journalist_press_lang';

// Détecte si un nom contient majoritairement des caractères arabes.
const ARABIC_RE = /[\u0600-\u06FF]/;
function isArabicName(name) { return ARABIC_RE.test(name); }

/** Filtre les catégories selon la langue du formulaire :
 *  - FR → garde les noms NON-arabes
 *  - AR → garde les noms arabes */
function filterCatsByLanguage(cats, language) {
  return cats.filter((c) =>
    language === 'AR' ? isArabicName(c.name) : !isArabicName(c.name)
  );
}

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const inputCls = "w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm";

// ── Traductions du formulaire journaliste (pas celles de la page publique /press) ──
const LABELS = {
  FR: {
    pageTitle: 'Nouvel article',
    pageSubtitle: 'Votre article sera publié immédiatement dès la soumission.',
    contentTypeLabel: 'Type de contenu *',
    typeText: 'Texte',
    typeVideo: 'Vidéo',
    titleLabel: 'Titre *',
    titlePlaceholder: 'Exemple : Inauguration du nouveau marché municipal',
    descriptionLabel: 'Description *',
    descriptionLabelOptional: 'Description (optionnelle)',
    descriptionPlaceholder: "Rédigez votre article ici : contexte, faits principaux, citations, impact local.",
    descriptionPlaceholderVideo: 'Légende de la vidéo (facultatif)',
    remaining: (n) => `${n} restants`,
    minReached: 'min. atteint',
    categoryLabel: 'Catégorie',
    categoryNone: 'Aucune',
    newCategoryPlaceholder: 'Nouvelle catégorie...',
    createCategoryButton: '+ Créer',
    regionLabel: 'Région',
    regionPlaceholder: 'Choisir une région',
    cityLabel: 'Ville',
    cityPlaceholderDisabled: "← Choisissez d'abord une région",
    cityPlaceholderEnabled: 'Choisir une ville',
    cityHelperDisabled: "Sélectionnez d'abord une région pour activer ce champ.",
    photoLabel: 'Photo *',
    videoLabel: 'Vidéo *',
    submitButton: "✦ Soumettre l'article",
    submitting: 'Publication en cours…',
    toastSuccessTitle: 'Article créé ✦',
    toastSuccessBody: 'Article publié !',
    toastGenericError: 'Une erreur est survenue',
    errTitleRequired: 'Le titre est requis',
    errDescriptionShort: "Décrivez l'article (30 caractères min)",
    errImageRequired: 'Une photo est requise',
    errVideoRequired: 'Une vidéo est requise',
    categoryNameTooLong: (max) => `Le nom de la catégorie ne peut pas dépasser ${max} caractères.`,
    categoryAlreadyExists: (name) => `"${name}" existe déjà — sélectionnée automatiquement.`,
    categoryCreated: 'Catégorie créée.',
  },
  AR: {
    pageTitle: 'مقال جديد',
    pageSubtitle: 'سيتم نشر مقالك فور إرساله.',
    contentTypeLabel: 'نوع المحتوى *',
    typeText: 'نص',
    typeVideo: 'فيديو',
    titleLabel: 'العنوان *',
    titlePlaceholder: 'مثال: افتتاح السوق البلدي الجديد',
    descriptionLabel: 'الوصف *',
    descriptionLabelOptional: 'الوصف (اختياري)',
    descriptionPlaceholder: 'اكتب مقالك هنا: السياق، الوقائع الأساسية، الاقتباسات، الأثر المحلي.',
    descriptionPlaceholderVideo: 'وصف الفيديو (اختياري)',
    remaining: (n) => `${n} متبقٍ`,
    minReached: 'تم بلوغ الحد الأدنى',
    categoryLabel: 'التصنيف',
    categoryNone: 'بدون',
    newCategoryPlaceholder: 'تصنيف جديد...',
    createCategoryButton: '+ إنشاء',
    regionLabel: 'الجهة',
    regionPlaceholder: 'اختر جهة',
    cityLabel: 'المدينة',
    cityPlaceholderDisabled: '← اختر جهة أولاً',
    cityPlaceholderEnabled: 'اختر مدينة',
    cityHelperDisabled: 'اختر جهة أولاً لتفعيل هذا الحقل.',
    photoLabel: 'صورة *',
    videoLabel: 'فيديو *',
    submitButton: '✦ نشر المقال',
    submitting: 'جارٍ النشر…',
    toastSuccessTitle: 'تم إنشاء المقال ✦',
    toastSuccessBody: 'تم نشر المقال!',
    toastGenericError: 'حدث خطأ',
    errTitleRequired: 'العنوان مطلوب',
    errDescriptionShort: 'صف المقال (30 حرفاً على الأقل)',
    errImageRequired: 'الصورة مطلوبة',
    errVideoRequired: 'الفيديو مطلوب',
    categoryNameTooLong: (max) => `لا يمكن أن يتجاوز اسم التصنيف ${max} حرفاً.`,
    categoryAlreadyExists: (name) => `"${name}" موجود بالفعل — تم اختياره تلقائياً.`,
    categoryCreated: 'تم إنشاء التصنيف.',
  },
};

// Même composant que worker-profiles/create (mode single-image), bilingue.
function PhotoGridUploader({ images, onChange, token, multiple = false, maxFiles = 1, language = 'FR' }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);
  const isAR = language === 'AR';

  const T = {
    clickToChoose: isAR ? 'اضغط لاختيار صورة' : 'Cliquez pour choisir une photo',
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
    if (!multiple && images.length + files.length > 1) { setUploadError(T.onlyOne); return; }

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
      setUploadError(T.uploadFailed);
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
            <p className="text-sm text-[#2D5016] font-semibold">{T.uploading}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-gray-500">
            <span className="text-2xl">📷</span>
            <p className="text-sm font-semibold">{T.clickToChoose}</p>
            <p className="text-xs text-gray-400">{T.formats}</p>
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
                  {T.remove}
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
    title: '', description: '', language: 'FR', city: '', categoryId: '', contentType: 'ARTICLE',
  });
  const [region, setRegion] = useState('');
  const [image, setImage] = useState([]);
  const [video, setVideo] = useState(null);
  const sectionRefs = {
    title: useRef(null), description: useRef(null), image: useRef(null), video: useRef(null),
  };
  const ERROR_ORDER = ['title', 'description', 'image', 'video'];
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const submittedRef = useRef(false);
  const imageRef = useRef(image);
  imageRef.current = image;
  const videoRef = useRef(video);
  videoRef.current = video;

  const t = LABELS[form.language];
  const isAR = form.language === 'AR';
  const dir = isAR ? 'rtl' : 'ltr';

  // Mémorise la langue préférée du journaliste (localStorage) — un journaliste
  // qui publie toujours en arabe n'a pas besoin de rebasculer à chaque article.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'AR' || saved === 'FR') {
      setForm((f) => ({ ...f, language: saved }));
    }
  }, []);

  const setLanguage = (lang) => {
    set('language', lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

  // Nettoyage best-effort : si l'utilisateur quitte sans soumettre, on détruit
  // l'image et/ou la vidéo temp déjà uploadées sur Cloudinary pour éviter une fuite de stockage.
  useEffect(() => {
    return () => {
      if (!submittedRef.current && imageRef.current[0]?.url?.includes('madinatti/temp')) {
        fetch(`${API_URL}/upload/images`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ url: imageRef.current[0].url }),
        }).catch(() => {}); // best-effort, on ne bloque jamais la navigation pour ça
      }
      if (!submittedRef.current && videoRef.current?.publicId?.includes('madinatti/temp')) {
        fetch(`${API_URL}/upload/videos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ publicId: videoRef.current.publicId }),
        }).catch(() => {}); // best-effort, idem
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
    !submittedRef.current && (form.title.trim() || form.description.trim() || image.length > 0 || video?.url);

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
  }, [form.title, form.description, image, video]);

  const MAX_CATEGORY_NAME_LENGTH = 40;

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
      toast.error(t.categoryNameTooLong(MAX_CATEGORY_NAME_LENGTH));
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
        toast.info(t.categoryAlreadyExists(cat.name));
      } else {
        toast.success(t.categoryCreated);
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la création de la catégorie');
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
        contentType: form.contentType,
        imageUrl: form.contentType === 'ARTICLE' ? image[0]?.url : null,
        videoUrl: form.contentType === 'VIDEO' ? video?.url : null,
      });

      submittedRef.current = true; // empêche le cleanup-on-unmount de détruire le média désormais utilisé
      toast.success(t.toastSuccessBody, { title: t.toastSuccessTitle, duration: 5000 });
      router.push('/my-space/newsroom');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t.toastGenericError, { duration: 7000 });
    } finally {
      setSubmitting(false);
    }
  };

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
      <p className="text-sm text-gray-400 mb-6">
        {t.pageSubtitle}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.contentTypeLabel}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set('contentType', 'ARTICLE')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                form.contentType === 'ARTICLE' ? 'bg-[#2D5016] text-white border-[#2D5016]' : 'bg-white text-gray-500 border-gray-200'
              }`}>
              📝 {t.typeText}
            </button>
            <button type="button" onClick={() => set('contentType', 'VIDEO')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                form.contentType === 'VIDEO' ? 'bg-[#2D5016] text-white border-[#2D5016]' : 'bg-white text-gray-500 border-gray-200'
              }`}>
              🎬 {t.typeVideo}
            </button>
          </div>
        </div>

        <div ref={sectionRefs.title}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.titleLabel}</label>
          <input
            dir={dir}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t.titlePlaceholder}
            maxLength={200}
            disabled={submitting}
            className={`${inputCls} ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.title
              ? <p className="text-red-500 text-xs">⚠ {errors.title}</p>
              : <span />}
            <p className={`text-xs ms-auto ${
              form.title.length > 180 ? 'text-amber-600 font-medium' : 'text-gray-400'
            }`}>
              {form.title.length} / 200
            </p>
          </div>
        </div>

        <div ref={sectionRefs.description}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {form.contentType === 'VIDEO' ? t.descriptionLabelOptional : t.descriptionLabel}
          </label>
          <textarea
            dir={dir}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={form.contentType === 'VIDEO' ? 3 : 6}
            maxLength={8000}
            disabled={submitting}
            placeholder={form.contentType === 'VIDEO' ? t.descriptionPlaceholderVideo : t.descriptionPlaceholder}
            className={`${inputCls} resize-none ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
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
            {filterCatsByLanguage(categories, form.language).map((c) => (
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
            <select value={form.city} onChange={(e) => set('city', e.target.value)} disabled={!region}
              className={`${inputCls} ${!region ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <option value="">{region ? t.cityPlaceholderEnabled : t.cityPlaceholderDisabled}</option>
              {(citiesByRegion[region] || []).sort((a, b) => a.localeCompare(b, 'fr')).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {!region && (
              <p className="text-xs text-gray-400 mt-1">{t.cityHelperDisabled}</p>
            )}
          </div>
        </div>

        {form.contentType === 'ARTICLE' ? (
          <div ref={sectionRefs.image}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.photoLabel}</label>
            <div className={submitting ? 'opacity-60 pointer-events-none' : ''}>
              <PhotoGridUploader images={image} onChange={setImage} token={token} multiple={false} maxFiles={1} language={form.language} />
            </div>
            {errors.image && <p className="text-red-500 text-xs mt-1">⚠ {errors.image}</p>}
          </div>
        ) : (
          <div ref={sectionRefs.video}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.videoLabel}</label>
            <div className={submitting ? 'opacity-60 pointer-events-none' : ''}>
              <VideoUploader video={video} onChange={setVideo} token={token} language={form.language} />
            </div>
            {errors.video && <p className="text-red-500 text-xs mt-1">⚠ {errors.video}</p>}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.submitting}
            </>
          ) : (
            t.submitButton
          )}
        </button>
      </div>
    </div>
  );
}