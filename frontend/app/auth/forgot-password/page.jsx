"use client";

import { useState } from "react";
import axios from "axios";
import GuestRoute from "@/components/shared/GuestRoute";
import AuthLayout from "@/components/auth/AuthLayout";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email }
      );
      setMessage("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestRoute>
      {loading && <LoadingSpinner message="Envoi en cours..." />}
      <AuthLayout
        title="Mot de passe oublié ?"
        subtitle="Recevez un lien sécurisé pour le réinitialiser"
      >
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Adresse email</label>
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

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium p-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Retour à la connexion ?{" "}
          <a href="/auth/login" className="text-[var(--color-primary-dark)] font-medium hover:underline">
            Se connecter
          </a>
        </p>
      </AuthLayout>
    </GuestRoute>
  );
}