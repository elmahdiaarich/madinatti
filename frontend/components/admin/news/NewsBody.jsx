'use client'

import { MapPin, Calendar, Eye, User, Hash, Mail, AlertCircle, Languages } from 'lucide-react'
import { StatusBadge, StatusPanel } from '../StatusPanel'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : null

const LANGUAGE_LABELS = { AR: 'Arabe', FR: 'Français' }

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

export default function NewsBody({ listing, onTransitionRequest, onStatusChanged }) {
  const adminNotes = listing.adminNote || listing.adminNotes

  const handleStatusChange = (newStatus) => {
    onStatusChanged?.(listing.id, newStatus)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} module="news" />
          {listing.language && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
              <Languages className="w-3 h-3" /> {LANGUAGE_LABELS[listing.language] || listing.language}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listing.category?.name && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/30 px-2.5 py-1 rounded-full">
              {listing.category.name}
            </span>
          )}
          {listing.city && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />{listing.city}
            </span>
          )}
        </div>
      </div>

      {listing.imageUrl && (
        <div className="w-full h-52 bg-gray-100 rounded-xl overflow-hidden">
          <img src={listing.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {listing.previousTitle && listing.previousTitle !== listing.title && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1.5">
            Titre — version publiée précédente
          </p>
          <p className="text-sm text-blue-900/70 line-through leading-relaxed">{listing.previousTitle}</p>
        </div>
      )}

      {listing.previousDescription && listing.previousDescription !== listing.description && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1.5">
            Description — version publiée précédente
          </p>
          <p className="text-sm text-blue-900/70 line-through leading-relaxed whitespace-pre-line">
            {listing.previousDescription}
          </p>
        </div>
      )}

      {listing.previousImageUrl && listing.previousImageUrl !== listing.imageUrl && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-1.5">
            Photo — version publiée précédente
          </p>
          <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden opacity-60">
            <img src={listing.previousImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <Section title="Informations">
        <InfoRow icon={User}     label="Journaliste" value={listing.submittedBy} />
        <InfoRow icon={Mail}     label="Email"       value={listing.submittedByEmail} href={listing.submittedByEmail ? `mailto:${listing.submittedByEmail}` : null} />
        <InfoRow icon={MapPin}   label="Ville"       value={listing.city} />
        <InfoRow icon={Hash}     label="Catégorie"   value={listing.category?.name} />
        <InfoRow icon={Eye}      label="Vues"        value={listing.viewsCount ?? 0} />
        <InfoRow icon={Calendar} label="Soumis le"   value={formatDate(listing.createdAt)} />
        <InfoRow icon={Calendar} label="Publié le"   value={formatDate(listing.publishedAt)} />
        <InfoRow icon={Hash}     label="Réf."        value={listing.id?.slice(0, 8).toUpperCase()} />
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
            module="news"
            currentStatus={listing.status}
            onStatusChange={handleStatusChange}
            onTransitionRequest={onTransitionRequest}
            deletedByOwner={false}
          />
        </div>
      </div>
    </div>
  )
}