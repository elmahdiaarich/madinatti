"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
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

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    if (name === "role" && value !== "business") {
      setFormData((prev) => ({
        ...prev,
        role: value,
        companyName: "",
        companyWebsite: "",
      }));
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    if (!formData.name) return "Nom requis";
    if (!formData.email.includes("@")) return "Email invalide";
    if (formData.password.length < 6) return "Mot de passe trop court";
    if (!formData.phone) return "Téléphone requis";
    if (!formData.city) return "Ville requise";
    if (isBusiness && !formData.companyName) return "Nom de la société requis";
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
      data.append("role", formData.role);
      if (isBusiness) {
        data.append("companyName", formData.companyName);
        data.append("companyWebsite", formData.companyWebsite);
        if (companyLogoFile) data.append("companyLogo", companyLogoFile);
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
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          name="name"
          placeholder="Nom complet"
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
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
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
        />

        {/* REGION SELECT */}
        <select
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            setFormData((prev) => ({ ...prev, city: "" }));
          }}
          value={selectedRegion}
          className="input-green p-3 border rounded-lg w-full"
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
            className="input-green p-3 border rounded-lg w-full"
          >
            <option value="">Choisir une ville</option>
            {citiesByRegion[selectedRegion].map((ville) => (
              <option key={ville} value={ville}>
                {ville}
              </option>
            ))}
          </select>
        )}

        {/* ROLE SELECT */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
        >
          <option value="citizen">Citoyen</option>
          <option value="business">Entreprise</option>
        </select>

        {/* BUSINESS FIELDS */}
        {isBusiness && (
          <div className="border border-green-100 bg-green-50 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Informations entreprise
            </p>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Nom de l'entreprise <span className="text-red-400">*</span>
              </label>
              <input
                name="companyName"
                placeholder="Ex: Madinatti SARL"
                onChange={handleChange}
                className="input-green p-3 border bg-white rounded-lg w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Site web
              </label>
              <input
                name="companyWebsite"
                placeholder="https://monentreprise.ma"
                onChange={handleChange}
                className="input-green p-3 border bg-white rounded-lg w-full"
                type="text"
              />
            </div>
            {/* LOGO UPLOAD */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Logo de l'entreprise
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-green-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
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
                <label className="text-sm text-green-600 cursor-pointer hover:text-green-700 underline underline-offset-2">
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
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white p-3 rounded-lg"
        >
          {loading ? "Création..." : "Créer un compte"}
        </button>
      </form>

      <p className="text-center text-sm mt-2">
        <a href="/auth/forgot-password" className="text-primary-dark hover:underline">
          Mot de passe oublié ?
        </a>
      </p>
      <GoogleAuth />
    </AuthLayout>
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