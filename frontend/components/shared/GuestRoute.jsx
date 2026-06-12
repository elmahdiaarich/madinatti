"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner"; // ✅ Import here

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until AuthContext finishes checking localStorage and the /me endpoint
    if (loading) return;

    // If the user IS logged in, redirect them away from login/register to home
    if (user) {
      router.replace("/"); 
    }
  }, [user, loading, router]);

  // While checking authentication state, show a clean loading indicator
  if (loading) {
    return <LoadingSpinner message="Vérification du profil..." />;
  }

  // If there is no user logged in, render the login/register form normally
  return !user ? children : null;
};

export default GuestRoute;