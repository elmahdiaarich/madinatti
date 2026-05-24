'use client'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const plans = ['standard', 'premium_tier1', 'premium_tier2']

export default function DevTools() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('standard')

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
      >
        🛠 DevTools
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 bg-gray-900 text-white rounded-xl shadow-xl p-4 w-72">
          <h3 className="text-sm font-bold mb-3 text-yellow-400">DevTools</h3>

          {user ? (
            <div className="flex flex-col gap-2 mb-4">
              <div className="text-xs">
                <span className="text-gray-400">Nom : </span>
                <span>{user.name}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-400">Email : </span>
                <span>{user.email}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-400">Rôle : </span>
                <span className="bg-green-700 px-2 py-0.5 rounded-full">{user.role}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-400">Plan actuel : </span>
                <span className="bg-blue-700 px-2 py-0.5 rounded-full">{user.plan || 'standard'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">Aucun utilisateur connecté</p>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">Changer le plan :</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-gray-800 text-white text-xs p-2 rounded-lg border border-gray-700"
            >
              {plans.map(plan => (
                <option key={plan} value={plan}>{plan}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const stored = localStorage.getItem('user')
                if (stored) {
                  const u = JSON.parse(stored)
                  u.plan = selectedPlan
                  localStorage.setItem('user', JSON.stringify(u))
                  window.location.reload()
                }
              }}
              className="bg-yellow-500 text-black text-xs p-2 rounded-lg font-medium hover:bg-yellow-400 transition"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}