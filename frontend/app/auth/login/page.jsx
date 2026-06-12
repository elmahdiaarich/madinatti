"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";

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
        } else {
          router.push("/");
        }
      } else {
        setError(res.message);
      }
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      <AuthLayout title="Connexion">
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-green p-3 border rounded-lg"
            required
          />

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="bg-primary text-white p-3 rounded-lg"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <GoogleAuth />

        <p className="text-center text-sm mt-4">
          Pas de compte ?{" "}
          <a href="/auth/register" className="text-primary-dark font-medium">
            S'inscrire
          </a>
        </p>
      </AuthLayout>
    </GuestRoute>
  );
}
