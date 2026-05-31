"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";

const MOROCCO_CITIES = [
  "Rabat",
  "Casablanca",
  "Fès",
  "Marrakech",
  "Tanger",
  "Agadir",
  "Kénitra",
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    role: "citizen",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const filteredCities = useMemo(() => {
    if (!formData.city) return MOROCCO_CITIES;

    return MOROCCO_CITIES.filter((c) =>
      c.toLowerCase().includes(formData.city.toLowerCase())
    );
  }, [formData.city]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectCity = (city) => {
    setFormData({ ...formData, city });
    setShowCities(false);
  };

  const validate = () => {
    if (!formData.name) return "Nom requis";
    if (!formData.email.includes("@")) return "Email invalide";
    if (formData.password.length < 6) return "Mot de passe trop court";
    if (!formData.phone) return "Téléphone requis";
    if (!formData.city) return "Ville requise";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    setError("");

    try {
      const res = await register(formData);

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
            setFormData({ ...formData, password: e.target.value })
          }
        />

        <input
          name="phone"
          placeholder="Téléphone"
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
        />

        {/* CITY AUTOCOMPLETE */}
        <div className="relative">
          <input
            name="city"
            placeholder="Ville"
            value={formData.city}
            onChange={handleChange}
            onFocus={() => setShowCities(true)}
            className="input-green p-3 border rounded-lg w-full"
          />

          {showCities && filteredCities.length > 0 && (
            <div className="absolute bg-white border w-full mt-1 rounded-lg max-h-40 overflow-auto z-10">
              {filteredCities.map((city) => (
                <div
                  key={city}
                  onClick={() => selectCity(city)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          name="role"
          onChange={handleChange}
          className="input-green p-3 border rounded-lg"
        >
          <option value="citizen">Citoyen</option>
          <option value="business">Entreprise</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white p-3 rounded-lg"
        >
          {loading ? "Création..." : "Créer un compte"}
        </button>
      </form>

      <GoogleAuth />

    </AuthLayout>
  );
}