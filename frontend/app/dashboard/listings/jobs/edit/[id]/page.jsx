"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { jobsService } from "@/services/jobsService";
import { cities } from "morocco-cities";
import { useToast } from "@/context/ToastContext";

// Build region → [city names] map once at module level (same source as publier page)
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const SORTED_REGIONS = Object.keys(citiesByRegion).sort((a, b) =>
  a.localeCompare(b, "fr"),
);

// ─── Static data (same as publier page) ──────────────────────────────────────

const CONTRACT_TYPES = [
  { value: "CDI",           label: "CDI",           desc: "Contrat à durée indéterminée" },
  { value: "CDD",           label: "CDD",           desc: "Contrat à durée déterminée" },
  { value: "STAGE",         label: "Stage",         desc: "Stage de fin d'études ou professionnel" },
  { value: "FREELANCE",     label: "Freelance",     desc: "Mission en indépendant" },
  { value: "INTERIM",       label: "Intérim",       desc: "Mission temporaire" },
  { value: "ALTERNANCE",    label: "Alternance",    desc: "Contrat en alternance" },
  { value: "ANAPEC",        label: "Anapec",        desc: "Contrat Idmaj ANAPEC" },
  { value: "TEMPS_PARTIEL", label: "Temps partiel", desc: "Moins de 40h/semaine" },
  { value: "STATUTAIRE",    label: "Statutaire",    desc: "Fonction publique" },
];

const REMOTE_TYPES = [
  { value: "ON_SITE", label: "Présentiel",  icon: "🏢" },
  { value: "REMOTE",  label: "Full Remote", icon: "🌍" },
  { value: "HYBRID",  label: "Hybride",     icon: "🔀" },
];

const EDUCATION_LEVELS = [
  { value: "BEFORE_BAC",      label: "Avant Bac" },
  { value: "BAC",             label: "Bac" },
  { value: "BAC_PLUS_1",      label: "Bac+1" },
  { value: "BAC_PLUS_2",      label: "Bac+2" },
  { value: "BAC_PLUS_3",      label: "Bac+3" },
  { value: "BAC_PLUS_4",      label: "Bac+4" },
  { value: "BAC_PLUS_5_PLUS", label: "Bac+5 et plus" },
];

const EXPERIENCE_LEVELS = [
  { value: "STUDENT_FRESH_GRAD", label: "Étudiant / Jeune diplômé" },
  { value: "JUNIOR_LESS_2",      label: "Débutant (< 2 ans)" },
  { value: "MID_2_TO_5",         label: "2 à 5 ans d'expérience" },
  { value: "SENIOR_5_TO_10",     label: "5 à 10 ans d'expérience" },
  { value: "EXPERT_PLUS_10",     label: "Expert (+ 10 ans)" },
];

const LANGUAGES = ["arabe", "français", "anglais", "espagnol", "allemand", "italien"];
const LANGUAGE_LEVELS = ["maternelle", "courant", "bon niveau", "intermédiaire", "notions"];

// ─── UI primitives ────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent";

