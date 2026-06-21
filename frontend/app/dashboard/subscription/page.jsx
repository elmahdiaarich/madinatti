"use client";

import { useAuth } from "@/context/AuthContext";
import { Check, X, Zap } from "lucide-react";
import { unifiedPlans } from "@/constants/pricingPlans";

const CTA_LABELS = {
  gratuit: "Votre offre actuelle",
  boost:   "Booster une annonce",
  pro:     "Choisir Pro",
  vip:     "Choisir VIP",
};

// Pour la démo UI, on simule le plan actuel ici.
// À remplacer par user?.subscription?.planId quand le backend sera branché.
const CURRENT_PLAN = "gratuit";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const currentPlan = user?.subscription?.planId ?? CURRENT_PLAN;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header — compact */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#2D5016]">Abonnement</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Quota partagé entre offres d'emploi et biens immobiliers.
            </p>
          </div>
          <CurrentPlanBanner planId={currentPlan} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {unifiedPlans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={isCurrent}
              />
            );
          })}
        </div>

        {/* Shared quota explainer */}
        <div className="bg-[#E8F5D0] border border-[#A7D129]/40 rounded-2xl px-6 py-5 flex gap-4 items-start">
          <span className="text-2xl shrink-0">💡</span>
          <div>
            <p className="text-sm font-bold text-[#2D5016]">Quota partagé jobs & immobilier</p>
            <p className="text-xs text-[#4a7a20] mt-1 leading-relaxed">
              Vos annonces d'emploi et vos biens immobiliers partagent le même compteur.
              Avec le plan Pro par exemple, vous pouvez publier 10 annonces dans n'importe quelle combinaison —
              6 jobs + 4 biens, ou 10 jobs, ou 10 biens. À vous de choisir.
            </p>
          </div>
        </div>

        {/* FAQ rapide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {FAQ.map((item, i) => (
            <div key={i} className="px-6 py-4">
              <p className="text-sm font-semibold text-gray-800">{item.q}</p>
              <p className="text-xs text-gray-500 mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Current plan banner ──────────────────────────────────────────────────────

function CurrentPlanBanner({ planId }) {
  const plan = unifiedPlans.find((p) => p.id === planId);
  if (!plan) return null;

  const isGratuit = planId === "gratuit";

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border
      ${isGratuit ? "bg-gray-50 border-gray-200" : "bg-[#E8F5D0] border-[#A7D129]/40"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0
        ${isGratuit ? "bg-gray-200 text-gray-500" : "bg-[#A7D129] text-[#1a3a00]"}`}>
        {plan.label.charAt(0)}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plan actuel</p>
        <p className={`text-sm font-extrabold leading-tight ${isGratuit ? "text-gray-700" : "text-[#2D5016]"}`}>
          {plan.label}
          {plan.price > 0 && (
            <span className="text-xs font-normal text-gray-400 ml-1">{plan.price} MAD/{plan.period}</span>
          )}
        </p>
      </div>
      {isGratuit && (
        <div className="flex items-center gap-1 text-[11px] text-[#2D5016] font-semibold bg-[#E8F5D0] px-3 py-1.5 rounded-lg ml-2 whitespace-nowrap">
          <Zap size={11} />
          Passer à Pro
        </div>
      )}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, isCurrent }) {
  const isVip = plan.id === "vip";
  const isPro = plan.id === "pro";
  const isBoost = plan.id === "boost";

  return (
    <div className={`relative rounded-2xl border-2 p-7 flex flex-col transition-all min-h-[420px]
      ${isCurrent
        ? "border-[#A7D129] shadow-lg ring-2 ring-[#A7D129]/30"
        : isVip
        ? "border-[#2D5016] bg-gradient-to-b from-[#2D5016] to-[#1c330e] text-white"
        : "border-gray-200 bg-white hover:border-[#A7D129]/60 hover:shadow-md"
      }`}>

      {/* Badges */}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#A7D129] text-[#1a3a00] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
            Plan actuel
          </span>
        </div>
      )}
      {plan.recommended && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#2D5016] text-white text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
            Recommandé
          </span>
        </div>
      )}

      {/* Plan info */}
      <div className="mb-5 mt-2">
        <p className={`text-base font-extrabold ${isVip ? "text-[#A7D129]" : "text-[#2D5016]"}`}>
          {plan.label}
        </p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className={`text-4xl font-extrabold ${isVip ? "text-white" : "text-gray-900"}`}>
            {plan.price === 0 ? "Gratuit" : plan.price}
          </span>
          {plan.price > 0 && (
            <span className={`text-sm ${isVip ? "text-white/60" : "text-gray-400"}`}>
              MAD/{plan.period}
            </span>
          )}
        </div>
        <p className={`text-xs mt-1.5 ${isVip ? "text-white/60" : "text-gray-400"}`}>
          {plan.subtitle}
        </p>
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-3 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${isVip ? "text-white/80" : "text-gray-600"}`}>
            {f.included
              ? <Check size={15} className="text-[#7BA428] shrink-0 mt-0.5" />
              : <X     size={15} className={`shrink-0 mt-0.5 ${isVip ? "text-white/30" : "text-gray-300"}`} />
            }
            <span className={!f.included ? (isVip ? "text-white/30" : "text-gray-300") : ""}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={isCurrent || isBoost}
        className={`w-full py-3 rounded-xl text-sm font-bold transition
          ${isCurrent
            ? "bg-[#A7D129]/20 text-[#2D5016] cursor-default"
            : isVip
            ? "bg-[#A7D129] text-[#1a3a00] hover:opacity-90"
            : isPro
            ? "bg-[#2D5016] text-white hover:bg-[#3d6b1e]"
            : isBoost
            ? "border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#E8F5D0]"
            : "border-2 border-gray-200 text-gray-500 cursor-default"
          }`}
      >
        {isCurrent ? "Votre plan actuel" : CTA_LABELS[plan.id]}
      </button>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    q: "Est-ce que mon quota se réinitialise chaque mois ?",
    a: "Oui, le nombre d'annonces actives est remis à zéro à chaque renouvellement mensuel de votre abonnement.",
  },
  {
    q: "Que se passe-t-il si j'atteins ma limite ?",
    a: "Vous ne pourrez plus publier de nouvelles annonces jusqu'à ce qu'une annonce existante expire ou que vous passiez à un plan supérieur.",
  },
  {
    q: "Le plan Boost est-il un abonnement ?",
    a: "Non, le Boost est un achat ponctuel par annonce. Il vous permet de mettre en avant une annonce existante pendant 20 jours, sans engagement.",
  },
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader à tout moment. Le changement prend effet immédiatement.",
  },
];