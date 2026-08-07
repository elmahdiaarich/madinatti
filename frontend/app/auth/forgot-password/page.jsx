"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import GuestRoute from "@/components/shared/GuestRoute";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        { email },
      )
      setMessage(
        "Un lien de réinitialisation a été envoyé à votre adresse email.",
      );
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur serveur");

      setMessage("");
    }
  };

  return (
    <GuestRoute>
      <div className="min-h-screen flex items-center justify-center bg-primary-mint px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-5">
            <Image src="/logo-new.svg" alt="Madinatti A Ville" width={512} height={370} priority className="h-16 w-auto" />
          </div>

          <h1 className="text-3xl font-bold text-center text-primary-dark mb-2">
            Mot de passe oublié ?
          </h1>

          <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
            Entrez votre adresse email et nous vous enverrons un lien sécurisé
            pour réinitialiser votre mot de passe.
          </p>

          {message && (
            <div className="bg-green-100 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-primary-dark">
                Adresse email
              </label>

              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
              w-full
              mt-1
              p-3
              border
              border-gray-300
              rounded-lg
              focus:outline-none
              focus:ring-2
              focus:ring-primary
            "
                required
              />
            </div>

            <button
              type="submit"
              className="
            bg-primary
            hover:bg-primary-sage
            transition
            text-white
            p-3
            rounded-lg
            font-medium
          "
            >
              Envoyer le lien
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Retour à la connexion ?{" "}
            <a
              href="/auth/login"
              className="text-primary-dark font-medium hover:underline"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </GuestRoute>
  );
}
