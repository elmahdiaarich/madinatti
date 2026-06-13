'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { reportService } from '@/services/reportService'

// ─── Constants ────────────────────────────────────────────────────────────────
const REASONS = [
  { value: 'FAKE',          label: '🚫 Fausse annonce / contenu fictif' },
  { value: 'FRAUD',         label: '⚠️ Arnaque ou fraude' },
  { value: 'DUPLICATE',     label: '🔁 Annonce en double' },
  { value: 'INAPPROPRIATE', label: '🔞 Contenu inapproprié' },
  { value: 'OTHER',         label: '💬 Autre motif' },
]

const TARGET_LABELS = {
  REAL_ESTATE: 'annonce immobilière',
  JOB:         'offre d\'emploi',
  USER:        'utilisateur',
}

// ─── ReportModal ──────────────────────────────────────────────────────────────
/**
 * Modale universelle de signalement
 *
 * Props:
 *  isOpen      {boolean}           — contrôle l'affichage
 *  onClose     {() => void}        — ferme la modale
 *  targetType  {'REAL_ESTATE'|'JOB'|'USER'}
 *  targetId    {string}            — ID de la ressource signalée
 *  targetTitle {string}            — Titre affiché dans la modale
 */
export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }) {
  const { user, token } = useAuth()

  const [reason,        setReason]        = useState('')
  const [description,   setDescription]   = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [loading,       setLoading]       = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState('')

  if (!isOpen) return null

  const reset = () => {
    setReason('')
    setDescription('')
    setReporterEmail('')
    setError('')
    setSuccess(false)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!reason) {
      setError('Veuillez sélectionner un motif.')
      return
    }
    if (!user && !reporterEmail.trim()) {
      setError('Veuillez saisir votre email.')
      return
    }
    // Validation email basique
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail.trim())) {
      setError('Adresse email invalide.')
      return
    }

    setLoading(true)
    try {
      await reportService.submitReport(
        {
          targetType,
          targetId,
          reason,
          description: description.trim() || undefined,
          reporterEmail: !user ? reporterEmail.trim() : undefined,
        },
        token || null,
      )
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const label = TARGET_LABELS[targetType] || 'élément'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Signaler un contenu"
        className="
          fixed inset-0 z-50 flex items-center justify-center p-4
          pointer-events-none
        "
      >
        <div
          className="
            relative w-full max-w-md bg-white rounded-2xl shadow-2xl
            pointer-events-auto overflow-hidden
            animate-slide-up
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Signaler cette {label}</h2>
                {targetTitle && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{targetTitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {success ? (
              // ── Confirmation ──────────────────────────────────────────────
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Signalement envoyé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Notre équipe examinera votre signalement dans les plus brefs délais. Merci de contribuer à la qualité de la plateforme.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              // ── Formulaire ────────────────────────────────────────────────
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Visiteur anonyme — email */}
                {!user && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="report-email" className="text-sm font-semibold text-gray-700">
                      Votre email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="report-email"
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="
                        w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent
                        placeholder:text-gray-300
                      "
                    />
                    <p className="text-xs text-gray-400">
                      Requis pour les visiteurs. Votre email ne sera pas partagé.
                    </p>
                  </div>
                )}

                {/* Motif */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Motif du signalement <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                          ${reason === r.value
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={(e) => setReason(e.target.value)}
                          className="accent-red-500 shrink-0"
                        />
                        <span className="text-sm text-gray-700">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description optionnelle */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="report-desc" className="text-sm font-semibold text-gray-700">
                    Détails <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    id="report-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le problème en quelques mots..."
                    rows={3}
                    maxLength={500}
                    className="
                      w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none
                      focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent
                      placeholder:text-gray-300
                    "
                  />
                  <p className="text-xs text-gray-400 text-right">{description.length}/500</p>
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="
                      flex-1 py-2.5 text-sm font-semibold text-gray-600
                      border border-gray-200 rounded-xl
                      hover:bg-gray-50 transition-colors
                    "
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      flex-1 py-2.5 text-sm font-semibold text-white
                      bg-red-500 hover:bg-red-600 rounded-xl
                      transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Envoi...
                      </>
                    ) : (
                      'Envoyer le signalement'
                    )}
                  </button>
                </div>

                {/* Note légale */}
                <p className="text-xs text-center text-gray-400">
                  Les signalements abusifs peuvent entraîner une restriction de votre compte.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

    </>
  )
}
