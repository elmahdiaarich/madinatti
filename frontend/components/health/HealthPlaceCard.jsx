"use client";

import Link from "next/link";
import { Clock, MapPin, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import { HEALTH_SUBCATEGORY_MAP } from "@/constants/healthCategories";

function formatDistance(meters) {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function openLabel(place) {
  if (place.openNow === true) return "Ouvert maintenant";
  if (place.openNow === false) return "Ferme";
  return "Horaires non disponibles";
}

function coverImage(place) {
  const images = Array.isArray(place.images) ? place.images : [];
  const cover = images.find((image) => image?.isCover) || images[0];
  return typeof cover === "string" ? cover : cover?.url;
}

export default function HealthPlaceCard({ place, selected, onSelect }) {
  const cfg = HEALTH_SUBCATEGORY_MAP[place.subcategory];
  const Icon = cfg?.icon;
  const phone = place.phones?.[0];
  const cover = coverImage(place);
  const distance = formatDistance(place.distanceMeters);
  const directionsUrl =
    place.googleMapsUri ||
    (place.latitude && place.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : null);

  return (
    <article
      className={`border bg-white p-4 shadow-sm transition ${
        selected ? "border-[#2D5016] ring-2 ring-[#A7D129]/30" : "border-black/10 hover:border-[#A7D129]"
      }`}
    >
      {cover && (
        <button type="button" onClick={() => onSelect?.(place)} className="mb-3 block h-36 w-full overflow-hidden bg-[#E8F5D0]">
          <img src={cover} alt="" className="h-full w-full object-cover transition hover:scale-[1.02]" />
        </button>
      )}

      <button type="button" onClick={() => onSelect?.(place)} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8F5D0] text-[#2D5016]">
            {Icon && <Icon size={19} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-bold text-gray-950">{place.name}</h2>
              {place.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5D0] px-2 py-0.5 text-[11px] font-semibold text-[#2D5016]">
                  <ShieldCheck size={12} /> Verifie MADINATI
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium text-gray-500">{cfg?.label || place.subcategory}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          {place.address && (
            <p className="flex gap-1.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
              <span>{place.address}{distance ? ` - ${distance}` : ""}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Clock size={15} className="text-gray-400" />
            <span className={place.openNow ? "text-[#027A48]" : "text-gray-600"}>{openLabel(place)}</span>
          </p>
          {place.rating != null && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {place.rating} ({place.userRatingCount || 0}) - Google
            </p>
          )}
        </div>
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        {phone && (
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-md bg-[#2D5016] px-3 py-2 text-xs font-semibold text-white">
            <Phone size={14} /> Appeler
          </a>
        )}
        <Link href={`/sante/${encodeURIComponent(place.id)}`} className="rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#2D5016]">
          Details
        </Link>
        {directionsUrl && (
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#2D5016]">
            <Navigation size={14} /> Itineraire
          </a>
        )}
      </div>
    </article>
  );
}
