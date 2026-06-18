import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Archive,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { updateListingStatus, adminDeleteListing } from "@/lib/adminApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

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

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">

          {/* Top accent */}
          <div className="h-1 w-full bg-red-500 rounded-t-2xl" />

          <div className="p-6 flex flex-col gap-4">
            {/* Icon + heading */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Suppression définitive</h3>
                <p className="text-xs text-gray-400 mt-0.5">Cette action est irréversible</p>
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-gray-600 leading-relaxed">
              L'annonce sera <span className="font-semibold text-red-600">supprimée définitivement</span> de
              la base de données. Aucune restauration ne sera possible.
            </p>

            {/* Warning chip */}
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">
                Toutes les données associées seront perdues.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-gray-600 bg-gray-100 hover:bg-gray-200
                  disabled:opacity-40 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-white bg-red-500 hover:bg-red-600
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 transition-colors"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
                  : <><Trash2 className="w-4 h-4" /> Supprimer</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

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

// ─── StatusPanel ─────────────────────────────────────────────────────────────

export function StatusPanel({
  listingId,
  module,
  currentStatus,
  onStatusChange,
  onTransitionRequest,
  deletedByOwner = false,
}) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { token } = useAuth()
  const { toast } = useToast()

  const transitions = (STATUS_CONFIG[currentStatus]?.transitions ?? [])
    .filter(t => !(deletedByOwner && t.to === 'PENDING'))

  if (transitions.length === 0 && currentStatus !== 'ARCHIVED') return null

  const handleTransition = async (toStatus) => {
    if (onTransitionRequest?.(toStatus, listingId)) return

    setLoading(toStatus)
    setError(null)
    try {
      await updateListingStatus(listingId, toStatus, null, token, module)
      onStatusChange(toStatus)
    } catch (e) {
      setError(e.message)
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setLoading(null)
    }
  }

  const handlePermanentDelete = async () => {
    setLoading('DELETE')
    setError(null)
    try {
      await adminDeleteListing(listingId, token)
      setShowDeleteConfirm(false)
      toast.success('Annonce supprimée définitivement.')
      onStatusChange('DELETED')
    } catch (e) {
      setError(e.message)
      toast.error(`Erreur lors de la suppression : ${e.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <>

<div className="flex flex-col gap-2">
  <div className="flex flex-wrap gap-2 justify-end">
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
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                rounded-lg border border-red-300 text-red-600 hover:bg-red-50
                transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
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

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handlePermanentDelete}
        loading={loading === 'DELETE'}
      />
    </>
  )
}