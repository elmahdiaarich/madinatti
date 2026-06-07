'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * components/shared/LayoutShell.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrapper client qui détecte la route actuelle.
 * Sur /admin/* → pas de Navbar ni Footer (le dashboard a son propre layout).
 * Sur toutes les autres routes → Navbar + Footer normaux.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function LayoutShell({ children }) {
  const pathname = usePathname()
  const isAdmin  = pathname?.startsWith('/admin')

  if (isAdmin) {
    // Le admin/layout.jsx gère son propre structure — on rend juste les enfants
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
