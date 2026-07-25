import Link from "next/link";
import { CalendarDays, Globe, Mail, MapPin, Navigation, Phone, Share2, Ticket } from "lucide-react";
import MapFrame from "@/components/shared/MapFrame";
import EventFavoriteButton from "@/components/events/EventFavoriteButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchEvent(id) {
  const response = await fetch(`${API_URL}/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload.data;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Casablanca",
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function eventStatusSchema(status) {
  if (status === "CANCELLED") return "https://schema.org/EventCancelled";
  if (status === "POSTPONED") return "https://schema.org/EventPostponed";
  if (status === "FINISHED") return "https://schema.org/EventCompleted";
  return "https://schema.org/EventScheduled";
}

function attendanceMode(mode) {
  if (mode === "ONLINE") return "https://schema.org/OnlineEventAttendanceMode";
  if (mode === "HYBRID") return "https://schema.org/MixedEventAttendanceMode";
  return "https://schema.org/OfflineEventAttendanceMode";
}

function priceLabel(event) {
  if (event.isFree) return "Gratuit";
  if (event.priceMin != null && event.priceMax != null) return `${event.priceMin} - ${event.priceMax} ${event.currency || "MAD"}`;
  if (event.priceMin != null) return `Des ${event.priceMin} ${event.currency || "MAD"}`;
  return "Payant";
}

export async function generateMetadata({ params }) {
  const event = await fetchEvent(params.id);
  if (!event) return { title: "Evenement introuvable | MADINATI" };
  return {
    title: `${event.title} | Evenements MADINATI`,
    description: event.shortDescription || event.description?.slice(0, 150),
    openGraph: {
      title: event.title,
      description: event.shortDescription || event.description?.slice(0, 150),
      images: event.mainImage ? [event.mainImage] : [],
      type: "website",
    },
  };
}

export default async function EventDetailPage({ params }) {
  const event = await fetchEvent(params.id);
  if (!event) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900">Evenement introuvable</h1>
        <Link href="/evenements" className="mt-4 inline-flex text-sm font-semibold text-[#2D5016]">Retour aux evenements</Link>
      </main>
    );
  }

  const directionsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : null;
  const statusWarning = event.status === "CANCELLED" ? "Cet evenement est annule." : event.status === "POSTPONED" ? "Cet evenement est reporte." : "";
  const images = [...new Set([event.mainImage, ...(event.gallery || []).map((item) => item.url || item)].filter(Boolean))];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: eventStatusSchema(event.status),
    eventAttendanceMode: attendanceMode(event.eventMode),
    image: images,
    description: event.description,
    location: event.eventMode === "ONLINE"
      ? { "@type": "VirtualLocation", url: event.onlineUrl }
      : {
          "@type": "Place",
          name: event.venueName || event.address || event.city,
          address: [event.address, event.city, event.region].filter(Boolean).join(", "),
        },
    organizer: { "@type": "Organization", name: event.organizerName, url: event.websiteUrl || undefined },
    offers: {
      "@type": "Offer",
      price: event.isFree ? 0 : event.priceMin || 0,
      priceCurrency: event.currency || "MAD",
      url: event.ticketUrl || event.websiteUrl || undefined,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            {images[0] ? (
              <img src={images[0]} alt="" className="h-[360px] w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-[280px] w-full items-center justify-center rounded-xl bg-[#E8F5D0] text-[#2D5016]">
                <CalendarDays size={54} />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#2D5016]">{event.categoryLabel}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{event.title}</h1>
            {event.titleAr && <p dir="rtl" className="mt-2 text-xl font-semibold text-gray-700">{event.titleAr}</p>}
            {statusWarning && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{statusWarning}</div>}
            <p className="mt-4 text-gray-600">{event.shortDescription || event.description}</p>
            <div className="mt-5 grid gap-3 text-sm text-gray-700">
              <p className="flex items-center gap-2"><CalendarDays size={17} /> {dateFormatter.format(new Date(event.startsAt))} - {dateFormatter.format(new Date(event.endsAt))}</p>
              <p className="flex items-center gap-2"><MapPin size={17} /> {event.eventMode === "ONLINE" ? "En ligne" : [event.venueName, event.address, event.city].filter(Boolean).join(", ")}</p>
              <p className="flex items-center gap-2"><Ticket size={17} /> {priceLabel(event)}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {event.ticketUrl && <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#A7D129] px-4 py-2 text-sm font-bold text-[#17250D]">Billetterie</a>}
              {directionsUrl && <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"><Navigation size={16} /> Itineraire</a>}
              <EventFavoriteButton eventId={event.id} />
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_FRONTEND_URL || ""}/evenements/${event.slug || event.id}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"><Share2 size={16} /> Partager</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">{event.description}</p>
          </section>
          {images.length > 1 && (
            <section className="bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900">Galerie</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {images.slice(1).map((image) => <img key={image} src={image} alt="" className="aspect-video w-full rounded-lg object-cover" />)}
              </div>
            </section>
          )}
          {event.latitude && event.longitude && <MapFrame latitude={event.latitude} longitude={event.longitude} location={event.address || event.venueName} city={event.city} />}
        </div>
        <aside className="grid content-start gap-4">
          <section className="bg-white p-5">
            <h2 className="font-bold text-gray-900">Organisateur</h2>
            <p className="mt-2 text-sm font-semibold text-gray-700">{event.organizerName}</p>
            <div className="mt-4 grid gap-2 text-sm">
              {event.organizerPhone && <a href={`tel:${event.organizerPhone}`} className="inline-flex items-center gap-2 text-gray-700"><Phone size={15} /> {event.organizerPhone}</a>}
              {event.organizerEmail && <a href={`mailto:${event.organizerEmail}`} className="inline-flex items-center gap-2 text-gray-700"><Mail size={15} /> {event.organizerEmail}</a>}
              {event.websiteUrl && <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-700"><Globe size={15} /> Site web</a>}
            </div>
          </section>
          {event.occurrences?.length > 0 && (
            <section className="bg-white p-5">
              <h2 className="font-bold text-gray-900">Prochaines occurrences</h2>
              <div className="mt-3 grid gap-2">
                {event.occurrences.map((occurrence) => (
                  <p key={occurrence.startsAt} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {dateFormatter.format(new Date(occurrence.startsAt))}
                  </p>
                ))}
              </div>
            </section>
          )}
          <section className="bg-white p-5 text-xs leading-6 text-gray-500">
            Les horaires sont affiches avec le fuseau Africa/Casablanca. Verifiez toujours les informations aupres de l&apos;organisateur avant de vous deplacer.
          </section>
        </aside>
      </section>
    </main>
  );
}
