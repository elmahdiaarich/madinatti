/**
 * components/admin/StatCard.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *  <StatCard
 *    label="En attente"
 *    value={12}
 *    variant="orange"
 *    icon={<IconClock />}
 *    sub="annonces à traiter"
 *  />
 *
 * Variants: 'orange' | 'green' | 'red' | 'blue'
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

const VARIANTS = {
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    valueColor: 'text-orange-700',
    bar: 'bg-orange-400',
  },
  green: {
    bg: 'bg-[#E8F5D0]',
    border: 'border-[#A7D129]/30',
    iconBg: 'bg-[#A7D129]/20',
    iconColor: 'text-[#2D5016]',
    valueColor: 'text-[#2D5016]',
    bar: 'bg-[#A7D129]',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    valueColor: 'text-red-700',
    bar: 'bg-red-400',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    valueColor: 'text-blue-700',
    bar: 'bg-blue-400',
  },
}

/**
 * Props:
 *  label    — titre de la carte (ex: "En attente")
 *  value    — nombre affiché en grand
 *  variant  — 'orange' | 'green' | 'red' | 'blue'
 *  icon     — ReactNode (Tabler icon)
 *  sub      — sous-texte optionnel (ex: "annonces à traiter")
 *  loading  — affiche un skeleton si true
 */
export default function StatCard({ label, value, variant = 'blue', icon, sub, loading = false }) {
  const v = VARIANTS[variant] || VARIANTS.blue

  if (loading) {
    return (
      <div className={`rounded-2xl border ${v.border} ${v.bg} p-5 flex flex-col gap-3 animate-pulse`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-10 w-10 rounded-xl bg-gray-200" />
        </div>
        <div className="h-8 w-16 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-200" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border ${v.border} ${v.bg} p-5 flex flex-col gap-2 hover:shadow-md transition-shadow duration-200`}>
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-500 leading-tight">{label}</p>
        {icon && (
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${v.iconBg}`}>
            <span className={`${v.iconColor} [&>svg]:w-5 [&>svg]:h-5`}>{icon}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <p className={`text-3xl font-bold tracking-tight ${v.valueColor}`}>
        {value ?? '—'}
      </p>

      {/* Sub text */}
      {sub && (
        <p className="text-xs text-gray-400 leading-tight">{sub}</p>
      )}

      {/* Bottom accent bar */}
      <div className="mt-1 h-1 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${v.bar}`} style={{ width: value > 0 ? '100%' : '0%', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}
