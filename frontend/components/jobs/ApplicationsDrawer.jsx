'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Download, ChevronDown, ChevronUp, Users } from 'lucide-react'
import { jobsService } from '@/services/jobsService'
import { useToast } from '@/context/ToastContext'

function StatusBadge({ status }) {
  const config = {
    pending:  { label: 'Nouveau',    className: 'bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40' },
    viewed:   { label: 'Vu',         className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
    accepted: { label: 'Retenu ✅',  className: 'bg-green-50 text-green-700 border border-green-200' },
  }
  const { label, className } = config[status] ?? config.pending
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${className}`}>
      {label}
    </span>
  )
}

function ApplicantCard({ application, onRetain, isRetaining }) {
  const [expanded, setExpanded] = useState(false)
  const { id, status, coverLetter, cvPath, createdAt, user } = application
  const alreadyAccepted = status === 'accepted'

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      alreadyAccepted ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-100'
    }`}>
      {/* En-tête */}
      <div className="p-4 flex items-start gap-3">
        {/* Avatar initiale */}
        <div className="w-10 h-10 rounded-full bg-[#E8F5D0] flex items-center justify-center text-[#2D5016] font-extrabold text-sm shrink-0">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm truncate">
              {user?.name || 'Candidat anonyme'}
            </p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
          {user?.phone && (
            <p className="text-xs text-gray-400">{user.phone}</p>
          )}
          <p className="text-[10px] text-gray-300 mt-1">
            {new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        {/* Télécharger CV */}
           {cvPath && (
  <a
    href={`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/cv/download?url=${encodeURIComponent(cvPath)}&name=${encodeURIComponent(user?.name || 'Candidat')}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#A7D129] bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129]/20 transition no-underline"
  >
    <Download size={12} /> Voir CV
  </a>
)}

        {/* Lettre de motivation */}
        {coverLetter && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Masquer lettre' : 'Lettre de motivation'}
          </button>
        )}

        {/* Retenir */}
        {!alreadyAccepted && (
          <button
            onClick={() => onRetain(id)}
            disabled={isRetaining}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-50"
          >
            {isRetaining ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                En cours…
              </>
            ) : '✅ Retenir ce candidat'}
          </button>
        )}
      </div>

      {/* Lettre expandable */}
      {expanded && coverLetter && (
        <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-700 leading-relaxed whitespace-pre-wrap border-l-4 border-[#A7D129]">
          {coverLetter}
        </div>
      )}
    </div>
  )
}

export default function ApplicationsDrawer({ jobId, jobTitle, onClose, token }) {
  const { toast } = useToast()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retaining, setRetaining] = useState(null)

  const load = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const json = await jobsService.getJobApplications(jobId, token)
      setApplications(json.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [jobId, token])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleRetain = async (appId) => {
    setRetaining(appId)
    try {
      await jobsService.updateApplicationStatus(appId, 'accepted', token)
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a)
      )
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la mise à jour du candidat')
    } finally {
      setRetaining(null)
    }
  }

  const sorted = [...applications].sort((a, b) => {
    const order = { accepted: 0, viewed: 1, pending: 2 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  const pendingCount  = applications.filter(a => a.status === 'pending').length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-50 flex flex-col shadow-2xl">


        {/* Header */}
        <div className="bg-[#2D5016] text-white px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Users size={20} className="mt-0.5 shrink-0 opacity-80" />
              <div>
                <h2 className="font-extrabold text-base leading-snug">Candidatures reçues</h2>
                {jobTitle && (
                  <p className="text-xs opacity-75 mt-0.5 line-clamp-1">{jobTitle}</p>
                )}
                {!loading && (
                  <p className="text-xs opacity-60 mt-1">
                    {applications.length} candidature(s) · {pendingCount} nouveau(x) · {acceptedCount} retenu(s)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">

          {loading && (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={load} className="ml-auto underline font-semibold">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && applications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
              <span className="text-5xl mb-4">📭</span>
              <p className="font-semibold text-gray-500">Aucune candidature</p>
              <p className="text-xs mt-1">Les candidatures apparaîtront ici</p>
            </div>
          )}

          {!loading && !error && sorted.map(app => (
            <ApplicantCard
              key={app.id}
              application={app}
              onRetain={handleRetain}
              isRetaining={retaining === app.id}
            />
          ))}
        </div>
      </div>
    </>
  )
}