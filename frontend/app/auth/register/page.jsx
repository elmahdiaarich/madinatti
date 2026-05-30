"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
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

  const { register } = useAuth();
  const router = useRouter();

  const moroccanCities = [
    "Casablanca",
    "Rabat",
    "Salé",
    "Kénitra",
    "Tanger",
    "Marrakech",
    "Fès",
    "Meknès",
    "Agadir",
    "Oujda",
    "Tétouan",
    "Nador",
    "El Jadida",
    "Safi",
    "Béni Mellal",
    "Khouribga",
    "Mohammedia",
    "Settat",
    "Laâyoune",
    "Dakhla",
  ];

  const filteredCities = moroccanCities.filter((city) =>
    city.toLowerCase().includes(formData.city.toLowerCase()),
  );
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(06|07)\d{8}$/;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3)
      return "Le nom doit contenir au moins 3 caractères";

    if (!emailRegex.test(formData.email)) return "Email invalide";

    if (formData.password.length < 8)
      return "Le mot de passe doit contenir au moins 8 caractères";

    if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    )
      return "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre";

    if (formData.phone && !phoneRegex.test(formData.phone))
      return "Numéro invalide";

    if (!formData.city.trim()) return "Ville requise";

    if (!moroccanCities.includes(formData.city))
      return "Veuillez choisir une ville valide";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await register(formData);
      if (response.token) {
        router.push("/");
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-mint">
      <div className="p-8 rounded-xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Madinatti" className="h-12" />
        </div>

        <h1 className="text-2xl font-bold text-center text-primary-dark mb-6">
          Créer un compte
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-primary-dark">
              Nom complet
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">
              Mot de passe
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-green w-full p-3 border border-gray-300 rounded-lg pr-12"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">
              Téléphone
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg"
              placeholder="06XXXXXXXX"
            />
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-primary-dark">
              Ville
            </label>

            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg"
              placeholder="Votre ville"
              autoComplete="off"
            />

            {!moroccanCities.some(
              (city) => city.toLowerCase() === formData.city.toLowerCase(),
            ) &&
              formData.city &&
              filteredCities.length > 0 && (
                <div className="absolute z-10 bg-white border border-gray-300 rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow">
                  {filteredCities.map((city) => (
                    <div
                      key={city}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          city,
                        })
                      }
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                    >
                      {city}
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">
              Type de compte
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg"
            >
              <option value="citizen">Citoyen</option>
              <option value="business">Entreprise</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary-sage transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{" "}
            <a
              href="/auth/login"
              className="text-primary-dark font-medium hover:underline"
            >
              Se connecter
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
