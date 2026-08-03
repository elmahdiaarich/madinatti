"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { cities } from "morocco-cities";
import GuestRoute from "@/components/shared/GuestRoute";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";
import Turnstile from "../../../components/shared/Turnstile";

// Grouper les villes par région
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

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
  });

  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const turnstileRef = useRef(null);
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
      }));
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
    } else {
      setFormData((prev) => ({ ...prev, role }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
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
    if (!turnstileToken) return "Merci de valider la vérification anti-robot";
    return null;
  };

  const goToNextStep = () => {
    const err = validateStep1();
    if (err) return setError(err);
    if (isBusiness) {
      setError("");
      setStep(2);
    } else {
      if (!turnstileToken) return setError("Merci de valider la vérification anti-robot");
      setError("");
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
      data.append("turnstileToken", turnstileToken);
      if (isBusiness) {
        data.append("companyName", formData.companyName);
        data.append("companyWebsite", formData.companyWebsite);
        if (companyLogoFile) data.append("companyLogo", companyLogoFile);
      }
      const res = await register(data);
      if (res.token) router.push("/");
      else {
        setError(res.message);
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
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

            {/* Pour le flow citoyen (pas de step 2), le captcha se valide ici */}
            {!isBusiness && (
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
              />
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

            <div className="flex items-start gap-2 bg-[var(--color-primary-mint)]/50 rounded-lg p-3 border border-[var(--color-primary-dark)]/10">
              <span className="text-sm">ℹ️</span>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Un compte non vérifié peut publier avec des limites. La vérification
                par notre équipe débloque le badge "Entreprise vérifiée" et plus de
                visibilité pour vos annonces.
              </p>
            </div>

            {/* Pour le flow business, le captcha se valide ici (step 2) */}
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
            />

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