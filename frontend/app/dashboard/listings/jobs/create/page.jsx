'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { cities } from 'morocco-cities';
import PricingModal from '@/components/shared/PricingModal';
import { useToast } from '@/context/ToastContext';
import { saveJobDraft, loadJobDraft, clearJobDraft, hasMeaningfulContent, formatRelativeTime } from '@/lib/jobDraft';

const CONTRACT_TYPES = [
  { value: 'CDI',           label: 'CDI',           desc: 'Contrat à durée indéterminée' },
  { value: 'CDD',           label: 'CDD',           desc: 'Contrat à durée déterminée' },
  { value: 'STAGE',         label: 'Stage',         desc: "Stage de fin d'études ou professionnel" },
  { value: 'FREELANCE',     label: 'Freelance',     desc: 'Mission en indépendant' },
  { value: 'INTERIM',       label: 'Intérim',       desc: 'Mission temporaire' },
  { value: 'ALTERNANCE',    label: 'Alternance',    desc: 'Contrat en alternance' },
  { value: 'ANAPEC',        label: 'Anapec',        desc: 'Contrat Idmaj ANAPEC' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel', desc: 'Moins de 40h/semaine' },
  { value: 'STATUTAIRE',    label: 'Statutaire',    desc: 'Fonction publique' },
];

const REMOTE_TYPES = [
  { value: 'ON_SITE', label: 'Présentiel',  icon: '🏢', desc: 'Travail sur site uniquement' },
  { value: 'REMOTE',  label: 'Full Remote', icon: '🌍', desc: 'Travail à distance complet' },
  { value: 'HYBRID',  label: 'Hybride',     icon: '🔀', desc: 'Mix présentiel / remote' },
];

const EDUCATION_LEVELS = [
  { value: 'BEFORE_BAC',      label: 'Avant Bac' },
  { value: 'BAC',             label: 'Bac' },
  { value: 'BAC_PLUS_1',      label: 'Bac+1' },
  { value: 'BAC_PLUS_2',      label: 'Bac+2' },
  { value: 'BAC_PLUS_3',      label: 'Bac+3' },
  { value: 'BAC_PLUS_4',      label: 'Bac+4' },
  { value: 'BAC_PLUS_5_PLUS', label: 'Bac+5 et plus' },
];

const EXPERIENCE_LEVELS = [
  { value: 'STUDENT_FRESH_GRAD', label: 'Étudiant / Jeune diplômé' },
  { value: 'JUNIOR_LESS_2',      label: 'Débutant (< 2 ans)' },
  { value: 'MID_2_TO_5',         label: "2 à 5 ans d'expérience" },
  { value: 'SENIOR_5_TO_10',     label: "5 à 10 ans d'expérience" },
  { value: 'EXPERT_PLUS_10',     label: 'Expert (+ 10 ans)' },
];

const LANGUAGES = ['arabe', 'français', 'anglais', 'espagnol', 'allemand', 'italien'];
const LANGUAGE_LEVELS = ['maternelle', 'courant', 'bon niveau', 'intermédiaire', 'notions'];

const WHY_JOIN_SUGGESTIONS = [
  'Équipe jeune et dynamique',
  'Évolution rapide en interne',
  'Projets variés et stimulants',
  'Formation continue',
];

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const STEPS = [
  { id: 1, label: 'Poste',        icon: '📋' },
  { id: 2, label: 'Contrat',      icon: '📄' },
  { id: 3, label: 'Profil',       icon: '🎓' },
  { id: 4, label: 'Description',  icon: '✍️' },
  { id: 5, label: 'Confirmation', icon: '✅' },
];

function StepHeader({ step, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{STEPS[step - 1].icon}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#7BA428]">
            Étape {step} sur {STEPS.length}
          </p>
          <h2 className="text-xl font-extrabold text-[#2D5016]">{title}</h2>
        </div>
      </div>
      {subtitle && <p className="text-sm text-gray-500 ml-[52px]">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none transition
        focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] placeholder:text-gray-400 text-sm ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none transition
        focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] text-sm ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full bg-white border-2 border-[#2D5016] text-black rounded-xl px-4 py-3 outline-none transition
        focus:ring-2 focus:ring-[#A7D129] focus:border-[#A7D129] placeholder:text-gray-400 text-sm resize-none ${className}`}
      {...props}
    />
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {msg}</p>;
}

function ListSection({
  label, required, optionalLabel, help,
  items, setItems, placeholderFn,
  maxItems = 8, addLabel,
  badgeClass = 'bg-[#E8F5D0] text-[#2D5016]',
  icon, iconClass = '', error,
}) {
  return (
    <div>
      <FieldLabel required={required}>
        {label}{' '}
        {optionalLabel && <span className="text-gray-400 font-normal">(optionnel)</span>}
      </FieldLabel>
      {help && <p className="text-xs text-gray-400 mb-3">{help}</p>}
      <div className="space-y-2">
        {items.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            {icon ? (
              <span className={`text-sm shrink-0 ${iconClass}`}>{icon}</span>
            ) : (
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${badgeClass}`}>
                {i + 1}
              </span>
            )}
            <Input
              value={value}
              onChange={(e) => {
                const updated = [...items];
                updated[i] = e.target.value;
                setItems(updated);
              }}
              placeholder={`Ex: ${placeholderFn(i)}`}
              className="flex-1"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {items.length < maxItems && (
        <button
          type="button"
          onClick={() => setItems([...items, ''])}
          className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#2D5016] hover:text-[#A7D129] transition"
        >
          <span className="w-5 h-5 rounded-full border-2 border-[#2D5016] flex items-center justify-center text-sm leading-none">+</span>
          {addLabel}
        </button>
      )}
      <ErrorMsg msg={error} />
    </div>
  );
}

function PublierJobContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  // ── CHANGED: no longer shown on mount; shown only after clicking Soumettre ──
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [draftBanner, setDraftBanner] = useState(null); // { savedAt } quand un brouillon vient d'être restauré
  const draftCheckedRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    categorySlug: '',
    city: '',
    location: '',
    region: '',
    remote: 'ON_SITE',
    contractType: '',
    salaryMin: '',
    salaryMax: '',
    applicationDeadline: '',
    educationLevel: [],
    experienceLevel: '',
    skills: [],
    skillInput: '',
    languages: [],
    descMode: 'paste',
    description: '',
    missions: [''],
    profil: [''],
    avantages: [''],
    whyJoin: [''],
  });

  useEffect(() => {
    jobsService.getCategories()
      .then((res) => {
        setCategories(res.data.map((c) => ({ label: c.name, slug: c.slug })));
      })
      .catch((err) => console.error('Erreur chargement catégories:', err));
  }, []);

  // ── Restaurer un brouillon existant (une seule fois, dès que l'utilisateur est connu) ──
  useEffect(() => {
    if (draftCheckedRef.current || !user?.id) return;
    draftCheckedRef.current = true;
    const draft = loadJobDraft(user.id);
    if (draft) {
      setForm((prev) => ({ ...prev, ...draft.form }));
      setStep(draft.step || 1);
      setDraftBanner({ savedAt: draft.savedAt });
    }
  }, [user?.id]);

  // ── Sauvegarde automatique (debounced) tant qu'il y a du contenu et hors écran de succès ──
  useEffect(() => {
    if (!draftCheckedRef.current || !user?.id) return; // attendre la tentative de restauration d'abord
    if (step === 6) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (hasMeaningfulContent(form)) {
        saveJobDraft(user.id, form, step);
      }
    }, 1000);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [form, step, user?.id]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleEducationLevel = (value) => {
    set(
      'educationLevel',
      form.educationLevel.includes(value)
        ? form.educationLevel.filter((v) => v !== value)
        : [...form.educationLevel, value]
    );
  };

const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Le titre est requis';
      if (!form.categorySlug) e.categorySlug = 'Choisissez une catégorie';
      if (!form.region)   e.region   = 'Choisissez une région';
      if (!form.city) e.city = 'Choisissez une ville';
    }
    if (step === 2) {
      if (!form.contractType) e.contractType = 'Choisissez un type de contrat';
      if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
        e.salaryMax = 'Le salaire max doit être supérieur au salaire min';
      }
    }
    if (step === 4) {
      if (form.descMode === 'paste') {
        if (!form.description.trim() || form.description.trim().length < 50)
          e.description = 'La description doit contenir au moins 50 caractères';
      } else {
        if (form.missions.filter((m) => m.trim()).length === 0)
          e.missions = 'Ajoutez au moins une mission';
        if (form.profil.filter((p) => p.trim()).length === 0)
          e.profil = 'Ajoutez au moins un critère de profil';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const back = () => setStep((s) => s - 1);

  const addSkill = () => {
    const s = form.skillInput.trim();
    const exists = form.skills.some((sk) => sk.toLowerCase() === s.toLowerCase());
    if (s && !exists && form.skills.length < 10) {
      set('skills', [...form.skills, s]);
      set('skillInput', '');
    }
  };
  const removeSkill = (sk) => set('skills', form.skills.filter((x) => x !== sk));

  const addLanguage = (lang) => {
    if (!form.languages.find((l) => l.language === lang)) {
      set('languages', [...form.languages, { language: lang, level: 'bon niveau' }]);
    }
  };
  const removeLanguage = (lang) =>
    set('languages', form.languages.filter((l) => l.language !== lang));
  const setLangLevel = (lang, level) =>
    set('languages', form.languages.map((l) => (l.language === lang ? { ...l, level } : l)));

  const handleRegionChange = (region) => {
    set('region', region);
    set('city', '');
  };

  const handleCityChange = (city) => {
    set('city', city);
  };

  const buildDescription = () => {
    const missionsText  = form.missions.filter((m) => m.trim()).map((m) => `- ${m.trim()}`).join('\n');
    const profilText    = form.profil.filter((p) => p.trim()).map((p) => `- ${p.trim()}`).join('\n');
    const avantagesText = form.avantages.filter((a) => a.trim()).map((a) => `- ${a.trim()}`).join('\n');
    const whyJoinText   = form.whyJoin.filter((w) => w.trim()).map((w) => `- ${w.trim()}`).join('\n');

    return [
      `Missions :\n${missionsText}`,
      `Profil recherché :\n${profilText}`,
      avantagesText ? `Nous offrons :\n${avantagesText}` : '',
      whyJoinText   ? `Pourquoi nous rejoindre :\n${whyJoinText}` : '',
    ].filter(Boolean).join('\n\n');
  };

  // ── CHANGED: "Soumettre" now opens the pricing modal ──
  const handleSubmit = () => {
    setShowPricingModal(true);
  };

  // ── CHANGED: called when user picks a plan → save listing then redirect ──
  const handlePlanSelect = async (planId) => {
    setShowPricingModal(false);
    setSubmitting(true);
    try {
      await jobsService.createJob({
        title:               form.title,
        categorySlug:        form.categorySlug,
        city:                form.city,
        location:            form.location || '',
        region:              form.region,
        remote:              form.remote,
        contractType:        form.contractType,
        salaryMin:           form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax:           form.salaryMax ? Number(form.salaryMax) : null,
        applicationDeadline: form.applicationDeadline || null,
        educationLevel:      form.educationLevel,
        experienceLevel:     form.experienceLevel || null,
        skills:              form.skills,
        languages:           form.languages,
        description:         form.descMode === 'paste' ? form.description : buildDescription(),
        plan:                planId,
      }, token);
     clearJobDraft(user?.id);
      toast.success("Offre soumise avec succès ! Elle sera visible après validation.", {
        title: "Annonce envoyée ✦",
        duration: 6000,
      });
      router.push('/dashboard/listings/jobs');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── CHANGED: modal only shown after clicking Soumettre ── */}
      {showPricingModal && (
        <PricingModal module="jobs" onSelect={handlePlanSelect} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-1">
            <button
              onClick={() => router.push('/dashboard/listings/jobs')}
              className="text-white/60 hover:text-white transition text-xs flex items-center gap-1"
            >
              ← Retour à mes annonces
            </button>
          </div>

          <h1 className="text-lg font-extrabold tracking-tight leading-tight">Publier une offre d'emploi</h1>

          {step <= 5 && (
            <div className="mt-3">
              <div className="flex items-center gap-0">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div
                      title={s.label}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0
                        ${step > s.id  ? 'bg-[#A7D129] text-[#2D5016]' :
                          step === s.id ? 'bg-white text-[#2D5016] shadow scale-110' :
                          'bg-white/20 text-white/60'}`}>
                      {step > s.id ? '✓' : s.id}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 transition-all
                        ${step > s.id ? 'bg-[#A7D129]' : 'bg-white/20'}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/70 mt-1.5">
                Étape {step}/{STEPS.length} — {STEPS[step - 1].label}
              </p>
            </div>
          )}
       </div>
      </div>

      {/* Bandeau brouillon restauré */}
      {draftBanner && step !== 6 && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between gap-3 bg-[#E8F5D0] border border-[#A7D129]/50 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-[#2D5016]">
              📝 Brouillon restauré (dernière modification {formatRelativeTime(draftBanner.savedAt)})
            </span>
            <button
              type="button"
              onClick={() => {
                clearJobDraft(user?.id);
                setDraftBanner(null);
                setStep(1);
                setForm({
                  title: '', categorySlug: '', city: '', location: '', region: '',
                  remote: 'ON_SITE', contractType: '', salaryMin: '', salaryMax: '',
                  applicationDeadline: '', educationLevel: [], experienceLevel: '',
                  skills: [], skillInput: '', languages: [],
                  descMode: 'paste', description: '',
                  missions: [''], profil: [''], avantages: [''], whyJoin: [''],
                });
              }}
              className="shrink-0 text-xs font-semibold text-[#2D5016]/70 hover:text-red-600 underline transition"
            >
              Repartir de zéro
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Étape 1 ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader step={1} title="Informations du poste"
              subtitle="Renseignez les informations principales de votre offre" />

            <div className="space-y-5">
              <div>
                <FieldLabel required>Titre du poste</FieldLabel>
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex: Développeur Full Stack React/Node.js"
                />
                <ErrorMsg msg={errors.title} />
              </div>

              <div>
                <FieldLabel required>Secteur d'activité</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => set('categorySlug', cat.slug)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all
                        ${form.categorySlug === cat.slug
                          ? 'border-[#A7D129] bg-[#E8F5D0] text-[#2D5016]'
                          : 'border-gray-200 text-gray-600 hover:border-[#A7D129]/50 hover:bg-[#E8F5D0]/50'
                        }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <ErrorMsg msg={errors.categorySlug} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Région</FieldLabel>
                  <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)}>
                    <option value="">Choisir une région</option>
                    {Object.keys(citiesByRegion)
                      .sort((a, b) => a.localeCompare(b, 'fr'))
                      .map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                  </Select>
                  <ErrorMsg msg={errors.region} />
                </div>
                <div>
                  <FieldLabel required>Ville</FieldLabel>
                  <Select
                    value={form.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!form.region}
                  >
                    <option value="">
                      {form.region ? 'Choisir une ville' : "← Choisissez d'abord une région"}
                    </option>
                    {(citiesByRegion[form.region] || [])
                      .sort((a, b) => a.localeCompare(b, 'fr'))
                      .map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                  </Select>
                  <ErrorMsg msg={errors.city} />
                </div>
              </div>

              <div>
                <FieldLabel required>Mode de travail</FieldLabel>
                <div className="grid grid-cols-3 gap-3">
                  {REMOTE_TYPES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set('remote', r.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all
                        ${form.remote === r.value
                          ? 'border-[#A7D129] bg-[#E8F5D0]'
                          : 'border-gray-200 hover:border-[#A7D129]/50'
                        }`}
                    >
                      <div className="text-2xl mb-1">{r.icon}</div>
                      <div className="text-xs font-bold text-[#2D5016]">{r.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <NavButtons onNext={next} nextLabel="Suivant : Contrat →" />
          </div>
        )}

        {/* ── Étape 2 ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader step={2} title="Contrat & Rémunération"
              subtitle="Définissez les conditions de l'offre" />

            <div className="space-y-6">
              <div>
                <FieldLabel required>Type de contrat</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {CONTRACT_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set('contractType', c.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all
                        ${form.contractType === c.value
                          ? 'border-[#A7D129] bg-[#E8F5D0]'
                          : 'border-gray-200 hover:border-[#A7D129]/50'
                        }`}
                    >
                      <div className="text-sm font-bold text-[#2D5016]">{c.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{c.desc}</div>
                    </button>
                  ))}
                </div>
                <ErrorMsg msg={errors.contractType} />
              </div>

              <div>
                <FieldLabel>Fourchette salariale <span className="text-gray-400 font-normal">(optionnel)</span></FieldLabel>
                <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Input type="number" min="0" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} placeholder="Min (ex: 8000)" />
                    <p className="text-xs text-gray-400 mt-1">MAD / mois</p>
                  </div>
                  <div>
                    <Input type="number" min="0" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} placeholder="Max (ex: 12000)" />
                    <p className="text-xs text-gray-400 mt-1">MAD / mois</p>
                  </div>
                </div>
                <ErrorMsg msg={errors.salaryMax} />
                <div className="mt-2 px-3 py-2 bg-[#E8F5D0] rounded-lg text-xs text-[#2D5016] font-medium">
                  💡 Les offres avec salaire affiché reçoivent 3× plus de candidatures
                </div>
              </div>

              <div>
                <FieldLabel>Date limite de candidature <span className="text-gray-400 font-normal">(optionnel)</span></FieldLabel>
                <Input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => set('applicationDeadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <NavButtons onBack={back} onNext={next} nextLabel="Suivant : Profil →" />
          </div>
        )}

        {/* ── Étape 3 ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader step={3} title="Profil recherché"
              subtitle="Définissez les critères du candidat idéal" />

            <div className="space-y-6">
              <div>
                <FieldLabel>
                  Niveau d'études{' '}
                  <span className="text-gray-400 font-normal">(plusieurs choix possibles)</span>
                </FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {EDUCATION_LEVELS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => toggleEducationLevel(e.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                        ${form.educationLevel.includes(e.value)
                          ? 'border-[#A7D129] bg-[#A7D129] text-[#2D5016]'
                          : 'border-gray-200 text-gray-600 hover:border-[#A7D129]/50'
                        }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Niveau d'expérience</FieldLabel>
                <div className="flex flex-col gap-2">
                  {EXPERIENCE_LEVELS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => set('experienceLevel', form.experienceLevel === e.value ? '' : e.value)}
                      className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all
                        ${form.experienceLevel === e.value
                          ? 'border-[#A7D129] bg-[#E8F5D0] text-[#2D5016]'
                          : 'border-gray-200 text-gray-600 hover:border-[#A7D129]/50'
                        }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Compétences clés <span className="text-gray-400 font-normal">(max 10)</span></FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={form.skillInput}
                    onChange={(e) => set('skillInput', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Ex: React, Python, Excel..."
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={form.skills.length >= 10}
                    className="px-4 py-3 bg-[#2D5016] text-white rounded-xl text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.skills.map((sk) => (
                      <span key={sk}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5D0] border border-[#A7D129]/50 text-[#2D5016] text-xs font-semibold">
                        {sk}
                        <button type="button" onClick={() => removeSkill(sk)}
                          className="text-gray-400 hover:text-red-500 transition text-xs font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>Langues requises</FieldLabel>
                <div className="flex flex-wrap gap-2 mb-3">
                  {LANGUAGES.map((lang) => {
                    const added = form.languages.find((l) => l.language === lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => added ? removeLanguage(lang) : addLanguage(lang)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize
                          ${added
                            ? 'border-[#A7D129] bg-[#A7D129] text-[#2D5016]'
                            : 'border-gray-200 text-gray-600 hover:border-[#A7D129]/50'
                          }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {form.languages.length > 0 && (
                  <div className="space-y-2">
                    {form.languages.map((l) => (
                      <div key={l.language} className="flex items-center gap-3 bg-[#E8F5D0] rounded-xl px-4 py-2">
                        <span className="text-sm font-semibold text-[#2D5016] capitalize w-20">{l.language}</span>
                        <Select
                          value={l.level}
                          onChange={(e) => setLangLevel(l.language, e.target.value)}
                          className="flex-1 border-[#A7D129]/50 py-1.5"
                        >
                          {LANGUAGE_LEVELS.map((lv) => (
                            <option key={lv} value={lv}>{lv}</option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <NavButtons onBack={back} onNext={next} nextLabel="Suivant : Description →" />
          </div>
        )}

        {/* ── Étape 4 ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <StepHeader step={4} title="Description du poste"
              subtitle="Choisissez la méthode qui vous convient" />

            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => set('descMode', 'paste')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${form.descMode === 'paste' ? 'bg-white text-[#2D5016] shadow-sm' : 'text-gray-500'}`}
              >
                📋 J'ai déjà ma description
              </button>
              <button
                type="button"
                onClick={() => set('descMode', 'guided')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${form.descMode === 'guided' ? 'bg-white text-[#2D5016] shadow-sm' : 'text-gray-500'}`}
              >
                🧭 Aidez-moi à rédiger
              </button>
            </div>

            {form.descMode === 'paste' && (
              <div>
                <FieldLabel required>Description complète de l'offre</FieldLabel>
                <p className="text-xs text-gray-400 mb-3">
                  Collez votre annonce existante (missions, profil, avantages...)
                </p>
                <Textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={12}
                  placeholder={`Missions :\n- ...\n\nProfil recherché :\n- ...\n\nNous offrons :\n- ...`}
                />
                <div className="flex items-center justify-between mt-2">
                  <ErrorMsg msg={errors.description} />
                  <span className={`text-xs ml-auto ${form.description.trim().length < 50 ? 'text-gray-400' : 'text-[#7BA428]'}`}>
                    {form.description.trim().length} / 50 min
                  </span>
                </div>
              </div>
            )}

            {form.descMode === 'guided' && (
              <div className="space-y-8">
                <ListSection
                  label="Missions principales" required
                  help="Décrivez ce que le candidat va faire au quotidien"
                  items={form.missions}
                  setItems={(v) => set('missions', v)}
                  badgeClass="bg-[#E8F5D0] text-[#2D5016]"
                  placeholderFn={(i) =>
                    i === 0 ? 'Développer les fonctionnalités front-end'
                    : i === 1 ? 'Participer aux réunions Agile / Scrum'
                    : `Mission ${i + 1}`
                  }
                  maxItems={8}
                  addLabel="Ajouter une mission"
                  error={errors.missions}
                />
                <div className="h-px bg-gray-100" />
                <ListSection
                  label="Profil recherché" required
                  help="Listez les critères que doit avoir le candidat idéal"
                  items={form.profil}
                  setItems={(v) => set('profil', v)}
                  badgeClass="bg-[#A7D129]/20 text-[#7BA428]"
                  placeholderFn={(i) =>
                    i === 0 ? 'Bac+3 minimum en informatique'
                    : i === 1 ? "2 ans d'expérience en React"
                    : `Critère ${i + 1}`
                  }
                  maxItems={8}
                  addLabel="Ajouter un critère"
                  error={errors.profil}
                />
                <div className="h-px bg-gray-100" />
                <ListSection
                  label="Ce que vous offrez" optionalLabel
                  help="Mutuelle, télétravail, tickets restaurant, formation..."
                  items={form.avantages}
                  setItems={(v) => set('avantages', v)}
                  icon="✦"
                  iconClass="text-[#A7D129]"
                  placeholderFn={(i) =>
                    i === 0 ? "Mutuelle d'entreprise prise en charge à 100%"
                    : i === 1 ? '2 jours de télétravail par semaine'
                    : `Avantage ${i + 1}`
                  }
                  maxItems={6}
                  addLabel="Ajouter un avantage"
                />
                <div className="h-px bg-gray-100" />
                <ListSection
                  label="Pourquoi nous rejoindre ?" optionalLabel
                  help="Culture d'entreprise, ambiance, perspectives d'évolution..."
                  items={form.whyJoin}
                  setItems={(v) => set('whyJoin', v)}
                  icon="🌱"
                  iconClass="text-[#7BA428]"
                  placeholderFn={(i) => WHY_JOIN_SUGGESTIONS[i] || `Raison ${i + 1}`}
                  maxItems={6}
                  addLabel="Ajouter une raison"
                />
                <div className="bg-[#E8F5D0] border border-[#A7D129]/40 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#2D5016]">✨ Générer un brouillon</p>
                    <p className="text-xs text-[#7BA428] mt-0.5">
                      Assemblez vos champs en un texte structuré, puis affinez-le librement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { set('description', buildDescription()); set('descMode', 'paste'); }}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-[#2D5016] text-white text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition whitespace-nowrap"
                  >
                    Générer →
                  </button>
                </div>
              </div>
            )}

            <NavButtons onBack={back} onNext={next} nextLabel="Aperçu & Confirmer →" />
          </div>
        )}

        {/* ── Étape 5 ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <StepHeader step={5} title="Aperçu de votre annonce"
                subtitle="Vérifiez les informations avant de soumettre" />

              <div className="border-2 border-[#A7D129]/40 rounded-2xl overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] p-6 text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#E8F5D0] flex items-center justify-center text-[#2D5016] font-extrabold text-xl shrink-0">
                      {user?.companyName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold">{form.title || 'Titre du poste'}</h3>
                      <p className="text-[#A7D129] font-semibold mt-0.5">{user?.companyName}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.contractType && (
                          <span className="px-2 py-0.5 bg-[#A7D129] text-[#2D5016] rounded-full text-xs font-bold">
                            {CONTRACT_TYPES.find((c) => c.value === form.contractType)?.label}
                          </span>
                        )}
                        {form.city && (
                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">📍 {form.city}</span>
                        )}
                        {form.remote && (
                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {REMOTE_TYPES.find((r) => r.value === form.remote)?.icon}{' '}
                            {REMOTE_TYPES.find((r) => r.value === form.remote)?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 text-sm">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <SummaryRow label="Catégorie"
                      value={categories.find((c) => c.slug === form.categorySlug)?.label} />
                    <SummaryRow label="Contrat"
                      value={CONTRACT_TYPES.find((c) => c.value === form.contractType)?.label} />
                    <SummaryRow label="Expérience"
                      value={EXPERIENCE_LEVELS.find((e) => e.value === form.experienceLevel)?.label} />
                    <SummaryRow label="Mode de travail"
                      value={REMOTE_TYPES.find((r) => r.value === form.remote)?.label} />
                    <SummaryRow
                      label="Niveau d'études"
                      value={
                        form.educationLevel.length
                          ? form.educationLevel
                              .map((v) => EDUCATION_LEVELS.find((e) => e.value === v)?.label)
                              .join(', ')
                          : null
                      }
                    />
                    <SummaryRow label="Salaire"
                      value={
                        form.salaryMin && form.salaryMax
                          ? `${Number(form.salaryMin).toLocaleString('fr-MA')} – ${Number(form.salaryMax).toLocaleString('fr-MA')} MAD/mois`
                          : form.salaryMin
                          ? `À partir de ${Number(form.salaryMin).toLocaleString('fr-MA')} MAD/mois`
                          : form.salaryMax
                          ? `Jusqu'à ${Number(form.salaryMax).toLocaleString('fr-MA')} MAD/mois`
                          : 'À discuter'
                      }
                    />
                    {form.applicationDeadline && (
                      <SummaryRow label="Date limite"
                        value={new Date(form.applicationDeadline).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start mb-6">
                <span className="text-amber-500 text-lg shrink-0">⏳</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">En attente de validation</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Votre annonce sera examinée par notre équipe sous 24-48h avant d'être publiée sur la plateforme.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={back}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-[#2D5016] transition"
                >
                  ← Modifier
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : "✦ Soumettre l'annonce"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Succès ── */}
        {step === 6 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-[#E8F5D0] flex items-center justify-center text-4xl mx-auto mb-6">
              🎉
            </div>
            <h2 className="text-2xl font-extrabold text-[#2D5016] mb-2">Annonce soumise !</h2>
            <p className="text-gray-500 text-sm mb-2">
              Votre offre <strong className="text-gray-800">"{form.title}"</strong> a bien été reçue.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Notre équipe va l'examiner sous <strong>24 à 48h</strong>. Vous serez notifié par email dès sa publication.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/listings/jobs')}
                className="px-6 py-3 rounded-xl border-2 border-[#2D5016] text-[#2D5016] font-bold text-sm hover:bg-[#E8F5D0] transition"
              >
                Suivre mon annonce
              </button>
              <button
                onClick={() => {
                  clearJobDraft(user?.id);
                  setStep(1);
                  setForm({
                    title: '', categorySlug: '', city: '', location: '', region: '',
                    remote: 'ON_SITE', contractType: '', salaryMin: '', salaryMax: '',
                    applicationDeadline: '', educationLevel: [], experienceLevel: '',
                    skills: [], skillInput: '', languages: [],
                    descMode: 'paste', description: '',
                    missions: [''], profil: [''], avantages: [''], whyJoin: [''],
                  });
                }}
                className="px-6 py-3 rounded-xl bg-[#2D5016] text-white font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition"
              >
                + Nouvelle annonce
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = 'Suivant →' }) {
  return (
    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-[#2D5016] transition"
        >
          ← Retour
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="ml-auto px-8 py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition hover:scale-[1.02] active:scale-100"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function SummaryRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default function PublierJobPage() {
  return (
    <ProtectedRoute roles={['business']}>
      <PublierJobContent />
    </ProtectedRoute>
  );
}