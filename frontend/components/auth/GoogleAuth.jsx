"use client";

import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GoogleAuth({ onSuccess, redirect = true }) {
  const { loginWithGoogle, addGoogleAccount } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async (credentialResponse) => {
  setLoading(true);
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
    if (!onSuccess) router.push("/auth/login");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex justify-center mt-4">
      <GoogleLogin onSuccess={handleGoogle} disabled={loading} />
    </div>
  );
}