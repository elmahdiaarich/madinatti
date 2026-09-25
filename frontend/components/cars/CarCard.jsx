'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { carsService } from '@/services/carsService';
import ShareMenu from '@/components/shared/ShareMenu';
import { Gauge, Fuel, Settings, Store } from 'lucide-react';

const LISTING_TYPE_LABELS = {
  SALE: { label: 'Vente', color: 'bg-[#123524] text-white shadow-sm' },
  RENT: { label: 'Location', color: 'bg-white/95 text-[#123524] border border-[#123524]/20 shadow-sm' },
};

const FUEL_LABELS = { PETROL: 'Essence', DIESEL: 'Diesel', ELECTRIC: 'Électrique', HYBRID: 'Hybride', LPG: 'GPL' };
const TRANS_LABELS = { MANUAL: 'Manuelle', AUTOMATIC: 'Automatique', SEMI_AUTOMATIC: 'Semi-auto' };
const COND_LABELS = { NEW: 'Neuf', USED: 'Occasion', DAMAGED: 'Accidenté' };

// ─── PhotoFrame ───────────────────────────────────────────────────────────────
function PhotoFrame({ images, title }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErr, setImgErr] = useState(false);

  const sortedImages =
    images && images.length > 0
      ? [...images].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
      : [];

  const hasMultiple = sortedImages.length > 1;
  const current = sortedImages[currentIndex];

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgErr(false);
    setCurrentIndex((i) => (i - 1 + sortedImages.length) % sortedImages.length);
  };
  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgErr(false);
    setCurrentIndex((i) => (i + 1) % sortedImages.length);
  };

  return (
    <div className="rounded-2xl overflow-hidden">
      <div className="relative w-full aspect-square bg-gray-100">
        {current && !imgErr ? (
          <img
            src={current.url}
            alt={title}
            className="w-full rounded-2xl h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#E8F5D0] text-[#A7D129]">
            <span className="text-5xl mb-2">🚗</span>
            <span className="text-sm font-medium text-[#7BA428]">Pas de photo</span>
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all duration-150 opacity-0 group-hover:opacity-100 z-10"
              aria-label="Photo précédente"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all duration-150 opacity-0 group-hover:opacity-100 z-10"
              aria-label="Photo suivante"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {currentIndex + 1}/{sortedImages.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── FavoriteButton ───────────────────────────────────────────────────────────
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
    if (loading) return;
    if (onToggle) {
      onToggle();
      return;
    }
    const prev = favorited;
    setFavorited(!prev);
    setLoading(true);
    try {
      await carsService.toggleFavorite(listingId, token);
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
        w-7 h-7 rounded-full flex items-center justify-center
        transition-all duration-200 hover:scale-110 active:scale-95
        ${favorited
          ? 'bg-[#2D5016] text-white hover:bg-[#1f3a10]'
          : 'bg-black/3 text-gray-700 hover:text-white hover:bg-[#2D5016]'
        }
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

// ─── ShareButton ──────────────────────────────────────────────────────────────
function ShareButton({ listing }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + window.scrollY + 6, right: window.innerWidth - rect.right });
    }
    setOpen((p) => !p);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleClick}
        title="Partager cette annonce"
        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 text-gray-400 hover:text-[#2D5016] hover:bg-[#E8F5D0] transition-all duration-200 hover:scale-110 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      {open &&
        typeof window !== 'undefined' &&
        createPortal(
          <div style={{ position: 'absolute', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}>
            <ShareMenu type="cars" id={listing.id} title={listing.title} onClose={() => setOpen(false)} />
          </div>,
          document.body
        )}
    </div>
  );
}

// ─── ShopBadge ────────────────────────────────────────────────────────────────
function ShopBadge({ shop }) {
  const subscription = shop?.subscriptions?.[0];
  const hasProfessionalPlan = shop?.status === 'ACTIVE' && ['ACTIVE', 'TRIAL'].includes(subscription?.status);
  if (!shop || !hasProfessionalPlan) return null;
  return (
    <div className="mb-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      <Store size={12} className="shrink-0" />
      <span className="truncate">{shop.name}</span>
      {shop.isVerified && <span className="shrink-0">✓</span>}
    </div>
  );
}

// ─── CarCard ──────────────────────────────────────────────────────────────────
export default function CarCard({ listing, initialFavorited = false, onFavoriteToggle, showShare = false }) {
  const listingType = LISTING_TYPE_LABELS[listing.listingType];
  const fmtPrice = (v) => Number(v).toLocaleString('fr-MA');

  return (
    <div className="relative mb-7 w-full">
      <Link href={`/cars/${listing.id}`} className="block group">
        <div className="transition-all duration-300">
          {/* Photo */}
          <div className="relative">
            <PhotoFrame images={listing.images} title={listing.title} />

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[calc(100%-6rem)]">
              {listingType && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap ${listingType.color}`}>
                  {listingType.label}
                </span>
              )}
              {listing.condition && (
                <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap bg-white/95 text-slate-700 shadow-sm ring-1 ring-black/5">
                  {COND_LABELS[listing.condition]}
                </span>
              )}
              {listing.isFeatured && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border border-[#A7D129] text-[#7BA428] bg-[#E8F5D0]">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pt-2.5 px-0.5">
            {/* Price + location */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-md font-bold text-[#2D5016]">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === 'RENT' && <span className="text-xs font-medium text-gray-500">/j</span>}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.city || listing.location}
              </span>
            </div>

            {/* Make / model / year */}
            <h2 className="font-bold text-gray-900 text-[14px] leading-snug line-clamp-1 mb-1">
              {listing.make} {listing.model} {listing.year}
            </h2>
            <p className="text-xs text-gray-400 line-clamp-1 mb-1">{listing.title}</p>
            <ShopBadge shop={listing.shop} />

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {listing.mileage != null && (
                <div className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  <span className="font-semibold text-gray-700">{listing.mileage.toLocaleString('fr-MA')} km</span>
                </div>
              )}
              {listing.fuelType && (
                <div className="flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  <span className="font-semibold text-gray-700">{FUEL_LABELS[listing.fuelType] ?? listing.fuelType}</span>
                </div>
              )}
              {listing.transmission && (
                <div className="flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="font-semibold text-gray-700">{TRANS_LABELS[listing.transmission] ?? listing.transmission}</span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                {showShare && <ShareButton listing={listing} />}
                <FavoriteButton listingId={listing.id} initialFavorited={initialFavorited} onToggle={onFavoriteToggle} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
