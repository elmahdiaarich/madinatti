'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { jobsService } from '@/services/jobsService'

function StatusPill({ status }) {
  if (status === 'accepted') {
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
        Retenu 🎉
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40 whitespace-nowrap">
      En cours ⏳
    </span>
  )
}

function CandidatureCard({ application }) {
  const { jobListing, status, createdAt } = application
  const displayStatus = status === 'accepted' ? 'accepted' : 'pending'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex items-center gap-4 p-4 transition hover:shadow-sm ${
      displayStatus === 'accepted' ? 'border-green-200 bg-green-50/40' : 'border-gray-100'
    }`}>
      {/* Logo / Initiale */}
      {jobListing?.user?.companyLogo ? (
        <img
          src={jobListing?.user?.companyLogo}
          alt=""
          className="w-11 h-11 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-[#E8F5D0] flex items-center justify-center text-[#2D5016] font-extrabold text-base shrink-0">
          {jobListing?.title?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">
          {jobListing?.title || 'Offre supprimée'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {jobListing?.companyName || 'Entreprise'}
          {' · '}
          {new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Statut + lien */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusPill status={displayStatus} />
        {jobListing?.id && (
          <Link
            href={`/jobs/${jobListing.id}`}
            className="text-[10px] text-[#A7D129] font-semibold hover:text-[#2D5016] transition"
          >
            Voir l'offre →
          </Link>
        )}
      </div>
    </div>
  )
}

function PageContent() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    jobsService.getMyApplications(token)
      .then(json => setApplications(json.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const accepted = applications.filter(a => a.status === 'accepted')
  const pending  = applications.filter(a => a.status !== 'accepted')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobs" className="text-gray-400 hover:text-[#2D5016] transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-extrabold text-[#2D5016] text-lg flex-1">Mes candidatures</h1>
          {!loading && (
            <span className="text-xs text-gray-400 font-medium">
              {applications.length} au total · {accepted.length} retenu(s)
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs text-red-700">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📋</span>
            <p className="font-bold text-gray-700">Aucune candidature</p>
            <p className="text-sm text-gray-400">Postulez à une offre pour la voir apparaître ici.</p>
            <Link
              href="/jobs"
              className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
            >
              Voir les offres
            </Link>
          </div>
        )}

        {/* Retenus en premier */}
        {!loading && !error && accepted.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-green-700 px-1">
              🎉 Retenu(s)
            </p>
            {accepted.map(a => <CandidatureCard key={a.id} application={a} />)}
          </section>
        )}

        {/* En attente */}
        {!loading && !error && pending.length > 0 && (
          <section className="flex flex-col gap-3">
            {accepted.length > 0 && (
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1 mt-2">
                En cours
              </p>
            )}
            {pending.map(a => <CandidatureCard key={a.id} application={a} />)}
          </section>
        )}
      </div>
    </div>
  )
}

export default function MesCandidaturesPage() {
  return (
    <ProtectedRoute roles={['citizen']}>
      <PageContent />
    </ProtectedRoute>
  )
}