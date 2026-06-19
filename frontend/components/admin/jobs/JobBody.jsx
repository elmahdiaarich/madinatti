'use client'

import { useState } from 'react'
import {
  Briefcase, MapPin, User, Calendar, Eye,
  Building2, Globe, Languages, GraduationCap,
  DollarSign, CheckCircle2, Clock, Mail, Hash, Tag,
  AlertCircle, Star,
} from 'lucide-react'
import { StatusBadge, StatusPanel } from '../StatusPanel'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null

const CONTRACT_LABELS = {
  CDI: 'CDI', CDD: 'CDD', FREELANCE: 'Freelance',
  STAGE: 'Stage', ALTERNANCE: 'Alternance', INTERIM: 'Intérim',
  ANAPEC: 'ANAPEC', TEMPS_PARTIEL: 'Temps partiel', STATUTAIRE: 'Statutaire',
}

const REMOTE_LABELS = {
  ON_SITE: { label: 'Présentiel', icon: '🏢' },
  REMOTE:  { label: 'Full Remote', icon: '🌍' },
  HYBRID:  { label: 'Hybride', icon: '🔀' },
}

const EDUCATION_LABELS = {
  BEFORE_BAC:     'Qualification avant Bac',
  BAC:            'Bac',
  BAC_PLUS_1:     'Bac +1',
  BAC_PLUS_2:     'Bac +2',
  BAC_PLUS_3:     'Bac +3',
  BAC_PLUS_4:     'Bac +4',
  BAC_PLUS_5_PLUS:'Bac +5 et plus',
}

const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant / Jeune diplômé',
  JUNIOR_LESS_2:      'Débutant < 2 ans',
  MID_2_TO_5:         'Expérience entre 2 et 5 ans',
  SENIOR_5_TO_10:     'Expérience entre 5 et 10 ans',
  EXPERT_PLUS_10:     'Expérience > 10 ans',
}

const LANGUAGE_FLAGS = {
  arabe:    '🇲🇦',
  français: '🇫🇷',
  anglais:  '🇬🇧',
  espagnol: '🇪🇸',
  allemand: '🇩🇪',
}

const LANGUAGE_LEVEL_COLORS = {
  'maternelle':    'bg-[#2D5016] text-white',
  'courant':       'bg-[#A7D129] text-[#2D5016]',
  'bon niveau':    'bg-[#E8F5D0] text-[#2D5016]',
  'intermédiaire': 'bg-amber-50 text-amber-700 border border-amber-200',
  'notions':       'bg-gray-100 text-gray-600',
}

