'use client';

import Link from 'next/link';
import { useState } from 'react';

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

      {/* Photo count badge */}
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

export default function RealEstateCard({ listing }) {
  const listingType  = LISTING_TYPE_LABELS[listing.listingType];
  const propertyType = PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType;
  const fmtPrice     = (v) => Number(v).toLocaleString('fr-MA');

  return (
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

          {listing.isFeatured && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
                ⭐ À la une
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xl font-extrabold text-orange-600">
              {fmtPrice(listing.price)} MAD
              {listing.listingType === 'RENT' && (
                <span className="text-sm font-medium text-gray-400">/mois</span>
              )}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
            {listing.title}
          </h2>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{listing.city || listing.location}</span>
          </div>

          {/* Specs */}
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
  );
}