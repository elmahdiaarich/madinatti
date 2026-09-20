'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function CvDownload({ applicationId, candidateId, mine, children, className, title }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const query = new URLSearchParams(applicationId ? { applicationId } : candidateId ? { candidateId } : { mine: String(!!mine) });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/cv/download?${query}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (!response.ok) throw new Error((await response.json()).message || 'CV indisponible.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CV.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.message || 'Téléchargement impossible.');
    } finally {
      setBusy(false);
    }
  };

  return <button type="button" onClick={download} disabled={!token || busy} className={className} title={title} aria-busy={busy}>{children}</button>;
}
