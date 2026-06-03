"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import Logo from "../../../components/shared/logos/Logo";
import { moroccanCities } from "../../../data/moroccanCities.js";

export default function CompleteProfilePage() {
  const { user, token, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState("");

  const [form, setForm] = useState({
    phone: "",
    city: "",
    role: "citizen",
  });

  const [citySearch, setCitySearch] = useState("");
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(false);

  // redirect si déjà complété
  useEffect(() => {
    if (user?.profileCompleted) {
      router.push("/");
    }
  }, [user, router]);

  // avatar google
  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  // close dropdown click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowCities(false);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // cities filter
  const filteredCities = useMemo(() => {
    const list = moroccanCities || [];

    if (!citySearch.trim()) {
      return list.slice(0, 15);
    }

    return list
      .filter((city) =>
        city.toLowerCase().includes(citySearch.toLowerCase())
      )
      .slice(0, 15);
  }, [citySearch]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCitySelect = (city) => {
    setForm((prev) => ({
      ...prev,
      city,
    }));

    setCitySearch(city);
    setShowCities(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setAvatarPreview(imageUrl);
  };

  const isFormValid =
    form.phone.trim() !== "" &&
    form.city.trim() !== "" &&
    form.role.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-profile`,
        {
          phone: form.phone,
          city: form.city,
          role: form.role,
          avatar: avatarPreview,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      loginWithGoogle(res.data.user, token);

      router.push("/");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">

        {/* LOGO */}
        <div className="flex justify-center mb-5">
          <Logo />
        </div>

        {/* AVATAR */}
        <div className="flex flex-col items-center mb-4">

          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img
              src={avatarPreview || "/default-avatar.png"}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <label className="mt-3 text-sm text-green-600 cursor-pointer">
            Changer la photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>

          <h1 className="mt-4 text-lg font-bold">
            Bonjour {user?.name}
          </h1>

          <p className="text-sm text-gray-500 text-center mt-2">
            Complétez votre profil pour accéder aux services du site .
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          {/* ROLE */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg mb-3"
          >
            <option value="citizen">Citoyen</option>
            <option value="business">Entreprise</option>
          </select>

          {/* PHONE */}
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Téléphone"
            className="w-full border p-3 rounded-lg mb-3"
          />

          {/* CITY */}
          <div className="relative">

            <input
              value={citySearch}
              onFocus={() => setShowCities(true)}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCities(true);
              }}
              placeholder="Ville"
              className="w-full border p-3 rounded-lg mb-3"
            />

            {showCities && filteredCities.length > 0 && (
              <div className="absolute z-50 bg-white border w-full rounded-lg shadow max-h-48 overflow-y-auto">
                {filteredCities.map((city) => (
                  <div
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTON */}
          <button
            disabled={!isFormValid || loading}
            className={`w-full p-3 rounded-lg text-white font-medium ${
              isFormValid
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