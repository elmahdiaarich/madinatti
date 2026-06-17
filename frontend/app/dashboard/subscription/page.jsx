"use client";

import { useAuth } from "@/context/AuthContext";
import { Check, X } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();

  const isPremium = user?.tier === "PREMIUM";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Gérez votre abonnement</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Choisissez le plan qui correspond le mieux aux besoins de votre entreprise pour maximiser votre visibilité.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Standard Plan */}
        <div className={`bg-white rounded-3xl p-8 border-2 flex flex-col relative ${!isPremium ? 'border-[#2D5016] shadow-xl' : 'border-gray-100 shadow-sm opacity-80'}`}>
          {!isPremium && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2D5016] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Plan Actuel</div>}
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Standard</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">Idéal pour les petites entreprises qui démarrent sur la plateforme.</p>
          
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-gray-900">Gratuit</span>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-gray-700">
              <Check className="text-green-500 shrink-0" size={20} />
              <span>Max 3 annonces actives</span>
            </li>
            <li className="flex gap-3 text-gray-700">
              <Check className="text-green-500 shrink-0" size={20} />
              <span>Photos limitées</span>
            </li>
            <li className="flex gap-3 text-gray-700">
              <Check className="text-green-500 shrink-0" size={20} />
              <span>Visibilité standard</span>
            </li>
            <li className="flex gap-3 text-gray-400">
              <X className="shrink-0" size={20} />
              <span>Pas de boost</span>
            </li>
            <li className="flex gap-3 text-gray-400">
              <X className="shrink-0" size={20} />
              <span>Pas de statistiques</span>
            </li>
          </ul>

          <button disabled className={`w-full py-3 rounded-xl font-bold transition-colors ${!isPremium ? 'bg-gray-100 text-gray-500' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {!isPremium ? "Votre offre actuelle" : "Passer à Standard"}
          </button>
        </div>

        {/* Premium Plan */}
        <div className={`bg-gradient-to-b from-[#2D5016] to-[#1c330e] rounded-3xl p-8 text-white flex flex-col relative shadow-2xl ${isPremium ? 'ring-4 ring-yellow-400 ring-offset-4' : 'hover:-translate-y-2 transition-transform duration-300'}`}>
          {isPremium && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-bold tracking-wide uppercase">Plan Actuel</div>}
          
          <div className="absolute top-8 right-8">
            <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-lg uppercase tracking-wider">Populaire</span>
          </div>

          <h3 className="text-2xl font-bold mb-2 text-white">Premium</h3>
          <p className="text-[#A7D129] text-sm mb-6 flex-1 opacity-90">Pour les agences et entreprises nécessitant un volume important.</p>
          
          <div className="mb-8">
            <span className="text-4xl font-extrabold text-white">Sur devis</span>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span>Annonces <strong>illimitées</strong></span>
            </li>
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span>Photos illimitées en haute qualité</span>
            </li>
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span><strong>Boost automatique</strong> de vos annonces</span>
            </li>
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span>Badge Professionnel Vérifié</span>
            </li>
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span>Statistiques détaillées</span>
            </li>
            <li className="flex gap-3 text-white/90">
              <Check className="text-[#A7D129] shrink-0" size={20} />
              <span>Support prioritaire 24/7</span>
            </li>
          </ul>

          <button className={`w-full py-3 rounded-xl font-bold transition-colors ${isPremium ? 'bg-white/20 text-white cursor-default' : 'bg-[#A7D129] text-[#2D5016] hover:bg-[#b8e23b] shadow-lg shadow-[#A7D129]/30'}`}>
            {isPremium ? "Offre Active" : "Contacter le service commercial"}
          </button>
        </div>
      </div>
    </div>
  );
}
