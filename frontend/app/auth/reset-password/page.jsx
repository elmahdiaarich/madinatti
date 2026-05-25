'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'

export default function ResetPasswordPage() {

  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas')
    }

    try {

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          token,
          password
        }
      )

      setMessage(response.data.message)

      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)

    } catch (err) {

      setError(
        err.response?.data?.message || 'Erreur serveur'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-mint">

      <div className="p-8 rounded-xl w-full max-w-md">

        <h1 className="text-2xl font-bold text-center mb-6">
          Nouveau mot de passe
        </h1>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border rounded-lg"
            required
          />

          <input
            type="password"
            placeholder="Confirmer mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 border rounded-lg"
            required
          />

          <button
            type="submit"
            className="bg-primary text-white p-3 rounded-lg"
          >
            Réinitialiser
          </button>

        </form>

      </div>

    </div>
  )
}