'use client'

import { useState } from 'react'
import {
  MapPin, Star, Rocket, Camera,
  Calendar, Eye, User, Tag, Check,
  Hash, Mail, Phone, MessageSquare,
  DollarSign, AlertCircle, ChevronLeft, ChevronRight,
  Compass, Gauge, Settings, HelpCircle,
} from 'lucide-react'
import { StatusBadge, StatusPanel } from '../StatusPanel'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : null

const LISTING_TYPE_LABELS = {
  SALE: 'Vente',
  RENT: 'Location',
}

const CONDITION_LABELS = {
  NEW: 'Neuf',
  USED: 'Occasion',
  DAMAGED: 'Accidenté',
}

const FUEL_LABELS = {
  PETROL: 'Essence',
  DIESEL: 'Diesel',
  ELECTRIC: 'Électrique',
  HYBRID: 'Hybride',
  LPG: 'GPL',
}

const TRANS_LABELS = {
  MANUAL: 'Manuelle',
  AUTOMATIC: 'Automatique',
  SEMI_AUTOMATIC: 'Semi-automatique',
}

const BODY_LABELS = {
  SEDAN: 'Berline',
  SUV: 'SUV',
  HATCHBACK: 'Citadine',
  COUPE: 'Coupé',
  CONVERTIBLE: 'Cabriolet',
  WAGON: 'Break',
  VAN: 'Utilitaire',
  PICKUP: 'Pickup',
  MINIVAN: 'Monospace',
}

const fmtPrice = (v) => Number(v).toLocaleString('fr-MA')

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

