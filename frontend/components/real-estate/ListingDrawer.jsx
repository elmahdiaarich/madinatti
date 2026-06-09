'use client';

import { useEffect, useRef } from 'react';
import MapFrame from '@/components/shared/MapFrame';

const STATUS_LABELS = {
  PENDING:  { label: 'En attente',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Approuvée',   cls: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejetée',     cls: 'bg-red-100 text-red-700 border-red-200' },
};

const PROPERTY_LABELS = {
  APARTMENT: 'Appartement', VILLA: 'Villa', HOUSE: 'Maison',
  STUDIO: 'Studio', LAND: 'Terrain', OFFICE: 'Bureau', SHOP: 'Commerce',
};

// ─── Mini map (read-only, shows pin) ─────────────────────────────────────────
function MiniMap({ latitude, longitude, location }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  useEffect(() => {
    if (leafletMap.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      const lat = latitude ? parseFloat(latitude) : null;
      const lng = longitude ? parseFloat(longitude) : null;

      // If no coords, try to geocode the location string
      if (!lat || !lng) {
        // fallback center on Morocco
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
          .setView([31.7917, -7.0926], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        leafletMap.current = map;

        if (location) {
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Maroc')}&format=json&limit=1`)
            .then(r => r.json())
            .then(data => {
              if (data[0]) {
                const { lat: rlat, lon: rlng } = data[0];
                map.setView([parseFloat(rlat), parseFloat(rlng)], 13);
                L.marker([parseFloat(rlat), parseFloat(rlng)], { icon: makeIcon(L) })
                  .addTo(map)
                  .bindPopup(location)
                  .openPopup();
              }
            })
            .catch(() => {});
        }
        return;
      }

      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        .setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: makeIcon(L) })
        .addTo(map)
        .bindPopup(location || 'Position du bien')
        .openPopup();
      leafletMap.current = map;
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-40 rounded-xl overflow-hidden border border-gray-200"
      style={{ position: 'relative', zIndex: 0 }}
    />
  );
}

function makeIcon(L) {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

// ─── Main drawer ──────────────────────────────────────────────────────────────
export default function ListingDrawer({ listing, onClose, onEdit, onDelete, onModerate, isAdmin }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!listing) return null;
console.log({
  latitude: listing.latitude,
  longitude: listing.longitude,
  location: listing.location,
  city: listing.city,
});
  const status = STATUS_LABELS[listing.status] || STATUS_LABELS.PENDING;
  const images = Array.isArray(listing.images) ? listing.images : [];
  const coverImage = images.find(img => img.isCover) || images[0];
  const otherImages = images.filter(img => !img.isCover);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>
              {status.label}
            </span>
            {listing.isFeatured && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-200">
                ⭐ Mis en avant
              </span>
            )}
            {listing.listingType && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                {listing.listingType === 'SALE' ? 'Vente' : 'Location'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500 text-xl shrink-0"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Cover image */}
          {coverImage && (
            <div className="w-full h-52 bg-gray-100 overflow-hidden relative">
              <img src={coverImage.url} alt="" className="w-full h-full object-cover" />
              {images.length > 1 && (
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  📷 {images.length} photos
                </span>
              )}
            </div>
          )}

          {/* Photo strip */}
          {otherImages.length > 0 && (
            <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
              {otherImages.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt=""
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-gray-200 hover:opacity-90 transition cursor-pointer"
                />
              ))}
            </div>
          )}

          <div className="px-5 py-4 flex flex-col gap-5">

            {/* Title & price */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {PROPERTY_LABELS[listing.propertyType] || listing.propertyType}
                {listing.category?.name ? ` · ${listing.category.name}` : ''}
              </p>
              <h2 className="font-extrabold text-gray-900 text-lg leading-tight">{listing.title}</h2>
              <p className="text-primary font-bold text-2xl mt-0.5">
                {Number(listing.price).toLocaleString('fr-MA')} MAD
                {listing.listingType === 'RENT' && (
                  <span className="text-sm font-normal text-gray-400"> / mois</span>
                )}
              </p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                listing.surface   && { icon: '📐', label: 'Surface',   value: `${listing.surface} m²` },
                listing.rooms     && { icon: '🛏', label: 'Pièces',    value: listing.rooms },
                listing.bathrooms && { icon: '🚿', label: 'SDB',       value: listing.bathrooms },
                listing.floor != null && { icon: '🏢', label: 'Étage', value: listing.floor === 0 ? 'RDC' : `${listing.floor}ème` },
                listing.city      && { icon: '📍', label: 'Ville',     value: listing.city },
                { icon: '👁', label: 'Vues', value: listing.viewsCount ?? 0 },
              ].filter(Boolean).map(({ icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5 flex flex-col gap-0.5">
                  <p className="text-xs text-gray-400">{icon} {label}</p>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Features */}
            {listing.features && Object.keys(listing.features).length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Équipements</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(listing.features).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-xs bg-primary-mint border border-primary/30 text-primary-dark px-2.5 py-1 rounded-full font-medium"
                    >
                      ✓ {k}{v !== true ? `: ${v}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location + map */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Localisation</p>
              {listing.location && (
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{listing.location}{listing.city ? `, ${listing.city}` : ''}</span>
                </p>
              )}
              {(listing.latitude || listing.longitude || listing.location) && (
                <MiniMap
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  location={listing.location}
                //   city={listing.city}
                />
              )}
              {listing.latitude && listing.longitude && (
                
                <a href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-semibold hover:underline self-start"
                >
                  Ouvrir dans Google Maps →
                </a>
              )}
            </div>

            {/* Contact */}
            {listing.contactPhone && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</p>
                <div className="flex gap-2">
                  
                  <a href={`tel:${listing.contactPhone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition"
                  >
                    📞 Appeler
                  </a>
                  
                  <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Admin notes */}
            {listing.adminNotes && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-xs text-red-500 font-semibold mb-1">⛔ Note admin</p>
                <p className="text-sm text-red-700">{listing.adminNotes}</p>
              </div>
            )}

            {/* Admin moderation */}
            {isAdmin && listing.status === 'PENDING' && onModerate && (
              <div className="flex gap-2">
                <button
                  onClick={() => onModerate(listing.id, 'approve')}
                  className="flex-1 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm hover:bg-green-600 transition"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={() => onModerate(listing.id, 'reject')}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition"
                >
                  ✕ Rejeter
                </button>
              </div>
            )}

            {/* Meta info */}
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-1 text-xs text-gray-400">
              <span>Réf: <span className="font-mono">{listing.id?.slice(0, 8).toUpperCase()}</span></span>
              {listing.createdAt && (
                <span>Créée le {new Date(listing.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              )}
              {listing.publishedAt && (
                <span>Publiée le {new Date(listing.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              )}
              {listing._count?.inquiries !== undefined && (
                <span>💬 {listing._count.inquiries} message(s) reçu(s)</span>
              )}
            </div>

          </div>
        </div>

        {/* Footer — business actions */}
        {!isAdmin && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(listing.id)}
                className="flex-1 py-2.5 border-2 border-primary text-primary font-bold rounded-xl text-sm hover:bg-primary/5 transition"
              >
                ✏️ Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(listing.id)}
                className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition"
              >
                🗑 Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}