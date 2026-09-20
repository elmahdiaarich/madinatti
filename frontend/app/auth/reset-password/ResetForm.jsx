'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import AuthLayout from '@/components/auth/AuthLayout'
import PasswordInput from '@/components/auth/PasswordInput'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { isStrongPassword, PASSWORD_MESSAGE } from '@/lib/passwordPolicy.mjs'

export default function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) return setError('Lien invalide')
    if (!isStrongPassword(password)) return setError(PASSWORD_MESSAGE)
    if (password !== confirmPassword) return setError('Les mots de passe ne correspondent pas')

    setLoading(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        { token, password }
      )
      setMessage(res.data.message)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur serveur')
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingSpinner message="Réinitialisation..." />}
      <AuthLayout
        title="Nouveau mot de passe"
        subtitle="Choisissez un mot de passe sécurisé pour votre compte"
      >
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium p-3 rounded-lg transition disabled:opacity-60 mt-1"
          >
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>
      </AuthLayout>
    </>
  )
}
