'use client'

/**
 * components/admin/StatusBadge.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Two badge variants:
 *  <StatusBadge status="PENDING" />   → statut de l'annonce
 *  <StatusBadge module="emploi" />    → type/module de l'annonce
 *  <StatusBadge role="business" />    → rôle utilisateur
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Status configs ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    label: 'En attente',
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
  },

  APPROVED: {
    label: 'Approuvé',
    className: 'bg-green-100 text-green-700 border border-green-200',
    dot: 'bg-green-500',
  },
  REJECTED: {
    label: 'Refusé',
    className: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  SUSPENDED: {
    label: 'Suspendu',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  ARCHIVED: {
    label: 'Archivé',
    className: 'bg-gray-100 text-gray-400 border border-gray-200',
    dot: 'bg-gray-300',
  },
  DRAFT: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
  },
  EXPIRED: {
    label: 'Expiré',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
    dot: 'bg-gray-400',
  },
  // Job-specific
  CLOSED: {
    label: 'Fermé',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
    dot: 'bg-slate-400',
  },
  // Report statuses
  OPEN: {
    label: 'Ouvert',
    className: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  DISMISSED: {
    label: 'Ignoré',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
    dot: 'bg-gray-400',
  },
  DELETED: {
    label: 'Supprimé',
    className: 'bg-red-50 text-red-400 border border-red-100',
    dot: 'bg-red-300',
  },
}

// ─── Module configs ───────────────────────────────────────────────────────────
const MODULE_CONFIG = {
  emploi: {
    label: 'Emploi',
    className: 'bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40',
  },
  immobilier: {
    label: 'Immo',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  vehicule: {
    label: 'Véhicule',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  signalement: {
    label: 'Signalement',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
}

// ─── Role configs ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    className: 'bg-purple-100 text-purple-700 border border-purple-200',
  },
  business: {
    label: 'Entreprise',
    className: 'bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40',
  },
  citizen: {
    label: 'Citoyen',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  visiteur: {
    label: 'Visiteur',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props:
 *  status  — listing/report status key
 *  module  — listing module key (emploi, immobilier, vehicule, signalement)
 *  role    — user role key (admin, business, citizen, visiteur)
 *  showDot — show animated dot indicator (status badges only, default false)
 *  size    — 'sm' | 'md' (default 'md')
 */
export default function StatusBadge({ status, module: mod, role, showDot = false, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'

  // Module badge
  if (mod) {
    const config = MODULE_CONFIG[mod] || {
      label: mod,
      className: 'bg-gray-100 text-gray-600 border border-gray-200',
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // Role badge
  if (role) {
    const config = ROLE_CONFIG[role] || {
      label: role,
      className: 'bg-gray-100 text-gray-600 border border-gray-200',
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${config.className}`}>
        {config.label}
      </span>
    )
  }

  // Status badge
  if (status) {
    const config = STATUS_CONFIG[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-600 border border-gray-200',
      dot: 'bg-gray-400',
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${config.className}`}>
        {showDot && (
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'PENDING' ? 'animate-pulse' : ''}`} />
        )}
        {config.label}
      </span>
    )
  }

  return null
}