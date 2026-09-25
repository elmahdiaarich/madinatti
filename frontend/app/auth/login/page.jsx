"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";
import GuestRoute from "@/components/shared/GuestRoute";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login({ email, password });
      if (res.token) {
        const user = res.user;
        if (user?.profileCompleted === false) {
          router.push("/auth/complete-profile");
        } else if (user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        setError(res.message || "Email ou mot de passe incorrect");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Email ou mot de passe incorrect");
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      {loading && <LoadingSpinner message="Connexion en cours..." />}
      <AuthLayout
        title="Bon retour parmi vous"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-green"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Mot de passe</label>
              
              <a href="/auth/forgot-password"
                className="text-xs text-[var(--color-primary-dark)] hover:underline"
              >
                Mot de passe oublié ?
              </a>
            </div>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium p-3 rounded-lg transition disabled:opacity-60 mt-1"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <GoogleAuth />

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas de compte ?{" "}
          <a href="/auth/register" className="text-[var(--color-primary-dark)] font-medium hover:underline">
            S'inscrire
          </a>
        </p>
      </AuthLayout>
    </GuestRoute>
  );
}
