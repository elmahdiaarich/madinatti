// components/admin/SuspendModal.jsx
'use client'
import { useState, useEffect } from 'react'
import { updateListingStatus } from '@/lib/adminApi'
import { useAuth } from '@/context/AuthContext'

const SUSPEND_REASONS = [
  { id: 'fraud',       label: 'Suspicion de fraude ou arnaque' },
  { id: 'reported',    label: 'Signalée par plusieurs utilisateurs' },
  { id: 'price',       label: 'Prix manifestement erroné ou abusif' },
  { id: 'photos',      label: 'Photos volées ou non conformes' },
  { id: 'tos',         label: "Violation des conditions d'utilisation" },
]

export default function SuspendModal({ isOpen, onClose, onConfirm, listingId, listingTitle, module }) {
  const [selected, setSelected] = useState([])
  const [customNote, setCustomNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    if (isOpen) { setSelected([]); setCustomNote('') }
  }, [isOpen])

  if (!isOpen) return null

  const toggleReason = (id) =>
    setSelected(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id])

  const buildNote = () => {
    const labels = SUSPEND_REASONS.filter(r => selected.includes(r.id)).map(r => `• ${r.label}`)
    const parts = []
    if (labels.length) parts.push(labels.join('\n'))
    if (customNote.trim()) parts.push(customNote.trim())
    return parts.join('\n\n')
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const note = buildNote() || 'Annonce suspendue par l\'administrateur.'
      await updateListingStatus(listingId, 'SUSPENDED', note, token, module )
      onConfirm('SUSPENDED')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const hasSelection = selected.length > 0 || customNote.trim().length > 0

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
              ⚠️
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Motif de suspension</h2>
              {listingTitle && <p className="text-sm text-gray-500 truncate mt-0.5">{listingTitle}</p>}
            </div>
            <button onClick={onClose} disabled={loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Raisons (sélection multiple)</p>
              <div className="flex flex-col gap-2">
                {SUSPEND_REASONS.map(reason => {
                  const checked = selected.includes(reason.id)
                  return (
                    <label key={reason.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                        ${checked ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'}`}>
                      <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                        ${checked ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'}`}>
                        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>}
                      </span>
                      <input type="checkbox" className="sr-only" checked={checked}
                        onChange={() => toggleReason(reason.id)} disabled={loading} />
                      <span className="text-sm font-medium">{reason.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note personnalisée
                <span className="font-normal text-gray-400 ml-1">(envoyée à l'entreprise)</span>
              </label>
              <textarea value={customNote} onChange={e => setCustomNote(e.target.value)}
                disabled={loading} rows={3}
                placeholder="Précisez les éléments à corriger..."
                className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm
                  placeholder:text-gray-400 resize-none outline-none focus:border-amber-400
                  focus:bg-white disabled:opacity-50 transition-all" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40">
              Annuler
            </button>
            <button onClick={handleConfirm} disabled={loading || !hasSelection}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? 'Traitement...' : 'Confirmer la suspension'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}