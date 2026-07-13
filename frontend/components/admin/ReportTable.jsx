'use client'

import { useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:  { label: 'En attente',  bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  REVIEWED: { label: 'En cours',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  RESOLVED: { label: 'Résolu',      bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  REJECTED: { label: 'Rejeté',      bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
}

const TARGET_LABELS = {
  REAL_ESTATE:    { label: 'Immobilier',        color: 'bg-orange-100 text-orange-700' },
  JOB:            { label: 'Emploi',            color: 'bg-[#E8F5D0] text-[#2D5016]'  },
  CAR:            { label: 'Véhicule',          color: 'bg-blue-100 text-blue-700' },
  WORKER_PROFILE: { label: 'Profil prestataire',color: 'bg-teal-100 text-teal-700' },
  TASK_REQUEST:   { label: 'Demande de tâche',  color: 'bg-amber-100 text-amber-700' },
  REVIEW:         { label: 'Avis',              color: 'bg-pink-100 text-pink-700' },
  USER:           { label: 'Utilisateur',       color: 'bg-purple-100 text-purple-700' },
}

const REASON_LABELS = {
  FAKE:          'Fausse annonce',
  FRAUD:         'Arnaque / fraude',
  DUPLICATE:     'Doublon',
  INAPPROPRIATE: 'Contenu inapproprié',
  OTHER:         'Autre',
}

const NEXT_STATUS = {
  PENDING:  ['REVIEWED', 'RESOLVED', 'REJECTED'],
  REVIEWED: ['RESOLVED', 'REJECTED', 'PENDING'],
  RESOLVED: ['PENDING'],
  REJECTED: ['PENDING'],
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── ReportRow ────────────────────────────────────────────────────────────────
function ReportRow({ report, onStatusChange, onNotesUpdate, onRowClick, isSelected }) {
  const [expanded,  setExpanded]  = useState(false)
  const [notes,     setNotes]     = useState(report.adminNotes || '')
  const [saving,    setSaving]    = useState(false)

  const targetCfg  = TARGET_LABELS[report.targetType] || { label: report.targetType, color: 'bg-gray-100 text-gray-600' }
  const reporterName = report.user?.name || report.reporterEmail || 'Visiteur anonyme'
  const date = new Date(report.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const handleSaveNotes = async () => {
    setSaving(true)
    try {
      await onNotesUpdate(report.id, notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Main row */}
      <tr
        className={`border-b border-gray-50 transition-colors cursor-pointer
          ${isSelected
            ? 'bg-orange-50/60 hover:bg-orange-50'
            : 'hover:bg-gray-50/60'
          }`}
        onClick={() => onRowClick?.(report)}
      >
        {/* Reporter */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
              {reporterName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{reporterName}</p>
              {report.user?.role?.name && (
                <p className="text-[10px] text-gray-400">{report.user.role.name}</p>
              )}
            </div>
          </div>
        </td>

        {/* Target */}
        <td className="px-5 py-3.5">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${targetCfg.color}`}>
            {targetCfg.label}
          </span>
          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{report.targetId.slice(0, 8)}…</p>
        </td>

        {/* Reason */}
        <td className="px-5 py-3.5">
          <p className="text-sm text-gray-700">{REASON_LABELS[report.reason] || report.reason}</p>
          {report.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{report.description}</p>
          )}
        </td>

        {/* Status */}
        <td className="px-5 py-3.5">
          <StatusBadge status={report.status} />
        </td>

        {/* Date */}
        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{date}</td>

        {/* Expand toggle */}
        <td className="px-5 py-3.5 text-right">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr className="bg-gray-50/80">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Left: info + actions statut */}
              <div className="flex flex-col gap-4">
                {report.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100">{report.description}</p>
                  </div>
                )}

                {report.resolvedAt && (
                  <div className="text-xs text-gray-400">
                    Résolu le {new Date(report.resolvedAt).toLocaleDateString('fr-FR')}
                    {report.resolvedBy && ` par ${report.resolvedBy}`}
                  </div>
                )}

                {/* Changement de statut */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Changer le statut</p>
                  <div className="flex flex-wrap gap-2">
                    {(NEXT_STATUS[report.status] || []).map((s) => {
                      const cfg = STATUS_CONFIG[s]
                      return (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); onStatusChange(report.id, s) }}
                          className={`
                            px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all
                            ${cfg.bg} ${cfg.text} border-transparent hover:opacity-80
                          `}
                        >
                          → {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right: notes admin */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes internes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  rows={4}
                  placeholder="Ajouter des notes administratives..."
                  className="
                    text-sm bg-white border border-gray-200 rounded-xl p-3 resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent
                    placeholder:text-gray-300
                  "
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveNotes() }}
                  disabled={saving || notes === (report.adminNotes || '')}
                  className="
                    self-end px-4 py-2 text-xs font-semibold
                    bg-gray-900 text-white rounded-xl
                    hover:bg-gray-700 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── ReportTable ──────────────────────────────────────────────────────────────
/**
 * Props:
 *  reports        {Report[]}
 *  loading        {boolean}
 *  onStatusChange (id, status) => void
 *  onNotesUpdate  (id, notes)  => void
 */
export default function ReportTable({ reports = [], loading, onStatusChange, onNotesUpdate, onRowClick, selectedId }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-2 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!reports.length) {
    return (
      <div className="rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Aucun signalement trouvé</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Signalant</th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cible</th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
            <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-50">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              onStatusChange={onStatusChange}
              onNotesUpdate={onNotesUpdate}
              onRowClick={onRowClick}
              isSelected={r.id === selectedId}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
