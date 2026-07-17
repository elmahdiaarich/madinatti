"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Globe, Loader2, MapPin, Navigation, Phone, ShieldCheck, Star } from "lucide-react";
import GoogleHealthMap from "@/components/health/GoogleHealthMap";
import { HEALTH_SUBCATEGORY_MAP } from "@/constants/healthCategories";
import { healthService } from "@/services/healthService";

function hoursRows(place) {
  return place.currentHours?.weekdayDescriptions || place.regularHours?.weekdayDescriptions || [];
}

export default function HealthDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      healthService
        .getPlace(id)
        .then((response) => {
          if (!cancelled) setPlace(response.data);
        })
        .catch(() => {
          if (!cancelled) setError("Etablissement introuvable ou indisponible.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">{error || "Etablissement introuvable."}</p>
        <Link href="/sante" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2D5016]">
          <ArrowLeft size={15} /> Retour Sante
        </Link>
      </div>
    );
  }

  const cfg = HEALTH_SUBCATEGORY_MAP[place.subcategory];
  const Icon = cfg?.icon;
  const phone = place.phones?.[0];
  const directionsUrl =
    place.googleMapsUri ||
    (place.latitude && place.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      : null);
  const rows = hoursRows(place);

  return (
    <main className="min-h-screen bg-[#F7F9F5] px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-600">
          <ArrowLeft size={15} /> Retour
        </button>

        <section className="grid gap-5 bg-white p-5 shadow-sm lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5D0] px-3 py-1 text-xs font-semibold text-[#2D5016]">
                {Icon && <Icon size={13} />} {cfg?.label || place.subcategory}
              </span>
              {place.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5D0] px-3 py-1 text-xs font-semibold text-[#2D5016]">
                  <ShieldCheck size={13} /> Verifie MADINATI
                </span>
              )}
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{place.source}</span>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-gray-950">{place.name}</h1>
            {place.address && (
              <p className="mt-2 flex gap-2 text-sm text-gray-600">
                <MapPin size={16} className="mt-0.5 shrink-0" /> {place.address}
              </p>
            )}
            {place.description && <p className="mt-4 text-sm leading-6 text-gray-700">{place.description}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-md bg-[#2D5016] px-4 py-2 text-sm font-semibold text-white">
                  <Phone size={16} /> Appeler
                </a>
              )}
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-gray-800">
                  <Navigation size={16} /> Itineraire
                </a>
              )}
              {place.website && (
                <a href={place.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-gray-800">
                  <Globe size={16} /> Site web
                </a>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="border border-black/10 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">Statut</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <Clock size={15} /> {place.openNow === true ? "Ouvert" : place.openNow === false ? "Ferme" : "Non disponible"}
                </p>
              </div>
              {place.rating != null && (
                <div className="border border-black/10 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">Note Google</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <Star size={15} className="fill-amber-400 text-amber-400" /> {place.rating} ({place.userRatingCount || 0})
                  </p>
                </div>
              )}
              <div className="border border-black/10 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">Actualisation</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {place.lastGoogleRefreshAt ? new Date(place.lastGoogleRefreshAt).toLocaleDateString("fr-FR") : "Locale"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-base font-bold text-gray-950">Horaires</h2>
              {rows.length ? (
                <div className="mt-3 divide-y divide-black/10 border border-black/10">
                  {rows.map((row) => (
                    <p key={row} className="px-4 py-2 text-sm text-gray-700">{row}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-2 border border-black/10 p-4 text-sm text-gray-500">Horaires non disponibles.</p>
              )}
            </div>
          </div>

          <div className="min-h-[360px]">
            {place.latitude && place.longitude ? (
              <GoogleHealthMap places={[place]} selectedId={place.id} center={{ lat: Number(place.latitude), lng: Number(place.longitude) }} />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center border border-black/10 text-sm text-gray-500">
                Carte indisponible.
              </div>
            )}
          </div>
        </section>

        <p className="mt-4 text-xs text-gray-500">
          Les donnees Google sont affichees avec attribution Google quand elles sont disponibles. Les horaires et informations peuvent changer. En cas d&apos;urgence medicale, contactez les services d&apos;urgence competents.
        </p>
      </div>
    </main>
  );
}