const fmtNum = (v) => Number(v).toLocaleString('fr-MA')

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = false }) {
  if (!value && value !== 0) return null
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl px-3 py-2.5 border ${
      accent
        ? 'bg-[#E8F5D0] border-[#A7D129]/40'
        : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{label}</span>
      </div>
      <span className={`text-sm font-bold leading-snug ${accent ? 'text-[#2D5016]' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, href }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-sm font-medium text-[#2D5016] hover:underline truncate flex-1">
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold text-gray-800 flex-1">{value}</span>
      )}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{title}</p>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function JobBody({ listing: initialListing, onTransitionRequest, onStatusChanged }) {
  const [listing, setListing] = useState(initialListing)

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'DELETED') { onStatusChanged?.(listing.id, 'DELETED'); return }
    setListing(p => ({ ...p, status: newStatus }))
    onStatusChanged?.(listing.id, newStatus)
  }

  // ── Data normalization ────────────────────────────────────────────────────
  const adminNotes      = listing.adminNote || listing.adminNotes
  const contractLabel   = CONTRACT_LABELS[listing.contractType] ?? listing.contractType
  const remoteData      = REMOTE_LABELS[listing.remote]
  const experienceLabel = EXPERIENCE_LABELS[listing.experienceLevel] ?? listing.experienceLevel

  // educationLevel peut être un array ou une string selon l'origine
  const educationLevels = Array.isArray(listing.educationLevel)
    ? listing.educationLevel
    : listing.educationLevel ? [listing.educationLevel] : []
  const educationLabel = educationLevels
    .map(e => EDUCATION_LABELS[e] ?? e)
    .join(', ') || null

  // languages = [{language, level}, ...] ou string[] simple
  const languages = Array.isArray(listing.languages) ? listing.languages : []
  const hasStructuredLanguages = languages.length > 0 && typeof languages[0] === 'object'

  // skills
  const skills = Array.isArray(listing.skills) ? listing.skills : []

  // Salary — salaryMin / salaryMax dans le schema
  const salaryDisplay = (() => {
    const hasMin = listing.salaryMin != null && Number(listing.salaryMin) > 0
    const hasMax = listing.salaryMax != null && Number(listing.salaryMax) > 0
    if (!hasMin && !hasMax) return null
    if (hasMin && hasMax) return `${fmtNum(listing.salaryMin)} – ${fmtNum(listing.salaryMax)} MAD/mois`
    if (hasMin) return `Dès ${fmtNum(listing.salaryMin)} MAD/mois`
    return `Jusqu'à ${fmtNum(listing.salaryMax)} MAD/mois`
  })()

  const deadline = listing.applicationDeadline || listing.deadline

  return (
    <div className="flex flex-col gap-5">

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} />
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-amber-500" /> Vedette
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contractLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
              <Briefcase className="w-3 h-3" />{contractLabel}
            </span>
          )}
          {remoteData && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-full">
              {remoteData.icon} {remoteData.label}
            </span>
          )}
          {(listing.city || listing.location) && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              {listing.city || listing.location}
              {listing.region ? `, ${listing.region}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Entreprise ────────────────────────────────────────────────── */}
      {(listing.companyLogo || listing.company || listing.companyName) && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
          {listing.companyLogo ? (
            <img
              src={listing.companyLogo}
              alt={listing.company || listing.companyName}
              className="w-12 h-12 rounded-xl object-contain border border-gray-100 bg-white p-1 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#E8F5D0] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#2D5016]" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{listing.company || listing.companyName}</p>
            {listing.submittedByEmail && (
              <a href={`mailto:${listing.submittedByEmail}`} className="text-xs text-[#2D5016] hover:underline">
                {listing.submittedByEmail}
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Grid stats clés ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard icon={DollarSign}    label="Salaire"      value={salaryDisplay}     accent />
        <StatCard icon={GraduationCap} label="Expérience"   value={experienceLabel} />
        <StatCard icon={GraduationCap} label="Niveau étude" value={educationLabel} />
        <StatCard icon={Globe}         label="Télétravail"  value={remoteData ? `${remoteData.icon} ${remoteData.label}` : null} />
        <StatCard icon={Clock}         label="Date limite"  value={formatDate(deadline)} />
        <StatCard icon={Eye}           label="Vues"         value={listing.viewsCount ?? 0} />
      </div>

      {/* ── 4. Détails ───────────────────────────────────────────────────── */}
      <Section title="Détails de l'offre">
        <InfoRow icon={User}          label="Soumis par"   value={listing.submittedBy || listing.company || listing.companyName} />
        <InfoRow icon={Building2}     label="Entreprise"   value={listing.company || listing.companyName} />
        <InfoRow icon={Mail}          label="Email"        value={listing.submittedByEmail} href={listing.submittedByEmail ? `mailto:${listing.submittedByEmail}` : null} />
        <InfoRow icon={Tag}           label="Contrat"      value={contractLabel} />
        <InfoRow icon={MapPin}        label="Ville"        value={listing.city || listing.location} />
        <InfoRow icon={MapPin}        label="Région"       value={listing.region} />
        <InfoRow icon={GraduationCap} label="Expérience"   value={experienceLabel} />
        <InfoRow icon={GraduationCap} label="Études"       value={educationLabel} />
        <InfoRow icon={DollarSign}    label="Salaire"      value={salaryDisplay} />
        <InfoRow icon={Clock}         label="Date limite"  value={formatDate(deadline)} />
        <InfoRow icon={Eye}           label="Vues"         value={listing.viewsCount ?? 0} />
        <InfoRow icon={Calendar}      label="Soumis le"    value={formatDate(listing.createdAt)} />
        <InfoRow icon={Hash}          label="Réf."         value={listing.id?.slice(0, 8).toUpperCase()} />
      </Section>

      {/* ── 5. Description ───────────────────────────────────────────────── */}
      {listing.description && (
        <Section title="Description du poste">
          <p className="py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </Section>
      )}

      {/* ── 6. Compétences ───────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Compétences clés</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" /> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Langues ───────────────────────────────────────────────────── */}
      {languages.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Langues requises</p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-3">
            {hasStructuredLanguages ? (
              // [{language, level}, ...]
              languages.map((lang, i) => {
                const cap = (s) => s?.charAt(0).toUpperCase() + s?.slice(1)
                const levelColor = LANGUAGE_LEVEL_COLORS[lang.level?.toLowerCase()] || 'bg-gray-100 text-gray-600'
                const flag = LANGUAGE_FLAGS[lang.language?.toLowerCase()] || '🌐'
                return (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{flag}</span>
                      <span className="text-sm font-semibold text-gray-800">{cap(lang.language)}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColor}`}>
                      {cap(lang.level)}
                    </span>
                  </div>
                )
              })
            ) : (
              // string[] simple
              <div className="flex flex-wrap gap-1.5 py-1">
                {languages.map((lang, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                    {LANGUAGE_FLAGS[lang?.toLowerCase()] || '🌐'} {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 8. Note admin ────────────────────────────────────────────────── */}
      {adminNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Note admin</p>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{adminNotes}</p>
        </div>
      )}

      {/* ── 9. Actions ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Actions</p>
          <StatusPanel
            listingId={listing.id}
            module={listing.module}
            currentStatus={listing.status}
            onStatusChange={handleStatusChange}
            onTransitionRequest={onTransitionRequest}
            deletedByOwner={listing.deletedByOwner ?? false}
          />
        </div>
      </div>

    </div>
  )
}