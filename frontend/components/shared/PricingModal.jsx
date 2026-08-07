'use client'

import { useRouter } from 'next/navigation'
import { Check, Star, X } from 'lucide-react'
import { unifiedPlans } from '@/constants/pricingPlans'

const CTA_LABELS = {
  gratuit: 'Commencer gratuitement',
  basic: 'Choisir Basic',
  pro: 'Choisir Pro',
  max: 'Choisir Max',
}

const MODULE_SUBTITLE = {
  jobs: "Pour vos offres d'emploi",
  immobilier: 'Pour vos annonces immobilieres',
  vehicules: 'Pour vos annonces vehicules',
  evenements: 'Pour vos evenements',
  sante: 'Pour vos etablissements de sante',
}

function getMinDailyPrice(plan) {
  const paidOptions = (plan.billingOptions || []).filter((option) => option.dailyPrice > 0)
  if (!paidOptions.length) return null
  return Math.min(...paidOptions.map((option) => option.dailyPrice)).toFixed(1)
}

function PlanStars({ count }) {
  return (
    <div className="flex items-center gap-0.5 mt-1 text-[#FF8C42]" aria-label={`${count} etoiles`}>
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} size={13} fill="currentColor" strokeWidth={1.5} />
      ))}
    </div>
  )
}

export default function PricingModal({ module, onSelect }) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-[#2D5016]">Choisir un plan</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {MODULE_SUBTITLE[module] || 'Pour toutes vos annonces'} - quota partage entre vos publications Business
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          {unifiedPlans.map((plan) => {
            const minDailyPrice = getMinDailyPrice(plan)

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all
                  ${plan.recommended
                    ? 'border-[#A7D129] shadow-lg lg:scale-[1.03]'
                    : 'border-gray-200'
                  }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#A7D129] text-[#1a3a00] text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-4 mt-1">
                  <p className="text-sm font-extrabold text-[#2D5016]">{plan.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-gray-900">
                      {minDailyPrice ? `Des ${minDailyPrice}` : '0'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {minDailyPrice ? 'DH/j' : 'MAD'}
                    </span>
                  </div>
                  {plan.stars > 0 && <PlanStars count={plan.stars} />}
                  <p className="text-[11px] text-gray-400 mt-1 min-h-[32px]">{plan.subtitle}</p>
                </div>

                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-xs text-gray-500">
                      {f.included
                        ? <Check size={13} className="text-[#7BA428] shrink-0 mt-0.5" />
                        : <X size={13} className="text-gray-300 shrink-0 mt-0.5" />
                      }
                      <span className={f.included ? '' : 'text-gray-300'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelect(plan.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition
                    ${plan.id === 'max'
                      ? 'bg-[#2D5016] text-[#E8F5D0] hover:opacity-90'
                      : plan.id === 'pro'
                      ? 'bg-[#A7D129] text-[#1a3a00] hover:bg-[#7BA428]'
                      : 'border-2 border-[#2D5016] text-[#2D5016] hover:bg-[#E8F5D0]'
                    }`}
                >
                  {CTA_LABELS[plan.id] || plan.label}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[11px] text-gray-400 pb-4">
          Les annonces actives sont partagees entre emploi, immobilier, voitures, sante et evenements.
        </p>
      </div>
    </div>
  )
}
