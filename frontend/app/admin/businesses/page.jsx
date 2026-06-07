/**
 * app/admin/businesses/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Page de gestion des comptes entreprise.
 * Affiche stats d'annonces, plan, statut actif/inactif.
 * Utilise getBusinesses() depuis adminApi.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBusinesses, toggleUser } from '../../../lib/adminApi'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l18 0" /><path d="M9 8l1 0" /><path d="M9 12l1 0" /><path d="M9 16l1 0" />
    <path d="M14 8l1 0" /><path d="M14 12l1 0" /><path d="M14 16l1 0" />
    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-gray-100 rounded-full w-1/2" />
          <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        </div>
      </div>
      <div className="h-8 w-24 bg-gray-100 rounded-lg shrink-0" />
    </div>
    <div className="mt-4 grid grid-cols-4 gap-3">
      {[1,2,3,4].map((i) => (
        <div key={i} className="h-14 bg-gray-50 rounded-xl" />
      ))}
    </div>
  </div>
)

// ── Plan badge ────────────────────────────────────────────────────────────────
const PlanBadge = ({ plan }) => {
  const isPremium = plan === 'Premium'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold
      ${isPremium
        ? 'bg-amber-50 text-amber-600 border border-amber-200'
        : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}>
      {isPremium ? '⭐ Premium' : 'Standard'}
    </span>
  )
}

// ── Stat mini ─────────────────────────────────────────────────────────────────
const StatMini = ({ label, value, color }) => (
  <div className={`rounded-xl p-3 flex flex-col gap-1 ${color}`}>
    <span className="text-lg font-bold leading-none">{value}</span>
    <span className="text-xs opacity-70">{label}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS CARD
// ─────────────────────────────────────────────────────────────────────────────

function BusinessCard({ business, onToggle, actionLoading }) {
  const isActioning = actionLoading === business.id

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all
      ${business.isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/30'}`}>

      {/* ── Top row ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center
            text-sm font-bold shrink-0
            ${business.isActive
              ? 'bg-[#E8F5D0] text-[#2D5016]'
              : 'bg-gray-100 text-gray-400'
            }`}>
            {getInitials(business.name)}
          </div>

          {/* Name + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{business.name}</span>
              <PlanBadge plan={business.plan} />
              {!business.isActive && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-500 text-xs font-semibold">
                  Désactivé
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
              <a href={`mailto:${business.email}`}
                className="text-blue-400 hover:text-blue-600 transition-colors">
                {business.email}
              </a>
              <span className="text-gray-300">•</span>
              <span>{business.city}</span>
              <span className="text-gray-300">•</span>
              <span>Inscrit le {formatDate(business.joinedAt)}</span>
            </div>
          </div>
        </div>

        {/* Toggle active */}
        <button
          onClick={() => onToggle(business.id)}
          disabled={isActioning}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
            transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0
            ${business.isActive
              ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
              : 'text-green-700 bg-green-50 hover:bg-green-100 border border-green-200'
            }`}
        >
          {isActioning ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : null}
          {business.isActive ? 'Désactiver' : 'Réactiver'}
        </button>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatMini label="Total annonces"  value={business.totalListings}     color="bg-gray-50 text-gray-700" />
        <StatMini label="En attente"      value={business.pendingListings}   color="bg-orange-50 text-orange-600" />
        <StatMini label="Publiées"        value={business.publishedListings} color="bg-green-50 text-green-700" />
        <StatMini label="Refusées"        value={business.rejectedListings}  color="bg-red-50 text-red-600" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [searchInput, setSearchInput]     = useState('')
  const [search, setSearch]               = useState('')
  const [planFilter, setPlanFilter]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadBusinesses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBusinesses()
      setBusinesses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBusinesses() }, [loadBusinesses])

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
      await loadBusinesses()
    } finally {
      setActionLoading(null)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = businesses.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.email.toLowerCase().includes(search.toLowerCase())) return false
    if (planFilter && b.plan !== planFilter) return false
    if (statusFilter === 'active'   && !b.isActive) return false
    if (statusFilter === 'inactive' &&  b.isActive) return false
    return true
  })

  const inactiveCount = businesses.filter((b) => !b.isActive).length

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5D0] flex items-center justify-center text-[#2D5016]">
            <IconBuilding />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
              {inactiveCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {inactiveCount} désactivée{inactiveCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Gestion des comptes entreprise et de leurs annonces
            </p>
          </div>
        </div>
        <button
          onClick={loadBusinesses}
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

        <div className="flex items-center gap-6 flex-wrap">
          {/* Plan filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Plan :</span>
            {[{ key: '', label: 'Tous' }, { key: 'Premium', label: '⭐ Premium' }, { key: 'Standard', label: 'Standard' }].map((f) => (
              <button key={f.key} onClick={() => setPlanFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${planFilter === f.key ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Statut :</span>
            {[{ key: '', label: 'Tous' }, { key: 'active', label: 'Actifs' }, { key: 'inactive', label: 'Désactivés' }].map((f) => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${statusFilter === f.key ? 'bg-[#2D5016] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Count ─────────────────────────────────────────────────────── */}
      <div className="flex items-center">
        <h2 className="text-base font-semibold text-gray-700">
          {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {/* ── Business cards ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16">
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <IconInbox />
              <p className="text-sm font-medium text-gray-400">Aucune entreprise trouvée</p>
            </div>
          </div>
        )}

        {!loading && filtered.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onToggle={handleToggle}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  )
}
