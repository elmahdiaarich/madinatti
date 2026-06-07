/**
 * app/admin/real-estate/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de gestion des annonces immobilières.
 * Filtre automatiquement sur module="immobilier".
 * Réutilise ListingTable avec showModuleCol=false.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import ListingTable from '../../../components/admin/ListingTable'
import { getListings, approveListing, rejectListing } from '../../../lib/adminApi'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
)
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
)

// ── Status filter tabs ────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: '',          label: 'Tous' },
  { key: 'PENDING',   label: 'En attente' },
  { key: 'PUBLISHED', label: 'Approuvés' },
  { key: 'REJECTED',  label: 'Refusés' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminRealEstatePage() {
  const [listings, setListings]           = useState([])
  const [pagination, setPagination]       = useState({})
  const [tableLoading, setTableLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const [status, setStatus]           = useState('PENDING')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadListings = useCallback(async () => {
    setTableLoading(true)
    try {
      const result = await getListings({ module: 'immobilier', status, search, page })
      setListings(result.data)
      setPagination(result.pagination)
    } finally {
      setTableLoading(false)
    }
  }, [status, search, page])

  useEffect(() => { loadListings() }, [loadListings])
  useEffect(() => { setPage(1) }, [status, search])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(id)
    try { await approveListing(id); await loadListings() }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id, note) => {
    setActionLoading(id)
    try { await rejectListing(id, note); await loadListings() }
    finally { setActionLoading(null) }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <IconHome />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces immobilières</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Modération des biens immobiliers soumis par les agences et particuliers
          </p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
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
            placeholder="Rechercher par titre, agence ou ville..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50
              text-sm text-gray-800 placeholder:text-gray-400 outline-none
              focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20 transition-all"
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            Annonces immobilier
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
          showModuleCol={false}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  )
}
