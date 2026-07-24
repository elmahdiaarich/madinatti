'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingJournalists, updateJournalistStatus } from '../../../lib/adminApi'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '@/context/ToastContext'

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" />
  </svg>
)

const refreshSidebarCounts = () => window.dispatchEvent(new Event('admin:counts:refresh'))

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function AdminJournalistsPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [journalists, setJournalists] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await getPendingJournalists(token)
      setJournalists(data)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleDecision = async (id, status) => {
    setActionLoading(id)
    try {
      await updateJournalistStatus(id, status, token)
      setJournalists((prev) => prev.filter((j) => j.id !== id))
      refreshSidebarCounts()
      toast.success(status === 'APPROVED' ? 'Compte journaliste approuvé.' : 'Compte journaliste refusé.')
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          <IconUserCheck />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comptes journalistes</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Validation des comptes avant qu'ils puissent soumettre des articles
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : journalists.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-gray-700">Aucune demande en attente</p>
          <p className="text-sm text-gray-400 mt-1">Les nouveaux comptes journalistes apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {journalists.map((j) => (
            <div key={j.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {j.avatar ? (
                    <img src={j.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-teal-700">{j.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{j.name}</p>
                  <p className="text-xs text-gray-400 truncate">{j.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {j.phone && <span className="bg-gray-100 px-2 py-1 rounded-full">{j.phone}</span>}
                {j.city && <span className="bg-gray-100 px-2 py-1 rounded-full">{j.city}</span>}
                <span className="bg-gray-100 px-2 py-1 rounded-full">Inscrit le {formatDate(j.createdAt)}</span>
              </div>

              {j.rejectedArticlesCount >= 3 && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                  <span className="text-red-500 text-xs">⚠</span>
                  <p className="text-xs text-red-600 font-semibold">
                    {j.rejectedArticlesCount} refus sur {j.totalArticlesCount} article{j.totalArticlesCount > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleDecision(j.id, 'APPROVED')}
                  disabled={actionLoading === j.id}
                  className="flex-1 py-2 rounded-xl bg-[#2D5016] text-white text-xs font-bold hover:bg-[#3a6b1e] transition disabled:opacity-50"
                >
                  Approuver
                </button>
                <button
                  onClick={() => handleDecision(j.id, 'REJECTED')}
                  disabled={actionLoading === j.id}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}