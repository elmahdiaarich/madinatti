// components/admin/ArchiveModal.jsx
'use client'
import { useState, useEffect } from 'react'
import { updateListingStatus } from '@/lib/adminApi'
import { useAuth } from '@/context/AuthContext'

export default function ArchiveModal({ isOpen, onClose, onConfirm, listingId, listingTitle }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  useEffect(() => { if (isOpen) setNote('') }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await updateListingStatus(listingId, 'ARCHIVED', note.trim() || 'Archivée par l\'administrateur.', token)
      onConfirm('ARCHIVED')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">

          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">Archiver l'annonce</h2>
              {listingTitle && <p className="text-sm text-gray-500 truncate mt-0.5">{listingTitle}</p>}
            </div>
            <button onClick={onClose} disabled={loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-40">
              ✕
            </button>
          </div>

          <div className="px-6 py-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Raison de l'archivage
              <span className="font-normal text-gray-400 ml-1">(optionnel)</span>
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              disabled={loading} rows={3}
              placeholder="Ex: Annonce expirée, bien vendu, doublon détecté..."
              className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm
                placeholder:text-gray-400 resize-none outline-none focus:border-gray-400
                focus:bg-white disabled:opacity-50 transition-all" />
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40">
              Annuler
            </button>
            <button onClick={handleConfirm} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-40 flex items-center gap-2">
              {loading ? 'Archivage...' : 'Confirmer l\'archivage'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}