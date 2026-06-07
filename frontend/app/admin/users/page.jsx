/**
 * app/admin/users/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de gestion des utilisateurs.
 * Table paginée avec recherche, filtre rôle, et toggle actif/inactif.
 * Utilise getUsers() et toggleUser() depuis adminApi.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUsers, toggleUser } from '../../../lib/adminApi'
import StatusBadge from '../../../components/admin/StatusBadge'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
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
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[55, 40, 30, 25, 20, 20].map((w, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-gray-100 rounded-full" style={{ width: `${w}%` }} />
      </td>
    ))}
  </tr>
)

// ── Role filter tabs ──────────────────────────────────────────────────────────
const ROLE_FILTERS = [
  { key: '',         label: 'Tous' },
  { key: 'citizen',  label: 'Citoyens' },
  { key: 'business', label: 'Entreprises' },
  { key: 'admin',    label: 'Admins' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers]                 = useState([])
  const [pagination, setPagination]       = useState({})
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [role, setRole]               = useState('')
  const [page, setPage]               = useState(1)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getUsers({ search, role, page })
      setUsers(result.data)
      setPagination(result.pagination)
    } finally {
      setLoading(false)
    }
  }, [search, role, page])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { setPage(1) }, [search, role])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Toggle ────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    setActionLoading(id)
    try {
      await toggleUser(id)
      await loadUsers()
    } finally {
      setActionLoading(null)
    }
  }

  const { page: currentPage = 1, totalPages = 1, total = 0 } = pagination
  const inactiveCount = users.filter((u) => !u.isActive).length

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconUsers />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Gestion de tous les comptes de la plateforme
            </p>
          </div>
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors
            disabled:opacity-40"
        >
          <span className={loading ? 'animate-spin' : ''}><IconRefresh /></span>
          Actualiser
        </button>
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
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50
              text-sm text-gray-800 placeholder:text-gray-400 outline-none
              focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20 transition-all"
          />
        </div>

        {/* Role tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-1">Rôle :</span>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRole(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${role === f.key
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
            {total} utilisateur{total > 1 ? 's' : ''}
            {inactiveCount > 0 && (
              <span className="ml-2 text-sm font-normal text-red-400">
                ({inactiveCount} désactivé{inactiveCount > 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Utilisateur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                    Rôle
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                    Ville
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                    Inscrit le
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                    Statut
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {/* Skeleton */}
                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                {/* Empty */}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <IconInbox />
                        <p className="text-sm font-medium text-gray-400">Aucun utilisateur trouvé</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && users.map((user) => {
                  const isActioning = actionLoading === user.id
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                              text-xs font-bold shrink-0
                              ${user.isActive ? 'bg-[#E8F5D0] text-[#2D5016]' : 'bg-gray-100 text-gray-400'}`}>
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <StatusBadge role={user.role} size="sm" />
                      </td>

                      {/* City */}
                      <td className="px-4 py-3">
                        <span className="text-gray-500">{user.city || '—'}</span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                          ${user.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-500'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full
                            ${user.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {user.isActive ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>

                      {/* Toggle */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggle(user.id)}
                          disabled={isActioning || user.role === 'admin'}
                          title={user.role === 'admin' ? "Impossible de désactiver un admin" : ''}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                            transition-colors ml-auto disabled:opacity-40 disabled:cursor-not-allowed
                            ${user.isActive
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-green-700 bg-green-50 hover:bg-green-100'
                            }`}
                        >
                          {isActioning ? (
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : null}
                          {user.isActive ? 'Désactiver' : 'Réactiver'}
                        </button>
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
                {total} utilisateur{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                    hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <IconChevronLeft />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
                      ${p === currentPage ? 'bg-[#2D5016] text-white' : 'text-gray-500 hover:bg-gray-200'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500
                    hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <IconChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