function ImageCarousel({ images }) {
  const [active, setActive] = useState(0)

  if (!images?.length) return null

  const prev = () => setActive(i => (i - 1 + images.length) % images.length)
  const next = () => setActive(i => (i + 1) % images.length)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full h-52 bg-gray-100 rounded-xl overflow-hidden group">
        <img
          src={images[active]?.url || images[active]}
          alt={`Photo ${active + 1}`}
          className="w-full h-full object-cover transition-opacity duration-200"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5">
          <Camera className="w-3 h-3" /> {active + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                active === i
                  ? 'border-[#2D5016]'
                  : 'border-transparent hover:border-[#A7D129]'
              } bg-gray-100`}
            >
              <img
                src={img?.url || img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VehicleBody({ listing: initialListing, onTransitionRequest, onStatusChanged }) {
  const [listing, setListing] = useState(initialListing)

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'DELETED') { onStatusChanged?.(listing.id, 'DELETED'); return }
    setListing(p => ({ ...p, status: newStatus }))
    onStatusChanged?.(listing.id, newStatus)
  }

  const images = Array.isArray(listing.images) ? listing.images : []
  const sortedImages = [
    ...images.filter(img => img?.isCover),
    ...images.filter(img => !img?.isCover),
  ]

  const adminNotes       = listing.adminNote || listing.adminNotes
  const inquiryCount     = listing.inquiriesCount ?? listing._count?.inquiries ?? 0
  const listingTypeKey   = listing.listingType ?? listing.contractType
  const listingTypeLabel = LISTING_TYPE_LABELS[listingTypeKey] ?? listingTypeKey
  const conditionLabel   = CONDITION_LABELS[listing.condition] ?? listing.condition
  const fuelLabel        = FUEL_LABELS[listing.fuelType] ?? listing.fuelType
  const transmissionLabel = TRANS_LABELS[listing.transmission] ?? listing.transmission
  const bodyLabel        = BODY_LABELS[listing.bodyType] ?? listing.bodyType

  const features    = listing.features && typeof listing.features === 'object' ? listing.features : {}
  const hasFeatures = Object.keys(features).length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={listing.status} />
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-purple-700" /> Vedette
            </span>
          )}
          {listing.isSponsored && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
              <Rocket className="w-3 h-3" /> Sponsorisé
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {listingTypeLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/30 px-2.5 py-1 rounded-full">
              {listingTypeLabel}
            </span>
          )}
          {conditionLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              {conditionLabel}
            </span>
          )}
          {listing.city && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3" />{listing.city}{listing.region ? `, ${listing.region}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Prix ──────────────────────────────────────────────────────── */}
      {listing.price != null && (
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-[#2D5016]">
            {fmtPrice(listing.price)} MAD
          </p>
          {listingTypeKey === 'RENT' && (
            <span className="text-sm text-gray-400 mb-1">/jour</span>
          )}
          {listing.isNegotiable && (
            <span className="text-xs text-[#7BA428] font-semibold border border-[#A7D129] rounded-full px-2.5 py-0.5 mb-1 bg-[#E8F5D0]/30">
              Négociable
            </span>
          )}
        </div>
      )}

      {/* ── 3. Carousel images ───────────────────────────────────────────── */}
      <ImageCarousel images={sortedImages} />

      {/* ── 4. Grid stats clés ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard icon={Gauge}         label="Kilométrage"  value={listing.mileage != null ? `${fmtPrice(listing.mileage)} km` : null} accent />
        <StatCard icon={Calendar}      label="Année"        value={listing.year} />
        <StatCard icon={Settings}      label="Boîte"        value={transmissionLabel} />
        <StatCard icon={Compass}       label="Carburant"    value={fuelLabel} />
        <StatCard icon={Tag}           label="Carrosserie"  value={bodyLabel} />
        <StatCard icon={Eye}           label="Vues"         value={listing.viewsCount ?? 0} />
      </div>

      {/* ── 5. Informations ──────────────────────────────────────────────── */}
      <Section title="Informations">
        <InfoRow icon={User}     label="Vendeur"      value={listing.submittedBy || listing.company} />
        <InfoRow icon={Mail}     label="Email"        value={listing.submittedByEmail} href={listing.submittedByEmail ? `mailto:${listing.submittedByEmail}` : null} />
        {listing.contactPhone && (
          <InfoRow icon={Phone}  label="Téléphone"    value={listing.contactPhone} href={`tel:${listing.contactPhone}`} />
        )}
        <InfoRow icon={Tag}      label="Marque"       value={listing.make} />
        <InfoRow icon={Tag}      label="Modèle"       value={listing.model} />
        <InfoRow icon={Tag}      label="Transaction"  value={listingTypeLabel} />
        <InfoRow icon={Compass}  label="Carburant"    value={fuelLabel} />
        <InfoRow icon={Settings} label="Boîte"        value={transmissionLabel} />
        <InfoRow icon={Tag}      label="Carrosserie"  value={bodyLabel} />
        <InfoRow icon={Tag}      label="Couleur"      value={listing.color} />
        <InfoRow icon={Tag}      label="Portes"       value={listing.doors} />
        <InfoRow icon={Tag}      label="Places"       value={listing.seats} />
        <InfoRow icon={Gauge}    label="Cylindrée"    value={listing.engineSize ? `${listing.engineSize} L` : null} />
        <InfoRow icon={Gauge}    label="Puissance ch" value={listing.horsePower ? `${listing.horsePower} ch` : null} />
        <InfoRow icon={MapPin}   label="Ville"        value={listing.city} />
        <InfoRow icon={MapPin}   label="Adresse"      value={listing.location} />
        <InfoRow icon={MapPin}   label="Région"       value={listing.region} />
        <InfoRow icon={Hash}     label="Catégorie"    value={listing.category?.name} />
        <InfoRow icon={Calendar} label="Soumis le"    value={formatDate(listing.createdAt)} />
        <InfoRow icon={Calendar} label="Publié le"    value={formatDate(listing.publishedAt)} />
        <InfoRow icon={Hash}     label="Réf."         value={listing.id?.slice(0, 8).toUpperCase()} />
      </Section>

      {/* ── 6. Description ───────────────────────────────────────────────── */}
      {listing.description && (
        <Section title="Description">
          <p className="py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </Section>
      )}

      {/* ── 7. Options & Équipements ───────────────────────────────────────── */}
      {hasFeatures && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Options & Équipements</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(features).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium">
                <Check className="w-3 h-3 stroke-[3]" /> {k}{v !== true ? `: ${v}` : ''}
              </span>
            ))}
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
