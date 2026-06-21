'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { realEstateService } from '@/services/realEstateService';
import ReportModal from '@/components/shared/ReportModal';
import ShareMenu from '@/components/shared/ShareMenu';

const LISTING_TYPE_LABELS = {
  SALE: { label: 'Vente',    color: 'bg-orange-500 text-white' },
  RENT: { label: 'Location', color: 'bg-blue-500 text-white'   },
};

const PROPERTY_TYPE_LABELS = {
  APARTMENT: 'Appartement',
  VILLA:     'Villa',
  HOUSE:     'Maison',
  STUDIO:    'Studio',
  LAND:      'Terrain',
  OFFICE:    'Bureau',
  SHOP:      'Commerce',
};

function PhotoFrame({ images, title }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = images?.find((i) => i.isCover) ?? images?.[0];

  return (
    <div className="relative w-full h-[220px] bg-gray-100 overflow-hidden rounded-t-2xl">
      {cover && !imgErr ? (
        <img
          src={cover.url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 text-orange-300">
          <svg className="w-14 h-14 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium text-orange-300">Pas de photo</span>
        </div>
      )}

      {images?.length > 1 && (
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {images.length}
        </div>
      )}
    </div>
  );
}

// ─── Bouton cœur ──────────────────────────────────────────────────────────────
function FavoriteButton({ listingId, initialFavorited = false, onToggle }) {
  const { user, token } = useAuth();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  if (!user) return null;

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const el = document.getElementById('inscription-realstate');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (loading) return;

    if (onToggle) {
      onToggle();
      return;
    }

    const prev = favorited;
    setFavorited(!prev);
    setLoading(true);
    try {
      await realEstateService.toggleFavorite(listingId, token);
    } catch {
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`
        w-8 h-8 rounded-full flex items-center justify-center
        transition-all duration-200 hover:scale-110 active:scale-95
        ${favorited
          ? 'bg-orange-50 text-orange-400 hover:bg-orange-100'
          : 'bg-white/80 text-gray-300 hover:text-orange-400 hover:bg-orange-50'
        }
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton({ listing }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((p) => !p);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleClick}
        title="Partager cette annonce"
        className="w-8 h-8 rounded-full flex items-center justify-center
          bg-white/80 text-gray-400 hover:text-orange-500 hover:bg-orange-50
          transition-all duration-200 hover:scale-110 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          style={{ position: 'absolute', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
        >
          <ShareMenu
            type="real-estate"
            id={listing.id}
            title={listing.title}
            onClose={() => setOpen(false)}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── RealEstateCard ───────────────────────────────────────────────────────────
export default function RealEstateCard({ listing, initialFavorited = false, onFavoriteToggle, showShare = false }) {
  const [reportOpen, setReportOpen] = useState(false);

  const listingType  = LISTING_TYPE_LABELS[listing.listingType];
  const propertyType = PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType;
  const fmtPrice     = (v) => Number(v).toLocaleString('fr-MA');

  return (
    <>
      <div className="relative">
        <Link href={`/real-estate/${listing.id}`} className="block group">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-orange-200 transition-all duration-300">

            {/* Photo */}
            <div className="relative">
              <PhotoFrame images={listing.images} title={listing.title} />

              {/* Badges overlay */}
              <div className="absolute top-3 left-3 flex gap-2">
                {listingType && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${listingType.color}`}>
                    {listingType.label}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-700">
                  {propertyType}
                </span>
              </div>

              {/* Top-right action buttons */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                {showShare && <ShareButton listing={listing} />}
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={initialFavorited}
                  onToggle={onFavoriteToggle}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-extrabold text-orange-600">
                  {fmtPrice(listing.price)} MAD
                  {listing.listingType === 'RENT' && (
                    <span className="text-sm font-medium text-gray-400">/mois</span>
                  )}
                </span>
              </div>

              <h2 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                {listing.title}
              </h2>

              <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{listing.city || listing.location}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-50 pt-3">
                {listing.surface && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span className="font-semibold text-gray-700">{listing.surface} m²</span>
                  </div>
                )}
                {listing.rooms && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-semibold text-gray-700">{listing.rooms} pièces</span>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <span className="font-semibold text-gray-700">{listing.bathrooms} sdb</span>
                  </div>
                )}
                <div className="ml-auto text-[10px] text-gray-300">
                  {listing.createdAt
                    ? new Date(listing.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Bouton Signaler */}
        <div className="flex justify-end mt-1 pr-1">
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Signaler cette annonce"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Signaler
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="REAL_ESTATE"
        targetId={listing.id}
        targetTitle={listing.title}
      />
    </>
  );
}