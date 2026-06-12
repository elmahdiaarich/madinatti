/**
 * app/admin/categories/page.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin category management — for Emploi & Immobilier.
 * Features:
 *  - Tab switcher: Emploi / Immobilier
 *  - Tree view: parent → children with listing counts
 *  - Per-row: rename (inline), toggle active/inactive, delete (guarded)
 *  - Inline "Add category" form per parent group
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAdminCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminToggleCategory,
  adminDeleteCategory,
} from '../../../lib/adminApi'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    <path d="M14 3h6v6" /><path d="M20 3l-9 9" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)
const IconChevron = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ── Tabs definition ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'emploi',      label: 'Emploi',      color: '#3B82F6' },
  { key: 'immobilier',  label: 'Immobilier',   color: '#10B981' },
]

// ─────────────────────────────────────────────────────────────────────────────
// INLINE EDIT INPUT
// ─────────────────────────────────────────────────────────────────────────────
function InlineEdit({ initialValue, onSave, onCancel, loading }) {
  const [val, setVal] = useState(initialValue)
  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(val)
          if (e.key === 'Escape') onCancel()
        }}
        className="flex-1 px-3 py-1.5 rounded-lg border border-[#2D5016]/40 bg-white text-sm
          text-gray-800 outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#A7D129]/20"
      />
      <button
        onClick={() => onSave(val)}
        disabled={loading || !val.trim()}
        className="w-7 h-7 rounded-lg bg-[#2D5016] text-white flex items-center justify-center
          hover:bg-[#1e3a0f] transition-colors disabled:opacity-50"
      >
        {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <IconCheck />}
      </button>
      <button
        onClick={onCancel}
        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center
          hover:bg-gray-200 transition-colors"
      >
        <IconX />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY ROW (child)
// ─────────────────────────────────────────────────────────────────────────────
function CategoryRow({ cat, onEdit, onToggle, onDelete, actionId }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const total = (cat._count?.jobListings ?? 0) + (cat._count?.realEstateListings ?? 0)
  const isBusy = actionId === cat.id

  const handleSave = async (name) => {
    setSaving(true)
    try { await onEdit(cat.id, name) } finally { setSaving(false); setEditing(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${cat.name}" ?`)) return
    setDeleting(true)
    try { await onDelete(cat.id) } finally { setDeleting(false) }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
      ${cat.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}
    `}>
      {/* Name / Edit */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${cat.isActive ? 'bg-[#A7D129]' : 'bg-gray-300'}`} />
        {editing ? (
          <InlineEdit
            initialValue={cat.name}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            loading={saving}
          />
        ) : (
          <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
        )}
      </div>

      {/* Listing count badge */}
      {!editing && (
        <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {total} annonce{total !== 1 ? 's' : ''}
        </span>
      )}

      {/* Actions */}
      {!editing && (
        <div className="shrink-0 flex items-center gap-1">
          {/* Edit */}
          <button
            onClick={() => setEditing(true)}
            title="Renommer"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
              hover:text-[#2D5016] hover:bg-[#A7D129]/10 transition-colors"
          >
            <IconEdit />
          </button>

          {/* Toggle active */}
          <button
            onClick={() => onToggle(cat.id)}
            disabled={isBusy}
            title={cat.isActive ? 'Désactiver' : 'Activer'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
              ${cat.isActive
                ? 'text-[#A7D129] hover:bg-[#A7D129]/10'
                : 'text-gray-400 hover:bg-gray-100'
              } disabled:opacity-40`}
          >
            {isBusy
              ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {cat.isActive
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  }
                </svg>
              )
            }
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting || total > 0}
            title={total > 0 ? `Impossible — ${total} annonce(s) liée(s)` : 'Supprimer'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300
              hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {deleting
              ? <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              : <IconTrash />
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD CATEGORY FORM (inline)
// ─────────────────────────────────────────────────────────────────────────────
function AddCategoryForm({ parentId, onAdd }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAdd({ name: name.trim(), parentId })
      setName('')
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200
          text-sm text-gray-400 hover:text-[#2D5016] hover:border-[#A7D129] hover:bg-[#A7D129]/5
          transition-all w-full"
      >
        <IconPlus />
        Ajouter une catégorie
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={e => { setName(e.target.value); setError('') }}
        placeholder="Nom de la catégorie..."
        className="flex-1 px-3 py-2 rounded-xl border border-[#2D5016]/30 bg-white text-sm
          text-gray-800 outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#A7D129]/20"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-4 py-2 rounded-xl bg-[#2D5016] text-white text-sm font-semibold
          hover:bg-[#1e3a0f] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
      >
        {loading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><IconPlus /> Ajouter</>
        }
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setName(''); setError('') }}
        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 transition-colors shrink-0"
      >
        Annuler
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARENT BLOCK
// ─────────────────────────────────────────────────────────────────────────────
function ParentBlock({ parent, onAdd, onEdit, onToggle, onDelete, actionId }) {
  const [expanded, setExpanded] = useState(true)
  const activeCount = parent.children.filter(c => c.isActive).length
  const totalChildren = parent.children.length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Parent header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-gray-400 transition-transform">
          <IconChevron open={expanded} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{parent.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${parent.isActive ? 'bg-[#E8F5D0] text-[#2D5016]' : 'bg-gray-100 text-gray-500'}`}>
              {parent.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalChildren} sous-catégorie{totalChildren !== 1 ? 's' : ''} · {activeCount} active{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {totalChildren}
          </span>
        </div>
      </button>

      {/* Children list */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="pt-4 flex flex-col gap-2">
            {parent.children.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Aucune sous-catégorie pour l'instant.
              </p>
            )}
            {parent.children.map(child => (
              <CategoryRow
                key={child.id}
                cat={child}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                actionId={actionId}
              />
            ))}

            {/* Add form */}
            <div className="mt-1">
              <AddCategoryForm parentId={parent.id} onAdd={onAdd} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [message, onClose])

  if (!message) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
      rounded-2xl shadow-2xl text-sm font-semibold backdrop-blur-sm border transition-all animate-in
      ${type === 'error'
        ? 'bg-red-500/95 text-white border-red-400'
        : 'bg-[#2D5016]/95 text-white border-[#A7D129]/30'
      }`}>
      {type === 'error' ? '❌' : '✅'}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState('emploi')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)   // ID of the category being toggled
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => setToast({ message, type })

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdminCategories(activeTab)
      setCategories(data)
    } catch (err) {
      showToast(err.message || 'Erreur de chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = async ({ name, parentId }) => {
    await adminCreateCategory({ name, parentId })
    showToast(`"${name}" ajoutée`)
    await load()
  }

  const handleEdit = async (id, name) => {
    await adminUpdateCategory(id, { name })
    showToast(`Catégorie renommée`)
    await load()
  }

  const handleToggle = async (id) => {
    setActionId(id)
    try {
      const res = await adminToggleCategory(id)
      showToast(res.message || 'Statut mis à jour')
      await load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminDeleteCategory(id)
      showToast('Catégorie supprimée')
      await load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalCats = categories.reduce((s, p) => s + p.children.length, 0)
  const activeCats = categories.reduce(
    (s, p) => s + p.children.filter(c => c.isActive).length, 0
  )

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des catégories</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Emploi &amp; Immobilier — ajoutez, renommez ou désactivez les catégories
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            text-gray-600 bg-white border border-gray-200 hover:border-[#A7D129]
            hover:text-[#2D5016] transition-colors shadow-sm"
        >
          <IconRefresh />
          Actualiser
        </button>
      </div>

      {/* ── Quick stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Groupes', value: categories.length, color: '#2D5016' },
          { label: 'Catégories totales', value: totalCats, color: '#3B82F6' },
          { label: 'Catégories actives', value: activeCats, color: '#A7D129' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {loading ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            id={`tab-${tab.key}`}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === tab.key
                ? 'bg-[#2D5016] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
          >
            <IconTag />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Category groups ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {loading ? (
          // Skeleton
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="w-32 h-5 bg-gray-200 rounded" />
                <div className="w-16 h-5 bg-gray-100 rounded-full" />
              </div>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="w-40 h-4 bg-gray-200 rounded flex-1" />
                  <div className="w-20 h-4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ))
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconTag />
            </div>
            <p className="text-gray-500 font-medium">Aucune catégorie trouvée</p>
            <p className="text-sm text-gray-400 mt-1">Le groupe parent "{activeTab}" n'existe pas en base.</p>
          </div>
        ) : (
          categories.map(parent => (
            <ParentBlock
              key={parent.id}
              parent={parent}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              actionId={actionId}
            />
          ))
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  )
}
