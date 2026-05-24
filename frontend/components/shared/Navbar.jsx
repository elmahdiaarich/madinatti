'use client'

import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">

      <a href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="Madinatti" className="h-8" />
      </a>

      <div className="flex items-center gap-6">
        <a href="/" className="text-sm bg-primary-mint text-primary-dark px-3 py-1.5 rounded-lg font-medium">
          Accueil
        </a>
        <a href="/explorer" className="text-sm text-gray-600 hover:text-primary-dark">
          Explorer
        </a>
        <a href="/jobs" className="text-sm text-gray-600 hover:text-primary-dark">
          Services
        </a>
        <a href="/signaler" className="text-sm text-gray-600 hover:text-primary-dark">
          Signaler
        </a>
        <a href="/blog" className="text-sm text-gray-600 hover:text-primary-dark">
          Blog
        </a>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Bonjour, <span className="font-medium text-primary-dark">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <a href="/auth/login" className="text-sm text-gray-600 hover:text-primary-dark">
              Connexion
            </a>
            <a href="/auth/register" className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-sage transition">
              S'inscrire
            </a>
          </>
        )}
      </div>

    </nav>
  )
}