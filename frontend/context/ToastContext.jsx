'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({
    message,
    type = 'success',   // 'success' | 'error' | 'warning' | 'info'
    duration = 5000,    // ms, 0 = manual only
    title,
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, message, type, title }])

    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    }

    return id
  }, [dismiss])

  // Convenience shorthands
  toast.success = (message, opts) => toast({ message, type: 'success', ...opts })
  toast.error   = (message, opts) => toast({ message, type: 'error',   
                    // duration: 0, 
                    ...opts })
  toast.warning = (message, opts) => toast({ message, type: 'warning', ...opts })
  toast.info    = (message, opts) => toast({ message, type: 'info',    ...opts })

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}
function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" />
    </svg>
  )
}
function IconError() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  )
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_STYLES = {
  success: {
    bar:    'bg-[#A7D129]',
    icon:   'bg-[#E8F5D0] text-[#2D5016]',
    title:  'text-[#2D5016]',
    msg:    'text-[#3d6b1e]',
    border: 'border-[#A7D129]/30',
    Icon:   IconCheck,
  },
  error: {
    bar:    'bg-red-500',
    icon:   'bg-red-50 text-red-600',
    title:  'text-red-700',
    msg:    'text-red-600',
    border: 'border-red-200',
    Icon:   IconError,
  },
  warning: {
    bar:    'bg-[#FFC107]',
    icon:   'bg-amber-50 text-amber-600',
    title:  'text-amber-700',
    msg:    'text-amber-600',
    border: 'border-amber-200',
    Icon:   IconAlert,
  },
  info: {
    bar:    'bg-blue-400',
    icon:   'bg-blue-50 text-blue-600',
    title:  'text-blue-700',
    msg:    'text-blue-600',
    border: 'border-blue-200',
    Icon:   IconInfo,
  },
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

function Toast({ id, type, title, message, onDismiss }) {
  const cfg = TOAST_STYLES[type] ?? TOAST_STYLES.info
  const { Icon } = cfg

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 bg-white rounded-xl shadow-lg
        border ${cfg.border} overflow-hidden
        animate-[slideIn_0.22s_ease-out]
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-3 ml-4 ${cfg.icon}`}>
        <Icon />
      </div>

      {/* Text */}
      <div className="flex-1 py-3 pr-2 min-w-0">
        {title && (
          <p className={`text-sm font-semibold leading-tight ${cfg.title}`}>{title}</p>
        )}
        <p className={`text-sm leading-snug ${title ? 'mt-0.5' : ''} ${cfg.msg}`}>
          {message}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 mt-2.5 mr-2.5 p-1 rounded-lg text-gray-400
          hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Fermer"
      >
        <IconX />
      </button>
    </div>
  )
}

// ─── Container (portal-like, fixed bottom-right) ──────────────────────────────

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  )
}

// how to use 
// import { useToast } from '@/context/ToastContext'

// const { toast } = useToast()

// toast.success('Done!')
// toast.error('Something went wrong')     stays until manually closed
// toast.warning('Listing suspended')
// toast({ message: '...', type: 'info', duration: 4000, title: 'Optional title' })