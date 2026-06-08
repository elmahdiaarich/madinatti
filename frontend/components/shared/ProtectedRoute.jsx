'use client'

import { useAuth } from '../../context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log("aji hna");
      router.push('/auth/login')
    }

    if (!loading && user && roles && !roles.includes(user.role)) {
      router.push('/')
    }
  }, [user, loading])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-primary-dark">Chargement...</p>
    </div>
  }

  if (!user) return null

  return children
}

//usage
// Route accessible uniquement aux connectés
{/* <ProtectedRoute>
  <MaPage />
</ProtectedRoute> */}

// Route accessible uniquement aux admins
{/* <ProtectedRoute roles={['admin']}>
  <AdminPage />
</ProtectedRoute> */}