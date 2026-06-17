import { useState, useEffect, useRef } from 'react'
import { searchUsers } from '@/lib/adminApi'

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
  </svg>
)

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)

// ─── User filter autocomplete ─────────────────────────────────────────────────
//
// `value` is the source of truth — when the parent clears it (e.g. "Tout effacer"
// resets selectedUser to null), this component now reacts and clears its own
// input text instead of silently keeping the old name displayed.
export default function UserFilterDropdown({ value, onChange }) {
  const [inputVal, setInputVal]   = useState(value ? `${value.name} (${value.email})` : '')
  const [results, setResults]     = useState([])
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const debounceRef               = useRef(null)
  const wrapperRef                = useRef(null)

  // Sync displayed text whenever the external value changes.
  // Covers: parent resets to null ("Tout effacer"), or sets a user programmatically.
  useEffect(() => {
    if (value) {
      setInputVal(`${value.name} (${value.email})`)
    } else {
      setInputVal('')
    }
    setResults([])
    setOpen(false)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = (e) => {
    const q = e.target.value
    setInputVal(q)

    // If the user starts typing again after a selection, clear the active filter
    if (value) onChange(null)

    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const users = await searchUsers(q)
        setResults(users)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  const handleSelect = (user) => {
    onChange(user)
    setInputVal(`${user.name} (${user.email})`)
    setOpen(false)
    setResults([])
  }

  const handleClear = () => {
    onChange(null)
    setInputVal('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-[200px] max-w-xs">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <IconUser />
        </span>
        <input
          type="text"
          value={inputVal}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Filtrer par utilisateur..."
          className="w-full pl-8 pr-8 py-2 rounded-xl border border-gray-200 bg-gray-50
            text-sm text-gray-800 placeholder:text-gray-400 outline-none
            focus:border-[#2D5016] focus:bg-white focus:ring-2 focus:ring-[#A7D129]/20
            transition-all"
        />
        {inputVal && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400
              hover:text-gray-600 transition-colors"
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-xl
          border border-gray-200 shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Recherche...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">Aucun utilisateur trouvé</div>
          ) : (
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => handleSelect(u)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}