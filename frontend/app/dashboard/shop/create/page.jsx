"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Image, Info, ShieldCheck, Store } from "lucide-react";
import { shopService } from "@/services/shopService";
import { categoriesService } from "@/services/categoriesService";

const emptyForm = {
  name: "",
  categoryId: "",
  description: "",
  city: "",
  address: "",
  professionalPhone: "",
  professionalEmail: "",
  logo: "",
  coverImage: "",
  legalName: "",
  taxIdentifier: "",
  website: "",
  socialLinks: { facebook: "", instagram: "", linkedin: "" },
  openingHours: { summary: "" },
  planId: "",
  acceptTerms: false,
};

function Field({ label, children, error }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-gray-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function CreateShopPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === form.planId), [plans, form.planId]);

  useEffect(() => {
    shopService.plans().then((res) => setPlans(res.data || [])).catch(() => setPlans([]));
    categoriesService.getByModule()
      .then((res) => setCategories(res.data || res.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateNested = (group, key, value) => setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  const validateStep = () => {
    const next = {};
    if (step === 1) {
      if (!form.name.trim()) next.name = "Nom requis.";
      if (!form.description.trim() || form.description.trim().length < 20) next.description = "Description de 20 caracteres minimum.";
      if (!form.city.trim()) next.city = "Ville requise.";
      if (!form.professionalPhone.trim()) next.professionalPhone = "Telephone requis.";
    }
    if (step === 4 && !form.planId) next.planId = "Choisissez une formule.";
    if (step === 5 && !form.acceptTerms) next.acceptTerms = "Vous devez accepter les conditions.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(5, prev + 1));
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      await shopService.create(form);
      router.push("/dashboard/shop");
    } catch (error) {
      setErrors(error.response?.data?.errors || { form: error.response?.data?.message || "Creation impossible." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Creer ma boutique</h1>
        <p className="text-sm text-gray-500">Demandez une boutique professionnelle avec abonnement simule.</p>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className={`h-2 rounded-full ${item <= step ? "bg-[#2D5016]" : "bg-gray-200"}`} />
        ))}
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        {errors.form && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom de la boutique" error={errors.name}><input value={form.name} onChange={(e) => update("name", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Categorie principale">
              <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                <option value="">Choisir</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </Field>
            <Field label="Ville" error={errors.city}><input value={form.city} onChange={(e) => update("city", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Adresse"><input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Telephone professionnel" error={errors.professionalPhone}><input value={form.professionalPhone} onChange={(e) => update("professionalPhone", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Email professionnel"><input value={form.professionalEmail} onChange={(e) => update("professionalEmail", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <div className="md:col-span-2"><Field label="Description" error={errors.description}><textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" /></Field></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Logo (URL image)"><input value={form.logo} onChange={(e) => update("logo", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Image de couverture (URL image)"><input value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <div className="md:col-span-2 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              <Image className="mx-auto mb-2 text-[#2D5016]" /> Les uploads reels peuvent etre branches plus tard via le module upload existant.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Raison sociale"><input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Identifiant fiscal"><input value={form.taxIdentifier} onChange={(e) => update("taxIdentifier", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Horaires d'ouverture"><input value={form.openingHours.summary} onChange={(e) => updateNested("openingHours", "summary", e.target.value)} placeholder="Lun-Sam 09:00-18:00" className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Site internet"><input value={form.website} onChange={(e) => update("website", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Facebook"><input value={form.socialLinks.facebook} onChange={(e) => updateNested("socialLinks", "facebook", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
            <Field label="Instagram"><input value={form.socialLinks.instagram} onChange={(e) => updateNested("socialLinks", "instagram", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <button key={plan.id} type="button" onClick={() => update("planId", plan.id)} className={`rounded-xl border p-4 text-left ${form.planId === plan.id ? "border-[#2D5016] bg-[#E8F5D0]" : "border-gray-200"}`}>
                <Store className="mb-3 text-[#2D5016]" />
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#2D5016]">{plan.displayedPrice}</p>
                <p className="mt-1 text-xs text-gray-500">{plan.listingLimit} annonces actives</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {(plan.features || []).map((feature) => <li key={feature} className="flex gap-2"><Check size={14} className="mt-0.5 text-[#2D5016]" /> {feature}</li>)}
                </ul>
                <span className="mt-4 inline-flex rounded-xl bg-[#2D5016] px-3 py-2 text-xs font-bold text-white">Choisir cette formule</span>
              </button>
            ))}
            {errors.planId && <p className="text-sm text-red-600 md:col-span-3">{errors.planId}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <h2 className="font-bold text-gray-900">Resume</h2>
              <p className="mt-2 text-sm text-gray-600">{form.name} · {form.city}</p>
              <p className="text-sm text-gray-600">{form.description}</p>
              <p className="mt-2 text-sm font-semibold text-[#2D5016]">Formule : {selectedPlan?.name} - {selectedPlan?.displayedPrice}</p>
            </div>
            <label className="flex gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.acceptTerms} onChange={(e) => update("acceptTerms", e.target.checked)} />
              J accepte les conditions de creation de boutique.
            </label>
            {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700"><Info size={16} className="mr-2 inline" /> Aucun paiement reel ne sera demande.</div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button type="button" disabled={step === 1} onClick={() => setStep((prev) => Math.max(1, prev - 1))} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-40">Retour</button>
          {step < 5 ? (
            <button type="button" onClick={next} className="rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white">Continuer</button>
          ) : (
            <button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><ShieldCheck size={16} /> Envoyer la demande</button>
          )}
        </div>
      </section>
    </main>
  );
}
