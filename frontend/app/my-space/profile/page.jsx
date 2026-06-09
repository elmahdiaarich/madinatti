'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7D129]/40 focus:border-[#2D5016] transition bg-white"
const disabledCls = "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth()
  const isBusiness = user?.role === 'business'

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const [form, setForm] = useState({
    name:           user?.name           || '',
    phone:          user?.phone          || '',
    city:           user?.city           || '',
    companyName:    user?.companyName    || '',
    companyWebsite: user?.companyWebsite || '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [infoStatus, setInfoStatus] = useState(null) // null | 'saving' | 'ok' | 'error'
  const [infoErrors, setInfoErrors] = useState({})
  const [passStatus, setPassStatus] = useState(null)
  const [passError,  setPassError]  = useState('')

  // Avatar state
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null) // local blob URL before upload
  const [avatarFile, setAvatarFile]       = useState(null) // File object
  const [avatarStatus, setAvatarStatus]   = useState(null) // null | 'saving' | 'ok' | 'error'

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setPass = (k, v) => setPasswords(p => ({ ...p, [k]: v }))

  // Pick a file locally — just preview, don't upload yet
  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarStatus(null)
    // reset input so picking the same file again triggers onChange
    e.target.value = ''
  }

  // Upload avatar to backend → Cloudinary
  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setAvatarStatus('saving')
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      updateUser(res.data.user)
      setAvatarFile(null)
      setAvatarPreview(null)
      setAvatarStatus('ok')
      setTimeout(() => setAvatarStatus(null), 3000)
    } catch {
      setAvatarStatus('error')
    }
  }

  const handleCancelAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarStatus(null)
  }

  // Validation
  const validateInfo = () => {
    const errors = {}
    if (!form.name.trim()) {
      errors.name = 'Le nom est requis.'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères.'
    }
    if (form.phone && !/^(\+212|0)[5-7]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format invalide. Ex : 0612345678 ou +212612345678'
    }
    if (form.companyWebsite && !/^https?:\/\/.+\..+/.test(form.companyWebsite)) {
      errors.companyWebsite = 'URL invalide. Ex : https://monsite.com'
    }
    return errors
  }

  // Save personal / business info
  const handleSaveInfo = async () => {
    const errors = validateInfo()
    if (Object.keys(errors).length > 0) {
      setInfoErrors(errors)
      return
    }
    setInfoErrors({})
    setInfoStatus('saving')
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          name:           form.name,
          phone:          form.phone,
          city:           form.city,
          companyName:    form.companyName,
          companyWebsite: form.companyWebsite,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      updateUser(res.data.user)
      setInfoStatus('ok')
      setTimeout(() => setInfoStatus(null), 3000)
    } catch {
      setInfoStatus('error')
    }
  }

  // Change password
  const handleChangePassword = async () => {
    setPassError('')
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('Les mots de passe ne correspondent pas.')
      return
    }
    if (passwords.newPassword.length < 6) {
      setPassError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    setPassStatus('saving')
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          currentPassword: passwords.currentPassword,
          newPassword:     passwords.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPassStatus('ok')
      setTimeout(() => setPassStatus(null), 3000)
    } catch (err) {
      setPassError(err?.response?.data?.message || 'Mot de passe actuel incorrect.')
      setPassStatus(null)
    }
  }

  // The avatar src to display: local preview > saved avatar > null (show initials)
  const displayAvatar = avatarPreview || user?.avatar

  return (
    <div className="max-w-2xl flex flex-col gap-6 p-6 lg:p-8">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      {/* Avatar block */}
      <SectionCard title="Photo de profil">
        <div className="flex items-center gap-5">

          {/* Avatar circle — clickable */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-16 h-16 rounded-full shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5016]"
            title="Changer la photo"
          >
            <div className="w-16 h-16 rounded-full bg-[#A7D129]/20 border-2 border-[#A7D129]/40 flex items-center justify-center overflow-hidden">
              {displayAvatar
                ? <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-[#2D5016]">{initials}</span>
              }
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          {/* Info + actions */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
              {isBusiness ? 'Business' : 'Citoyen'}
            </span>

            {/* Pending upload actions */}
            {avatarFile && (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarStatus === 'saving'}
                  className="px-3 py-1.5 bg-[#2D5016] text-white text-xs font-bold rounded-lg hover:bg-[#3a6b1e] transition disabled:opacity-60"
                >
                  {avatarStatus === 'saving' ? 'Envoi...' : 'Enregistrer'}
                </button>
                <button
                  onClick={handleCancelAvatar}
                  disabled={avatarStatus === 'saving'}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* No pending file — just the change link */}
            {!avatarFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs text-[#2D5016] font-semibold hover:underline"
              >
                Changer la photo
              </button>
            )}
          </div>
        </div>

        {/* Avatar feedback */}
        {avatarStatus === 'ok' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
            Photo de profil mise à jour.
          </div>
        )}
        {avatarStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            Échec de l'envoi. Veuillez réessayer.
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarPick}
          className="hidden"
        />
      </SectionCard>

      {/* Personal info */}
      <SectionCard title="Informations personnelles" subtitle="Ces informations sont visibles sur vos annonces">
        <Field label="Nom complet">
          <input
            value={form.name}
            onChange={e => { set('name', e.target.value); setInfoErrors(p => ({ ...p, name: '' })) }}
            className={`${inputCls} ${infoErrors.name ? 'border-red-400 focus:ring-red-200' : ''}`}
          />
          {infoErrors.name && <p className="text-xs text-red-500">{infoErrors.name}</p>}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Téléphone" hint="Format : 06XXXXXXXX ou +212XXXXXXXXX">
            <input
              value={form.phone}
              onChange={e => { set('phone', e.target.value); setInfoErrors(p => ({ ...p, phone: '' })) }}
              placeholder="06XXXXXXXX"
              className={`${inputCls} ${infoErrors.phone ? 'border-red-400 focus:ring-red-200' : ''}`}
            />
            {infoErrors.phone && <p className="text-xs text-red-500">{infoErrors.phone}</p>}
          </Field>
          <Field label="Ville">
            <input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="Casablanca..."
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Adresse email" hint="L'email ne peut pas être modifié">
          <input value={user?.email || ''} disabled className={disabledCls} />
        </Field>

        {infoStatus === 'ok' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
            Profil mis à jour avec succès.
          </div>
        )}
        {infoStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            Une erreur est survenue. Veuillez réessayer.
          </div>
        )}

        <button
          onClick={handleSaveInfo}
          disabled={infoStatus === 'saving'}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
        >
          {infoStatus === 'saving' ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </SectionCard>

      {/* Business info */}
      {isBusiness && (
        <SectionCard title="Informations entreprise" subtitle="Visibles sur votre profil public et vos annonces">
          <Field label="Nom de l'entreprise">
            <input value={form.companyName} onChange={e => set('companyName', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Site web">
            <input
              value={form.companyWebsite}
              onChange={e => { set('companyWebsite', e.target.value); setInfoErrors(p => ({ ...p, companyWebsite: '' })) }}
              placeholder="https://..."
              className={`${inputCls} ${infoErrors.companyWebsite ? 'border-red-400 focus:ring-red-200' : ''}`}
            />
            {infoErrors.companyWebsite && <p className="text-xs text-red-500">{infoErrors.companyWebsite}</p>}
          </Field>
        </SectionCard>
      )}

      {/* Change password */}
      <SectionCard title="Changer le mot de passe" subtitle="Laissez vide si vous ne souhaitez pas le modifier">
        <Field label="Mot de passe actuel">
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={e => setPass('currentPassword', e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nouveau mot de passe">
            <input
              type="password"
              value={passwords.newPassword}
              onChange={e => setPass('newPassword', e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </Field>
          <Field label="Confirmer le mot de passe">
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={e => setPass('confirmPassword', e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </Field>
        </div>

        {passError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {passError}
          </div>
        )}
        {passStatus === 'ok' && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
            Mot de passe modifié avec succès.
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={passStatus === 'saving' || !passwords.currentPassword || !passwords.newPassword}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
        >
          {passStatus === 'saving' ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </SectionCard>

    </div>
  )
}