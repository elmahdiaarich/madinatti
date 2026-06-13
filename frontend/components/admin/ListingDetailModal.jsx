/**
 * components/admin/ListingDetailModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-detail modal for any listing (emploi / immobilier / véhicule).
 *
 * For immobilier listings, renders a rich view: images (with lightbox),
 * price, surface/rooms/bathrooms, description, map, features, contact.
 * For all other modules, renders the original compact meta grid.
 *
 * Props:
 *  isOpen        — boolean
 *  onClose       — () => void
 *  listing       — listing object from adminApi
 *  onApprove     — (id) => Promise<void>
 *  onReject      — (id, note) => Promise<void>
 *  loading       — boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Star, 
  Rocket, 
  Camera, 
  Maximize2, 
  Bed, 
  Bath, 
  Building, 
  MapPin, 
  Eye, 
  User, 
  Tag, 
  Calendar, 
  Check 
} from 'lucide-react';
import StatusBadge from './StatusBadge'
import RejectModal from './RejectModal'

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6l-12 12" /><path d="M6 6l12 12" />
  </svg>
)
const IconMapPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
  </svg>
)
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" />
    <path d="M8 15h2" /><path d="M14 15h2" /><path d="M8 19h2" /><path d="M14 19h2" />
  </svg>
)
const IconBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
  </svg>
)
const IconContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
    <path d="M9 15l2 2l4 -4" />
  </svg>
)
const IconHistory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8l0 4l2 2" />
    <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
  </svg>
)
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5l10 -10" />
  </svg>
)
const IconBan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M5.7 5.7l12.6 12.6" />
  </svg>
)
const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6l-6 6l6 6" />
  </svg>
)
const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6l-6 6" />
  </svg>
)

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

const PROPERTY_LABELS = {
  APARTMENT: 'Appartement', VILLA: 'Villa', HOUSE: 'Maison',
  STUDIO: 'Studio', LAND: 'Terrain', OFFICE: 'Bureau', SHOP: 'Commerce',
}

const MetaItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="text-gray-400 shrink-0">{icon}</span>
    <span className="text-gray-400 shrink-0">{label} :</span>
    <span className="font-medium text-gray-800">{value || '—'}</span>
  </div>
)

// ── Mini map ──────────────────────────────────────────────────────────────────
function MiniMap({ latitude, longitude, location }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)

  useEffect(() => {
    if (leafletMap.current) return

    const initMap = () => {
      if (!mapRef.current || !window.L) return
      const L = window.L
      const lat = latitude ? parseFloat(latitude) : null
      const lng = longitude ? parseFloat(longitude) : null

      if (!lat || !lng) {
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
          .setView([31.7917, -7.0926], 5)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
        leafletMap.current = map
        if (location) {
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Maroc')}&format=json&limit=1`)
            .then(r => r.json())
            .then(data => {
              if (data[0]) {
                const { lat: rlat, lon: rlng } = data[0]
                map.setView([parseFloat(rlat), parseFloat(rlng)], 13)
                L.marker([parseFloat(rlat), parseFloat(rlng)]).addTo(map)
              }
            }).catch(() => {})
        }
        return
      }

      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        .setView([lat, lng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      L.marker([lat, lng]).addTo(map).bindPopup(location || 'Position du bien').openPopup()
      leafletMap.current = map
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'; link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    if (window.L) {
      initMap()
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap() }
      }, 50)
      return () => clearInterval(interval)
    }
  }, [])

  return (
    <div ref={mapRef} className="w-full h-40 rounded-xl overflow-hidden border border-gray-200"
      style={{ position: 'relative', zIndex: 0 }} />
  )
}

// ── Image lightbox ────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrent(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}>
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white transition-colors"
      >
        <IconX />
      </button>

      {/* Counter */}
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {current + 1} / {images.length}
      </span>

      {/* Prev */}
      {current > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent(i => i - 1) }}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
            flex items-center justify-center text-white transition-colors"
        >
          <IconChevronLeft />
        </button>
      )}

      {/* Image */}
      <img
        src={images[current]?.url || images[current]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {current < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrent(i => i + 1) }}
          className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
            flex items-center justify-center text-white transition-colors"
        >
          <IconChevronRight />
        </button>
      )}

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0
                ${i === current ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-75'}`}
            >
              <img src={img?.url || img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Real-estate body ──────────────────────────────────────────────────────────
function RealEstateBody({ listing }) {
  console.log("listing: ", listing.latitude);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const images = Array.isArray(listing.images) ? listing.images : [];
  const coverImage = images.find(img => img?.isCover) || images[0];
  const otherImages = images.filter(img => img !== coverImage);
  const allImages = coverImage ? [coverImage, ...otherImages] : images;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const submittedByName = listing.submittedBy || listing.company || listing.user?.name || 'Inconnu';
  const submittedByEmail = listing.submittedByEmail || listing.user?.email;
  const inquiryCount = listing.inquiryCount ?? listing._count?.inquiries ?? 0;
  const adminNotes = listing.adminNotes || listing.adminNote;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto p-1">
      
      {/* ── Admin Badges & System Status ─────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center bg-gray-100 p-2.5 rounded-xl border border-gray-200">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
          listing.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
          listing.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`}>
          Statut: {listing.status || 'PENDING'}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${listing.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-200 text-gray-600'}`}>
          {listing.isActive !== false ? '● En ligne (Actif)' : '○ Hors ligne (Inactif)'}
        </span>
        {listing.isFeatured && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-md border border-purple-200">
            <Star className="w-3.5 h-3.5 fill-purple-800 text-purple-800" /> Vedette
          </span>
        )}
        {listing.isSponsored && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-md border border-blue-200">
            <Rocket className="w-3.5 h-3.5 text-blue-800" /> Sponsorisé
          </span>
        )}
      </div>

      {/* ── Images ────────────────────────────────────────────────────── */}
      {allImages.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Cover */}
          <div
            className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={coverImage?.url || coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {allImages.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs
                px-2.5 py-1 rounded-full font-semibold pointer-events-none inline-flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> {allImages.length} photos
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {/* Thumbnail strip */}
          {otherImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {otherImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i + 1)}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200
                    hover:border-[#2D5016] flex-shrink-0 transition-colors group"
                >
                  <img
                    src={img?.url || img}
                    alt=""
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Title, Subtitle & Price ───────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {listing.propertyType && (
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {listing.propertyType}
            {listing.category?.name ? ` · ${listing.category.name}` : ''}
          </p>
        )}
        
        <h2 className="text-xl font-bold text-gray-800 leading-snug">
          {listing.title || 'Sans titre'}
        </h2>

        {listing.price != null && (
          <p className="text-2xl font-bold text-[#2D5016]">
            {originalPriceString(listing.price)} MAD
            {listing.listingType === 'RENT' && (
              <span className="text-sm font-normal text-gray-400"> / mois</span>
            )}
          </p>
        )}
      </div>

      {/* ── Key stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          listing.surface    && { icon: Maximize2, label: 'Surface',    value: `${listing.surface} m²` },
          listing.rooms      && { icon: Bed,       label: 'Pièces',     value: listing.rooms },
          listing.bathrooms  && { icon: Bath,      label: 'SDB',        value: listing.bathrooms },
          listing.floor != null && { icon: Building, label: 'Étage',      value: listing.floor === 0 ? 'RDC' : `${listing.floor}ème` },
          listing.city       && { icon: MapPin,    label: 'Ville',      value: listing.region ? `${listing.city} (${listing.region})` : listing.city },
          { icon: Eye,        label: 'Vues Total', value: listing.viewsCount ?? 0 },
        ].filter(Boolean).map(({ icon: IconComponent, label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex flex-col gap-1 border border-gray-100">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <IconComponent className="w-3.5 h-3.5 stroke-[1.8] text-gray-400" /> 
              {label}
            </p>
            <p className="text-sm font-bold text-gray-800 pl-5">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Meta grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <MetaItem icon={<User className="w-4 h-4 text-gray-400" />} label="Soumis par" value={submittedByName} />
        <MetaItem icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Ville" value={listing.city} />
        <MetaItem icon={<Tag className="w-4 h-4 text-gray-400" />} label="Transaction" value={listing.listingType === 'SALE' ? 'Vente' : listing.listingType === 'RENT' ? 'Location' : listing.listingType} />
        <MetaItem icon={<Calendar className="w-4 h-4 text-gray-400" />} label="Soumis le" value={formatDate(listing.createdAt)} />
        
        {submittedByEmail && (
          <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2 pt-2 border-t border-gray-200/60">
            <span className="text-gray-400">Email Propriétaire :</span>
            <a href={`mailto:${submittedByEmail}`} className="font-medium text-[#2D5016] hover:underline truncate">
              {submittedByEmail}
            </a>
          </div>
        )}
        
        {inquiryCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
            <span className="text-gray-400">Messages reçus :</span>
            <span className="font-medium text-gray-800">{inquiryCount} demandes</span>
          </div>
        )}
      </div>

      {/* ── Description ───────────────────────────────────────────────── */}
      {listing.description && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
            {listing.description}
          </p>
        </div>
      )}

      {/* ── Features ──────────────────────────────────────────────────── */}
      {listing.features && Object.keys(listing.features).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Équipements</h3>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(listing.features).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium">
                <Check className="w-3 h-3 stroke-[3]" /> {k}{v !== true ? `: ${v}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Internal Admin Notes ──────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes Administrateur (Privé)</h3>
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl px-4 py-3 text-sm text-amber-900">
          {adminNotes ? (
            <p className="whitespace-pre-line">{adminNotes}</p>
          ) : (
            <p className="text-gray-400 italic">Aucune note interne rédigée pour le moment.</p>
          )}
        </div>
      </div>

      {/* ── Location & map ────────────────────────────────────────────── */}
      {(listing.location || listing.latitude || listing.longitude) && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Localisation</h3>
          {listing.location && (
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{listing.location}{listing.city ? `, ${listing.city}` : ''}</span>
            </p>
          )}
          <MiniMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            location={listing.location}
          />
        </div>
      )}

      {/* ── System Audit Logs Metadata ────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono">
        <div>ID Système : <span className="text-gray-600">{listing.id}</span></div>
        <div>Module App : <span className="text-gray-600">{listing.module || 'N/A'}</span></div>
        <div>Modifié le : <span className="text-gray-600">{formatDate(listing.updatedAt || listing.createdAt)}</span></div>
        {listing.submittedById && <div>ID Soumetteur : <span className="text-gray-600">{listing.submittedById}</span></div>}
      </div>
    </div>
  );
}

// Helper to format string or decimal prices safely
function originalPriceString(price) {
  const num = Number(price);
  return isNaN(num) ? price : num.toLocaleString('fr-MA');
}

// Small sub-component validation logic helper mapping structure
// function MetaItem({ icon, label, value }) {
//   if (!value) return null;
//   return (
//     <div className="flex items-center gap-2.5 text-sm text-gray-600">
//       <div className="text-gray-400 w-4 h-4 flex items-center justify-center">{icon}</div>
//       <span className="text-gray-400">{label} :</span>
//       <span className="font-medium text-gray-800 truncate">{value}</span>
//     </div>
//   );
// }

// ── Generic listing body (emploi / véhicule / etc.) ───────────────────────────
function GenericBody({ listing }) {
  return (
    <>
      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <MetaItem icon={<IconBuilding />} label="Entreprise" value={listing.company} />
        <MetaItem icon={<IconMapPin />}   label="Ville"      value={listing.city} />
        <MetaItem icon={<IconContract />} label="Type"       value={listing.contractType} />
        <MetaItem icon={<IconCalendar />} label="Soumis le"  value={formatDate(listing.createdAt)} />
        {listing.submittedByEmail && (
          <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
            <span className="text-gray-400">Email :</span>
            <a href={`mailto:${listing.submittedByEmail}`}
              className="font-medium text-[#2D5016] hover:underline truncate">
              {listing.submittedByEmail}
            </a>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50
          rounded-xl border border-gray-100 px-4 py-3">
          {listing.description || 'Aucune description fournie.'}
        </p>
      </div>

      {/* Previous admin note */}
      {listing.adminNote && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-red-600 mb-1">Note de refus précédente</p>
          <p className="text-sm text-red-700 whitespace-pre-line">{listing.adminNote}</p>
        </div>
      )}

      {/* Company history */}
      {listing.companyHistory && (
        <div className="border border-[#A7D129]/30 bg-[#E8F5D0]/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#2D5016]"><IconHistory /></span>
            <p className="text-sm font-semibold text-[#2D5016]">Historique de l'entreprise</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5016]">
                {listing.companyHistory.totalSubmitted}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Annonces soumises</p>
            </div>
            <div className="w-px h-10 bg-[#A7D129]/30" />
            <div className="text-center">
              <p className={`text-2xl font-bold ${listing.companyHistory.previousRejections > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {listing.companyHistory.previousRejections}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Refus précédents</p>
            </div>
            <div className="w-px h-10 bg-[#A7D129]/30" />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#2D5016]">
                {listing.companyHistory.totalSubmitted - listing.companyHistory.previousRejections}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Approuvées</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ListingDetailModal({
  isOpen,
  onClose,
  listing,
  onApprove,
  onReject,
  loading = false,
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  if (!isOpen || !listing) return null

  const isReport  = listing.module === 'signalement'
  const isPending = listing.status === 'PENDING'
  const isImmo    = listing.module === 'immobilier'

  const handleApprove = async () => {
    await onApprove(listing.id)
    onClose()
  }

  const handleReject = async (note) => {
    setRejectLoading(true)
    try {
      await onReject(listing.id, note)
      setRejectOpen(false)
      onClose()
    } finally {
      setRejectLoading(false)
    }
  }

  return (
    <>
      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* ── Modal panel ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]
          ${isImmo ? 'max-w-2xl' : 'max-w-2xl'}`}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge module={listing.module} />
                <StatusBadge status={listing.status} showDot />
                {isImmo && listing.listingType && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    {listing.listingType === 'SALE' ? 'Vente' : 'Location'}
                  </span>
                )}
                {isImmo && listing.isFeatured && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                    ⭐ Mis en avant
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug mt-1">
                {listing.title}
              </h2>
              {isImmo && listing.price != null && (
                <p className="text-sm text-[#2D5016] font-semibold mt-0.5">
                  Réf: <span className="font-mono text-gray-400">{listing.id?.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400
                hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <IconX />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {isImmo
              ? <RealEstateBody listing={listing} />
              : <GenericBody listing={listing} />
            }

            {/* Admin note (immobilier) */}
            {isImmo && listing.adminNote && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Note de refus précédente</p>
                <p className="text-sm text-red-700 whitespace-pre-line">{listing.adminNote}</p>
              </div>
            )}
          </div>

          {/* ── Footer actions ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100
                hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              Fermer
            </button>

            {!isReport && isPending && (
              <>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  <IconBan />
                  Refuser avec note
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    text-white bg-[#2D5016] hover:bg-[#3a6b1e] transition-colors disabled:opacity-40"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : <IconCheck />}
                  Approuver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Nested RejectModal ───────────────────────────────────────────── */}
      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        listingTitle={listing.title}
        loading={rejectLoading}
      />
    </>
  )
}