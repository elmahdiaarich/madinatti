'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // Lire les params ici, côté client, au bon moment
    const params = new URLSearchParams(window.location.search);
    const isBypass = params.get('type') === 'business';

    if (!isBypass) {
      router.replace('/');
    }
  }, [user, loading]);

  // Pendant le chargement → attendre
  if (loading) return null;

  // Ne jamais bloquer le rendu synchrone — laisser le useEffect gérer la redirect
  return <>{children}</>;
}