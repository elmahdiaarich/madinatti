"use client";

import Link from "next/link";
import { CalendarDays, Heart, MapPin, Navigation, ShieldCheck, Ticket } from "lucide-react";
import { EVENT_CATEGORY_MAP, DEFAULT_EVENT_ICON } from "@/constants/eventCategories";

const EVENT_FALLBACK_IMAGES = {
  "theatre-spectacle": "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80",
  "concert-musique": "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80",
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80",
  "marche-souk": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=900&q=80",
  "salon-foire": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
  exposition: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
  "conference-seminaire": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=80",
  "formation-atelier": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  sport: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80",
  "famille-enfants": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80",
  autre: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Casablanca",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatPrice(event) {
  if (event.isFree) return "Gratuit";
  if (event.priceMin != null && event.priceMax != null) return `${event.priceMin} - ${event.priceMax} ${event.currency || "MAD"}`;
  if (event.priceMin != null) return `Des ${event.priceMin} ${event.currency || "MAD"}`;
  return "Payant";
}

function statusLabel(status) {
  if (status === "CANCELLED") return "Annule";
  if (status === "POSTPONED") return "Reporte";
  if (status === "FINISHED") return "Termine";
  return null;
}

export default function EventCard({ event, selected, onSelect, onFavorite }) {
  const cfg = EVENT_CATEGORY_MAP[event.categorySlug] || {};
  const Icon = cfg.icon || DEFAULT_EVENT_ICON;
  const image = event.mainImage || EVENT_FALLBACK_IMAGES[event.categorySlug] || EVENT_FALLBACK_IMAGES.autre;
  const start = event.nextOccurrence?.startsAt || event.startsAt;
  const status = statusLabel(event.status);
  const directionsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : null;

  return (
    <article
      onMouseEnter={() => onSelect?.(event)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${
        selected
          ? "border-[#2D5016] ring-2 ring-[#A7D129]/30"
          : "border-black/[0.06] hover:-translate-y-0.5 hover:border-[#2D5016] hover:shadow-md"
      }`}
    >
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={event.title || ""} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
          {event.categoryLabel || cfg.label || "Evenement"}
        </span>
        {event.isFree && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#A7D129] px-2.5 py-1 text-xs font-semibold text-[#17250D] shadow">
            Gratuit
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={() => onSelect?.(event)} className="w-full text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8F5D0] text-[#2D5016]">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="line-clamp-2 text-sm font-bold text-gray-950 transition-colors group-hover:text-[#2D5016]">{event.title}</h2>
                {event.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5D0] px-2 py-0.5 text-[11px] font-semibold text-[#2D5016]">
                    <ShieldCheck size={12} /> Verifie
                  </span>
                )}
                {status && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{status}</span>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">{event.categoryLabel || cfg.label || "Evenement"}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-gray-600">
            <p className="flex items-center gap-1.5">
              <CalendarDays size={15} className="text-gray-400" />
              {start ? dateFormatter.format(new Date(start)) : "Date a confirmer"}
            </p>
            <p className="flex gap-1.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
              <span>{event.eventMode === "ONLINE" ? "En ligne" : [event.venueName, event.city].filter(Boolean).join(", ")}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Ticket size={15} className="text-gray-400" />
              {formatPrice(event)}
            </p>
          </div>
        </button>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={`/evenements/${event.slug || event.id}`} className="rounded-md bg-[#2D5016] px-3 py-2 text-xs font-semibold text-white">
            Details
          </Link>
          {directionsUrl && (
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#2D5016]">
              <Navigation size={14} /> Itineraire
            </a>
          )}
          <button type="button" onClick={() => onFavorite?.(event)} className="inline-flex items-center gap-1.5 rounded-md border border-black/10 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#2D5016]">
            <Heart size={14} /> Favori
          </button>
        </div>
      </div>
    </article>
  );
}
