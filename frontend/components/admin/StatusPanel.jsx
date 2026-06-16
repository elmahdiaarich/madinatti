// StatusPanel.jsx
import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Archive,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2 
} from "lucide-react";
import { updateListingStatus } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";

const STATUS_CONFIG = {
  PENDING: {
    label: "En attente",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
    transitions: [
      {
        to: "APPROVED",
        label: "Approuver",
        icon: ShieldCheck,
        style: "bg-green-600 hover:bg-green-700 text-white",
      },
      {
        to: "REJECTED",
        label: "Rejeter",
        icon: ShieldX,
        style: "bg-red-500 hover:bg-red-600 text-white",
      },
    ],
  },
  APPROVED: {
    label: "Approuvé",
    badgeClass: "bg-green-100 text-green-800 border-green-300",
    icon: ShieldCheck,
    transitions: [
      {
        to: "SUSPENDED",
        label: "Suspendre",
        icon: AlertTriangle,
        style: "bg-amber-500 hover:bg-amber-600 text-white",
      },
      {
        to: "ARCHIVED",
        label: "Archiver",
        icon: Archive,
        style: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    ],
  },
  REJECTED: {
    label: "Rejeté",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    icon: ShieldX,
    transitions: [
      {
        to: "PENDING",
        label: "Remettre en attente",
        icon: RefreshCw,
        style: "bg-amber-500 hover:bg-amber-600 text-white",
      },
      {
        to: "ARCHIVED",
        label: "Archiver",
        icon: Archive,
        style: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    ],
  },
  SUSPENDED: {
    label: "Suspendu",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    icon: AlertTriangle,
    transitions: [
      {
        to: "APPROVED",
        label: "Réactiver",
        icon: ShieldCheck,
        style: "bg-green-600 hover:bg-green-700 text-white",
      },
      {
        to: "REJECTED",
        label: "Rejeter",
        icon: ShieldX,
        style: "bg-red-500 hover:bg-red-600 text-white",
      },
      {
        to: "ARCHIVED",
        label: "Archiver",
        icon: Archive,
        style: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    ],
  },
  EXPIRED: {
    label: "Expiré",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-300",
    icon: Clock,
    transitions: [
      {
        to: "APPROVED",
        label: "Réactiver",
        icon: ShieldCheck,
        style: "bg-green-600 hover:bg-green-700 text-white",
      },
      {
        to: "ARCHIVED",
        label: "Archiver",
        icon: Archive,
        style: "bg-gray-500 hover:bg-gray-600 text-white",
      },
    ],
  },
  ARCHIVED: {
    label: "Archivé",
    badgeClass: "bg-gray-200 text-gray-500 border-gray-300",
    icon: Archive,
    transitions: [
      {
        to: "PENDING",
        label: "Restaurer",
        icon: RefreshCw,
        style: "bg-amber-500 hover:bg-amber-600 text-white",
      },
    ],
  },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badgeClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

export function StatusPanel({
  listingId,
  currentStatus,
  onStatusChange,
  onTransitionRequest, // ← new: return true to intercept, false to proceed
  deletedByOwner = false,
}) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const { token } = useAuth()

  const transitions = (STATUS_CONFIG[currentStatus]?.transitions ?? [])
    .filter(t => !(deletedByOwner && t.to === 'PENDING'))

  if (transitions.length === 0 && currentStatus !== 'ARCHIVED') return null

  const handleTransition = async (toStatus) => {
    // Let parent intercept if it wants (e.g. open a modal)
    if (onTransitionRequest?.(toStatus, listingId)) return

    setLoading(toStatus)
    setError(null)
    try {
      await updateListingStatus(listingId, toStatus, null, token)
      onStatusChange(toStatus)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  const handlePermanentDelete = async () => {
    if (!confirm('Cette action est irréversible. Confirmer la suppression définitive ?')) return
    setLoading('DELETE')
    setError(null)
    try {
      await adminDeleteListing(listingId, token) // add this to adminApi.js
      onStatusChange('DELETED') // parent can close modal on this
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
        Actions disponibles
      </p>
      <div className="flex flex-wrap gap-2">
        {transitions.map(({ to, label, icon: Icon, style }) => (
          <button
            key={to}
            onClick={() => handleTransition(to)}
            disabled={!!loading}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${style}`}
          >
            {loading === to
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Icon className="w-3.5 h-3.5" />
            }
            {label}
          </button>
        ))}

        {currentStatus === 'ARCHIVED' && (
          <button
            onClick={handlePermanentDelete}
            disabled={!!loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {loading === 'DELETE'
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />
            }
            Supprimer définitivement
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  )
}
