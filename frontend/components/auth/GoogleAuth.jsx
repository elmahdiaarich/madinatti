"use client";

import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingSpinner from "@/components/shared/LoadingSpinner";


export default function GoogleAuth({ onSuccess, redirect = true }) {
  const { loginWithGoogle, addGoogleAccount } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
        { token: credentialResponse.credential }
      );

      const { user, token } = res.data;
      if (!user || !token) throw new Error("Invalid Google response");

      if (onSuccess) {
        addGoogleAccount(token, user);
        onSuccess(user, token);
      } else {
        loginWithGoogle(user, token);
        if (redirect) {
          setTimeout(() => {
            router.push(user?.profileCompleted === false ? "/auth/complete-profile" : "/");
          }, 100);
        }
      }
    } catch (err) {
      console.log("Google login error:", err);
      setError(err.response?.data?.message || "Connexion Google impossible. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Connexion en cours..." />;

  return (
    <div className="flex justify-center mt-4">
      <div className="flex flex-col items-center gap-2">
        <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Connexion Google annulée ou indisponible.")} disabled={loading} />
        {error && <p className="text-xs text-red-600 text-center max-w-xs">{error}</p>}
      </div>
    </div>
  );
}
