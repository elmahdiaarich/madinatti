'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import axios from 'axios'
import { useToast } from '@/context/ToastContext'
import { candidateProfileService } from '@/services/candidateProfileService'
import { ALL_REGIONS, citiesByRegion } from '@/components/shared/FilterPanel'

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A7D129]/40 focus:border-[#2D5016] transition bg-white"
const disabledCls = "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"

const EDUCATION_OPTIONS = ['BEFORE_BAC','BAC','BAC_PLUS_1','BAC_PLUS_2','BAC_PLUS_3','BAC_PLUS_4','BAC_PLUS_5_PLUS']
const EXPERIENCE_OPTIONS = ['STUDENT_FRESH_GRAD','JUNIOR_LESS_2','MID_2_TO_5','SENIOR_5_TO_10','EXPERT_PLUS_10']
const CONTRACT_OPTIONS = ['CDI','CDD','INTERIM','FREELANCE','STAGE','ANAPEC','TEMPS_PARTIEL','ALTERNANCE']
const LANGUAGE_OPTIONS = ['Français', 'Arabe', 'Anglais', 'Espagnol', 'Amazigh']

const EDUCATION_LABELS = {
  BEFORE_BAC: 'Qualification avant Bac', BAC: 'Bac', BAC_PLUS_1: 'Bac+1', BAC_PLUS_2: 'Bac+2',
  BAC_PLUS_3: 'Bac+3', BAC_PLUS_4: 'Bac+4', BAC_PLUS_5_PLUS: 'Bac+5 et plus',
}
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant, jeune diplômé', JUNIOR_LESS_2: 'Débutant < 2 ans',
  MID_2_TO_5: 'Entre 2 et 5 ans', SENIOR_5_TO_10: 'Entre 5 et 10 ans', EXPERT_PLUS_10: '> 10 ans',
}

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

function ChecklistItem({ done, label }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${done ? 'bg-[#A7D129] text-white' : 'bg-gray-200 text-gray-400'}`}>
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  )
}

function formatUpdatedAt(dateStr) {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} jours`
  return `il y a ${Math.floor(days / 30)} mois`
}

