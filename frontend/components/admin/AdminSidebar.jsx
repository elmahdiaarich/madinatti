/**
 * components/admin/AdminSidebar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dark green sidebar (#2D5016) for the admin dashboard.
 * - Logo "Madinatti" + subtitle "Espace administrateur"
 * - Nav items with Tabler icons + live badge counts from getSidebarCounts()
 * - Signalements badge is red if count > 0
 * - Active item: #A7D129 text + right border accent
 * - Bottom: admin avatar + name + email
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useEffect, useState,useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { getSidebarCounts } from '../../lib/adminApi'


// ── Tabler icons (inline SVG — no extra package needed) ──────────────────────

const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
)

const IconBriefcase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20"                                                                                 height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
    <path d="M3 13a20 20 0 0 0 18 0" />
  </svg>
)

const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
    <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
  </svg>
)

const IconCar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    <path d="M5 17h-2v-6l2 -5h9l4 4h1a2 2 0 0 1 2 2v5h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
  </svg>
)

const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <line x1="5" y1="5" x2="5" y2="21" />
    <line x1="19" y1="5" x2="5" y2="5" />
    <path d="M19 13l-14 0" />
    <line x1="19" y1="5" x2="19" y2="13" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
  </svg>
)

const IconCompany = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <rect x="2" y="7" width="17" height="14" rx="2" />
    <path d="M16 7v-2a2 2 0 0 0 -2 -2h-4a2 2 0 0 0 -2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M19 13l3 -1v9l-3 -1" />
  </svg>
)

const IconCategories = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M6 5h12l-6 9z" />
    <circle cx="12" cy="19" r="2" />
    <line x1="12" y1="14" x2="12" y2="17" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
    <path d="M9 12h12l-3 -3m0 6l3 -3" />
  </svg>
)

// ── Nav items definition ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'overview',     label: 'Vue d\'ensemble', href: '/admin',              icon: IconDashboard },
  { key: 'emploi',       label: 'Offres d\'emploi', href: '/admin/jobs',         icon: IconBriefcase },
  { key: 'immobilier',   label: 'Immobilier',       href: '/admin/real-estate',  icon: IconBuilding },
  { key: 'categories',   label: 'Catégories',       href: '/admin/categories',   icon: IconCategories },
  { key: 'vehicule',     label: 'Véhicules',        href: '/admin/vehicles',     icon: IconCar },
  { key: 'signalements', label: 'Signalements',     href: '/admin/reports',      icon: IconFlag },
  { key: 'entreprises',  label: 'Entreprises',      href: '/admin/businesses',   icon: IconCompany },
  { key: 'utilisateurs', label: 'Utilisateurs',     href: '/admin/users',        icon: IconUsers },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname = usePathname()
 const { user, logout, token } = useAuth()
  const [counts, setCounts] = useState({})
  const [loadingCounts, setLoadingCounts] = useState(true)

  const refreshCounts = useCallback(() => {
    if (!token) return
    getSidebarCounts(token)
      .then(setCounts)
      .catch(() => setCounts({}))
      .finally(() => setLoadingCounts(false))
  }, [token])

  useEffect(() => { refreshCounts() }, [refreshCounts])

  useEffect(() => {
    window.addEventListener('admin:counts:refresh', refreshCounts)
    return () => window.removeEventListener('admin:counts:refresh', refreshCounts)
  }, [refreshCounts])

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/auth/login'
  }

  // Admin initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD'

  return (
    <aside className="flex flex-col h-screen w-64 shrink-0 bg-[#2D5016] text-white">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
    <div className="px-6 pt-7 pb-6 border-b border-white/10">
  <Link
    href="/"
    className="group inline-block"
    title="Retour au site"
  >
    <p className="text-2xl font-bold text-[#A7D129] tracking-tight leading-none group-hover:text-white transition-colors duration-200">
      Madinatti
    </p>
  </Link>
  <p className="text-xs text-white/50 mt-1 font-medium tracking-wide uppercase">
    Espace administrateur
  </p>
</div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => {
            const active = isActive(href)
            const count = counts[key] || 0
            const isAlert = key === 'signalements' && count > 0

            return (
              <li key={key}>
                <Link
                  href={href}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group
                    ${active
                      ? 'bg-white/10 text-[#A7D129]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {/* Active right border */}
                  {active && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A7D129] rounded-l-full" />
                  )}

                  {/* Icon */}
                  <span className={`shrink-0 transition-colors ${active ? 'text-[#A7D129]' : 'text-white/50 group-hover:text-white/80'}`}>
                    <Icon />
                  </span>

                  {/* Label */}
                  <span className="flex-1 truncate">{label}</span>

                  {/* Badge */}
                  {!loadingCounts && count > 0 && (
                    <span className={`
                      shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                      flex items-center justify-center
                      ${isAlert
                        ? 'bg-red-500 text-white'
                        : 'bg-[#A7D129]/20 text-[#A7D129]'
                      }
                    `}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Admin avatar + info + logout ──────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#A7D129]/20 border border-[#A7D129]/40 flex items-center justify-center shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-[#A7D129]">{initials}</span>
            )}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user?.name || 'Administrateur'}
            </p>
            <p className="text-xs text-white/40 truncate leading-tight mt-0.5">
              {user?.email || ''}
            </p>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  )
}
