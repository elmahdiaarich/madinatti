"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { cities } from "morocco-cities";
import GuestRoute from "@/components/shared/GuestRoute";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";

// Grouper les villes par région
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const BUSINESS_SECTORS = [
  "Immobilier",
  "BTP / Construction",
  "Recrutement / RH",
  "Commerce / Retail",
  "Informatique / Tech",
  "Finance / Assurance",
  "Industrie",
  "Tourisme / Hôtellerie",
  "Santé",
  "Éducation / Formation",
  "Transport / Logistique",
  "Autre",
];

// Formatte l'ICE en groupes de 3 chiffres pendant la saisie
function formatIce(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 15);
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ");
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1); // 1 = compte, 2 = entreprise (business only)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    role: "citizen",
    companyName: "",
    companyWebsite: "",
    ice: "",
    businessSector: "",
  });

  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
  const [rcDocumentFile, setRcDocumentFile] = useState(null);
  const [rcDocumentName, setRcDocumentName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const isBusiness = formData.role === "business";

  // Pré-sélectionner "business" si ?type=business
  useEffect(() => {
    if (searchParams.get("type") === "business") {
      setFormData((prev) => ({ ...prev, role: "business" }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    if (role !== "business") {
      setFormData((prev) => ({
        ...prev,
        role,
        companyName: "",
        companyWebsite: "",
        ice: "",
        businessSector: "",
      }));
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
      setRcDocumentFile(null);
      setRcDocumentName("");
    } else {
      setFormData((prev) => ({ ...prev, role }));
    }
  };

  const handleIceChange = (e) => {
    setFormData((prev) => ({ ...prev, ice: formatIce(e.target.value) }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRcFile = (file) => {
    if (!file) return;
    setRcDocumentFile(file);
    setRcDocumentName(file.name);
  };

  const handleRcChange = (e) => handleRcFile(e.target.files[0]);

  const handleRcDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleRcFile(e.dataTransfer.files[0]);
  };

  const removeRcDocument = () => {
    setRcDocumentFile(null);
    setRcDocumentName("");
  };

  const validateStep1 = () => {
    if (!formData.name) return "Nom requis";
    if (!formData.email.includes("@")) return "Email invalide";
    if (formData.password.length < 6) return "Mot de passe trop court";
    if (!formData.phone) return "Téléphone requis";
    if (!formData.city) return "Ville requise";
    return null;
  };

  const validateStep2 = () => {
    if (isBusiness && !formData.companyName) return "Nom de la société requis";
    return null;
  };

  const goToNextStep = () => {
    const err = validateStep1();
    if (err) return setError(err);
    setError("");
    if (isBusiness) {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const err = isBusiness ? validateStep2() : validateStep1();
    if (err) return setError(err);
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("phone", formData.phone);
      data.append("city", formData.city);
      data.append("role", formData.role);
      if (isBusiness) {
        data.append("companyName", formData.companyName);
        data.append("companyWebsite", formData.companyWebsite);
        data.append("ice", formData.ice.replace(/\s/g, ""));
        data.append("businessSector", formData.businessSector);
        if (companyLogoFile) data.append("companyLogo", companyLogoFile);
        if (rcDocumentFile) data.append("rcDocument", rcDocumentFile);
      }
      const res = await register(data);
      if (res.token) router.push("/");
      else setError(res.message);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte">
      {/* Élargit le form ~20% au-delà de la largeur par défaut imposée par AuthLayout */}
      <div className="w-[120%] -mx-[10%] max-w-none">
      {/* STEP INDICATOR — visible uniquement pour le flow business */}
      {isBusiness && (
        <div className="flex items-center gap-2 mb-6">
          <StepDot active={step === 1} done={step > 1} label="Compte" number={1} />
          <div className="flex-1 h-0.5 bg-[var(--color-primary-dark)]/15 relative overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: step > 1 ? "100%" : "0%" }}
            />
          </div>
          <StepDot active={step === 2} done={false} label="Entreprise" number={2} />
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <>
            {/* ROLE CARDS */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-primary-dark)] mb-2 block uppercase tracking-wide">
                Je suis...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  emoji="🙋"
                  title="Citoyen"
                  subtitle="Trouvez un emploi ou un bien immobilier"
                  active={!isBusiness}
                  onClick={() => handleRoleSelect("citizen")}
                />
                <RoleCard
                  emoji="🏢"
                  title="Entreprise"
                  subtitle="Publiez des offres et touchez plus de clients"
                  active={isBusiness}
                  onClick={() => handleRoleSelect("business")}
                />
              </div>
            </div>

            <input
              name="name"
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleChange}
              className="input-green"
            />

            <input
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input-green"
            />

            <PasswordInput
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
            />

            <input
              name="phone"
              placeholder="Téléphone"
              value={formData.phone}
              onChange={handleChange}
              className="input-green"
            />

            {/* REGION SELECT */}
            <select
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setFormData((prev) => ({ ...prev, city: "" }));
              }}
              value={selectedRegion}
              className="input-green w-full"
            >
              <option value="">Choisir une région</option>
              {Object.keys(citiesByRegion)
                .sort()
                .map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
            </select>

            {/* CITY SELECT */}
            {selectedRegion && (
              <select
                name="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className="input-green w-full"
              >
                <option value="">Choisir une ville</option>
                {citiesByRegion[selectedRegion].map((ville) => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={goToNextStep}
              disabled={loading}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-sage)] text-[var(--color-primary-dark)] font-bold p-3 rounded-lg transition disabled:opacity-60"
            >
              {loading
                ? "Création..."
                : isBusiness
                ? "Continuer →"
                : "Créer un compte"}
            </button>
          </>
        )}

        {/* ============ STEP 2 (BUSINESS ONLY) ============ */}
        {step === 2 && isBusiness && (
          <div className="flex flex-col gap-4 animate-slide-up">
            <div className="flex items-center gap-2 pb-1">
              <span className="text-xl">🏢</span>
              <div>
                <p className="text-sm font-bold text-[var(--color-primary-dark)]">
                  Informations entreprise
                </p>
                <p className="text-xs text-gray-500">
                  Ces informations seront vérifiées par notre équipe
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Nom de l'entreprise <span className="text-[var(--color-accent)]">*</span>
              </label>
              <input
                name="companyName"
                placeholder="Ex: Madinatti SARL"
                value={formData.companyName}
                onChange={handleChange}
                className="input-green w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Site web
                </label>
                <input
                  name="companyWebsite"
                  placeholder="https://monentreprise.ma"
                  value={formData.companyWebsite}
                  onChange={handleChange}
                  className="input-green w-full"
                  type="text"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  Secteur d'activité
                </label>
                <select
                  name="businessSector"
                  value={formData.businessSector}
                  onChange={handleChange}
                  className="input-green w-full"
                >
                  <option value="">Sélectionner...</option>
                  {BUSINESS_SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                ICE — Identifiant Commun de l'Entreprise
              </label>
              <input
                name="ice"
                placeholder="002 345 678 000 045"
                value={formData.ice}
                onChange={handleIceChange}
                inputMode="numeric"
                className="input-green w-full tracking-wider font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                15 chiffres — utilisé pour la vérification de votre compte
              </p>
            </div>

            {/* LOGO UPLOAD */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">
                Logo de l'entreprise
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-[var(--color-primary-dark)]/20 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                  {companyLogoPreview ? (
                    <img
                      src={companyLogoPreview}
                      alt="Aperçu logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <label className="text-sm text-[var(--color-primary-dark)] cursor-pointer hover:underline underline-offset-2 font-medium">
                  {companyLogoPreview ? "Changer le logo" : "Ajouter le logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* RC DOCUMENT — real dropzone */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">
                RC / Patente <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>

              {!rcDocumentName ? (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleRcDrop}
                  className={`flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl border-2 border-dashed cursor-pointer transition ${
                    isDragging
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-mint)]"
                      : "border-[var(--color-primary-dark)]/25 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-mint)]/40"
                  }`}
                >
                  <span className="text-2xl">📄</span>
                  <p className="text-sm font-medium text-[var(--color-primary-dark)]">
                    Glissez votre document ici
                  </p>
                  <p className="text-xs text-gray-400">
                    ou cliquez pour choisir un fichier — PDF, JPG, PNG
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleRcChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between gap-3 w-full py-3 px-4 rounded-xl border-2 border-[var(--color-success)]/40 bg-[var(--color-success)]/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">✅</span>
                    <span className="text-sm text-[var(--color-primary-dark)] font-medium truncate">
                      {rcDocumentName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeRcDocument}
                    className="text-xs text-red-500 hover:underline flex-shrink-0"
                  >
                    Retirer
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 bg-[var(--color-primary-mint)]/50 rounded-lg p-3 border border-[var(--color-primary-dark)]/10">
              <span className="text-sm">ℹ️</span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Un compte non vérifié peut publier avec des limites. La vérification
                par notre équipe débloque le badge "Entreprise vérifiée" et plus de
                visibilité pour vos annonces.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-[var(--color-primary-dark)]/20 text-[var(--color-primary-dark)] font-semibold p-3 rounded-lg transition hover:bg-[var(--color-primary-mint)]/40"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-sage)] text-[var(--color-primary-dark)] font-bold p-3 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Création..." : "Créer un compte"}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm mt-2">
        <a href="/auth/forgot-password" className="text-[var(--color-primary-dark)] hover:underline">
          Mot de passe oublié ?
        </a>
      </p>
      {step === 1 && <GoogleAuth />}
      </div>
    </AuthLayout>
  );
}

function RoleCard({ emoji, title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all ${
        active
          ? "border-[var(--color-primary-dark)] bg-[var(--color-primary-mint)] shadow-sm"
          : "border-gray-200 bg-white hover:border-[var(--color-primary)]"
      }`}
    >
      {active && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center">
          ✓
        </span>
      )}
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-bold text-[var(--color-primary-dark)]">{title}</span>
      <span className="text-[11px] text-gray-500 leading-snug">{subtitle}</span>
    </button>
  );
}

function StepDot({ active, done, label, number }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
          active || done
            ? "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-[var(--color-primary-dark)]"
            : "bg-white border-gray-300 text-gray-400"
        }`}
      >
        {done ? "✓" : number}
      </div>
      <span
        className={`text-xs font-semibold hidden sm:inline ${
          active || done ? "text-[var(--color-primary-dark)]" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// GuestRoute + Suspense au niveau le plus haut
export default function RegisterPage() {
  return (
    <GuestRoute>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Chargement...</div>}>
        <RegisterForm />
      </Suspense>
    </GuestRoute>
  );
}