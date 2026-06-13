/**
 * app/admin/reports/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard admin des signalements.
 * Connecté à l'API réelle :
 *   GET    /api/admin/reports/stats
 *   GET    /api/admin/reports?status=&type=&page=&limit=&search=
 *   PATCH  /api/admin/reports/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { reportService } from '@/services/reportService'
import ReportTable from '@/components/admin/ReportTable'
import StatCard from '@/components/admin/StatCard'
import ReportDetailPanel from '@/components/admin/ReportDetailPanel'

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" />
    <path d="M5 21v-7" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

// ─── Filter constants ─────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '',         label: 'Tous' },
  { key: 'PENDING',  label: 'En attente' },
  { key: 'REVIEWED', label: 'En cours' },
  { key: 'RESOLVED', label: 'Résolus' },
  { key: 'REJECTED', label: 'Rejetés' },
]

const TYPE_OPTIONS = [
  { value: '',            label: 'Tous les types' },
  { value: 'REAL_ESTATE', label: 'Immobilier' },
  { value: 'JOB',         label: 'Emploi' },
  { value: 'USER',        label: 'Utilisateur' },
]

const ITEMS_PER_PAGE = 20

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { token } = useAuth()

  // Stats
  const [stats,       setStats]       = useState(null)
  const [statsLoading,setStatsLoading]= useState(true)

  // Table
  const [reports,     setReports]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, totalPages: 1 })

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)

  // Detail panel
  const [selectedReportId, setSelectedReportId] = useState(null)

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!token) return
    setStatsLoading(true)
    try {
      const res = await reportService.getStats(token)
      setStats(res.data)
    } catch (err) {
      console.error('loadStats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [token])

  // ── Fetch reports ───────────────────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        page,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter   && { type:   typeFilter   }),
        ...(search       && { search              }),
      }
      const res = await reportService.getAdminReports(params, token)
      setReports(res.data || [])
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error('loadReports error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, typeFilter, search, page])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadReports() }, [loadReports])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [statusFilter, typeFilter, search])

  // ── Status change ───────────────────────────────────────────────────────────
  const handleStatusChange = async (id, status) => {
    try {
      await reportService.updateReport(id, { status }, token)
      // Optimistic update
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      loadStats()
    } catch (err) {
      console.error('handleStatusChange error:', err)
    }
  }

  // ── Notes update ────────────────────────────────────────────────────────────
  const handleNotesUpdate = async (id, adminNotes) => {
    try {
      await reportService.updateReport(id, { adminNotes }, token)
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, adminNotes } : r))
    } catch (err) {
      console.error('handleNotesUpdate error:', err)
    }
  }

  const pendingCount = stats?.byStatus?.pending ?? 0

  return (
    <>
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <IconFlag />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Gérez les contenus signalés par les utilisateurs
            </p>
          </div>
        </div>

        <button
          onClick={() => { loadStats(); loadReports() }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors
            disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin' : ''}><IconRefresh /></span>
          Actualiser
        </button>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="En attente"
          value={stats?.byStatus?.pending ?? '—'}
          variant="orange"
          loading={statsLoading}
          sub="à traiter"
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="En cours"
          value={stats?.byStatus?.reviewed ?? '—'}
          variant="blue"
          loading={statsLoading}
          sub="en examen"
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
        <StatCard
          label="Résolus"
          value={stats?.byStatus?.resolved ?? '—'}
          variant="green"
          loading={statsLoading}
          sub="traités avec succès"
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Total"
          value={stats?.total ?? '—'}
          variant="blue"
          loading={statsLoading}
          sub="tous statuts confondus"
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>}
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">

        {/* Status tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Statut :</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${statusFilter === tab.key
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab.label}
              {tab.key === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSearch />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email, description, ID…"
              className="
                w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent
                placeholder:text-gray-300
              "
            />
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500">
            {loading ? '...' : `${pagination.total} signalement${pagination.total !== 1 ? 's' : ''}`}
          </h2>
        </div>

        <ReportTable
          reports={reports}
          loading={loading}
          onStatusChange={handleStatusChange}
          onNotesUpdate={handleNotesUpdate}
          onRowClick={(report) => setSelectedReportId(report.id)}
          selectedId={selectedReportId}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Précédent
            </button>
            <span className="text-xs text-gray-500">
              Page {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ── Panneau de détail ────────────────────────────────────────────── */}
    <ReportDetailPanel
      reportId={selectedReportId}
      onClose={() => setSelectedReportId(null)}
      onRefresh={() => { loadStats(); loadReports() }}
    />
    </>
  )
}
