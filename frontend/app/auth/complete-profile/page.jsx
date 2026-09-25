"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { cities } from "morocco-cities";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import AuthLayout from "../../../components/auth/AuthLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

export default function CompleteProfilePage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [form, setForm] = useState({ phone: "", city: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.profileCompleted) router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (user?.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const isFormValid = form.phone.trim() && form.city.trim();

  const submit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("phone", payload.phone);
      data.append("city", payload.city);
      if (avatarFile) data.append("avatar", avatarFile);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-profile`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = res.data.user;
      updateUser(updatedUser, token);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur serveur");
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    submit({ phone: form.phone, city: form.city });
  };

  const handleSkip = () => submit({ phone: "", city: "" });

  if (!user) return null;

  return (
    <>
      {loading && <LoadingSpinner message="Enregistrement..." />}
      <AuthLayout
        title={`Bonjour ${user?.name?.split(" ")[0] || ""} 👋`}
        subtitle="Ajoutez quelques infos pour profiter pleinement de la plateforme"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100">
            <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <label className="mt-3 text-sm text-[var(--color-primary-dark)] cursor-pointer hover:underline">
            Changer la photo
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Téléphone <span className="text-[var(--color-accent)]">*</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="06 00 00 00 00"
              className="input-green"
              autoComplete="tel"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Région <span className="text-[var(--color-accent)]">*</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setForm((prev) => ({ ...prev, city: "" }));
              }}
              className="input-green w-full"
            >
              <option value="">Choisir une région</option>
              {Object.keys(citiesByRegion).sort().map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Ville <span className="text-[var(--color-accent)]">*</span>
              </label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className="input-green w-full"
              >
                <option value="">Choisir une ville</option>
                {citiesByRegion[selectedRegion].map((ville) => (
                  <option key={ville} value={ville}>{ville}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium p-3 rounded-lg transition disabled:opacity-40 mt-1"
          >
            {loading ? "Enregistrement..." : "Continuer"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
          >
            Passer pour l'instant
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
