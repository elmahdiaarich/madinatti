"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace("/"); 
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Vérification du profil..." />;
  }

  return !user ? children : null;
};

export default GuestRoute;