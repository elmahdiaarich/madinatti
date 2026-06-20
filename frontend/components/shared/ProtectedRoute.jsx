'use client';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import BusinessAccountGate from "@/components/shared/BusinessAccountGate";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Cas spécifique : route réservée aux comptes business et l'utilisateur
  // connecté est un citoyen. On ne redirige pas — on lui propose de créer
  // ou d'ajouter un compte business au lieu de le renvoyer silencieusement.
  const isBusinessOnlyRoute = roles && roles.length === 1 && roles[0] === 'business';
  const isCitizenBlockedFromBusiness = isBusinessOnlyRoute && user && user.role === 'citizen';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (roles && !roles.includes(user.role) && !isCitizenBlockedFromBusiness) {
      router.push('/');
    }
  }, [user, loading, router, roles, isCitizenBlockedFromBusiness]);

  if (loading) {
    return <LoadingSpinner message="Connexion sécurisée en cours..." />;
  }
  if (!user) {
    return null;
  }
  if (isCitizenBlockedFromBusiness) {
    return <BusinessAccountGate />;
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