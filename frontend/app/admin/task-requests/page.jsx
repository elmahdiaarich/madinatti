'use client'

import { useState, useEffect, useCallback } from 'react'
import ListingTable from '@/components/admin/ListingTable'
import UserFilterDropdown from "@/components/admin/UserFilterDropdown"
import ListingDetailModal from '@/components/admin/ListingDetailModal'
import { getListings } from '@/lib/adminApi'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const STATUS_LABELS = {
  OPEN: 'Ouverte', IN_PROGRESS: 'En cours', COMPLETED: 'Terminée',
  CANCELLED: 'Annulée', ARCHIVED: 'Archivée', DELETED: 'Supprimée',
}

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
)
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
)
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)

const STATUS_FILTERS = [
  { key: '',            label: 'Tous statuts' },
  { key: 'OPEN',        label: 'Ouvertes' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'COMPLETED',   label: 'Terminées' },
  { key: 'CANCELLED',   label: 'Annulées' },
  { key: 'ARCHIVED',    label: 'Archivées' },
]

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5D0] text-[#2D5016] text-xs font-medium">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-red-500 transition-colors"><IconX /></button>
    </span>
  )
}

const refreshSidebarCounts = () => window.dispatchEvent(new Event('admin:counts:refresh'))

export default function AdminTaskRequestsPage() {
  const { token } = useAuth()
  const { toast } = useToast()

  const [listings, setListings]         = useState([])
  const [pagination, setPagination]     = useState({})
  const [tableLoading, setTableLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)

  const [status, setStatus]             = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchInput, setSearchInput]   = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)

  const loadListings = useCallback(async () => {
    if (!token) return
    setTableLoading(true)
    try {
      const result = await getListings({ module: 'taskRequests', status, search, page, token, userId: selectedUser?.id || '' })
      setListings(result.data)
      setPagination(result.pagination)
    } finally {
      setTableLoading(false)
    }
  }, [status, search, page, token, selectedUser])

  useEffect(() => { loadListings() }, [loadListings])
  useEffect(() => { setPage(1) }, [status, search, selectedUser])
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleRefresh = async () => { await loadListings() }

  const handleModalStatusChanged = useCallback(async (listingId, newStatus) => {
    await loadListings()
    refreshSidebarCounts()
    if (newStatus === 'DELETED') {
      setSelectedListing(null)
      toast.success('Demande supprimée définitivement.')
      return
    }
    setSelectedListing(prev => prev?.id === listingId ? { ...prev, status: newStatus } : prev)
    toast.success(`Statut mis à jour → ${STATUS_LABELS[newStatus] ?? newStatus}`)
  }, [loadListings, toast])

  const hasActiveFilters = search || status || selectedUser

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
          <IconClipboard />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mini-jobs · Demandes de tâches</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ces demandes publient immédiatement — modération réactive via les signalements uniquement.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><IconSearch /></span>
            <input
              type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher par titre, ville..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20 transition-all"
            />
          </div>
          <UserFilterDropdown value={selectedUser} onChange={(user) => setSelectedUser(user)} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Statut :</span>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${status === f.key ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
            <span className="text-xs text-gray-400">Filtres actifs :</span>
            {search && <FilterChip label={`"${search}"`} onRemove={() => { setSearch(''); setSearchInput('') }} />}
            {status && <FilterChip label={STATUS_FILTERS.find(f => f.key === status)?.label} onRemove={() => setStatus('')} />}
            {selectedUser && <FilterChip label={selectedUser.name || selectedUser.email} onRemove={() => setSelectedUser(null)} />}
            <button onClick={() => { setStatus(''); setSearch(''); setSearchInput(''); setSelectedUser(null) }}
              className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 ml-1 transition-colors">
              Tout effacer
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            Demandes de tâches
            {pagination.total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({pagination.total} résultat{pagination.total > 1 ? 's' : ''})</span>}
          </h2>
        </div>
        <ListingTable
          listings={listings} pagination={pagination} onPageChange={setPage}
          onRefresh={handleRefresh} onRowClick={(listing) => setSelectedListing(listing)}
          loading={tableLoading} showModuleCol={false} actionLoading={actionLoading}
          onStatusSuccess={(newStatus) => toast.success(`Statut mis à jour → ${STATUS_LABELS[newStatus] ?? newStatus}`)}
        />
      </div>

      <ListingDetailModal isOpen={!!selectedListing} onClose={() => setSelectedListing(null)} listing={selectedListing} onStatusChanged={handleModalStatusChanged} />
    </div>
  )
}