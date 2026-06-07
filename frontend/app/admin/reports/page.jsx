/**
 * app/admin/reports/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de gestion des signalements.
 * Affiche tous les reports avec actions : Ignorer (dismiss) ou Supprimer l'annonce.
 * Utilise getReports() et handleReport() depuis adminApi.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getReports, handleReport } from '../../../lib/adminApi'
import StatusBadge from '../../../components/admin/StatusBadge'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" />
    <path d="M5 21v-7" />
  </svg>
)
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5l10 -10" />
  </svg>
)
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" />
    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)
const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M4 13h3l3 3h4l3 -3h3" />
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ── Status filters ────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: 'all',       label: 'Tous' },
  { key: 'OPEN',      label: 'Ouverts' },
  { key: 'DISMISSED', label: 'Ignorés' },
]

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-full mt-2" />
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        <div className="h-8 w-28 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// REPORT CARD
// ─────────────────────────────────────────────────────────────────────────────

function ReportCard({ report, onAction, actionLoading }) {
  const isOpen      = report.status === 'OPEN'
  const isActioning = actionLoading === report.id

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all
      ${isOpen ? 'border-red-100' : 'border-gray-100 opacity-60'}`}>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        {/* ── Left: info ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Module badge + listing title */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge module={report.listingModule} size="sm" />
            <span className="font-semibold text-gray-900 text-sm truncate">
              {report.listingTitle}
            </span>
            {!isOpen && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                Ignoré
              </span>
            )}
          </div>

          {/* Reporter info */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Signalé par</span>
            <span className="font-semibold text-gray-600">{report.reportedBy}</span>
            <span className="text-gray-300">•</span>
            <a href={`mailto:${report.reportedByEmail}`}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}>
              {report.reportedByEmail}
            </a>
            <span className="text-gray-300">•</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>

          {/* Reason */}
          <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed
            ${isOpen ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
            <span className="font-semibold">Raison : </span>
            {report.reason}
          </div>
        </div>

        {/* ── Right: actions ─────────────────────────────────────────── */}
        {isOpen && (
          <div className="flex items-center gap-2 shrink-0 self-start">
            {/* Ignorer */}
            <button
              onClick={() => onAction(report.id, 'dismiss')}
              disabled={isActioning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActioning ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : <IconCheck />}
              Ignorer
            </button>

            {/* Supprimer l'annonce */}
            <button
              onClick={() => onAction(report.id, 'delete')}
              disabled={isActioning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                text-white bg-red-500 hover:bg-red-600 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isActioning ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : <IconTrash />}
              Supprimer l'annonce
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [reports, setReports]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [statusFilter, setStatusFilter]   = useState('OPEN')

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReports()
      setReports(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  // ── Action ────────────────────────────────────────────────────────────────
  const handleAction = async (id, action) => {
    setActionLoading(id)
    try {
      await handleReport(id, action)
      await loadReports()
    } finally {
      setActionLoading(null)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = reports.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
  })

  const openCount = reports.filter((r) => r.status === 'OPEN').length

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <IconFlag />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
              {openCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {openCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Signalements soumis par les utilisateurs sur des annonces publiées
            </p>
          </div>
        </div>

        {/* Actualiser */}
        <button
          onClick={loadReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors
            disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin' : ''}><IconRefresh /></span>
          Actualiser
        </button>
      </div>

      {/* ── Status tabs ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Afficher :</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${statusFilter === f.key
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
              {f.key === 'OPEN' && openCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Reports list ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">
            {filtered.length} signalement{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {/* Skeletons */}
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16">
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <IconInbox />
              <p className="text-sm font-medium text-gray-400">
                {statusFilter === 'OPEN'
                  ? 'Aucun signalement ouvert — tout est en ordre ✓'
                  : 'Aucun signalement trouvé'}
              </p>
            </div>
          </div>
        )}

        {/* Report cards */}
        {!loading && filtered.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onAction={handleAction}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  )
}
