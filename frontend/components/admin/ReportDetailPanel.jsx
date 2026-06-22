'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { reportService } from '@/services/reportService'
import MessageDrawer from './MessageDrawer'

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:  { label: 'En attente',  cls: 'bg-orange-100 text-orange-700' },
  REVIEWED: { label: 'En cours',    cls: 'bg-blue-100   text-blue-700'   },
  RESOLVED: { label: 'Résolu',      cls: 'bg-green-100  text-green-700'  },
  REJECTED: { label: 'Rejeté',      cls: 'bg-gray-100   text-gray-500'   },
}
const REASON_LABELS = {
  FAKE:          'Fausse annonce',
  FRAUD:         'Arnaque / fraude',
  DUPLICATE:     'Doublon',
  INAPPROPRIATE: 'Contenu inapproprié',
  OTHER:         'Autre',
}
const MODULE_HREF = { JOB: '/jobs', REAL_ESTATE: '/real-estate' }

const CONTACT_REASONS = [
  { value: 'PHOTOS',      label: '📷 Photos non conformes', text: "Les photos associées à votre annonce ne respectent pas nos critères de qualité (résolution insuffisante, contenu non pertinent ou hors-sujet). Merci de les remplacer par des photos claires et représentatives du bien." },
  { value: 'DESCRIPTION', label: '📝 Description insuffisante', text: "La description de votre annonce est incomplète ou ne reflète pas fidèlement le bien proposé. Merci de fournir des informations plus détaillées et précises." },
  { value: 'PRICE',       label: '💰 Prix incohérent', text: "Le prix indiqué pour cette annonce semble incohérent par rapport au marché ou aux caractéristiques du bien. Merci de vérifier et corriger le prix affiché." },
  { value: 'DUPLICATE',   label: '🔁 Annonce en double', text: "Nous avons constaté que cette annonce est un doublon d'une autre annonce déjà publiée sur la plateforme. Merci de ne conserver qu'une seule annonce active par bien." },
  { value: 'CATEGORY',    label: '📂 Catégorie incorrecte', text: "Le type de bien sélectionné pour cette annonce ne correspond pas à sa description. Merci de vérifier et corriger la catégorie choisie." },
  { value: 'OTHER',       label: '💬 Autre motif', text: "Suite à l'examen de votre annonce, nous avons identifié un point nécessitant une correction. Merci de vous référer aux détails ci-dessus ou de nous contacter pour plus d'informations." },
]
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// ─── Sub-components ───────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap
        ${active ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
    >
      {children}
    </button>
  )
}

