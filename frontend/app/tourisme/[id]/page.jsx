// frontend/app/explore/tourism/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Clock, Star, Loader2, FileText } from "lucide-react";
import { tourismService } from "@/services/tourismService";
import {
  TOURISM_CATEGORIES,
  FIELD_LABELS,
  getListingField,
  formatListingField,
} from "@/constants/tourismCategories";
import TourismMap from "@/components/explore/TourismMap";

const FIELD_ICONS = {
  contactPhone: Phone,
  hours: Clock,
  rating: Star,
  location: MapPin,
};

export default function TourismDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await tourismService.getById(id);
        setListing(data);
      } catch (err) {
        console.error("Failed to load tourism listing", err);
        setError("Ce lieu est introuvable ou a été supprimé.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-black/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-black/60">{error || "Lieu introuvable."}</p>
        <Link
          href="/explore/tourism"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary-dark)] hover:underline"
        >
          <ArrowLeft size={14} /> Retour à l'explorateur
        </Link>
      </div>
    );
  }

  const cfg = TOURISM_CATEGORIES[listing.category] || {};
  const images = listing.images?.length ? listing.images : [];
  const detailFields = cfg.detail || [];
  const pdfUrl = getListingField(listing, "pdfUrl");

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-black/60 hover:text-black"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Gallery */}
        <div className="overflow-hidden rounded-xl bg-[var(--color-primary-mint)]">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImage]?.url}
                alt={listing.name}
                className="h-72 w-full object-cover sm:h-96"
              />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto bg-white/80 p-2">
                  {images.map((img, i) => (
                    <button
                      key={img.url + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === activeImage ? "border-[var(--color-primary)]" : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-56 w-full items-center justify-center text-[var(--color-primary-dark)]/40">
              {cfg.icon && <cfg.icon size={40} />}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--color-primary-mint)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                {cfg.label || listing.category}
              </span>
              {listing.isFeatured && (
                <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-black">{listing.name}</h1>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/60">
              {listing.city && (
                <span className="flex items-center gap-1"><MapPin size={14} /> {listing.city}</span>
              )}
              {listing.neighborhood && <span>{listing.neighborhood}</span>}
              {listing.rating != null && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
                  {Number(listing.rating).toFixed(1)}
                </span>
              )}
            </div>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-[var(--color-primary-mint)] px-4 py-2 text-sm font-medium text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
              >
                <FileText size={16} /> Consulter le magazine (PDF)
              </a>
            )}

            <div className="mt-5 space-y-4">
              {detailFields.map((key) => {
                const raw = getListingField(listing, key);
                const value = formatListingField(key, raw);
                if (!value) return null;
                const Icon = FIELD_ICONS[key];
                return (
                  <div key={key}>
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-black/40">
                      {Icon && <Icon size={12} />}
                      {FIELD_LABELS[key] || key}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/80">
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact / location side panel */}
          <div className="space-y-4">
            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-black hover:brightness-95"
              >
                <Phone size={16} /> {listing.contactPhone}
              </a>
            )}

            {listing.latitude != null && listing.longitude != null && (
              <div className="h-48 overflow-hidden rounded-lg border border-black/10">
                <TourismMap listings={[listing]} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}