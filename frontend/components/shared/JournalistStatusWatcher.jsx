'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const STORAGE_KEY = 'lastKnownJournalistStatus';

export default function JournalistStatusWatcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const hasCheckedThisSession = useRef(false);

  useEffect(() => {
    if (!user || user.role !== 'journalist') return;

    const lastKnown = localStorage.getItem(STORAGE_KEY);
    const current = user.journalistStatus;

    // Transition PENDING -> APPROVED détectée : toast une seule fois, où qu'on soit sur le site
    if (lastKnown === 'PENDING' && current === 'APPROVED' && !hasCheckedThisSession.current) {
      hasCheckedThisSession.current = true;
      toast({
        message: 'Votre compte journaliste est validé. Vous pouvez publier vos articles.',
        type: 'success',
        title: 'Compte activé ✦',
        duration: 8000,
      });
    }

    if (current) {
      localStorage.setItem(STORAGE_KEY, current);
    }
  }, [user?.journalistStatus]);

  if (!user || user.role !== 'journalist' || user.journalistStatus !== 'PENDING') {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-center">
      <p className="text-xs font-medium text-amber-700">
        ⏳ Votre compte journaliste est en attente de validation par un administrateur.{' '}
        <button
          onClick={() => router.push('/my-space/newsroom')}
          className="underline font-bold hover:text-amber-900"
        >
          Voir mon espace
        </button>
      </p>
    </div>
  );
}