function ActionBtn({ onClick, loading, disabled, variant = 'gray', children }) {
  const variants = {
    gray:   'bg-gray-100 text-gray-700 hover:bg-gray-200',
    green:  'bg-green-50  text-green-700  hover:bg-green-100',
    red:    'bg-red-50    text-red-600    hover:bg-red-100',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    blue:   'bg-blue-50   text-blue-700   hover:bg-blue-100',
  }
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {loading && (
        <svg className="w-3 h-3 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-medium text-gray-800 break-all">{value}</span>
    </div>
  )
}

// ─── Tab: Infos ───────────────────────────────────────────────────────────────
function TabInfos({ detail }) {
  const { report, listingInfo, owner, ownerListingsCount } = detail
  const first = detail.allReporters?.[0]

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Annonce ciblée */}
      {listingInfo && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Annonce ciblée</p>
          <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-gray-900 leading-snug">{listingInfo.title}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                ${listingInfo.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                  : listingInfo.status === 'PENDING'  ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-600'}`}>
                {listingInfo.status}
              </span>
            </div>
            {listingInfo.price && (
              <p className="text-sm font-bold text-orange-600">{Number(listingInfo.price).toLocaleString('fr-MA')} MAD</p>
            )}
            {(listingInfo.salaryMin || listingInfo.salaryMax) && (
              <p className="text-xs text-gray-500">
                {listingInfo.salaryMin && `${Number(listingInfo.salaryMin).toLocaleString('fr-MA')} MAD`}
                {listingInfo.salaryMin && listingInfo.salaryMax && ' – '}
                {listingInfo.salaryMax && `${Number(listingInfo.salaryMax).toLocaleString('fr-MA')} MAD/mois`}
              </p>
            )}
            <p className="text-[11px] text-gray-400">Publié le {fmtDate(listingInfo.createdAt)}</p>
            <a
              href={`${MODULE_HREF[listingInfo.module]}/${listingInfo.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
            >
              Voir l'annonce
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </section>
      )}

      {/* Propriétaire */}
      {owner && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Propriétaire de l'annonce</p>
          <div className="flex flex-col gap-2">
            <InfoRow label="Nom"              value={owner.name} />
            <InfoRow label="Email"            value={owner.email} />
            <InfoRow label="Statut compte"    value={owner.isActive ? '✅ Actif' : '🚫 Suspendu'} />
            <InfoRow label="Nb d'annonces"    value={`${ownerListingsCount} annonce(s) au total`} />
          </div>
        </section>
      )}

      {/* Signal principal */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Premier signalement</p>
        <div className="flex flex-col gap-2">
          <InfoRow label="Motif"        value={REASON_LABELS[report.reason] || report.reason} />
          <InfoRow label="Date"         value={fmtDate(report.createdAt)} />
          <InfoRow label="Signalant"    value={first?.user?.name || first?.reporterEmail || 'Anonyme'} />
          {first?.description && (
            <div className="mt-1 text-xs text-gray-700 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
              "{first.description}"
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

// ─── Tab: Signaleurs ──────────────────────────────────────────────────────────
function TabReporters({ reporters }) {
  if (!reporters?.length) {
    return <p className="text-sm text-gray-400 py-8 text-center">Aucun signalement enregistré.</p>
  }
  return (
    <div className="flex flex-col gap-3 py-4">
      {reporters.map((r, i) => (
        <div key={r.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                {(r.user?.name || r.reporterEmail || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  {r.user?.name || r.reporterEmail || 'Visiteur anonyme'}
                </p>
                {r.user?.role?.name && (
                  <p className="text-[10px] text-gray-400">{r.user.role.name}</p>
                )}
              </div>
            </div>
            <span className="text-[10px] text-gray-400">{fmtDate(r.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 pl-9">
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              {REASON_LABELS[r.reason] || r.reason}
            </span>
          </div>
          {r.description && (
            <p className="text-xs text-gray-500 pl-9 italic">"{r.description}"</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Historique ──────────────────────────────────────────────────────────
function TabHistory({ detail }) {
  const { report, allReporters, listingInfo } = detail

  // Construction timeline
  const events = []

  if (listingInfo?.createdAt) {
    events.push({
      date: listingInfo.createdAt,
      label: 'Annonce publiée',
      icon: '📝',
      color: 'bg-blue-100 text-blue-700',
    })
  }
  allReporters?.forEach((r, i) => {
    events.push({
      date: r.createdAt,
      label: `Signalement #${i + 1} — ${REASON_LABELS[r.reason] || r.reason}`,
      sub:  r.user?.name || r.reporterEmail || 'Anonyme',
      icon: '🚩',
      color: 'bg-orange-100 text-orange-700',
    })
  })
  if (report.resolvedAt) {
    events.push({
      date: report.resolvedAt,
      label: `Clôturé (${STATUS_CFG[report.status]?.label || report.status})`,
      icon: report.status === 'RESOLVED' ? '✅' : '🚫',
      color: report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
    })
  }

  events.sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="py-4">
      {events.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Aucun événement.</p>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="flex flex-col gap-4">
            {events.map((ev, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm z-10 shrink-0 ${ev.color}`}>
                  {ev.icon}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-xs font-semibold text-gray-800">{ev.label}</p>
                  {ev.sub && <p className="text-[11px] text-gray-400">{ev.sub}</p>}
                  <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(ev.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportDetailPanel
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Panneau de détail latéral pour un signalement admin.
 *
 * Props:
 *  reportId   {string|null}   — ID du report sélectionné (null = fermé)
 *  onClose    {() => void}    — ferme le panneau
 *  onRefresh  {() => void}    — rafraîchit la liste principale après action
 */
export default function ReportDetailPanel({ reportId, onClose, onRefresh }) {
  const { token } = useAuth()
  const { toast } = useToast()

  const [tab,     setTab]     = useState('infos')
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Notes internes
  const [notes,      setNotes]      = useState('')
  const [savingNotes,setSavingNotes]= useState(false)

  // Contact owner
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [sendingContact, setSendingContact] = useState(false)

  // Actions
  const [actionLoading, setActionLoading] = useState(null) // 'dismiss'|'remove'|'suspend'

  // Client-side mount guard (pour createPortal)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])



  // ── Fetch detail ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reportId || !token) return
    setTab('infos')
    setDetail(null)
    setError('')
    setNotes('')
    setDrawerOpen(false)

    setLoading(true)
    reportService.getReportDetail(reportId, token)
      .then((res) => {
        setDetail(res.data)
        setNotes(res.data?.report?.adminNotes || '')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [reportId, token])

  if (!reportId || !mounted) return null

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await reportService.updateReport(reportId, { adminNotes: notes }, token)
      toast.success('Notes enregistrées')
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleAction = async (action) => {
    if (!window.confirm(ACTION_CONFIRMS[action])) return
    setActionLoading(action)
    try {
      if (action === 'dismiss') await reportService.dismissReport(reportId, token)
      if (action === 'remove')  await reportService.removeListing(reportId, token)
      if (action === 'suspend') await reportService.suspendOwner(reportId, token)
      toast.success('Action effectuée')
      onRefresh?.()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleContactOwner = async (message) => {
    if (!message.trim()) return
    setSendingContact(true)
    try {
      await reportService.contactOwner(reportId, message, token)
      toast.success('Email envoyé')
      setDrawerOpen(false)
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSendingContact(false)
    }
  }

  const ACTION_CONFIRMS = {
    dismiss: 'Confirmer : innocenter cette annonce et la remettre en ligne ?',
    remove:  'Confirmer : retirer définitivement cette annonce ?',
    suspend: 'Confirmer : suspendre le compte du propriétaire ?',
  }

  const isResolved = ['RESOLVED', 'REJECTED'].includes(detail?.report?.status)

  const panel = (
    <>
      {/* Overlay mobile */}
      <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose} />

      {/* Panneau */}
      <aside className="
        fixed right-0 top-0 bottom-0 z-40
        w-full max-w-[500px] bg-white border-l border-gray-100 shadow-2xl
        flex flex-col overflow-hidden
        animate-slide-in
      ">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Détail signalement</p>
              {detail?.report?.status && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CFG[detail.report.status]?.cls}`}>
                  {STATUS_CFG[detail.report.status]?.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {loading && (
            <div className="flex flex-col gap-3 p-5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-4 bg-gray-100 rounded ${i % 3 === 0 ? 'w-1/3' : 'w-full'}`} />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="p-5 text-sm text-red-600 bg-red-50 m-4 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-5 overflow-x-auto">
                <TabBtn active={tab === 'infos'}     onClick={() => setTab('infos')}>Infos</TabBtn>
                <TabBtn active={tab === 'reporters'} onClick={() => setTab('reporters')}>
                  Signaleurs ({detail.allReporters?.length || 0})
                </TabBtn>
                <TabBtn active={tab === 'history'}   onClick={() => setTab('history')}>Historique</TabBtn>
              </div>

              {/* Tab content */}
              <div className="px-5">
                {tab === 'infos'     && <TabInfos     detail={detail} />}
                {tab === 'reporters' && <TabReporters reporters={detail.allReporters} />}
                {tab === 'history'   && <TabHistory   detail={detail} />}
              </div>

              {/* Note interne */}
              <div className="px-5 pb-4 border-t border-gray-100 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 pt-4">Note interne (admin)</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ajouter une note visible uniquement par l'équipe…"
                  className="
                    w-full text-xs border border-gray-200 rounded-xl p-3 resize-none
                    focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent
                    placeholder:text-gray-300
                  "
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (detail.report.adminNotes || '')}
                  className="
                    mt-2 px-4 py-1.5 text-xs font-semibold
                    bg-gray-900 text-white rounded-xl float-right
                    hover:bg-gray-700 transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  {savingNotes ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <div className="clear-both" />
              </div>
            </>
          )}
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        {detail && !loading && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/80 p-4 flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Actions admin</p>

            <div className="grid grid-cols-2 gap-2">
              <ActionBtn
                variant="green"
                loading={actionLoading === 'dismiss'}
                disabled={isResolved}
                onClick={() => handleAction('dismiss')}
              >
                ✅ Innocenter
              </ActionBtn>

              <ActionBtn
                variant="red"
                loading={actionLoading === 'remove'}
                disabled={isResolved}
                onClick={() => handleAction('remove')}
              >
                🗑️ Retirer l'annonce
              </ActionBtn>

              <ActionBtn
                variant="orange"
                loading={actionLoading === 'suspend'}
                disabled={detail.owner?.isActive === false}
                onClick={() => handleAction('suspend')}
              >
                🚫 Suspendre compte
              </ActionBtn>

              <ActionBtn
                variant="blue"
                onClick={() => setDrawerOpen(true)}
              >
                ✉️ Contacter propriétaire
              </ActionBtn>
            </div>
          </div>
        )}

        </aside>

      <MessageDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSend={(message) => handleContactOwner(message)}
        title="Contacter le propriétaire"
        template={`Bonjour ${detail?.owner?.companyName || detail?.owner?.name || 'Propriétaire'},\n\nSuite au signalement de votre annonce "${detail?.listingInfo?.title || 'votre annonce'}", notre équipe a effectué une vérification.\n\n[Complétez votre message ici]\n\nCordialement,\n\nL'équipe Madinatti`}
        listingTitle={detail?.listingInfo?.title}
        listingType={detail?.report?.targetType}
        listingId={detail?.listingInfo?.id}
        badgeType="REPORT_CONTACT"
        reasons={CONTACT_REASONS}
      />
    </>
  )

  return createPortal(panel, document.body)
}
