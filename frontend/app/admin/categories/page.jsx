'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '@/context/ToastContext'
import {
  getAdminCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminToggleCategory,
  adminDeleteCategory,
  adminDeleteModule,
} from '../../../lib/adminApi'

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
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-4v4h4" />
    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
  </svg>
)
const IconEyeOn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)
const IconFolderX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <line x1="9" y1="13" x2="15" y2="19" /><line x1="15" y1="13" x2="9" y2="19" />
  </svg>
)
const IconWarning = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const FIXED_TABS = [
  { key: 'emploi', label: 'Emploi' },
  { key: 'immobilier', label: 'Immobilier' },
]

function ConfirmModal({ title, description, confirmLabel = 'Supprimer', onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <IconWarning />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><IconTrash /> {confirmLabel}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        className="flex-1 px-3 py-1.5 rounded-lg border border-[#2D5016]/40 bg-white text-sm text-gray-800 outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#A7D129]/20"
      />
      <button
        onClick={() => onSave(val)}
        disabled={loading || !val.trim()}
        className="w-7 h-7 rounded-lg bg-[#2D5016] text-white flex items-center justify-center hover:bg-[#1e3a0f] transition-colors disabled:opacity-50"
      >
        {loading
          ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <IconCheck />}
      </button>
      <button
        onClick={onCancel}
        className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
      >
        <IconX />
      </button>
    </div>
  )
}

