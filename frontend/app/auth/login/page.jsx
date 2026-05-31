"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Logo from "../../../components/shared/logos/Logo";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";

export default function LoginPage() {
  const { loginWithGoogle, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login({ email, password });
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className=" p-8 rounded-xl  w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h1 className="text-2xl font-bold text-center text-primary-dark mb-6">
          Connexion
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-primary-dark">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-green w-full mt-1 p-3 border border-gray-300 rounded-lg pr-12"
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

          <div className="text-right">
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary-dark hover:underline"
            >
              Mot de passe oublié ?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary-sage transition disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <a
              href="/auth/register"
              className="text-primary-dark font-medium hover:underline"
            >
              S'inscrire
            </a>
          </p>
        </form>
        <div className="mt-2">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
                  {
                    token: credentialResponse.credential,
                  },
                );

                console.log("BACKEND RESPONSE:", res.data);

                loginWithGoogle(res.data.user, res.data.token);

                alert("LOGIN SUCCESS");

                router.push("/");
              } catch (error) {
                console.log("ERROR:", error.response?.data || error);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
