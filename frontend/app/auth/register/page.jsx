'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    role: 'citizen'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    if (!formData.name.trim()) return "Nom requis"
    if (!formData.email.includes("@")) return "Email invalide"
    if (formData.password.length < 6) return "Mot de passe trop court"
    if (!formData.role) return "Rôle requis"

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await register(formData)
      if (response.token) {
        router.push('/')
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-mint">
      <div className="p-8 rounded-xl w-full max-w-md">

        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Madinatti" className="h-12" />
        </div>

        <h1 className="text-2xl font-bold text-center text-primary-dark mb-6">Créer un compte</h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-primary-dark">Nom complet</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">Mot de passe</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">Téléphone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="06XXXXXXXX"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">Ville</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Votre ville"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-dark">Type de compte</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="citizen">Citoyen</option>
              <option value="business">Entreprise</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary-sage transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <a href="/auth/login" className="text-primary-dark font-medium hover:underline">
              Se connecter
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}