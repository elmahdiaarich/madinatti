"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { cities } from "morocco-cities";
import { AlertCircle, Check } from "lucide-react";
import GuestRoute from "@/components/shared/GuestRoute";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import SearchableDropdown from "@/components/real-estate/SearchableDropdown";
import { isStrongPassword, PASSWORD_MESSAGE, PASSWORD_MIN_LENGTH } from "@/lib/passwordPolicy.mjs";

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const regionOptions = Object.keys(citiesByRegion).sort();

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!isStrongPassword(formData.password)) return PASSWORD_MESSAGE;
    if (!formData.name.trim()) return "Le nom est requis";
    if (!formData.email.includes("@")) return "Email invalide";
    if (!formData.phone.trim()) return "Le téléphone est requis";
    if (!formData.city) return "La ville est requise";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
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

      const res = await register(data);
      if (res.token) {
        router.push("/");
      } else {
        setError(res.message);
        setLoading(false);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Création du compte impossible. Veuillez réessayer."
      );
      setLoading(false);
    }
  };

  const cityOptions = selectedRegion ? citiesByRegion[selectedRegion] : [];

  return (
    <AuthLayout title="Créer un compte">
      {loading && <LoadingSpinner message="Création du compte..." />}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Nom complet <span className="text-[var(--color-accent)]">*</span>
          </label>
          <input
            name="name"
            placeholder="Votre nom"
            value={formData.name}
            onChange={handleChange}
            className="input-green"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Email <span className="text-[var(--color-accent)]">*</span>
          </label>
          <input
            name="email"
            type="email"
            placeholder="vous@exemple.com"
            value={formData.email}
            onChange={handleChange}
            className="input-green"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Mot de passe <span className="text-[var(--color-accent)]">*</span>
          </label>
          <PasswordInput
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            autoComplete="new-password"
          />
          <PasswordRules password={formData.password} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Téléphone <span className="text-[var(--color-accent)]">*</span>
          </label>
          <input
            name="phone"
            placeholder="06 00 00 00 00"
            value={formData.phone}
            onChange={handleChange}
            className="input-green"
            autoComplete="tel"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Région</label>
          <SearchableDropdown
            label="Choisir une région"
            value={selectedRegion}
            options={regionOptions}
            onSelect={(val) => {
              setSelectedRegion(val);
              setFormData((prev) => ({ ...prev, city: "" }));
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Ville <span className="text-[var(--color-accent)]">*</span>
          </label>
          <SearchableDropdown
            label="Choisir une ville"
            value={formData.city || null}
            options={cityOptions}
            onSelect={(val) => setFormData((prev) => ({ ...prev, city: val }))}
            emptyLabel={selectedRegion ? "Choisir une ville" : "Sélectionnez d'abord une région"}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 hover:bg-gray-800 text-white font-medium p-3 rounded-lg transition disabled:opacity-60 mt-1"
        >
          {loading ? "Création..." : "Créer un compte"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
      <GoogleAuth />

      <p className="text-center text-sm text-gray-500 mt-6">
        Déjà inscrit ?{" "}
        <a href="/auth/login" className="text-[var(--color-primary-dark)] font-medium hover:underline">
          Se connecter
        </a>
      </p>
    </AuthLayout>
  );
}

function PasswordRules({ password }) {
  const hasLength = password.length >= PASSWORD_MIN_LENGTH;
  const hasLetterAndNumber = /[A-Za-z]/.test(password) && /[0-9]/.test(password);

  return (
    <div className="flex flex-col gap-1 mt-1">
      <Rule met={hasLength} label={`Au moins ${PASSWORD_MIN_LENGTH} caractères`} />
      <Rule met={hasLetterAndNumber} label="Au moins une lettre et un chiffre" />
    </div>
  );
}

function Rule({ met, label }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? "text-[var(--color-primary-dark)]" : "text-gray-400"}`}>
      <span
        className={`flex items-center justify-center w-3.5 h-3.5 rounded-full flex-shrink-0 ${
          met ? "bg-[var(--color-primary-dark)]" : "bg-gray-200"
        }`}
      >
        {met && <Check size={9} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <GuestRoute>
      <Suspense fallback={<LoadingSpinner message="Chargement..." />}>
        <RegisterForm />
      </Suspense>
    </GuestRoute>
  );
}
