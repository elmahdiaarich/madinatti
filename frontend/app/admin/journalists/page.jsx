'use client'

import { useState, useEffect, useCallback } from 'react'
import { getJournalists, updateJournalistStatus } from '../../../lib/adminApi'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '@/context/ToastContext'
import JournalistActionModal from '@/components/admin/JournalistActionModal'

const refreshSidebarCounts = () => window.dispatchEvent(new Event('admin:counts:refresh'))

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const STATUS_FILTERS = [
  { key: 'PENDING',   label: 'En attente' },
  { key: 'APPROVED',  label: 'Approuvés' },
  { key: 'REJECTED',  label: 'Refusés' },
  { key: 'SUSPENDED', label: 'Suspendus' },
]

const STATUS_BADGE = {
  PENDING:   { label: 'En attente',  cls: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-400' },
  APPROVED:  { label: 'Approuvé',    cls: 'bg-green-50 text-green-700',  dot: 'bg-green-500' },
  REJECTED:  { label: 'Refusé',      cls: 'bg-red-50 text-red-600',      dot: 'bg-red-400' },
  SUSPENDED: { label: 'Suspendu',    cls: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
}

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
)
const IconInbox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
    <path d="M4 13h3l3 3h4l3 -3h3" />
  </svg>
)

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[45, 30, 20, 20, 25, 30].map((w, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
      </td>
    ))}
  </tr>
)

export default function AdminJournalistsPage() {
  const { token } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('PENDING')
  const [journalists, setJournalists] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, journalist: null, action: null })

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getJournalists(activeTab, token)
      setJournalists(data)
    } catch (e) {
      console.error('load journalists error:', e)
      setLoadError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, activeTab])

  const loadCounts = useCallback(async () => {
    if (!token) return
    try {
      const [p, a, r, s] = await Promise.all([
        getJournalists('PENDING', token),
        getJournalists('APPROVED', token),
        getJournalists('REJECTED', token),
        getJournalists('SUSPENDED', token),
      ])
      setCounts({ PENDING: p.length, APPROVED: a.length, REJECTED: r.length, SUSPENDED: s.length })
    } catch (_) {}
  }, [token])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadCounts() }, [loadCounts])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const filtered = search
    ? journalists.filter(j =>
        j.name?.toLowerCase().includes(search.toLowerCase()) ||
        j.email?.toLowerCase().includes(search.toLowerCase()) ||
        j.city?.toLowerCase().includes(search.toLowerCase()))
    : journalists

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await updateJournalistStatus(id, 'APPROVED', '', token)
      toast.success('Compte journaliste approuvé.')
      refreshSidebarCounts()
      await load(); await loadCounts()
    } catch (e) { toast.error(`Erreur : ${e.message}`) }
    finally { setActionLoading(null) }
  }

  const handleReactivate = async (id) => {
    setActionLoading(id)
    try {
      await updateJournalistStatus(id, 'APPROVED', '', token)
      toast.success('Compte journaliste réapprouvé.')
      refreshSidebarCounts()
      await load(); await loadCounts()
    } catch (e) { toast.error(`Erreur : ${e.message}`) }
    finally { setActionLoading(null) }
  }

  const handleModalSuccess = async () => {
    setModal({ open: false, journalist: null, action: null })
    refreshSidebarCounts()
    await load(); await loadCounts()
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <IconUserCheck />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journalistes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Validation et suivi des comptes journalistes</p>
          </div>
        </div>
        <button onClick={() => { load(); loadCounts() }} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40">
          <span className={loading ? 'animate-spin' : ''}><IconRefresh /></span>
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher par nom, email ou ville..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20 transition-all" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Statut :</span>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveTab(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${activeTab === f.key ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
              {counts[f.key] > 0 && (
                <span className={`ml-1.5 text-xs font-bold ${activeTab === f.key ? 'text-white/70' : 'text-gray-400'}`}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            {filtered.length} journaliste{filtered.length > 1 ? 's' : ''}
            {search && <span className="ml-2 text-sm font-normal text-gray-400">pour "{search}"</span>}
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loadError ? (
            <div className="text-center py-16">
              <p className="font-semibold text-gray-700">Erreur de chargement</p>
              <p className="text-sm text-red-500 mt-1 font-mono">{loadError}</p>
              <p className="text-xs text-gray-400 mt-2">Vérifiez que le backend est démarré.</p>
              <button onClick={load} className="mt-4 px-4 py-2 rounded-xl bg-[#2D5016] text-white text-sm font-semibold hover:bg-[#3a6b1e] transition">Réessayer</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Journaliste</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Ville</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Articles</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Inscrit le</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <IconInbox />
                          <p className="text-sm font-medium text-gray-400">
                            {search ? 'Aucun résultat pour cette recherche' : 'Aucun journaliste dans cet onglet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && filtered.map((j) => {
                    const isActioning = actionLoading === j.id
                    const badge = STATUS_BADGE[j.journalistStatus] || STATUS_BADGE.PENDING
                    const stats = j.stats || {}
                    return (
                      <tr key={j.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Journalist info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {j.avatar
                                ? <img src={j.avatar} alt="" className="w-full h-full object-cover" />
                                : <span className="text-xs font-bold text-teal-700">{getInitials(j.name)}</span>
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{j.name}</p>
                              <p className="text-xs text-gray-400">{j.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* City */}
                        <td className="px-4 py-3">
                          <span className="text-gray-500">{j.city || '-'}</span>
                        </td>
                        {/* Stats */}
                        <td className="px-4 py-3">
                          {stats.total > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-gray-700 font-semibold">{stats.total} article{stats.total > 1 ? 's' : ''}</span>
                              <span className="text-xs text-gray-400">
                                {stats.approved > 0 && <span className="text-green-600">{stats.approved} pub.</span>}
                                {stats.approved > 0 && stats.rejected > 0 && ' · '}
                                {stats.rejected > 0 && <span className="text-red-500">{stats.rejected} ref.</span>}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Aucun</span>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3">
                          <span className="text-gray-500 whitespace-nowrap">{formatDate(j.createdAt)}</span>
                        </td>
                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {activeTab === 'PENDING' && (
                              <>
                                <button onClick={() => handleApprove(j.id)} disabled={isActioning}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40">
                                  {isActioning ? '...' : 'Approuver'}
                                </button>
                                <button onClick={() => setModal({ open: true, journalist: j, action: 'REJECTED' })} disabled={isActioning}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40">
                                  Refuser
                                </button>
                              </>
                            )}
                            {activeTab === 'APPROVED' && (
                              <button onClick={() => setModal({ open: true, journalist: j, action: 'SUSPENDED' })} disabled={isActioning}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-40">
                                {isActioning ? '...' : 'Suspendre'}
                              </button>
                            )}
                            {(activeTab === 'REJECTED' || activeTab === 'SUSPENDED') && (
                              <>
                                <button onClick={() => handleReactivate(j.id)} disabled={isActioning}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40">
                                  {isActioning ? '...' : 'Réapprouver'}
                                </button>
                                {activeTab === 'SUSPENDED' && (
                                  <button onClick={() => setModal({ open: true, journalist: j, action: 'REJECTED' })} disabled={isActioning}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40">
                                    Refuser
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <JournalistActionModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, journalist: null, action: null })}
        onSuccess={handleModalSuccess}
        journalist={modal.journalist}
        action={modal.action}
      />
    </div>
  )
}