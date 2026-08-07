'use client';
import Link from 'next/link';

export default function HeadhunterBanner({ user }) {
  if (!user || user.role !== 'business') return null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 mt-4">
      <Link href="/dashboard/headhunter" className="block">
        <div className="bg-[#2D5016] rounded-2xl px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#3a6b1e] transition">
          <p className="text-sm text-white font-medium">
            🕵️ Recherchez directement des candidats correspondant à vos critères dans notre CVthèque.
          </p>
          <span className="text-[#A7D129] text-xs font-bold whitespace-nowrap">Accéder au Headhunter →</span>
        </div>
      </Link>
    </div>
  );
}