"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function StatsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques Avancées</h1>
        <p className="text-gray-500 mt-1">Analysez les performances de vos annonces (vues, clics, conversions).</p>
      </div>

      <div className="flex-1 mt-8 relative rounded-2xl border border-gray-100 overflow-hidden bg-white flex items-center justify-center">
        {/* Fake blurred background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10" />
        <div className="absolute inset-0 flex flex-col gap-8 p-12 blur-sm pointer-events-none opacity-40">
          <div className="h-64 bg-gray-100 rounded-xl w-full" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>

        {/* Lock overlay */}
        <div className="relative z-10 text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-yellow-700" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Fonctionnalité Premium</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Passez au plan Premium pour accéder aux statistiques détaillées de vos annonces et comprendre le comportement de vos candidats/clients.
          </p>
          <Link 
            href="/dashboard/subscription" 
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition-colors shadow-md shadow-[#2D5016]/20"
          >
            Voir les offres Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
