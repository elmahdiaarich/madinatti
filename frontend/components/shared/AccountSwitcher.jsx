'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const roleLabel = { admin: 'Admin', business: 'Business', citizen: 'Citoyen' }
const roleBadge = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  business: 'bg-blue-50 text-blue-700 border-blue-200',
  citizen: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function AccountSwitcher() {
  const { user, accounts, switchAccount, removeAccount, addAccount } = useAuth()
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const otherAccounts = accounts.filter(a => a.user.id !== user?.id)

  const handleSwitch = async (id) => {
    setError('')
    try {
      await switchAccount(id)
      setOpen(false)
    } catch (error) {
      setError(error.response?.data?.message || 'Ce compte n’est plus disponible')
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await addAccount(form.email, form.password)
      setShowAddForm(false)
      setForm({ email: '', password: '' })
      setOpen(false)
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
      >
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
          {user.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            : user.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-medium text-gray-700 max-w-[90px] truncate">{user.name}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleBadge[user.role]}`}>
          {roleLabel[user.role]}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-50">
          {/* Active account */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Compte actif</p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden shrink-0">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : user.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${roleBadge[user.role]}`}>
                {roleLabel[user.role]}
              </span>
            </div>
          </div>

          {/* Other accounts */}
          {otherAccounts.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Autres comptes</p>
              {otherAccounts.map(({ user: u }) => (
                <div key={u.id} className="flex items-center gap-2.5 py-1.5 group">
                  <button onClick={() => handleSwitch(u.id)} className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden shrink-0">
                      {u.avatar
                        ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                        : u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${roleBadge[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </button>
                  <button
                    onClick={() => removeAccount(u.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition ml-1 shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add account */}
          <div className="px-4 py-3">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Ajouter un compte
              </button>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-2">
                <input
                  type="email" placeholder="Email" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
                />
                <input
                  type="password" placeholder="Mot de passe" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
                />
                {error && <p className="text-[10px] text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={loading}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-50">
                    {loading ? '...' : 'Connexion'}
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); setError('') }}
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
