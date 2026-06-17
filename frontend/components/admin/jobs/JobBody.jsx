'use client'

import { useState } from 'react'
import {
  Briefcase,
  MapPin,
  User,
  Calendar,
  Tag,
  Eye,
  Building2,
  Clock,
  Globe,
  Languages,
  GraduationCap,
  DollarSign,
  CheckCircle2,
} from 'lucide-react'
import { StatusBadge, StatusPanel } from '../StatusPanel'

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('fr-MA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

function MetaItem({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-gray-800 pl-5">{value}</span>
    </div>
  )
}

const CONTRACT_LABELS = {
  CDI: 'CDI',
  CDD: 'CDD',
  FREELANCE: 'Freelance',
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  INTERIM: 'Intérim',
}

const REMOTE_LABELS = {
  ON_SITE: 'Présentiel',
  REMOTE: 'Full remote',
  HYBRID: 'Hybride',
}

export default function JobBody({
  listing: initialListing,
  onTransitionRequest,
  onStatusChanged,
}) {
  const [listing, setListing] = useState(initialListing)

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'DELETED') {
      onStatusChanged?.(listing.id, 'DELETED')
      return
    }
    setListing((p) => ({ ...p, status: newStatus }))
    onStatusChanged?.(listing.id, newStatus)
  }

  const submittedByName = listing.submittedBy || listing.company || ''
  const submittedByEmail = listing.submittedByEmail || ''
  const adminNotes = listing.adminNote || listing.adminNotes

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto p-1">

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={listing.status} />
          {listing.isActive !== false ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              ● Actif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-500 border-gray-300">
              ○ Inactif
            </span>
          )}
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-full border border-purple-200">
              ★ Vedette
            </span>
          )}
        </div>
        <StatusPanel
          listingId={listing.id}
          module={listing.module}
          currentStatus={listing.status}
          onStatusChange={handleStatusChange}
          onTransitionRequest={onTransitionRequest}
          deletedByOwner={listing.deletedByOwner ?? false}
        />
      </div>

      {/* ── Company + Title ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        {listing.companyLogo && (
          <img
            src={listing.companyLogo}
            alt={listing.company}
            className="w-14 h-14 rounded-xl object-contain border border-gray-100 bg-white p-1 shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          {listing.company && (
            <p className="text-sm font-semibold text-[#2D5016]">{listing.company}</p>
          )}
          <h2 className="text-xl font-bold text-gray-800 leading-snug">
            {listing.title || 'Sans titre'}
          </h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {listing.contractType && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                <Briefcase className="w-3 h-3" />
                {CONTRACT_LABELS[listing.contractType] ?? listing.contractType}
              </span>
            )}
            {listing.remote && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                <Globe className="w-3 h-3" />
                {REMOTE_LABELS[listing.remote] ?? listing.remote}
              </span>
            )}
            {listing.city && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                <MapPin className="w-3 h-3" /> {listing.city}
                {listing.region ? `, ${listing.region}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Key stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          listing.salary && {
            icon: DollarSign,
            label: 'Salaire',
            value: listing.salary,
          },
          listing.experience && {
            icon: GraduationCap,
            label: 'Expérience',
            value: listing.experience,
          },
          listing.education && {
            icon: GraduationCap,
            label: 'Formation',
            value: listing.education,
          },
          listing.languages && {
            icon: Languages,
            label: 'Langues',
            value: Array.isArray(listing.languages)
              ? listing.languages.join(', ')
              : listing.languages,
          },
          listing.deadline && {
            icon: Clock,
            label: 'Date limite',
            value: formatDate(listing.deadline),
          },
          { icon: Eye, label: 'Vues', value: listing.viewsCount ?? 0 },
        ]
          .filter(Boolean)
          .map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl px-3 py-2.5 flex flex-col gap-1 border border-gray-100"
            >
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 stroke-[1.8]" /> {label}
              </p>
              <p className="text-sm font-bold text-gray-800 pl-5">{value}</p>
            </div>
          ))}
      </div>

      {/* ── Meta / submitter ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <MetaItem
          icon={<User className="w-4 h-4 text-gray-400" />}
          label="Soumis par"
          value={submittedByName}
        />
        <MetaItem
          icon={<Building2 className="w-4 h-4 text-gray-400" />}
          label="Entreprise"
          value={listing.company}
        />
        <MetaItem
          icon={<Tag className="w-4 h-4 text-gray-400" />}
          label="Contrat"
          value={CONTRACT_LABELS[listing.contractType] ?? listing.contractType}
        />
        <MetaItem
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="Soumis le"
          value={formatDate(listing.createdAt)}
        />
        {submittedByEmail && (
          <div className="flex items-center gap-2 text-sm sm:col-span-2 pt-2 border-t border-gray-200/60">
            <span className="text-gray-400">Email :</span>
            <a
              href={`mailto:${submittedByEmail}`}
              className="font-medium text-[#2D5016] hover:underline truncate"
            >
              {submittedByEmail}
            </a>
          </div>
        )}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      {listing.description && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
            Description du poste
          </p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
            {listing.description}
          </p>
        </div>
      )}

      {/* ── Skills / requirements ───────────────────────────────────────── */}
      {listing.skills && listing.skills.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
            Compétences requises
          </p>
          <div className="flex flex-wrap gap-1.5">
            {listing.skills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium"
              >
                <CheckCircle2 className="w-3 h-3 stroke-[3]" /> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin notes ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
          Notes administrateur{' '}
          <span className="normal-case font-normal">(privé)</span>
        </p>
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl px-4 py-3 text-sm text-amber-900">
          {adminNotes ? (
            <p className="whitespace-pre-line">{adminNotes}</p>
          ) : (
            <p className="text-gray-400 italic">Aucune note interne rédigée.</p>
          )}
        </div>
      </div>

      {/* ── Audit ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono">
        <div>
          ID système : <span className="text-gray-600">{listing.id}</span>
        </div>
        <div>
          Module : <span className="text-gray-600">{listing.module || 'emploi'}</span>
        </div>
        <div>
          Modifié le :{' '}
          <span className="text-gray-600">
            {formatDate(listing.updatedAt || listing.createdAt)}
          </span>
        </div>
        {listing.submittedById && (
          <div>
            ID soumetteur :{' '}
            <span className="text-gray-600">{listing.submittedById}</span>
          </div>
        )}
      </div>
    </div>
  )
}