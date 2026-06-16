'use client'

/**
 * components/admin/ListingTable.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable paginated table used on every admin listing page.
 * Columns: Type badge | Titre | Soumis par | Date | Statut | Actions
 *
 * Props:
 *  listings        — array of listing objects
 *  pagination      — { total, page, limit, totalPages }
 *  onPageChange    — (page: number) => void
 *  onApprove       — (id) => Promise<void>
 *  onReject        — (id, note) => Promise<void>
 *  onUpdateStatus  — (id, status, adminNotes?) => Promise<void>  ← NEW
 *  onView          — (listing) => void  (opens ListingDetailModal)
 *  loading         — boolean (shows skeleton rows)
 *  showModuleCol   — boolean (show Type column — hide on module-specific pages)
 *  actionLoading   — string | null  (id of listing currently being actioned)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import ListingDetailModal from './ListingDetailModal'
import RejectModal from './RejectModal'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5l10 -10" />
  </svg>
)
const IconBan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M5.7 5.7l12.6 12.6" />
  </svg>
)
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
  </svg>
)
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6l-6 6" />
  </svg>
)
const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M4 13h3l3 3h4l3 -3h3" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const SkeletonRow = ({ cols }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded-full" style={{ width: `${60 + (i * 13) % 30}%` }} />
      </td>
    ))}
  </tr>
)

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ListingTable({
  listings = [],
  pagination = {},
  onPageChange,
  onApprove,
  onReject,
  onUpdateStatus,    // NEW — full status control from detail modal
  onView,
  loading = false,
  showModuleCol = true,
  actionLoading = null,
}) {
  const [detailListing, setDetailListing] = useState(null)
  const [rejectTarget, setRejectTarget]   = useState(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  const colCount = showModuleCol ? 6 : 5

  const handleRowClick = (listing) => {
    if (onView) onView(listing)
    else setDetailListing(listing)
  }

  const handleApprove = async (e, id) => {
    e.stopPropagation()
    await onApprove?.(id)
  }

  const handleOpenReject = (e, listing) => {
    e.stopPropagation()
    setRejectTarget(listing)
  }

  const handleConfirmReject = async (note) => {
    if (!rejectTarget) return
    setRejectLoading(true)
    try {
      await onReject?.(rejectTarget.id, note)
      setRejectTarget(null)
    } finally {
      setRejectLoading(false)
    }
  }

  // After modal actions, refresh via parent callback
  const handleModalApprove = async (id) => {
    await onApprove?.(id)
    setDetailListing(null)
  }

  const handleModalReject = async (id, note) => {
    await onReject?.(id, note)
    setDetailListing(null)
  }

  const handleModalUpdateStatus = async (id, status, adminNotes) => {
    if (onUpdateStatus) {
      await onUpdateStatus(id, status, adminNotes)
    } else if (status === 'APPROVED') {
      await onApprove?.(id)
    } else {
      await onReject?.(id, adminNotes)
    }
    setDetailListing(null)
  }

  const { page = 1, totalPages = 1, total = 0 } = pagination

  // Smart page range (show max 7 page buttons)
  const pageRange = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const left  = Math.max(1, page - 2)
    const right = Math.min(totalPages, page + 2)
    const pages = []
    if (left > 1) pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (right < totalPages) pages.push(totalPages)
    return pages
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {showModuleCol && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                    Type
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Titre
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">
                  Soumis par
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                  Statut
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {/* Skeleton */}
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} cols={colCount} />
              ))}

              {/* Empty state */}
              {!loading && listings.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <IconInbox />
                      <p className="text-sm font-medium text-gray-400">Aucune annonce trouvée</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && listings.map((listing) => {
                const isPending   = listing.status === 'PENDING'
                const isActioning = actionLoading === listing.id

                return (
                  <tr
                    key={listing.id}
                    onClick={() => handleRowClick(listing)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Type badge */}
                    {showModuleCol && (
                      <td className="px-4 py-3">
                        <StatusBadge module={listing.module} size="sm" />
                      </td>
                    )}

                    {/* Title */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 group-hover:text-[#2D5016] transition-colors truncate max-w-[220px]">
                        {listing.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">
                        {listing.city}
                      </p>
                    </td>

                    {/* Submitted by */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium truncate max-w-[140px]">
                        {listing.submittedBy || listing.company}
                      </p>
                      {listing.submittedByEmail && (
                        <p className="text-xs text-gray-400 truncate max-w-[140px] mt-0.5">
                          {listing.submittedByEmail}
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <p className="text-gray-500 whitespace-nowrap">
                        {formatDate(listing.createdAt)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={listing.status} showDot size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approuver — only for PENDING */}
                        {isPending && (
                          <button
                            onClick={(e) => handleApprove(e, listing.id)}
                            disabled={isActioning}
                            title="Approuver"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                              text-white bg-[#2D5016] hover:bg-[#3a6b1e] transition-colors
                              disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isActioning ? (
                              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                            ) : <IconCheck />}
                            <span className="hidden sm:inline">Approuver</span>
                          </button>
                        )}

                        {/* Refuser — only for PENDING */}
                        {isPending && (
                          <button
                            onClick={(e) => handleOpenReject(e, listing)}
                            disabled={isActioning}
                            title="Refuser"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                              text-white bg-red-500 hover:bg-red-600 transition-colors
                              disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <IconBan />
                            <span className="hidden sm:inline">Refuser</span>
                          </button>
                        )}

                        {/* Voir — always visible */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRowClick(listing) }}
                          title="Voir le détail"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                            text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                        >
                          <IconEye />
                          <span className="hidden sm:inline">Voir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              {total} résultat{total > 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                  hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronLeft />
              </button>

              {pageRange().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange?.(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
                      ${p === page
                        ? 'bg-[#2D5016] text-white'
                        : 'text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                  hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal (internal — opened by row click when no onView prop) */}
      <ListingDetailModal
        isOpen={!!detailListing}
        onClose={() => setDetailListing(null)}
        listing={detailListing}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        onUpdateStatus={handleModalUpdateStatus}
      />

      {/* Reject modal (row action quick-reject) */}
      <RejectModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        listingTitle={rejectTarget?.title}
        loading={rejectLoading}
      />
    </>
  )
}