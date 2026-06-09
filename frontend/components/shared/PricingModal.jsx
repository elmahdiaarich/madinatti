'use client'

import { useRouter } from 'next/navigation'
import { X, Check } from 'lucide-react'
import { pricingPlans } from '@/constants/pricingPlans'

export default function PricingModal({ module, onSelect }) {
  const router = useRouter()
  const plans = pricingPlans[module] || []

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-[#2D5016]">Choisir un plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sélectionnez le plan qui correspond à vos besoins
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#2D5016] hover:text-[#2D5016] transition"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-4 p-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all
                ${plan.recommended
                  ? 'border-[#A7D129] shadow-lg scale-[1.03]'
                  : 'border-gray-200'
                }`}
            >
              {/* Recommended badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#A7D129] text-[#1a3a00] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Recommandé
                  </span>
                </div>
              )}

              {/* Plan info */}
              <div className="mb-4 mt-1">
                <p className="text-sm font-extrabold text-[#2D5016]">{plan.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400">
                    MAD{plan.period ? `/${plan.period}` : ''}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{plan.subtitle}</p>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-2 mb-5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    {f.included
                      ? <Check size={13} className="text-[#7BA428] shrink-0 mt-0.5" />
                      : <X size={13} className="text-gray-300 shrink-0 mt-0.5" />
                    }
                    <span className={f.included ? '' : 'text-gray-300'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onSelect(plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition
                  ${plan.id === 'vip'
                    ? 'bg-[#2D5016] text-[#E8F5D0] hover:opacity-90'
                    : plan.id === 'pro'
                    ? 'bg-[#A7D129] text-[#1a3a00] hover:bg-[#7BA428]'
                    : 'border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#E8F5D0]'
                  }`}
              >
                {plan.id === 'gratuit' ? 'Commencer gratuitement'
                  : plan.id === 'pro' ? 'Choisir Pro'
                  : 'Choisir VIP'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}