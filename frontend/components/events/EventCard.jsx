"use client";

import Link from "next/link";
import { CalendarDays, Heart, MapPin, Navigation, ShieldCheck, Ticket } from "lucide-react";
import { EVENT_CATEGORY_MAP, DEFAULT_EVENT_ICON } from "@/constants/eventCategories";

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
  const start = event.nextOccurrence?.startsAt || event.startsAt;
  const status = statusLabel(event.status);
  const directionsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : null;

  return (
    <article className={`overflow-hidden border bg-white shadow-sm transition ${selected ? "border-[#2D5016] ring-2 ring-[#A7D129]/30" : "border-black/10 hover:border-[#A7D129]"}`}>
      {event.mainImage ? (
        <img src={event.mainImage} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-[#E8F5D0] text-[#2D5016]">
          <Icon size={34} />
        </div>
      )}

      <div className="p-4">
        <button type="button" onClick={() => onSelect?.(event)} className="w-full text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8F5D0] text-[#2D5016]">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="line-clamp-2 text-sm font-bold text-gray-950">{event.title}</h2>
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

        <div className="mt-4 flex flex-wrap gap-2">
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