const selectCls =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent bg-white";

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function EditJobPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <EditJobForm />
    </ProtectedRoute>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function EditJobForm() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [skillInput, setSkillInput] = useState("");

  // Load job + categories in parallel
  useEffect(() => {
    const init = async () => {
      try {
        const [jobRes, catRes] = await Promise.all([
          jobsService.getMyJobById(id, token),
          jobsService.getCategories(),
        ]);

        const d = jobRes.data;
        setCategories(catRes.data || []);

        // Normalize languages — can be stored as JSON string or array
        let langs = [];
        if (Array.isArray(d.languages)) langs = d.languages;
        else if (typeof d.languages === "string") {
          try { langs = JSON.parse(d.languages); } catch { langs = []; }
        }

        // Normalize skills
        let skills = [];
        if (Array.isArray(d.skills)) skills = d.skills;
        else if (typeof d.skills === "string") {
          try { skills = JSON.parse(d.skills); } catch { skills = []; }
        }

        setForm({
          title:               d.title || "",
          categoryId:          d.categoryId || "",
          categorySlug:        d.category?.slug || "",
          city:                d.city || "",
          region:              d.region || "",
          remote:              d.remote || "ON_SITE",
          contractType:        d.contractType || "",
          salaryMin:           d.salaryMin?.toString() || "",
          salaryMax:           d.salaryMax?.toString() || "",
          applicationDeadline: d.applicationDeadline
            ? new Date(d.applicationDeadline).toISOString().split("T")[0]
            : "",
          educationLevel:  Array.isArray(d.educationLevel) ? d.educationLevel : [],
          experienceLevel: d.experienceLevel || "",
          skills,
          languages:       langs,
          description:     d.description || "",
        });
      } catch (e) {
        setError("Offre introuvable ou accès refusé.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const toggleEducation = (value) => {
    set(
      "educationLevel",
      form.educationLevel.includes(value)
        ? form.educationLevel.filter((v) => v !== value)
        : [...form.educationLevel, value],
    );
  };

   const addSkill = () => {
    const s = skillInput.trim();
    const exists = form.skills.some((sk) => sk.toLowerCase() === s.toLowerCase());
    if (s && !exists && form.skills.length < 10) {
      set("skills", [...form.skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (sk) => set("skills", form.skills.filter((x) => x !== sk));

  const addLanguage = (lang) => {
    if (!form.languages.find((l) => l.language === lang)) {
      set("languages", [...form.languages, { language: lang, level: "bon niveau" }]);
    }
  };
  const removeLanguage = (lang) =>
    set("languages", form.languages.filter((l) => l.language !== lang));
  const setLangLevel = (lang, level) =>
    set("languages", form.languages.map((l) => (l.language === lang ? { ...l, level } : l)));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Le titre est requis."); return; }
    if (!form.contractType) { setError("Le type de contrat est requis."); return; }
    if (!form.description.trim()) { setError("La description est requise."); return; }
    if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
      setError("Le salaire minimum ne peut pas être supérieur au salaire maximum.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title:               form.title,
        city:                form.city,
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
        description:         form.description,
        // Only pass categorySlug if user changed it
        ...(form.categorySlug && { categorySlug: form.categorySlug }),
      };
      await jobsService.updateMyJob(id, payload, token);
      toast.success("Offre mise à jour avec succès !");
      router.push("/dashboard/listings/jobs");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#A7D129] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Chargement de l'offre...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 text-sm">
        {error || "Offre introuvable."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-[#2D5016] text-lg">Modifier l'offre</h1>
          <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            ⚠ Re-soumise à validation
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Informations générales ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations générales</SectionTitle>

          <Field label="Titre du poste *">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex: Développeur Full Stack"
              className={inputCls}
            />
          </Field>

          <Field label="Secteur d'activité">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { set("categoryId", cat.id); set("categorySlug", cat.slug); }}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                    form.categoryId === cat.id
                      ? "border-[#A7D129] bg-[#E8F5D0] text-[#2D5016]"
                      : "border-gray-200 text-gray-600 hover:border-[#A7D129]/50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Région *">
              <select
                value={form.region}
                onChange={(e) => {
                  set("region", e.target.value);
+                 set("city", ""); // reset city when region changes
                }}
                className={selectCls}
              >
                <option value="">Choisir une région</option>
                {SORTED_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Ville *">
                    <select
               value={form.city}
               onChange={(e) => set("city", e.target.value)}
                disabled={!form.region}
                className={selectCls}
              >
                <option value="">
                  {form.region ? "Choisir une ville" : "← Choisissez d'abord une région"}
                </option>
                {(citiesByRegion[form.region] || [])
                  .sort((a, b) => a.localeCompare(b, "fr"))
                  .map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
              </select>
            </Field>
          </div>

          <Field label="Mode de travail">
            <div className="grid grid-cols-3 gap-2">
              {REMOTE_TYPES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set("remote", r.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    form.remote === r.value
                      ? "border-[#A7D129] bg-[#E8F5D0]"
                      : "border-gray-200 hover:border-[#A7D129]/50"
                  }`}
                >
                  <div className="text-xl mb-0.5">{r.icon}</div>
                  <div className="text-xs font-bold text-[#2D5016]">{r.label}</div>
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* ── Contrat & Salaire ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contrat & Rémunération</SectionTitle>

          <Field label="Type de contrat *">
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_TYPES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set("contractType", c.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.contractType === c.value
                      ? "border-[#A7D129] bg-[#E8F5D0]"
                      : "border-gray-200 hover:border-[#A7D129]/50"
                  }`}
                >
                  <div className="text-sm font-bold text-[#2D5016]">{c.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{c.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Salaire min (MAD/mois)">
              <input
                type="number"
                min="0"
                value={form.salaryMin}
                onChange={(e) => set("salaryMin", e.target.value)}
                placeholder="Ex: 8000"
                className={inputCls}
              />
            </Field>
            <Field label="Salaire max (MAD/mois)">
              <input
                type="number"
                min="0"
                value={form.salaryMax}
                onChange={(e) => set("salaryMax", e.target.value)}
                placeholder="Ex: 12000"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Date limite de candidature">
            <input
              type="date"
              value={form.applicationDeadline}
              onChange={(e) => set("applicationDeadline", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputCls}
            />
          </Field>
        </div>

        {/* ── Profil recherché ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Profil recherché</SectionTitle>

          <Field label="Niveau d'études (plusieurs choix)">
            <div className="flex flex-wrap gap-2">
              {EDUCATION_LEVELS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => toggleEducation(e.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    form.educationLevel.includes(e.value)
                      ? "border-[#A7D129] bg-[#A7D129] text-[#2D5016]"
                      : "border-gray-200 text-gray-600 hover:border-[#A7D129]/50"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Niveau d'expérience">
            <div className="flex flex-col gap-2">
              {EXPERIENCE_LEVELS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => set("experienceLevel", form.experienceLevel === e.value ? "" : e.value)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                    form.experienceLevel === e.value
                      ? "border-[#A7D129] bg-[#E8F5D0] text-[#2D5016]"
                      : "border-gray-200 text-gray-600 hover:border-[#A7D129]/50"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Compétences clés (max 10)">
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Ex: React, Excel, Photoshop..."
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={form.skills.length >= 10}
                className="px-4 py-2.5 bg-[#2D5016] text-white rounded-xl text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-40"
              >
                +
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5D0] border border-[#A7D129]/50 text-[#2D5016] text-xs font-semibold"
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => removeSkill(sk)}
                      className="text-gray-400 hover:text-red-500 transition font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Langues requises">
            <div className="flex flex-wrap gap-2 mb-3">
              {LANGUAGES.map((lang) => {
                const added = form.languages.find((l) => l.language === lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => added ? removeLanguage(lang) : addLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all capitalize ${
                      added
                        ? "border-[#A7D129] bg-[#A7D129] text-[#2D5016]"
                        : "border-gray-200 text-gray-600 hover:border-[#A7D129]/50"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            {form.languages.length > 0 && (
              <div className="flex flex-col gap-2">
                {form.languages.map((l) => (
                  <div key={l.language} className="flex items-center gap-3 bg-[#E8F5D0] rounded-xl px-4 py-2">
                    <span className="text-sm font-semibold text-[#2D5016] capitalize w-20">{l.language}</span>
                    <select
                      value={l.level}
                      onChange={(e) => setLangLevel(l.language, e.target.value)}
                      className={`${selectCls} flex-1 border-[#A7D129]/50 py-1.5`}
                    >
                      {LANGUAGE_LEVELS.map((lv) => (
                        <option key={lv} value={lv}>{lv}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* ── Description ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Description du poste *</SectionTitle>
          <textarea
            rows={10}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={`Missions :\n- ...\n\nProfil recherché :\n- ...\n\nNous offrons :\n- ...`}
            className={`${inputCls} resize-none`}
          />
          <p className={`text-xs text-right ${form.description.trim().length < 50 ? "text-gray-300" : "text-[#7BA428]"}`}>
            {form.description.trim().length} caractères
          </p>
        </div>

        {/* Error — only shown for validation errors (title/contractType/description) */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3.5 bg-[#2D5016] text-white font-extrabold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition text-sm disabled:opacity-60"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          La modification remet l'offre en attente de validation.
        </p>
      </div>
    </div>
  );
}
