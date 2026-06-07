/**
 * app/admin/layout.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout racine pour toutes les pages /admin/*.
 * - Pas de Navbar ni Footer principal
 * - Sidebar fixe à gauche (AdminSidebar)
 * - Contenu scrollable à droite
 * - Protégé : rôle "admin" uniquement via ProtectedRoute
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import AdminSidebar from '../../components/admin/AdminSidebar'
import ProtectedRoute from '../../components/shared/ProtectedRoute'

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">

        {/* ── Sidebar fixe ────────────────────────────────────────────── */}
        <AdminSidebar />

        {/* ── Contenu principal scrollable ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-6 lg:p-8">
            {children}
          </div>
        </main>

      </div>
    </ProtectedRoute>
  )
}
