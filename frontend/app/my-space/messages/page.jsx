'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { messageService } from '@/services/messageService'

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  REJECTION:     { label: "Rejet d'annonce",  cls: 'bg-red-100 text-red-700'    },
  REPORT_CONTACT:{ label: 'Message admin',     cls: 'bg-orange-100 text-orange-700' },
}
const TARGET_LABELS = { JOB: "Offre d'emploi", REAL_ESTATE: 'Bien immobilier' }
const TARGET_HREF   = { JOB: '/my-space/services/jobs/edit', REAL_ESTATE: '/my-space/services/real-estate/edit' }

const DEFAULT_MSG = {
  REJECTION:      "Votre annonce ne respecte pas nos conditions de publication.",
  REPORT_CONTACT: "Nous avons examiné un signalement concernant votre annonce.",
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) : '—'

const refCode = (id) => '#' + id.replace(/-/g, '').slice(0, 8).toUpperCase()

// ─── MessageCard ──────────────────────────────────────────────────────────────
function MessageCard({ msg, onRead }) {
  const [open, setOpen] = useState(false)
  const cfg  = TYPE_CFG[msg.type]   || { label: msg.type, cls: 'bg-gray-100 text-gray-600' }
  const href = TARGET_HREF[msg.targetType]

  const handleToggle = async () => {
    if (!open && !msg.isRead) onRead(msg.id)
    setOpen((p) => !p)
  }

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-200
        ${msg.isRead
          ? 'bg-white border-gray-100'
          : 'bg-amber-50/60 border-amber-200'}
      `}
    >
      {/* ── Row cliquable ── */}
      <button
        onClick={handleToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {/* Indicateur non-lu */}
        <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5
          ${msg.isRead ? 'bg-transparent' : 'bg-amber-500'}`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>
              {cfg.label}
            </span>
            <p className="text-sm font-semibold text-gray-900 truncate">{msg.targetTitle}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{fmtDate(msg.createdAt)}</p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Détail accordéon ── */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100">

          {/* Partie haute — message admin */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Message de l'équipe Madinatti
            </p>
            <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-4 whitespace-pre-wrap">
              {msg.adminMessage?.trim() || DEFAULT_MSG[msg.type]}
            </p>
          </div>

          <hr className="border-gray-100 mb-4" />

          {/* Partie basse — infos statiques */}
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-32 shrink-0">Annonce concernée :</span>
              <span className="font-semibold text-gray-800">{msg.targetTitle}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-32 shrink-0">Type :</span>
              <span className="text-gray-700">{TARGET_LABELS[msg.targetType] || msg.targetType}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-32 shrink-0">Date :</span>
              <span className="text-gray-700">{fmtDate(msg.createdAt)}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-32 shrink-0">Référence :</span>
              <span className="font-mono text-gray-600">{refCode(msg.id)}</span>
            </div>
          </div>

          {href && (
            <Link
              href={`${href}/${msg.targetId}`}
              className="
                inline-flex items-center gap-2 mt-4
                px-4 py-2 rounded-xl text-xs font-semibold
                bg-[#2D5016] text-white hover:bg-[#1e380f] transition-colors
              "
            >
              Voir l'annonce
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
          <polyline points="3 7 12 13 21 7" strokeWidth={1.5} />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-600">Aucun message pour le moment</p>
        <p className="text-xs text-gray-400 mt-1">
          Les notifications de l'équipe Madinatti apparaîtront ici.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { token } = useAuth()

  const [messages,    setMessages]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, totalPages: 1 })
  const [page,        setPage]        = useState(1)
  const [markingAll,  setMarkingAll]  = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async (p = 1) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await messageService.getMessages(token, p)
      setMessages(res.data || [])
      setUnreadCount(res.unreadCount || 0)
      setPagination(res.pagination || { total: 0, page: 1, totalPages: 1 })
    } catch (err) {
      console.error('MessagesPage load error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load(page) }, [load, page])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleRead = async (id) => {
    try {
      await messageService.markAsRead(id, token)
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m))
      setUnreadCount((p) => Math.max(0, p - 1))
    } catch {}
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      await messageService.markAllAsRead(token)
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })))
      setUnreadCount(0)
    } catch {} finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Notifications et communications de l'équipe Madinatti
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              text-[#2D5016] bg-[#E8F5D0] hover:bg-[#d8edbb] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed shrink-0
            "
          >
            {markingAll ? 'Traitement…' : 'Tout marquer comme lu'}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} onRead={handleRead} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <span className="text-xs text-gray-500">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
