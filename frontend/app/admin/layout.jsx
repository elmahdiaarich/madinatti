'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import ProtectedRoute from '../../components/shared/ProtectedRoute'

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ProtectedRoute roles={['admin']}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">

        {/* Mobile overlay backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — takes real space on desktop via its own width transition */}
        <AdminSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed(c => !c)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Mobile top bar — hamburger only */}
          <header className="h-14 shrink-0 flex items-center gap-3 px-4 bg-white border-b border-gray-200 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-base font-semibold text-gray-700">Madinatti</span>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full p-4 lg:p-8">
              {children}
            </div>
          </main>
        </div>

      </div>
    </ProtectedRoute>
  )
}