'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
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
  const isAdmin = pathname?.startsWith('/admin')
  const isAuth = pathname?.startsWith('/auth')
  const navRef = useRef(null)

  useEffect(() => {
    if (!navRef.current) return
    const el = navRef.current

    const setVar = () => {
      document.documentElement.style.setProperty('--navbar-h', `${el.offsetHeight}px`)
    }
    setVar()

    const observer = new ResizeObserver(setVar)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (isAdmin || isAuth) {
    // Le admin/layout.jsx gère son propre structure — on rend juste les enfants
    return <>{children}</>
  }

  return (
    <>
      <Navbar ref={navRef} />
      {children}
      <Footer />
    </>
  )
}
