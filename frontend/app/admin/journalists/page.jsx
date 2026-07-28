'use client'

import { useState, useEffect, useCallback } from 'react'
import { getJournalists, createJournalistAccount, toggleUser, togglePublishRight } from '../../../lib/adminApi'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '@/context/ToastContext'

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 11l2 2l4 -4" />
  </svg>
)

const inputCls = "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2D5016] transition"

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function CreateJournalistForm({ onCreated }) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Nom, email et mot de passe sont requis')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createJournalistAccount(form, token)
      toast.success(`Compte journaliste créé pour ${form.name}.`)
      setForm({ name: '', email: '', password: '', phone: '', city: '' })
      setOpen(false)
      onCreated()
    } catch (err) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#3a6b1e] transition-all whitespace-nowrap"
      >
        + Créer un compte journaliste
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 w-full sm:w-96">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Nouveau compte journaliste</p>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">
          Annuler
        </button>
      </div>

      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nom complet *" className={inputCls} />
      <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email *" type="email" className={inputCls} />
      <input value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mot de passe *" type="password" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Téléphone" className={inputCls} />
        <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ville" className={inputCls} />
      </div>

      {error && <p className="text-xs text-red-500">⚠ {error}</p>}

      <button type="submit" disabled={submitting}
        className="py-2.5 rounded-xl bg-[#2D5016] text-white text-sm font-bold hover:bg-[#3a6b1e] transition disabled:opacity-50">
        {submitting ? 'Création...' : 'Créer le compte'}
      </button>
      <p className="text-[11px] text-gray-400">
        Communiquez ces identifiants au journaliste par un canal séparé (téléphone, email personnel).
      </p>
    </form>
  )
}

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
      const data = await getJournalists(token)
      setJournalists(data)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id) => {
    setActionLoading(id)
    try {
      const res = await toggleUser(id, token)
      setJournalists((prev) => prev.map((j) => j.id === id ? { ...j, isActive: res.isActive } : j))
      toast.success(res.isActive ? 'Compte réactivé' : 'Compte désactivé')
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTogglePublish = async (id) => {
    setActionLoading(`publish-${id}`)
    try {
      const res = await togglePublishRight(id, token)
      setJournalists((prev) => prev.map((j) => j.id === id ? { ...j, canPublish: res.canPublish } : j))
      toast.success(res.message)
    } catch (e) {
      toast.error(`Erreur : ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <IconUserCheck />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journalistes</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Comptes créés directement par l'admin — publication sans modération préalable
            </p>
          </div>
        </div>
        <CreateJournalistForm onCreated={load} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : journalists.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-semibold text-gray-700">Aucun compte journaliste</p>
          <p className="text-sm text-gray-400 mt-1">Créez-en un pour commencer.</p>
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
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{j.name}</p>
                  <p className="text-xs text-gray-400 truncate">{j.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    j.isActive ? 'bg-[#E8F5D0] text-[#2D5016]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {j.isActive ? 'Actif' : 'Désactivé'}
                  </span>
                  {!j.canPublish && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap bg-amber-50 text-amber-600">
                      Publication suspendue
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                {j.phone && <span className="bg-gray-100 px-2 py-1 rounded-full">{j.phone}</span>}
                {j.city && <span className="bg-gray-100 px-2 py-1 rounded-full">{j.city}</span>}
                <span className="bg-gray-100 px-2 py-1 rounded-full">{j.totalArticlesCount} article{j.totalArticlesCount > 1 ? 's' : ''}</span>
                <span className="bg-gray-100 px-2 py-1 rounded-full">Créé le {formatDate(j.createdAt)}</span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleToggle(j.id)}
                  disabled={actionLoading === j.id}
                  className={`text-xs font-bold hover:underline disabled:opacity-50 ${
                    j.isActive ? 'text-red-500' : 'text-[#2D5016]'
                  }`}
                >
                  {j.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
                </button>
                <button
                  onClick={() => handleTogglePublish(j.id)}
                  disabled={actionLoading === `publish-${j.id}`}
                  className={`text-xs font-bold hover:underline disabled:opacity-50 ${
                    j.canPublish ? 'text-amber-600' : 'text-[#2D5016]'
                  }`}
                >
                  {j.canPublish ? 'Suspendre la publication' : 'Restaurer la publication'}
                </button>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}