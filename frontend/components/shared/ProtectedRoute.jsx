'use client';

import { useAuth } from '../../context/AuthContext'; // Adjust path if needed
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from "@/components/shared/LoadingSpinner"; // Adjust path if needed

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 1. Do nothing while auth context is still figuring out who the user is
    if (loading) return;

    console.log("user: ", user)
    // 2. Not logged in? Send to login.
    if (!user) {
      router.push('/auth/login');
      return; 
    }

    // 3. Logged in, but wrong role? Send to home/dashboard.
    if (roles && !roles.includes(user.role)) {
      router.push('/');
    }
  }, [user, loading, router, roles]);

  // Show a spinner while the AuthContext fetches the session on mount
  if (loading) {
    return <LoadingSpinner message="Connexion sécurisée en cours..." />;
  }

  // Prevent flash of content while redirecting unauthenticated users
  if (!user) {
    return null;
  }

  // Prevent flash of content while redirecting users without the correct role
  if (roles && !roles.includes(user.role)) {
    return null;
  }

  // If we made it here, the user is authenticated and authorized!
  return children;
}

//usage
// Route accessible uniquement aux connectés
{/* <ProtectedRoute>
  <MaPage />
</ProtectedRoute> */}

// Route accessible uniquement aux admins
{/* <ProtectedRoute roles={['admin']}>
  <AdminPage />
</ProtectedRoute> */}