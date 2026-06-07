/**
 * app/admin/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vue d'ensemble — page principale du dashboard admin.
 * - 4 StatCards : En attente / Approuvés aujourd'hui / Signalements / Utilisateurs
 * - Barre de filtres : recherche + boutons module
 * - Tableau unifié de toutes les annonces en attente (triées par date desc)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import StatCard from '../../components/admin/StatCard'
import ListingTable from '../../components/admin/ListingTable'
import {
  getOverview,
  getListings,
  approveListing,
  rejectListing,
} from '../../lib/adminApi'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
  </svg>
)
const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2l4 -4" />
  </svg>
)
const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="5" x2="5" y2="21" />
    <line x1="19" y1="5" x2="5" y2="5" />
    <path d="M19 13l-14 0" />
    <line x1="19" y1="5" x2="19" y2="13" />
  </svg>
)
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
  </svg>
)
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)

// ── Filter tabs ───────────────────────────────────────────────────────────────
const MODULE_FILTERS = [
  { key: 'tous',        label: 'Tous' },
  { key: 'emploi',      label: 'Emploi' },
  { key: 'immobilier',  label: 'Immo' },
  { key: 'vehicule',    label: 'Véhicules' },
  { key: 'signalement', label: 'Signalements' },
]

const STATUS_FILTERS = [
  { key: '',          label: 'Tous statuts' },
  { key: 'PENDING',   label: 'En attente' },
  { key: 'PUBLISHED', label: 'Approuvés' },
  { key: 'REJECTED',  label: 'Refusés' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  // ── Stats ─────────────────────────────────────────────────────────────────
  const [overview, setOverview]           = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  // ── Listings ──────────────────────────────────────────────────────────────
  const [listings, setListings]           = useState([])
  const [pagination, setPagination]       = useState({})
  const [tableLoading, setTableLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [module, setModule]   = useState('tous')
  const [status, setStatus]   = useState('PENDING')
  const [search, setSearch]   = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]       = useState(1)

  // ── Load overview stats ───────────────────────────────────────────────────
  const loadOverview = async () => {
    setOverviewLoading(true)
    try {
      const data = await getOverview()
      setOverview(data)
    } finally {
      setOverviewLoading(false)
    }
  }

  // ── Load listings ─────────────────────────────────────────────────────────
  const loadListings = useCallback(async () => {
    setTableLoading(true)
    try {
      const result = await getListings({ module, status, search, page })
      setListings(result.data)
      setPagination(result.pagination)
    } finally {
      setTableLoading(false)
    }
  }, [module, status, search, page])

  useEffect(() => { loadOverview() }, [])
  useEffect(() => { loadListings() }, [loadListings])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [module, status, search])

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ── Approve ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await approveListing(id)
      await Promise.all([loadListings(), loadOverview()])
    } finally {
      setActionLoading(null)
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async (id, note) => {
    setActionLoading(id)
    try {
      await rejectListing(id, note)
      await Promise.all([loadListings(), loadOverview()])
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Toutes les soumissions en attente de modération
          </p>
        </div>
        <button
          onClick={() => { loadOverview(); loadListings() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            text-gray-600 bg-white border border-gray-200 hover:border-[#A7D129]
            hover:text-[#2D5016] transition-colors shadow-sm"
        >
          <IconRefresh />
          Actualiser
        </button>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="En attente"
          value={overview?.pending}
          variant="orange"
          icon={<IconClock />}
          sub="annonces à modérer"
          loading={overviewLoading}
        />
        <StatCard
          label="Approuvés aujourd'hui"
          value={overview?.approvedToday}
          variant="green"
          icon={<IconCheckCircle />}
          sub="publications du jour"
          loading={overviewLoading}
        />
        <StatCard
          label="Signalements ouverts"
          value={overview?.openReports}
          variant="red"
          icon={<IconFlag />}
          sub="à traiter en priorité"
          loading={overviewLoading}
        />
        <StatCard
          label="Utilisateurs inscrits"
          value={overview?.totalUsers}
          variant="blue"
          icon={<IconUsers />}
          sub="comptes actifs et inactifs"
          loading={overviewLoading}
        />
      </div>

      {/* ── Filter toolbar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par titre, entreprise ou ville..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50
              text-sm text-gray-800 placeholder:text-gray-400 outline-none
              focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20
              transition-all"
          />
        </div>

        {/* Module filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Module :</span>
          {MODULE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setModule(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${module === f.key
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}

          {/* Divider */}
          <span className="w-px h-5 bg-gray-200 mx-1" />

          <span className="text-xs font-semibold text-gray-400 mr-1">Statut :</span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${status === f.key
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Active filter summary */}
        {(search || module !== 'tous' || status !== 'PENDING') && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-400">Filtres actifs :</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-xs font-medium">
                Recherche : "{search}"
                <button onClick={() => { setSearch(''); setSearchInput('') }} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {module !== 'tous' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-xs font-medium">
                {MODULE_FILTERS.find(f => f.key === module)?.label}
                <button onClick={() => setModule('tous')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
            {status && status !== 'PENDING' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-xs font-medium">
                {STATUS_FILTERS.find(f => f.key === status)?.label}
                <button onClick={() => setStatus('PENDING')} className="ml-1 hover:text-red-500">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Listings table ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            Annonces soumises
            {pagination.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({pagination.total} résultat{pagination.total > 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        <ListingTable
          listings={listings}
          pagination={pagination}
          onPageChange={setPage}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={tableLoading}
          showModuleCol={true}
          actionLoading={actionLoading}
        />
      </div>

    </div>
  )
}
