'use client'

import { useState } from 'react'
import { MapPin, Calendar, Eye, User, Hash, Mail, AlertCircle } from 'lucide-react'
import { StatusBadge, StatusPanel } from '../StatusPanel'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null
const fmtPrice = (v) => Number(v).toLocaleString('fr-MA')

function StatCard({ icon: Icon, label, value, accent = false }) {
  if (!value && value !== 0) return null
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl px-3 py-2.5 border ${
      accent ? 'bg-[#E8F5D0] border-[#A7D129]/40' : 'bg-gray-50 border-gray-100'
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

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-sm font-medium text-[#2D5016] hover:underline truncate flex-1">{value}</a>
      ) : (
        <span className="text-sm font-semibold text-gray-800 flex-1">{value}</span>
      )}
    </div>
  )
}

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

export default function TaskRequestBody({ listing: initialListing, onTransitionRequest, onStatusChanged }) {
  const [listing, setListing] = useState(initialListing)

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'DELETED') { onStatusChanged?.(listing.id, 'DELETED'); return }
    setListing(p => ({ ...p, status: newStatus }))
    onStatusChanged?.(listing.id, newStatus)
  }

  const adminNotes = listing.adminNote || listing.adminNotes

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} module="taskRequests" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listing.category?.name && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/30 px-2.5 py-1 rounded-full">
              {listing.category.name}
            </span>
          )}
          {listing.city && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />{listing.city}{listing.region ? `, ${listing.region}` : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-[#2D5016]">
          {listing.budget ? `${fmtPrice(listing.budget)} MAD` : 'Budget à discuter'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard icon={Calendar} label="Date souhaitée" value={formatDate(listing.neededDate)} accent />
        <StatCard icon={Eye}      label="Vues" value={listing.viewsCount ?? 0} />
      </div>

      <Section title="Informations">
        <InfoRow icon={User}     label="Client"     value={listing.submittedBy || listing.company} />
        <InfoRow icon={Mail}     label="Email"      value={listing.submittedByEmail} href={listing.submittedByEmail ? `mailto:${listing.submittedByEmail}` : null} />
        <InfoRow icon={MapPin}   label="Ville"      value={listing.city} />
        <InfoRow icon={MapPin}   label="Région"     value={listing.region} />
        <InfoRow icon={Hash}     label="Catégorie"  value={listing.category?.name} />
        <InfoRow icon={Calendar} label="Publiée le" value={formatDate(listing.createdAt)} />
        <InfoRow icon={Hash}     label="Réf."       value={listing.id?.slice(0, 8).toUpperCase()} />
      </Section>

      {listing.description && (
        <Section title="Description">
          <p className="py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </Section>
      )}

      {adminNotes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Note admin</p>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">{adminNotes}</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Actions</p>
          <StatusPanel
            listingId={listing.id}
            module="taskRequests"
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