'use client'

import { useState } from 'react'
import { X, Upload, Send, User, Phone, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ApplyModal({ job, onClose, onSubmit }) {
  const { user } = useAuth()

  // Pré-remplir depuis le profil user
  const [phone, setPhone]           = useState(user?.phone || '')
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile]         = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState('')

  // ── Validation fichier ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Le fichier doit être au format PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo')
      return
    }
    setCvFile(file)
    setError('')
  }

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!cvFile)  { setError('Veuillez joindre votre CV (PDF)') ; return }
    if (!phone.trim()) { setError('Veuillez renseigner votre numéro de téléphone') ; return }

    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ cvFile, coverLetter, phone })
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-[#2D5016]">Postuler à cette offre</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">
              {job.title} — {job.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#2D5016] hover:text-[#2D5016] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Contenu scrollable ── */}
        <div className="overflow-y-auto flex-1">

          {submitted ? (
            /* ── État succès ── */
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8F5D0] flex items-center justify-center text-3xl mx-auto mb-4">🎉</div>
              <h3 className="text-lg font-extrabold text-[#2D5016] mb-2">Candidature envoyée !</h3>
              <p className="text-sm text-gray-500 mb-6">
                Votre candidature a bien été transmise à <strong>{job.companyName}</strong>.<br />
                Vous serez contacté(e) si votre profil correspond.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
              >
                Fermer
              </button>
            </div>
          ) : (
            <div className="px-6 py-5 flex flex-col gap-5">

              {/* ── Infos candidat pré-remplies (lecture seule) ── */}
              <div className="bg-[#E8F5D0]/60 border border-[#A7D129]/40 rounded-xl px-4 py-3.5 flex flex-col gap-2.5">
                <p className="text-[10px] uppercase tracking-widest text-[#7BA428] font-bold mb-0.5">
                  Vos informations
                </p>

                {/* Nom */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D5016]/10 flex items-center justify-center shrink-0">
                    <User size={13} className="text-[#2D5016]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">Nom complet</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || '—'}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D5016]/10 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-[#2D5016]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.email || '—'}</p>
                  </div>
                </div>

                {/* Téléphone — éditable */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D5016]/10 flex items-center justify-center shrink-0">
                    <Phone size={13} className="text-[#2D5016]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium">
                      Téléphone <span className="text-red-400">*</span>
                    </p>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError('') }}
                      placeholder="Ex : 06 12 34 56 78"
                      className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none border-b border-dashed border-[#A7D129] focus:border-[#2D5016] placeholder:text-gray-300 placeholder:font-normal transition pb-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* ── Upload CV ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  CV <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(PDF · max 5 Mo)</span>
                </label>
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition
                  ${cvFile
                    ? 'border-[#A7D129] bg-[#E8F5D0]'
                    : 'border-gray-200 hover:border-[#A7D129] hover:bg-[#E8F5D0]/30'
                  }`}>
                  <Upload size={18} className={cvFile ? 'text-[#2D5016]' : 'text-gray-400'} />
                  <div className="flex-1 min-w-0">
                    {cvFile ? (
                      <div>
                        <p className="text-sm font-semibold text-[#2D5016] truncate">{cvFile.name}</p>
                        <p className="text-xs text-[#7BA428] mt-0.5">
                          {(cvFile.size / 1024).toFixed(0)} Ko
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Cliquez pour uploader votre CV</p>
                    )}
                  </div>
                  {cvFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCvFile(null) }}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* ── Lettre de motivation ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lettre de motivation
                  <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  placeholder="Présentez-vous brièvement et expliquez pourquoi ce poste vous intéresse..."
                  className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none resize-none
                    focus:border-[#A7D129] focus:ring-2 focus:ring-[#A7D129]/20 placeholder:text-gray-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{coverLetter.length}/1500</p>
              </div>

              {error && (
                <p className="text-red-500 text-xs flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span>⚠</span> {error}
                </p>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-1 pb-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-[#2D5016] transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#2D5016] text-white font-extrabold text-sm
                    hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60
                    flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Envoi...
                    </>
                  ) : (
                    <><Send size={14} /> Envoyer ma candidature</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}