'use client'

import { useState } from 'react'
import {
  Briefcase, MapPin, User, Calendar, Eye,
  Building2, Globe, Languages, GraduationCap,
  DollarSign, CheckCircle2, Clock, Mail, Hash, Tag,
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
}
const REMOTE_LABELS = {
  ON_SITE: 'Présentiel', REMOTE: 'Full remote', HYBRID: 'Hybride',
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 w-32 shrink-0">
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

function Chip({ children, variant = 'gray' }) {
  const v = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    teal:   'bg-teal-50 text-teal-700 border-teal-100',
    green:  'bg-[#E8F5D0] text-[#2D5016] border-[#A7D129]/30',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    gray:   'bg-gray-100 text-gray-500 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${v[variant]}`}>
      {children}
    </span>
  )
}

export default function JobBody({ listing: initialListing, onTransitionRequest, onStatusChanged }) {
  const [listing, setListing] = useState(initialListing)

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'DELETED') { onStatusChanged?.(listing.id, 'DELETED'); return }
    setListing(p => ({ ...p, status: newStatus }))
    onStatusChanged?.(listing.id, newStatus)
  }

  const adminNotes = listing.adminNote || listing.adminNotes
  const contractLabel = CONTRACT_LABELS[listing.contractType] ?? listing.contractType
  const remoteLabel   = REMOTE_LABELS[listing.remote] ?? listing.remote

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero: statut + chips ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} />
          {listing.isFeatured && <Chip variant="orange">★ Vedette</Chip>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contractLabel && (
            <Chip variant="blue"><Briefcase className="w-3 h-3" />{contractLabel}</Chip>
          )}
          {remoteLabel && (
            <Chip variant="teal"><Globe className="w-3 h-3" />{remoteLabel}</Chip>
          )}
          {listing.city && (
            <Chip variant="gray"><MapPin className="w-3 h-3" />{listing.city}{listing.region ? `, ${listing.region}` : ''}</Chip>
          )}
        </div>
      </div>

      {/* ── Logo + identité ─────────────────────────────────────────────── */}
      {listing.companyLogo && (
        <div className="flex items-center gap-3">
          <img
            src={listing.companyLogo}
            alt={listing.company}
            className="w-12 h-12 rounded-xl object-contain border border-gray-100 bg-white p-1 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-gray-900">{listing.company}</p>
            <p className="text-xs text-gray-400">{listing.submittedByEmail}</p>
          </div>
        </div>
      )}

      {/* ── Infos clés ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Détails de l'offre</p>
        </div>
        <div className="px-4 py-0.5">
          <InfoRow icon={User}          label="Soumis par"   value={listing.submittedBy || listing.company} />
          <InfoRow icon={Building2}     label="Entreprise"   value={listing.company} />
          <InfoRow icon={Mail}          label="Email"        value={listing.submittedByEmail} href={`mailto:${listing.submittedByEmail}`} />
          <InfoRow icon={Tag}           label="Contrat"      value={contractLabel} />
          <InfoRow icon={MapPin}        label="Localisation" value={listing.city ? `${listing.city}${listing.region ? `, ${listing.region}` : ''}` : null} />
          <InfoRow icon={DollarSign}    label="Salaire"      value={listing.salary} />
          <InfoRow icon={GraduationCap} label="Expérience"   value={listing.experience} />
          <InfoRow icon={Languages}     label="Langues"      value={Array.isArray(listing.languages) ? listing.languages.join(', ') : listing.languages} />
          <InfoRow icon={Clock}         label="Date limite"  value={formatDate(listing.deadline)} />
          <InfoRow icon={Eye}           label="Vues"         value={listing.viewsCount ?? 0} />
          <InfoRow icon={Calendar}      label="Soumis le"    value={formatDate(listing.createdAt)} />
          <InfoRow icon={Hash}          label="Réf."         value={listing.id?.slice(0, 8).toUpperCase()} />
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      {listing.description && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Description du poste</p>
          </div>
          <p className="px-4 py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      )}

      {/* ── Compétences ─────────────────────────────────────────────────── */}
      {listing.skills?.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Compétences</p>
          <div className="flex flex-wrap gap-1.5">
            {listing.skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" /> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions — en bas à droite ────────────────────────────────────── */}
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