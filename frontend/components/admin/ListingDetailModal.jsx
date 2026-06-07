/**
 * components/admin/ListingDetailModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-detail modal for any listing (emploi / immobilier / véhicule).
 * Shows: title, company, metadata, description, company history.
 * Actions: Approuver | Refuser avec note (opens RejectModal) | Supprimer (reports)
 *
 * Props:
 *  isOpen        — boolean
 *  onClose       — () => void
 *  listing       — listing object from adminApi
 *  onApprove     — (id) => Promise<void>
 *  onReject      — (id, note) => Promise<void>
 *  loading       — boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import RejectModal from './RejectModal'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
  </svg>
)
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" />
    <path d="M8 15h2" /><path d="M14 15h2" /><path d="M8 19h2" /><path d="M14 19h2" />
  </svg>
)
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
  </svg>
)
const IconContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    <path d="M9 15l2 2l4 -4" />
  </svg>
)
const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8l0 4l2 2" />
    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
  </svg>
)
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </svg>
)
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5l10 -10" />
  </svg>
)
const IconBan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M5.7 5.7l12.6 12.6" />
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

const MetaItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="text-gray-400 shrink-0">{icon}</span>
    <span className="text-gray-400 shrink-0">{label} :</span>
    <span className="font-medium text-gray-800">{value || '—'}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ListingDetailModal({
  isOpen,
  onClose,
  listing,
  onApprove,
  onReject,
  loading = false,
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  if (!isOpen || !listing) return null

  const isReport = listing.module === 'signalement'
  const isPending = listing.status === 'PENDING'

  const handleApprove = async () => {
    await onApprove(listing.id)
    onClose()
  }

  const handleReject = async (note) => {
    setRejectLoading(true)
    try {
      await onReject(listing.id, note)
      setRejectOpen(false)
      onClose()
    } finally {
      setRejectLoading(false)
    }
  }

  const handleDelete = async () => {
    await onReject(listing.id, 'Annonce supprimée suite à un signalement.')
    onClose()
  }

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* ── Modal panel ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge module={listing.module} />
                <StatusBadge status={listing.status} showDot />
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug mt-1">
                {listing.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <IconX />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <MetaItem icon={<IconBuilding />} label="Entreprise" value={listing.company} />
              <MetaItem icon={<IconMapPin />}   label="Ville"      value={listing.city} />
              <MetaItem icon={<IconContract />} label="Type"       value={listing.contractType} />
              <MetaItem icon={<IconCalendar />} label="Soumis le"  value={formatDate(listing.createdAt)} />
              {listing.submittedByEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                  <span className="text-gray-400">Email :</span>
                  <a href={`mailto:${listing.submittedByEmail}`}
                    className="font-medium text-[#2D5016] hover:underline truncate">
                    {listing.submittedByEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50
                rounded-xl border border-gray-100 px-4 py-3">
                {listing.description || 'Aucune description fournie.'}
              </p>
            </div>

            {/* Previous admin note (if rejected before) */}
            {listing.adminNote && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Note de refus précédente</p>
                <p className="text-sm text-red-700 whitespace-pre-line">{listing.adminNote}</p>
              </div>
            )}

            {/* Company history */}
            {listing.companyHistory && (
              <div className="border border-[#A7D129]/30 bg-[#E8F5D0]/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#2D5016]"><IconHistory /></span>
                  <p className="text-sm font-semibold text-[#2D5016]">Historique de l'entreprise</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#2D5016]">
                      {listing.companyHistory.totalSubmitted}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Annonces soumises</p>
                  </div>
                  <div className="w-px h-10 bg-[#A7D129]/30" />
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${listing.companyHistory.previousRejections > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {listing.companyHistory.previousRejections}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Refus précédents</p>
                  </div>
                  <div className="w-px h-10 bg-[#A7D129]/30" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#2D5016]">
                      {listing.companyHistory.totalSubmitted - listing.companyHistory.previousRejections}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Approuvées</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer actions ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100
                hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              Fermer
            </button>

            {/* Report action: delete listing */}
            {isReport && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                <IconTrash />
                Supprimer l'annonce
              </button>
            )}

            {/* Normal listing actions — only shown when PENDING */}
            {!isReport && isPending && (
              <>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  <IconBan />
                  Refuser avec note
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    text-white bg-[#2D5016] hover:bg-[#3a6b1e] transition-colors disabled:opacity-40"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : <IconCheck />}
                  Approuver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Nested RejectModal ───────────────────────────────────────────── */}
      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        listingTitle={listing.title}
        loading={rejectLoading}
      />
    </>
  )
}
