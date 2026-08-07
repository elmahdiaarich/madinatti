/**
 * components/admin/AdminSidebar.jsx
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { getSidebarCounts } from '../../lib/adminApi'

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
)

const IconFactory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M4 21V9l4 3V9l4 3V9l4 3V5h4v16H4z" />
  </svg>
)

const IconBriefcase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
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
    <path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/>
    <path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/>
    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
  </svg>
)

const IconCar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    <path d="M5 17h-2v-6l2 -5h9l4 4h1a2 2 0 0 1 2 2v5h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
  </svg>
)

const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <line x1="5" y1="5" x2="5" y2="21"/>
    <line x1="19" y1="5" x2="5" y2="5"/>
    <path d="M19 13l-14 0"/>
    <line x1="19" y1="5" x2="19" y2="13"/>
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85"/>
  </svg>
)

const IconCompany = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <rect x="2" y="7" width="17" height="14" rx="2"/>
    <path d="M16 7v-2a2 2 0 0 0 -2 -2h-4a2 2 0 0 0 -2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12.01"/>
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
    <path d="M19 13l3 -1v9l-3 -1"/>
  </svg>
)

const IconCategories = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M6 5h12l-6 9z"/>
    <circle cx="12" cy="19" r="2"/>
    <line x1="12" y1="14" x2="12" y2="17"/>
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2"/>
    <path d="M9 12h12l-3 -3m0 6l3 -3"/>
  </svg>
)

const IconCompass = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)

const IconHealth = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 3l7 4v5c0 4.5 -3 7.5 -7 9c-4 -1.5 -7 -4.5 -7 -9v-5z" />
    <path d="M9 12h6" />
    <path d="M12 9v6" />
  </svg>
)

const IconEducation = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M22 10l-10 -5l-10 5l10 5l10 -5z" />
    <path d="M6 12v5c3 2 9 2 12 0v-5" />
    <path d="M22 10v6" />
  </svg>
)

const IconEvents = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M4 11h16" />
    <path d="M8 15h2M14 15h2M8 18h2" />
  </svg>
)

// Chevron left/right for the collapse button
const IconChevron = ({ left }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {left
      ? <polyline points="15 18 9 12 15 6" />
      : <polyline points="9 18 15 12 9 6" />
    }
  </svg>
)
const IconClipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
)

const IconNewspaper = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M8 4h11a2 2 0 0 1 2 2v11a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2z" />
    <line x1="12" y1="8" x2="17" y2="8" />
    <line x1="12" y1="12" x2="17" y2="12" />
    <line x1="12" y1="16" x2="15" y2="16" />
    <path d="M4 8h1v9a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2v-1h1" />
  </svg>
)

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    <path d="M16 11l2 2l4 -4" />
  </svg>
)
// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'overview',     label: "Vue d'ensemble", href: '/admin',             icon: IconDashboard  },
  { key: 'emploi',       label: "Emploi", href: '/admin/jobs',        icon: IconBriefcase  },
  { key: 'immobilier',   label: 'Immobilier',       href: '/admin/real-estate', icon: IconBuilding   },
  { key: 'vehicule',     label: 'Véhicules',        href: '/admin/vehicles',    icon: IconCar        },
  { key: 'tourisme',     label: 'Tourisme',         href: '/admin/tourism',     icon: IconCompass    },
  { key: 'events',       label: 'Evenements',       href: '/admin/events',      icon: IconEvents     },
  { key: 'espacesPro', label: 'Espaces Pro', href: '/admin/industriel-zones', icon: IconFactory },
  { key: 'sante',        label: 'Santé',            href: '/admin/health',      icon: IconHealth     },
  { key: 'miniJobs',     label: 'Mini-jobs · Profils', href: '/admin/mini-jobs', icon: IconBriefcase },
  { key: 'taskRequests', label: 'Mini-jobs · Demandes', href: '/admin/task-requests', icon: IconClipboard },
  { key: 'journalists',  label: 'Journalistes',      href: '/admin/journalists', icon: IconUserCheck },
  { key: 'shops',        label: 'Boutiques',         href: '/admin/shops',       icon: IconCompany    },
  { key: 'education',    label: 'Education',         href: '/admin/education',   icon: IconEducation  },
  { key: 'categories',   label: 'Catégories',       href: '/admin/categories',  icon: IconCategories },
  { key: 'signalements', label: 'Signalements',     href: '/admin/reports',     icon: IconFlag       },
  { key: 'entreprises',  label: 'Entreprises',      href: '/admin/businesses',  icon: IconCompany    },
  { key: 'utilisateurs', label: 'Utilisateurs',     href: '/admin/users',       icon: IconUsers      },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSidebar({
  collapsed = false,
  mobileOpen = false,
  onToggleCollapse,
  onCloseMobile,
}) {
  const pathname = usePathname()
  const { user, logout, token } = useAuth()
  const [counts, setCounts]           = useState({})
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

  const isActive = (href) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/auth/login'
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD'

  return (
    <>
      {/*
        The sidebar itself.
        - On mobile:  fixed, slides in/out via translateX.  Width always 256 px.
        - On desktop: part of the normal flex flow (relative).
                      Width transitions between 256 px (expanded) and 64 px (collapsed).
      */}
      <aside
        className={[
          // base
          'flex flex-col h-screen bg-[#2D5016] text-white overflow-hidden',
          'transition-all duration-300 ease-in-out',
          // mobile — fixed drawer, z-index above backdrop (z-20)
          'fixed top-0 left-0 z-30',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64',
          // desktop overrides — back to normal flow, no translate
          'lg:relative lg:translate-x-0 lg:z-auto',
          collapsed ? 'lg:w-16' : 'lg:w-64',
        ].join(' ')}
      >

        {/* ── Logo + collapse button ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 pt-5 pb-4 shrink-0">

          {/* Logo — hidden when collapsed on desktop */}
          <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
            <Link href="/" title="Retour au site" onClick={() => onCloseMobile?.()}
              className="group block">
              <p className="text-2xl font-bold text-[#A7D129] tracking-tight leading-none whitespace-nowrap group-hover:text-white transition-colors duration-200">
                Madinatti
              </p>
              <p className="text-xs text-white/50 mt-1 font-medium tracking-wide uppercase whitespace-nowrap">
                Espace administrateur
              </p>
            </Link>
          </div>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Développer' : 'Réduire'}
            className={[
              'hidden lg:flex shrink-0 items-center justify-center',
              'w-7 h-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors',
              // when collapsed, centre it in the 64 px rail
              collapsed ? 'mx-auto' : '',
            ].join(' ')}
          >
            <IconChevron left={!collapsed} />
          </button>
        </div>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => {
              const active  = isActive(href)
              const count   = counts[key] || 0
              const isAlert = key === 'signalements' && count > 0
              // On desktop collapsed mode, hide label/badge from layout entirely
              const showLabel = !collapsed

              return (
                <li key={key}>
                  <Link
                    href={href}
                    onClick={() => onCloseMobile?.()}
                    title={collapsed ? label : undefined}
                    className={[
                      'relative flex items-center gap-3 rounded-xl text-sm font-medium py-2.5',
                      'transition-all duration-150 group',
                      collapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3',
                      active
                        ? 'bg-white/10 text-[#A7D129]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                  >
                    {/* Active right accent */}
                    {active && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A7D129] rounded-l-full" />
                    )}

                    {/* Icon — relative wrapper so badge can anchor to it */}
                    <span className="relative shrink-0">
                      <span className={`block transition-colors ${active ? 'text-[#A7D129]' : 'text-white/50 group-hover:text-white/80'}`}>
                        <Icon />
                      </span>

                      {/* Collapsed badge: numbered pill top-left of icon, desktop only */}
                      {!loadingCounts && count > 0 && (
                        <span className={[
                          collapsed ? 'hidden lg:flex' : 'hidden',
                          'absolute -top-2 -left-2',
                          'items-center justify-center',
                          'min-w-[18px] h-[18px] px-1 rounded-full',
                          'text-[10px] font-bold leading-none text-white',
                          isAlert ? 'bg-red-500' : 'bg-[#A7D129]',
                        ].join(' ')}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </span>

                    {/* Label — never rendered on desktop when collapsed */}
                    <span className={collapsed ? 'lg:hidden flex-1 truncate' : 'flex-1 truncate'}>
                      {label}
                    </span>

                    {/* Expanded badge — never rendered on desktop when collapsed */}
                    {!loadingCounts && count > 0 && (
                      <span className={[
                        collapsed ? 'lg:hidden' : '',
                        'shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold',
                        'flex items-center justify-center',
                        isAlert ? 'bg-red-500 text-white' : 'bg-[#A7D129]/20 text-[#A7D129]',
                      ].join(' ')}>
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Footer: avatar + name + logout ──────────────────────────────── */}
        <div className="border-t border-white/10 px-2 py-3 shrink-0">
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#A7D129]/20 border border-[#A7D129]/40 flex items-center justify-center shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : <span className="text-xs font-bold text-[#A7D129]">{initials}</span>
              }
            </div>

            {/* Name + email */}
            <div className={[
              'flex-1 min-w-0 transition-all duration-300',
              collapsed ? 'lg:w-0 lg:opacity-0 lg:overflow-hidden lg:flex-none' : '',
            ].join(' ')}>
              <p className="text-sm font-semibold text-white truncate leading-tight whitespace-nowrap">
                {user?.name || 'Administrateur'}
              </p>
              <p className="text-xs text-white/40 truncate leading-tight mt-0.5 whitespace-nowrap">
                {user?.email || ''}
              </p>
            </div>

            {/* Logout */}
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
    </>
  )
}