function RecruiterPreview({ form, cityLabel, categoryLabel }) {
  const eduLabel = EDUCATION_LABELS[form.educationLevel]
  const expLabel = EXPERIENCE_LABELS[form.experienceLevel]
  return (
    <div className="bg-[#E8F5D0] border border-[#A7D129]/50 rounded-2xl p-4 flex flex-col gap-2">
      <p className="text-[10px] font-bold text-[#2D5016] uppercase tracking-wide">👁️ Aperçu recruteur (anonymisé)</p>
      <p className="font-bold text-gray-900 text-sm">Candidat #XXXXXXXX</p>
      {categoryLabel && <p className="text-xs font-semibold text-[#2D5016]">{categoryLabel}</p>}
      {form.currentPosition && <p className="text-xs text-gray-600">Poste actuel : {form.currentPosition}</p>}
      {form.headline && <p className="text-sm text-gray-700 italic">{form.headline}</p>}
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        {eduLabel && <p>🎓 {eduLabel}</p>}
        {expLabel && <p>💼 {expLabel}</p>}
        {cityLabel && <p>📍 {cityLabel}</p>}
        {form.languages.length > 0 && <p>🗣️ {form.languages.join(', ')}</p>}
      </div>
      {form.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {form.skills.map(s => (
            <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2D5016] border border-[#A7D129]/40">{s}</span>
          ))}
        </div>
      )}
      {form.desiredContractTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {form.desiredContractTypes.map(t => (
            <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2D5016] border border-[#A7D129]/40">{t}</span>
          ))}
        </div>
      )}
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block w-fit ${
        form.isAvailableForWork ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-500 bg-gray-50 border border-gray-200'
      }`}>
        {form.isAvailableForWork ? '✅ Disponible' : 'Non disponible actuellement'}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth()
  const { toast } = useToast()
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

  const [infoStatus, setInfoStatus] = useState(null)
  const [infoErrors, setInfoErrors] = useState({})
  const [passStatus, setPassStatus] = useState(null)
  const [passError,  setPassError]  = useState('')

  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarStatus, setAvatarStatus]   = useState(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setPass = (k, v) => setPasswords(p => ({ ...p, [k]: v }))

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarStatus(null)
    e.target.value = ''
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    setAvatarStatus('saving')
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      )
      updateUser(res.data.user)
      setAvatarFile(null)
      setAvatarPreview(null)
      setAvatarStatus(null)
      toast.success('Photo de profil mise à jour !')
    } catch {
      setAvatarStatus(null)
      toast.error('Échec de l\'envoi. Veuillez réessayer.')
    }
  }

  const handleCancelAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarStatus(null)
  }

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
      setInfoStatus(null)
      toast.success('Profil mis à jour avec succès !')
    } catch {
      setInfoStatus(null)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    }
  }

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
        { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPassStatus(null)
      toast.success('Mot de passe modifié avec succès !')
    } catch (err) {
      setPassError(err?.response?.data?.message || 'Mot de passe actuel incorrect.')
      setPassStatus(null)
    }
  }

  const displayAvatar = avatarPreview || user?.avatar

  // ── Candidate profile (citizen only) ─────────────────────────────────────
  const [candidateForm, setCandidateForm] = useState({
    headline: '',
    categorySlug: '',
    currentPosition: '',
    skills: [],
    portfolioUrl: '',
    isAvailableForWork: true,
    educationLevel: '',
    experienceLevel: '',
    desiredContractTypes: [],
    languages: [],
    mobilityRegion: '',
    mobilityCity: '',
    visibleToRecruiters: false,
  })
  const [skillInput, setSkillInput] = useState('')
  const [jobCategories, setJobCategories] = useState([])
  const [cvFile, setCvFile] = useState(null)
  const [candidateStatus, setCandidateStatus] = useState(null)
  const [existingCvUrl, setExistingCvUrl] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setJobCategories(d.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isBusiness || !token) return
    candidateProfileService.getMine(token).then(({ data }) => {
      if (data) {
        setCandidateForm({
          headline: data.headline || '',
          categorySlug: data.category?.slug || '',
          currentPosition: data.currentPosition || '',
          skills: data.skills || [],
          portfolioUrl: data.portfolioUrl || '',
          isAvailableForWork: data.isAvailableForWork,
          educationLevel: data.educationLevel || '',
          experienceLevel: data.experienceLevel || '',
          desiredContractTypes: data.desiredContractTypes || [],
          languages: data.languages || [],
          mobilityRegion: data.mobilityRegion || '',
          mobilityCity: data.mobilityCity || '',
          visibleToRecruiters: data.visibleToRecruiters,
        })
        setExistingCvUrl(data.cvUrl)
        setLastUpdatedAt(data.updatedAt)
      }
    }).catch(() => {})
  }, [isBusiness, token])

  const setCand = (k, v) => setCandidateForm(p => ({ ...p, [k]: v }))
  const addSkill = () => {
    const val = skillInput.trim()
    if (!val || candidateForm.skills.includes(val)) { setSkillInput(''); return }
    setCandidateForm(p => ({ ...p, skills: [...p.skills, val] }))
    setSkillInput('')
  }
  const removeSkill = (skill) => {
    setCandidateForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))
  }
  const toggleInArray = (key, value) => {
    setCandidateForm(p => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter(v => v !== value) : [...p[key], value],
    }))
  }

  const handleSaveCandidateProfile = async () => {
    setCandidateStatus('saving')
    try {
      const formData = new FormData()
      formData.append('headline', candidateForm.headline)
      formData.append('categorySlug', candidateForm.categorySlug)
      formData.append('currentPosition', candidateForm.currentPosition)
      formData.append('skills', JSON.stringify(candidateForm.skills))
      formData.append('portfolioUrl', candidateForm.portfolioUrl)
      formData.append('isAvailableForWork', candidateForm.isAvailableForWork)
      formData.append('educationLevel', candidateForm.educationLevel)
      formData.append('experienceLevel', candidateForm.experienceLevel)
      formData.append('desiredContractTypes', JSON.stringify(candidateForm.desiredContractTypes))
      formData.append('languages', JSON.stringify(candidateForm.languages))
      formData.append('mobilityRegion', candidateForm.mobilityRegion)
      formData.append('mobilityCity', candidateForm.mobilityCity)
      formData.append('visibleToRecruiters', candidateForm.visibleToRecruiters)
      if (cvFile) formData.append('cv', cvFile)

      const { data } = await candidateProfileService.update(formData, token)
      setExistingCvUrl(data.cvUrl)
      setLastUpdatedAt(data.updatedAt)
      setCvFile(null)
      setCandidateStatus(null)
      toast.success('Profil candidat mis à jour !')
    } catch (err) {
      setCandidateStatus(null)
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement.")
    }
  }

  const hasCv = !!(existingCvUrl || cvFile)
  const completionItems = [
    { label: "Niveau d'études", done: !!candidateForm.educationLevel },
    { label: "Niveau d'expérience", done: !!candidateForm.experienceLevel },
    { label: 'Type de contrat recherché', done: candidateForm.desiredContractTypes.length > 0 },
    { label: 'CV', done: hasCv },
  ]
  const completionCount = completionItems.filter(i => i.done).length
  const staleUpdate = lastUpdatedAt && (Date.now() - new Date(lastUpdatedAt).getTime()) / 86400000 > 60
  const cityLabel = candidateForm.mobilityCity || candidateForm.mobilityRegion || user?.city || null

  return (
    <div className="max-w-2xl flex flex-col gap-6 p-6 lg:p-8">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez vos informations personnelles</p>
      </div>

      <SectionCard title="Photo de profil">
        <div className="flex items-center gap-5">
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
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
              {isBusiness ? 'Business' : 'Citoyen'}
            </span>

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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarPick}
          className="hidden"
        />
      </SectionCard>

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

        <button
          onClick={handleSaveInfo}
          disabled={infoStatus === 'saving'}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60"
        >
          {infoStatus === 'saving' ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </SectionCard>

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

      {!isBusiness && (
        <SectionCard
          title="Profil candidat"
          subtitle={
            lastUpdatedAt
              ? `Dernière mise à jour : ${formatUpdatedAt(lastUpdatedAt)}${staleUpdate ? ' — pensez à le rafraîchir' : ''}`
              : "Complétez ces informations pour être visible auprès des recruteurs"
          }
        >
          {/* Checklist de complétion */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-600">
              Complétion du profil : {completionCount}/4 {completionCount === 4 ? '✅' : ''}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {completionItems.map(i => <ChecklistItem key={i.label} {...i} />)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Métier recherché">
              <select value={candidateForm.categorySlug} onChange={e => setCand('categorySlug', e.target.value)} className={inputCls}>
                <option value="">Sélectionner...</option>
                {jobCategories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Poste actuel" hint="Optionnel">
              <input
                value={candidateForm.currentPosition}
                onChange={e => setCand('currentPosition', e.target.value.slice(0, 100))}
                placeholder="Ex: Développeur Frontend"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Compétences clés" hint="Tapez une compétence puis Entrée">
            <div className="flex flex-wrap gap-2 mb-2">
              {candidateForm.skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/40">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-[#2D5016] hover:text-red-500">✕</button>
                </span>
              ))}
            </div>
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill() } }}
              placeholder="Ex: React, Node.js, Excel..."
              className={inputCls}
            />
          </Field>

          <Field label="Résumé professionnel" hint="Une phrase courte qui vous décrit — visible et cherchable par les recruteurs (150 caractères max)">
            <input
              value={candidateForm.headline}
              onChange={e => setCand('headline', e.target.value.slice(0, 150))}
              placeholder="Ex: Développeur React 3 ans, spécialisé e-commerce"
              className={inputCls}
            />
          </Field>

          {/* Aperçu recruteur */}
          <RecruiterPreview
            form={candidateForm}
            cityLabel={cityLabel}
            categoryLabel={jobCategories.find(c => c.slug === candidateForm.categorySlug)?.name}
          />
          <Field label="Disponibilité">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={candidateForm.isAvailableForWork}
                onChange={e => setCand('isAvailableForWork', e.target.checked)} />
              Disponible pour travailler actuellement
            </label>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Niveau d'études">
              <select value={candidateForm.educationLevel} onChange={e => setCand('educationLevel', e.target.value)} className={inputCls}>
                <option value="">Sélectionner...</option>
                {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{EDUCATION_LABELS[o]}</option>)}
              </select>
            </Field>
            <Field label="Niveau d'expérience">
              <select value={candidateForm.experienceLevel} onChange={e => setCand('experienceLevel', e.target.value)} className={inputCls}>
                <option value="">Sélectionner...</option>
                {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{EXPERIENCE_LABELS[o]}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Types de contrat recherchés">
            <div className="flex flex-wrap gap-2">
              {CONTRACT_OPTIONS.map(o => (
                <button key={o} type="button" onClick={() => toggleInArray('desiredContractTypes', o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    candidateForm.desiredContractTypes.includes(o)
                      ? 'bg-[#2D5016] text-white border-[#2D5016]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#A7D129]'
                  }`}>
                  {o}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Langues parlées">
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(o => (
                <button key={o} type="button" onClick={() => toggleInArray('languages', o)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    candidateForm.languages.includes(o)
                      ? 'bg-[#2D5016] text-white border-[#2D5016]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#A7D129]'
                  }`}>
                  {o}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Région de mobilité" hint="Laissez vide pour utiliser votre ville actuelle">
              <select
                value={candidateForm.mobilityRegion}
                onChange={e => setCandidateForm(p => ({ ...p, mobilityRegion: e.target.value, mobilityCity: '' }))}
                className={inputCls}
              >
                <option value="">{user?.city ? `Comme ma ville (${user.city})` : 'Non renseigné'}</option>
                {ALL_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Ville de mobilité">
              <select
                value={candidateForm.mobilityCity}
                onChange={e => setCand('mobilityCity', e.target.value)}
                disabled={!candidateForm.mobilityRegion}
                className={inputCls}
              >
                <option value="">
                  {candidateForm.mobilityRegion ? 'Toutes les villes de la région' : "Sélectionnez une région d'abord"}
                </option>
                {(citiesByRegion[candidateForm.mobilityRegion] || [])
                  .slice()
                  .sort((a, b) => a.localeCompare(b, 'fr'))
                  .map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Lien portfolio / LinkedIn" hint="Optionnel — visible uniquement après déblocage par un recruteur">
            <input
              value={candidateForm.portfolioUrl}
              onChange={e => setCand('portfolioUrl', e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={inputCls}
            />
          </Field>

          <Field label="CV (PDF, max 5 Mo)">
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#A7D129] transition">
                Choisir un fichier
                <input type="file" accept="application/pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              {cvFile && (
                <span className="flex items-center gap-2 text-xs bg-[#E8F5D0] text-[#2D5016] px-2.5 py-1.5 rounded-lg font-semibold">
                  📄 {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(1)} Mo)
                  <button type="button" onClick={() => setCvFile(null)} className="text-[#2D5016] hover:text-red-500">✕</button>
                </span>
              )}
              {existingCvUrl && !cvFile && (
                <a href={existingCvUrl} target="_blank" rel="noreferrer" className="text-xs text-[#2D5016] underline">Voir le CV actuel</a>
              )}
            </div>
          </Field>

          <Field label="Visibilité">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={candidateForm.visibleToRecruiters}
                onChange={e => setCand('visibleToRecruiters', e.target.checked)} />
              Rendre mon profil visible par les recruteurs (Headhunter)
            </label>
          </Field>

          <button onClick={handleSaveCandidateProfile} disabled={candidateStatus === 'saving'}
            className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#3a6b1e] transition text-sm disabled:opacity-60">
            {candidateStatus === 'saving' ? 'Enregistrement...' : 'Enregistrer mon profil candidat'}
          </button>
        </SectionCard>
      )}

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