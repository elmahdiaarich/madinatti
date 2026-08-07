'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { candidateProfileService } from '@/services/candidateProfileService';

export default function CompleteProfileBanner({ user, token }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'citizen' || !token) return;
    candidateProfileService.getMine(token)
      .then(({ complete }) => setShow(!complete))
      .catch(() => {});
  }, [user, token]);

  if (!show) return null;

  return (
    <div
      onClick={() => router.push('/my-space/profile')}
      className="max-w-[1200px] mx-auto px-4 mt-4 cursor-pointer"
    >
      <div className="bg-[#E8F5D0] border border-[#A7D129] rounded-2xl px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#d8edbb] transition">
        <p className="text-sm text-[#2D5016] font-medium">
          🎯 Complétez vos informations professionnelles pour être visible auprès des recruteurs.
        </p>
        <span className="text-[#2D5016] text-xs font-bold whitespace-nowrap">Compléter →</span>
      </div>
    </div>
  );
}