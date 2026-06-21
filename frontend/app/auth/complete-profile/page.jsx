"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { cities } from "morocco-cities";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import Logo from "../../../components/shared/logos/Logo";

// Grouper les villes par région
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

export default function CompleteProfilePage() {
  const { user, token, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState("");
  const [companyLogoPreview, setCompanyLogoPreview] = useState("");
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("");

  const [form, setForm] = useState({
    phone: "",
    city: "",
    role: "citizen",
    companyName: "",
    companyWebsite: "",
  });

  const [loading, setLoading] = useState(false);
  const isBusiness = form.role === "business";

  useEffect(() => {
    if (user?.profileCompleted) router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (user?.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "role" && value !== "business") {
      setForm((prev) => ({
        ...prev,
        role: value,
        companyName: "",
        companyWebsite: "",
      }));
      setCompanyLogoPreview("");
      setCompanyLogoFile(null);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCompanyLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompanyLogoFile(file);
    setCompanyLogoPreview(URL.createObjectURL(file));
  };

  const isFormValid = (() => {
    if (!form.phone.trim()) return false;
    if (!form.city.trim()) return false;
    if (isBusiness && !form.companyName.trim()) return false;
    return true;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("phone", form.phone);
      formData.append("city", form.city);
      formData.append("role", form.role);
      formData.append("avatar", avatarPreview);

      if (isBusiness) {
        formData.append("companyName", form.companyName);
        formData.append("companyWebsite", form.companyWebsite);
        if (companyLogoFile) formData.append("companyLogo", companyLogoFile);
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newToken = res.data.token;        // ← fresh JWT with role: "business"
      const updatedUser = res.data.user;
      loginWithGoogle(updatedUser, newToken); // ← replaces old citizen token
      router.push("/");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">

        {/* LOGO */}
        <div className="flex justify-center mb-5">
          <Logo />
        </div>

        {/* AVATAR */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-green-100">
           <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"   // 👈 cette ligne
/>
          </div>

          <label className="mt-3 text-sm text-green-600 cursor-pointer hover:text-green-700">
            Changer la photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>

          <h1 className="mt-4 text-lg font-bold">Bonjour {user?.name} 👋</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Complétez votre profil pour accéder aux services du site.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* PHONE */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Téléphone <span className="text-red-400">*</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="06 00 00 00 00"
              className="w-full border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {/* REGION SELECT */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Région <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setForm((prev) => ({ ...prev, city: "" }));
              }}
              className="w-full border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
            >
              <option value="">Choisir une région</option>
              {Object.keys(citiesByRegion).sort().map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* CITY SELECT */}
          {selectedRegion && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Ville <span className="text-red-400">*</span>
              </label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
              >
                <option value="">Choisir une ville</option>
                {citiesByRegion[selectedRegion].map((ville) => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ROLE */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Type de profil <span className="text-red-400">*</span>
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
            >
              <option value="citizen">Citoyen</option>
              <option value="business">Entreprise</option>
            </select>
          </div>

          {/* CHAMPS BUSINESS */}
          {isBusiness && (
            <div className="border border-green-100 bg-green-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Informations entreprise
              </p>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Nom de l'entreprise <span className="text-red-400">*</span>
                </label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Ex: Madinatti SARL"
                  className="w-full border bg-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  Site web
                </label>
                <input
                  name="companyWebsite"
                  value={form.companyWebsite}
                  onChange={handleChange}
                  placeholder="https://monentreprise.ma"
                  className="w-full border bg-white p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  type="text"
                />
              </div>

              {/* Company Logo */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">
                  Logo de l'entreprise
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-green-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                    {companyLogoPreview ? (
                      <img
                        src={companyLogoPreview}
                        alt="logo entreprise"
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
                      className="hidden"
                      onChange={handleCompanyLogoChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full p-3 rounded-lg text-white font-medium transition-colors mt-2 ${
              isFormValid && !loading
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Chargement..." : "Compléter mon profil"}
          </button>

        </form>
      </div>
    </div>
  );
}