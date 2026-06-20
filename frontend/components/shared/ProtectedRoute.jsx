'use client';

import { useAuth } from '../../context/AuthContext'; 
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from "@/components/shared/LoadingSpinner";
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return; 
    }

    if (roles && !roles.includes(user.role)) {
      router.push('/');
    }
  }, [user, loading, router, roles]);

  if (loading) {
    return <LoadingSpinner message="Connexion sécurisée en cours..." />;
  }

  if (!user) {
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    return null;
  }
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