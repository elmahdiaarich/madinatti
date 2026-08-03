"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import AuthLayout from "../../../components/auth/AuthLayout";
import PasswordInput from "../../../components/auth/PasswordInput";
import GoogleAuth from "../../../components/auth/GoogleAuth";
import GuestRoute from "@/components/shared/GuestRoute";
import Turnstile from "@/components/shared/Turnstile";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Merci de valider la vérification anti-robot");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await login({ email, password, turnstileToken });
      if (res.token) {
        const user = res.user;
        if (user?.profileCompleted === false) {
          router.push("/auth/complete-profile");
        } else {
          router.push("/");
        }
      } else {
        setError(res.message);
        turnstileRef.current?.reset();
        setTurnstileToken("");
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

         <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
          />

          <button
            disabled={loading}
            className="bg-primary text-white p-3 rounded-lg"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
<p className="text-right text-sm">
  <a href="/auth/forgot-password" className="text-primary-dark hover:underline">
    Mot de passe oublié ?
  </a>
</p>
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