function CategoryRow({ cat, selected, onSelect, onEdit, onToggle, onDelete, togglingId, selectionMode }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const total = (cat._count?.jobListings ?? 0) + (cat._count?.realEstateListings ?? 0)
  const isToggling = togglingId === cat.id

  const handleSave = async (name) => {
    if (!name.trim()) return
    setSaving(true)
    try { await onEdit(cat.id, name) }
    finally { setSaving(false); setEditing(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(cat.id) } finally { setDeleting(false) }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
      ${selected ? 'bg-red-50 border-red-200' : cat.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>

      <button
        onClick={() => onSelect(cat.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
          ${selected ? 'bg-red-500 border-red-500' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`w-2 h-2 rounded-full shrink-0 ${cat.isActive ? 'bg-[#A7D129]' : 'bg-gray-300'}`} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <InlineEdit
            initialValue={cat.name}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            loading={saving}
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
            <span className="text-[10px] font-mono text-gray-300 truncate hidden sm:block">{cat.slug}</span>
          </div>
        )}
      </div>

      {!editing && (
        <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {total} annonce{total !== 1 ? 's' : ''}
        </span>
      )}

      {!editing && (
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            disabled={selectionMode}
            title="Renommer"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#2D5016] hover:bg-[#A7D129]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <IconEdit />
          </button>
          <button
            onClick={() => onToggle(cat.id)}
            disabled={isToggling || selectionMode}
            title={cat.isActive ? 'Désactiver' : 'Activer'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
              ${cat.isActive ? 'text-[#A7D129] hover:bg-[#A7D129]/10' : 'text-gray-400 hover:bg-gray-100'}
              disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isToggling
              ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : (cat.isActive ? <IconEyeOn /> : <IconEyeOff />)}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || total > 0 || selectionMode}
            title={total > 0 ? `Impossible — ${total} annonce(s) liée(s)` : 'Supprimer'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {deleting
              ? <span className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              : <IconTrash />}
          </button>
        </div>
      )}
    </div>
  )
}

function AddCategoryForm({ activeModule, onAdd }) {
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
      await onAdd({ name: name.trim(), module: activeModule })
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
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400 hover:text-[#2D5016] hover:border-[#A7D129] hover:bg-[#A7D129]/5 transition-all w-full"
      >
        <IconPlus />
        Ajouter une catégorie
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-[#A7D129]/5 rounded-xl border border-[#A7D129]/20">
      <p className="text-xs font-semibold text-[#2D5016]">Nouvelle catégorie</p>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Nom de la catégorie..."
          className="flex-1 px-3 py-2 rounded-xl border border-[#2D5016]/30 bg-white text-sm text-gray-800 outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#A7D129]/20"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 rounded-xl bg-[#2D5016] text-white text-sm font-semibold hover:bg-[#1e3a0f] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><IconPlus /> Ajouter</>}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setName(''); setError('') }}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 transition-colors shrink-0"
        >
          Annuler
        </button>
      </form>
      {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
    </div>
  )
}

function NewModuleModal({ existingModules, onAdd, onClose }) {
  const [moduleKey, setModuleKey] = useState('')
  const [catName, setCatName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const slugify = (str) =>
    str.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')

  const validate = () => {
    const e = {}
    const key = slugify(moduleKey)
    if (!key) e.module = 'Requis'
    else if (existingModules.includes(key)) e.module = 'Ce module existe déjà'
    if (!catName.trim()) e.catName = 'Requis'
    return { e, key }
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const { e, key } = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await onAdd({ name: catName.trim(), module: key })
      onClose()
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  const previewKey = slugify(moduleKey)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#A7D129]/15 flex items-center justify-center text-[#2D5016]">
              <IconFolder />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Nouveau module</h2>
              <p className="text-xs text-gray-400">Groupe de catégories apparenté</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nom du module</label>
            <input
              autoFocus
              value={moduleKey}
              onChange={e => { setModuleKey(e.target.value); setErrors(p => ({ ...p, module: undefined })) }}
              placeholder="ex: vehicule, sante, services…"
              className={`px-3 py-2.5 rounded-xl border text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#A7D129]/20 transition-colors
                ${errors.module ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#2D5016]'}`}
            />
            {errors.module
              ? <p className="text-xs text-red-500">{errors.module}</p>
              : <p className="text-xs text-gray-400">
                  Identifiant interne (minuscules, sans accents).
                  {previewKey && <> Clé : <code className="bg-gray-100 px-1 rounded font-mono">{previewKey}</code></>}
                </p>
            }
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Première catégorie <span className="text-[#2D5016]">*</span>
            </label>
            <input
              value={catName}
              onChange={e => { setCatName(e.target.value); setErrors(p => ({ ...p, catName: undefined })) }}
              placeholder="ex: Voitures, Médecins généralistes…"
              className={`px-3 py-2.5 rounded-xl border text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#A7D129]/20 transition-colors
                ${errors.catName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#2D5016]'}`}
            />
            {errors.catName
              ? <p className="text-xs text-red-500">{errors.catName}</p>
              : <p className="text-xs text-gray-400">Le module s'affichera dans les onglets une fois créé.</p>
            }
          </div>

          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              Les catégories de ce module s'afficheront dans les formulaires d'annonces. Vous pouvez en ajouter ou en supprimer à tout moment depuis l'onglet du module.
            </p>
          </div>

          {errors.submit && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{errors.submit}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#2D5016] text-white text-sm font-semibold hover:bg-[#1e3a0f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><IconPlus /> Créer le module</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkActionBar({ selectedCount, totalCount, allSelected, onSelectAll, onClearAll, onBulkDelete, onBulkToggle, deleting, toggling }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex-wrap">
      <button
        onClick={allSelected ? onClearAll : onSelectAll}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
          ${allSelected ? 'bg-[#2D5016] border-[#2D5016]' : 'border-gray-300 bg-white hover:border-gray-400'}`}
      >
        {allSelected
          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          : selectedCount > 0 ? <span className="w-2 h-0.5 bg-gray-400 rounded-full" /> : null
        }
      </button>

      <span className="text-sm font-medium text-gray-600 flex-1">
        {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''} sur {totalCount}
      </span>

      <button onClick={onClearAll} className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline">
        Annuler
      </button>

      <button
        onClick={() => onBulkToggle('activate')}
        disabled={toggling}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A7D129]/15 text-[#2D5016] text-xs font-semibold hover:bg-[#A7D129]/25 border border-[#A7D129]/30 transition-colors disabled:opacity-50"
      >
        {toggling
          ? <span className="w-3 h-3 border-2 border-[#2D5016]/30 border-t-[#2D5016] rounded-full animate-spin" />
          : <IconEyeOn />}
        Activer
      </button>

      <button
        onClick={() => onBulkToggle('deactivate')}
        disabled={toggling}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
      >
        {toggling
          ? <span className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
          : <IconEyeOff />}
        Désactiver
      </button>

      <button
        onClick={onBulkDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {deleting
          ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <IconTrash />}
        Supprimer
      </button>
    </div>
  )
}

export default function AdminCategoriesPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('emploi')
  const [categories, setCategories] = useState([])
  const [extraModules, setExtraModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [showNewModule, setShowNewModule] = useState(false)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkToggling, setBulkToggling] = useState(false)

  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmModuleDelete, setConfirmModuleDelete] = useState(false)
  const [moduleDeletingLoading, setModuleDeletingLoading] = useState(false)

  const allModuleKeys = [...FIXED_TABS.map(t => t.key), ...extraModules]
  const tabs = [
    ...FIXED_TABS,
    ...extraModules.map(m => ({ key: m, label: m.charAt(0).toUpperCase() + m.slice(1) })),
  ]

  const selectedCount = selectedIds.size
  const allSelected = categories.length > 0 && selectedIds.size === categories.length
  const selectionMode = selectedIds.size > 0

  const deletableSelected = useMemo(() =>
    [...selectedIds].filter(id => {
      const cat = categories.find(c => c.id === id)
      if (!cat) return false
      return (cat._count?.jobListings ?? 0) + (cat._count?.realEstateListings ?? 0) === 0
    }), [selectedIds, categories])

  const blockedSelected = selectedCount - deletableSelected.length

  const moduleHasLinkedListings = categories.some(c =>
    (c._count?.jobListings ?? 0) + (c._count?.realEstateListings ?? 0) > 0
  )

  const loadModules = useCallback(async () => {
    try {
      const all = await getAdminCategories()
      const found = [...new Set(all.map(c => c.module))].filter(m => !FIXED_TABS.some(t => t.key === m))
      setExtraModules(found)
    } catch { }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setSelectedIds(new Set())
    try {
      const data = await getAdminCategories(activeTab)
      setCategories(data)
    } catch (err) {
      toast.error(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { loadModules() }, [loadModules])
  useEffect(() => { load() }, [load])

  const toggleSelect = (id) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectAll = () => setSelectedIds(new Set(categories.map(c => c.id)))
  const clearAll = () => setSelectedIds(new Set())

  const handleAdd = async ({ name, module: mod }) => {
    await adminCreateCategory({ name, module: mod })
    toast({ message: `"${name}" ajoutée`, type: 'success', duration: 3000 })
    if (!FIXED_TABS.some(t => t.key === mod) && !extraModules.includes(mod)) {
      setExtraModules(prev => [...prev, mod])
    }
    setActiveTab(mod)
    if (mod === activeTab) await load()
  }

  const handleEdit = async (id, name) => {
    await adminUpdateCategory(id, { name })
    toast({ message: 'Catégorie renommée', type: 'success', duration: 3000 })
    await load()
  }

  const handleToggle = async (id) => {
    setTogglingId(id)
    try {
      const res = await adminToggleCategory(id)
      toast({ message: res.message || 'Statut mis à jour', type: 'success', duration: 3000 })
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await adminDeleteCategory(id)
      toast({ message: 'Catégorie supprimée', type: 'success', duration: 3000 })
      const remaining = categories.filter(c => c.id !== id)
      const isFixed = FIXED_TABS.some(t => t.key === activeTab)
      if (!isFixed && remaining.length === 0) {
        setExtraModules(prev => prev.filter(m => m !== activeTab))
        setActiveTab(FIXED_TABS[0].key)
      } else {
        await load()
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleBulkToggle = async (action) => {
    setBulkToggling(true)
    let successCount = 0
    for (const id of [...selectedIds]) {
      const cat = categories.find(c => c.id === id)
      if (!cat) continue
      const needsChange = action === 'activate' ? !cat.isActive : cat.isActive
      if (!needsChange) continue
      try { await adminToggleCategory(id); successCount++ } catch { }
    }
    setBulkToggling(false)
    clearAll()
    toast({
      message: successCount > 0
        ? `${successCount} catégorie${successCount > 1 ? 's' : ''} ${action === 'activate' ? 'activée' : 'désactivée'}${successCount > 1 ? 's' : ''}`
        : 'Aucune modification — statut déjà à jour.',
      type: successCount > 0 ? 'success' : 'info',
      duration: 3000,
    })
    await load()
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    setConfirmBulkDelete(false)
    let successCount = 0
    let failCount = 0
    for (const id of deletableSelected) {
      try { await adminDeleteCategory(id); successCount++ } catch { failCount++ }
    }
    setBulkDeleting(false)
    clearAll()
    toast({
      message: `${successCount} catégorie${successCount > 1 ? 's' : ''} supprimée${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} échec${failCount > 1 ? 's' : ''})` : ''}`,
      type: failCount > 0 ? 'warning' : 'success',
      duration: 4000,
    })
    const remaining = categories.filter(c => !deletableSelected.includes(c.id))
    const isFixed = FIXED_TABS.some(t => t.key === activeTab)
    if (!isFixed && remaining.length === 0) {
      setExtraModules(prev => prev.filter(m => m !== activeTab))
      setActiveTab(FIXED_TABS[0].key)
    } else {
      await load()
    }
  }

  const handleDeleteModule = async () => {
    setModuleDeletingLoading(true)
    setConfirmModuleDelete(false)
    try {
      const res = await adminDeleteModule(activeTab)
      toast({
        message: res.message || `Module supprimé`,
        type: res.blocked > 0 ? 'warning' : 'success',
        duration: 4000,
      })
      if (res.blocked === 0 && !FIXED_TABS.some(t => t.key === activeTab)) {
        setExtraModules(prev => prev.filter(m => m !== activeTab))
        setActiveTab(FIXED_TABS[0].key)
      } else {
        await load()
      }
    } catch (err) {
      toast({ message: err.message, type: 'error', duration: 4000 })
    } finally {
      setModuleDeletingLoading(false)
    }
  }

  const totalCats = categories.length
  const activeCats = categories.filter(c => c.isActive).length

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des catégories</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ajoutez, renommez ou désactivez — créez de nouveaux modules si besoin</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowNewModule(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#2D5016] hover:bg-[#1e3a0f] transition-colors shadow-sm"
          >
            <IconFolder />
            Nouveau module
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-[#A7D129] hover:text-[#2D5016] transition-colors shadow-sm disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}><IconRefresh /></span>
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Module actif', value: tabs.find(t => t.key === activeTab)?.label ?? activeTab, color: '#2D5016' },
          { label: 'Catégories totales', value: totalCats, color: '#3B82F6' },
          { label: 'Catégories actives', value: activeCats, color: '#A7D129' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1 truncate" style={{ color }}>
              {loading ? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse" /> : value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); clearAll() }}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === tab.key ? 'bg-[#2D5016] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <IconTag />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center gap-3">
          <p className="text-sm font-semibold text-gray-700">
            {tabs.find(t => t.key === activeTab)?.label ?? activeTab}
          </p>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {loading ? '…' : `${totalCats} catégorie${totalCats !== 1 ? 's' : ''}`}
          </span>
          <div className="flex-1" />
          {!loading && categories.length > 0 && (
            <button
              onClick={() => setConfirmModuleDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
            >
              <IconFolderX />
              Supprimer le module
            </button>
          )}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-3">

          {!loading && (
            <div className="pt-4">
              <AddCategoryForm activeModule={activeTab} onAdd={handleAdd} />
            </div>
          )}

          {!loading && categories.length > 0 && (
            <div className="flex items-center gap-3 px-1 pt-1">
              <button
                onClick={allSelected ? clearAll : selectAll}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${allSelected ? 'bg-[#2D5016] border-[#2D5016]' : selectionMode ? 'border-gray-400 bg-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}
              >
                {allSelected
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  : selectionMode ? <span className="w-2 h-0.5 bg-gray-500 rounded-full" /> : null
                }
              </button>
              <span className="text-xs text-gray-400 select-none">
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </span>
              {selectionMode && (
                <span className="text-xs text-gray-500 ml-auto">
                  {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {selectionMode && (
            <BulkActionBar
              selectedCount={selectedCount}
              totalCount={categories.length}
              allSelected={allSelected}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onBulkToggle={handleBulkToggle}
              onBulkDelete={() => {
                if (deletableSelected.length === 0) {
                  toast({ message: 'Toutes les catégories sélectionnées ont des annonces liées.', type: 'error', duration: 4000 })
                  return
                }
                setConfirmBulkDelete(true)
              }}
              deleting={bulkDeleting}
              toggling={bulkToggling}
            />
          )}

          {!loading && categories.length > 0 && <div className="border-t border-gray-100" />}

          {loading ? (
            <div className="pt-2 flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded-md" />
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="flex-1 h-4 bg-gray-200 rounded" />
                  <div className="w-20 h-4 bg-gray-100 rounded-full" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map(j => <div key={j} className="w-7 h-7 bg-gray-100 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IconTag />
              </div>
              <p className="text-gray-500 font-medium">Aucune catégorie</p>
              <p className="text-sm text-gray-400 mt-1">Utilisez le formulaire ci-dessus pour ajouter la première.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  selected={selectedIds.has(cat.id)}
                  onSelect={toggleSelect}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  togglingId={togglingId}
                  selectionMode={selectionMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewModule && (
        <NewModuleModal
          existingModules={allModuleKeys}
          onAdd={handleAdd}
          onClose={() => setShowNewModule(false)}
        />
      )}

      {confirmBulkDelete && (
        <ConfirmModal
          title={`Supprimer ${deletableSelected.length} catégorie${deletableSelected.length > 1 ? 's' : ''} ?`}
          description={
            blockedSelected > 0
              ? `${deletableSelected.length} catégorie${deletableSelected.length > 1 ? 's' : ''} seront supprimées. ${blockedSelected} ignorée${blockedSelected > 1 ? 's' : ''} (annonces liées).`
              : `Cette action est irréversible. Les ${deletableSelected.length} catégorie${deletableSelected.length > 1 ? 's' : ''} sélectionnées seront définitivement supprimées.`
          }
          confirmLabel={`Supprimer ${deletableSelected.length} catégorie${deletableSelected.length > 1 ? 's' : ''}`}
          onConfirm={handleBulkDelete}
          onClose={() => setConfirmBulkDelete(false)}
          loading={bulkDeleting}
        />
      )}

      {confirmModuleDelete && (
        <ConfirmModal
          title={`Supprimer le module "${tabs.find(t => t.key === activeTab)?.label ?? activeTab}" ?`}
          description={
            moduleHasLinkedListings
              ? `Les catégories sans annonces liées seront supprimées. Celles ayant des annonces actives seront conservées.`
              : `Toutes les catégories de ce module (${totalCats}) seront supprimées définitivement. Cette action est irréversible.`
          }
          confirmLabel="Supprimer le module"
          onConfirm={handleDeleteModule}
          onClose={() => setConfirmModuleDelete(false)}
          loading={moduleDeletingLoading}
        />
      )}
    </div>
  )
}