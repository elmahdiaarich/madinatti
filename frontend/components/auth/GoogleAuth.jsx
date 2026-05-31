"use client";

import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function GoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogle = async (credentialResponse) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
        {
          token: credentialResponse.credential,
        }
      );

      loginWithGoogle(res.data.user, res.data.token);
      router.push("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <GoogleLogin onSuccess={handleGoogle} />
    </div>
  );
}