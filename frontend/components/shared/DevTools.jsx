'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const plans = ['gratuit', 'basic', 'pro', 'max']
const roles = ['citoyen', 'business', 'admin']

export default function DevTools() {
  const { user, accounts = [], switchAccount } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('gratuit')
  const [selectedRole, setSelectedRole] = useState('citoyen')

  if (process.env.NODE_ENV === 'production') return null

  const handleUpdateUserProperties = () => {
    const storedAccounts = localStorage.getItem('accounts')
    if (storedAccounts && user) {
      const parsedAccounts = JSON.parse(storedAccounts)
      
      const updatedAccounts = parsedAccounts.map((acc) => {
        // Find account matching either nested user ID or flat account ID
        const currentId = acc.user?.id || acc.id || acc.user?._id
        const activeTargetId = user.id || user._id

        if (currentId === activeTargetId) {
          // Keep structure consistent by updating both nested and root properties
          const baseUpdate = {
            plan: selectedPlan,
            role: selectedRole,
            name: acc.user?.name || acc.name || "Admin Madinatti"
          }

          if (acc.user) {
            return {
              ...acc,
              user: { ...acc.user, ...baseUpdate }
            }
          }
          return { ...acc, ...baseUpdate }
        }
        return acc
      })

      localStorage.setItem('accounts', JSON.stringify(updatedAccounts))
    }

    // Sync legacy fallback storage key
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      parsedUser.plan = selectedPlan
      parsedUser.role = selectedRole
      if (!parsedUser.name) parsedUser.name = "Admin Madinatti"
      localStorage.setItem('user', JSON.stringify(parsedUser))
    }

    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-sans">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-800 transition border border-gray-700"
      >
        🛠 DevTools Panel
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white rounded-xl shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto border border-gray-800">
          <h3 className="text-sm font-bold mb-3 text-yellow-400 border-b border-gray-800 pb-2">
            Session Debugger
          </h3>

          {/* ── ACTIVE SESSIONS REGISTRY ── */}
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2">
              Sessions Actives ({accounts.length})
            </h4>
            
            <div className="flex flex-col gap-2">
              {accounts.map((acc, index) => {
                // FORCE NORMALIZATION: Look deep into both objects
                const sessionUser = acc.user || acc
                const email = sessionUser.email || acc.email || "Inconnu"
                const role = sessionUser.role || acc.role || "citoyen"
                const plan = sessionUser.plan || acc.plan || "gratuit"
                const name = sessionUser.name || acc.name || (email.startsWith('admin') ? "Admin Madinatti" : "Sans nom")
                const isActive = sessionUser.id === user?.id || acc.id === user?.id

                return (
                  <div 
                    key={sessionUser.id || index} 
                    className={`p-2 rounded-lg border text-xs transition ${
                      isActive 
                        ? 'bg-gray-800 border-yellow-500/50' 
                        : 'bg-gray-950 border-gray-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="font-semibold truncate text-gray-200">
                        {name} {isActive && '• (Actuel)'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        role === 'admin' ? 'bg-red-950 text-red-400 border border-red-900/50' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {role}
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-gray-400 truncate mb-1.5">
                      {email}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/50">
                        Plan: {plan}
                      </span>
                      
                      {!isActive && switchAccount && (
                        <button
                          onClick={() => switchAccount(sessionUser.id || acc.id)}
                          className="text-[10px] bg-yellow-600 hover:bg-yellow-500 text-black px-2 py-0.5 rounded font-medium transition"
                        >
                          Permuter
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── OVERRIDE INTERFACE ── */}
          {user && (
            <div className="border-t border-gray-800 pt-3 flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Modifier le profil de : <span className="text-yellow-400 normal-case">{user?.name || user?.email}</span>
              </label>
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Plan :</span>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="bg-gray-800 text-white text-xs p-1.5 rounded border border-gray-700 focus:outline-none"
                >
                  {plans.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mb-1">
                <span className="text-[10px] text-gray-500">Rôle :</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-gray-800 text-white text-xs p-1.5 rounded border border-gray-700 focus:outline-none"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <button
                onClick={handleUpdateUserProperties}
                className="bg-yellow-500 text-black text-xs p-2 rounded-lg font-bold hover:bg-yellow-400 transition shadow-md"
              >
                Sauvegarder les modifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
