'use client'

import { useState } from 'react'
import RealEstateBody from "@/components/admin/real-estate/RealEstateBody"
import JobBody from "@/components/admin/jobs/JobBody"
import RejectModal from './RejectModal'
import SuspendModal from './SuspendModal'
import ArchiveModal from './ArchiveModal'

// ── Module registry — add new modules here ────────────────────────────────
const MODULE_BODIES = {
  immobilier: RealEstateBody,
  emploi: JobBody,
  // vehicules: VehicleBody, ← future
}

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)

export default function ListingDetailModal({ isOpen, onClose, listing, onStatusChanged }) {
  const [pendingTransition, setPendingTransition] = useState(null) // { to, listingId }

  if (!isOpen || !listing) return null

  const BodyComponent = MODULE_BODIES[listing.module]

  console.log(listing);

  // Called by StatusPanel instead of directly hitting the API
  // for transitions that need a modal (REJECTED, SUSPENDED, ARCHIVED)
  const handleTransitionRequest = (toStatus, listingId) => {
    const needsModal = ['REJECTED', 'SUSPENDED', 'ARCHIVED'].includes(toStatus)
    if (needsModal) {
      setPendingTransition({ to: toStatus, listingId })
      return true // signals StatusPanel to NOT proceed with API call
    }
    return false // StatusPanel handles it directly
  }

  const handleModalConfirm = (newStatus) => {
    setPendingTransition(null)
    onStatusChanged?.(listing.id, newStatus)
  }

  const handleModalClose = () => setPendingTransition(null)

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* ── Panel ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-1">
                {listing.module} · réf. {listing.id?.slice(0, 8).toUpperCase()}
              </p>
              <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                {listing.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <IconX />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {BodyComponent ? (
              <BodyComponent
                listing={listing}
                onTransitionRequest={handleTransitionRequest}
                onStatusChanged={onStatusChanged}
              />
            ) : (
              <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                {JSON.stringify(listing, null, 2)}
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600
                bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* ── Transition modals ─────────────────────────────────────────── */}
      <RejectModal
        isOpen={pendingTransition?.to === 'REJECTED'}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        listingId={pendingTransition?.listingId}
        listingTitle={listing.title}
        module={listing.module}
      />
      <SuspendModal
        isOpen={pendingTransition?.to === 'SUSPENDED'}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        listingId={pendingTransition?.listingId}
        listingTitle={listing.title}
        module={listing.module}
      />
      <ArchiveModal
        isOpen={pendingTransition?.to === 'ARCHIVED'}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        listingId={pendingTransition?.listingId}
        listingTitle={listing.title}
        module={listing.module}
      />
    </>
  )
}