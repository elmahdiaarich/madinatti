// frontend/app/tourisme/[id]/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReportModal from "@/components/shared/ReportModal";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Star,
  Loader2,
  FileText,
  Flag,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Images,
  Globe,
} from "lucide-react";
import StarRating from "@/components/explore/StarRating";
import { useAuth } from "@/context/AuthContext";
import { tourismService } from "@/services/tourismService";
import {
  TOURISM_CATEGORIES,
  FIELD_LABELS,
  getListingField,
  formatListingField,
} from "@/constants/tourismCategories";
import TourismDetailMap from "@/components/explore/TourismDetailMap";
import CategoryImage from "@/components/explore/CategoryImage";

const FIELD_ICONS = {
  contactPhone: Phone,
  hours: Clock,
  rating: Star,
  location: MapPin,
};

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" {...props}>
    <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
  </svg>
);

const DRAWER_THRESHOLD = 6;

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-6">
      <div className="mb-4 h-4 w-20 rounded bg-black/[0.06]" />
      <div className="h-72 w-full rounded-xl bg-[var(--color-primary-mint)]/40 sm:h-96" />
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="h-5 w-24 rounded-full bg-black/[0.06]" />
          <div className="h-7 w-2/3 rounded bg-black/[0.08]" />
          <div className="h-4 w-1/3 rounded bg-black/[0.06]" />
          <div className="mt-6 space-y-4">
            <div className="h-16 rounded-lg bg-black/[0.04]" />
            <div className="h-16 rounded-lg bg-black/[0.04]" />
            <div className="h-16 rounded-lg bg-black/[0.04]" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-11 rounded-lg bg-black/[0.06]" />
          <div className="h-64 rounded-lg bg-black/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default function TourismDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      console.warn("TourismDetailPage: no `id` from useParams(), aborting fetch.");
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await tourismService.getById(id);
        const resolved = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
        if (!cancelled) setListing(resolved || null);
      } catch (err) {
        console.error("Failed to load tourism listing", err);
        if (!cancelled) setError("Ce lieu est introuvable ou a été supprimé.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Favorite toggle check
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const favRes = await tourismService.getFavorites(token);
        const favIds = (favRes.data ?? favRes ?? []).map((l) => l.id ?? l);
        if (!cancelled) setIsFavorited(favIds.includes(id));
      } catch (err) {
        console.error("Failed to load favorite status", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  const images = listing?.images?.length ? listing.images : [];

  const goToImage = useCallback(
    (delta) => {
      if (!images.length) return;
      setActiveImage((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") goToImage(1);
      if (e.key === "ArrowLeft") goToImage(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, goToImage]);

  const openLightboxAt = (i) => {
    setActiveImage(i);
    setDrawerOpen(false);
    setLightboxOpen(true);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.name, url });
      } catch {
        /* user cancelled */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleDownload = async () => {
    try {
      const { fileUrl } = await tourismService.trackDownload(id);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to track download", err);
      if (listing?.fileUrl) window.open(listing.fileUrl, "_blank");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (favLoading) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);
    try {
      const token = localStorage.getItem("token");
      await tourismService.toggleFavorite(id, token);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-black/60">{error || "Lieu introuvable."}</p>
        <Link
          href="/tourisme"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary-dark)] hover:underline"
        >
          <ArrowLeft size={14} /> Retour à l'explorateur
        </Link>
      </div>
    );
  }

  const cfg = TOURISM_CATEGORIES[listing.category] || {};
  const CategoryIcon = cfg.icon;
  const detailFields = cfg.detail || [];
  const hasCoords = listing.latitude != null && listing.longitude != null;

  // Social link helpers
// Social link helpers
const facebookUrl = listing.facebook;
const instagramUrl = listing.instagram;
const websiteUrl = listing.website;
const hasSocialLinks = facebookUrl || instagramUrl || websiteUrl;

  const isDocument = listing.categoryDisplayType === "DOCUMENT";
  const pdfUrl = getListingField(listing, "pdfUrl") || listing.fileUrl;
  const coverImage = images[0]?.url;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-black/60 transition hover:text-black"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        {isDocument ? (
          /* Document Layout: Cover on left, Info on Right */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white p-6 md:p-8 rounded-2xl border border-black/[0.06] shadow-xs">
            <div className="md:col-span-1 flex justify-center">
              <div className="relative w-full max-w-[260px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-black/10">
                <CategoryImage
                  src={coverImage}
                  alt={listing.name}
                  icon={CategoryIcon}
                  iconSize={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-mint)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                  {CategoryIcon && <CategoryIcon size={12} />}
                  {cfg.label || listing.category}
                </span>

                <h1 className="mt-3 text-3xl font-bold text-gray-900 leading-tight">{listing.name}</h1>
                
                {listing.city && (
                  <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                    <MapPin size={14} /> {listing.city} {listing.neighborhood ? `(${listing.neighborhood})` : ''}
                  </p>
                )}

                <p className="mt-4 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {listing.description || "Aucune description supplémentaire disponible pour ce document."}
                </p>
              </div>

              {/* Social links row */}
              {hasSocialLinks && (
                <div className="flex gap-2">
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                    >
                      <FacebookIcon />
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                    >
                      <InstagramIcon />
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!pdfUrl}
                  className="flex-1 max-w-xs flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-black transition hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileText size={16} /> Télécharger le PDF
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-3 rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50"
                  title="Partager"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Place Layout: Gallery, description, coordinates */
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-xs space-y-6">
            <div className="overflow-hidden rounded-xl bg-[var(--color-primary-mint)]">
              {images.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => openLightboxAt(activeImage)}
                    className="group relative block w-full"
                  >
                    <CategoryImage
                      src={images[activeImage]?.url}
                      alt={listing.name}
                      icon={CategoryIcon}
                      iconSize={40}
                      className="h-72 w-full object-cover transition duration-300 group-hover:brightness-95 sm:h-96"
                    />
                    {images.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                        {activeImage + 1} / {images.length}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2 bg-white/80 p-2 border-t">
                    <div className="flex flex-1 gap-2 overflow-x-auto">
                      {images.slice(0, DRAWER_THRESHOLD).map((img, i) => (
                        <button
                          key={img.url + i}
                          type="button"
                          onClick={() => setActiveImage(i)}
                          className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition ${
                            i === activeImage
                              ? "border-[var(--color-primary)]"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <CategoryImage
                            src={img.url}
                            icon={CategoryIcon}
                            iconSize={18}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    {images.length > DRAWER_THRESHOLD && (
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[var(--color-primary-mint)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-dark)] transition hover:border-[var(--color-primary)]"
                      >
                        <Images size={14} /> Voir les {images.length} photos
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-56 w-full items-center justify-center text-[var(--color-primary-dark)]/40">
                  {CategoryIcon && <CategoryIcon size={40} />}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-mint)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]">
                    {CategoryIcon && <CategoryIcon size={12} />}
                    {cfg.label || listing.category}
                  </span>
                  {listing.isFeatured && (
                    <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
                      Recommandé
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${
                    isFavorited
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-black/10 text-black/50 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  } ${favLoading ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
                </button>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-black">{listing.name}</h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black/60">
                {listing.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {listing.city}
                  </span>
                )}
                {listing.neighborhood && <span>{listing.neighborhood}</span>}
                {listing.rating != null && (
  <StarRating value={Number(listing.rating)} size={15} />
)}
              </div>

              {listing.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-black/70">
                  {listing.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {listing.contactPhone && (
                  <a
                    href={`tel:${listing.contactPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-black transition hover:brightness-95"
                  >
                    <Phone size={14} /> {listing.contactPhone}
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black/10 px-3.5 py-2 text-sm font-medium text-black/70 transition hover:border-black/20"
                >
                  <Share2 size={14} /> Partager
                </button>
                {/* Add Signaler Button: */}
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-red-200/60 bg-red-50/30 px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-200"
                >
                  <Flag size={14} /> Signaler
                </button>
              </div>

              {/* Social links row */}
              {hasSocialLinks && (
                <div className="mt-4 flex gap-2">
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black/10 text-black/60 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                    >
                      <FacebookIcon />
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black/10 text-black/60 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                    >
                      <InstagramIcon />
                    </a>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black/10 text-black/60 hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
                    >
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {detailFields.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 border-t pt-6 border-gray-100">
                {detailFields.map((key) => {
                  const raw = getListingField(listing, key);
                  const value = formatListingField(key, raw);
                  if (!value) return null;
                  const Icon = FIELD_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-black/[0.06] px-4 py-3"
                    >
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
            )}

            {hasCoords && (
              <div className="mt-6 border-t pt-6 border-gray-100">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">
                  Localisation
                </p>
                <TourismDetailMap
                  listing={listing}
                  className="h-72 w-full overflow-hidden rounded-lg border border-black/10 sm:h-96 lg:h-[420px]"
                />
              </div>
            )}
          </div>
        )}

        {/* Reviews section */}
        <div className="mt-8 border-t border-black/[0.06] pt-6 space-y-6 bg-white p-6 rounded-2xl border shadow-xs">
          <h3 className="text-lg font-bold text-gray-900">Avis de la communauté</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">Sophie Dumont</span>
                <span className="text-xs text-gray-400">Il y a 3 jours</span>
              </div>
              <StarRating value={5} size={12} showValue={false} />
              <p className="text-sm text-gray-600 leading-relaxed">
                Une très belle expérience ! Les informations sont claires et fiables. Je recommande.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">Amine El Fassi</span>
                <span className="text-xs text-gray-400">Il y a 2 semaines</span>
              </div>
              <StarRating value={4} size={12} showValue={false} />
              <p className="text-sm text-gray-600 leading-relaxed">
                Pratique et rapide à utiliser. Les guides touristiques facilitent grandement la visite.
              </p>
            </div>
          </div>

          <div className="border-t border-black/[0.06] pt-6">
            <p className="mb-3 text-sm font-semibold text-black">
              Laisser un avis
            </p>
            <StarRating value={0} size={20} showValue={false} />
            <textarea
              placeholder="Partagez votre expérience..."
              rows={3}
              disabled
              className="mt-3 w-full resize-none rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm text-black/60 placeholder:text-black/30"
            />
            <button
              type="button"
              disabled
              title="Bientôt disponible"
              className="mt-2 cursor-not-allowed rounded-lg bg-black/10 px-4 py-2 text-sm font-semibold text-black/40"
            >
              Envoyer (bientôt disponible)
            </button>
          </div>
        </div>
      </div>

      {/* Sticky mobile call bar */}
      {!isDocument && listing.contactPhone && (
        <div className="fixed inset-x-0 bottom-0 border-t border-black/10 bg-white/95 p-3 backdrop-blur sm:hidden">
          <a
            href={`tel:${listing.contactPhone}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-black"
          >
            <Phone size={16} /> Appeler {listing.contactPhone}
          </a>
        </div>
      )}

      {/* Photo drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-black">
              {images.length} photo{images.length > 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full p-2 text-black/60 hover:bg-black/[0.04] hover:text-black"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  type="button"
                  onClick={() => openLightboxAt(i)}
                  className="aspect-square overflow-hidden rounded-lg bg-[var(--color-primary-mint)]"
                >
                  <CategoryImage
                    src={img.url}
                    icon={CategoryIcon}
                    iconSize={24}
                    className="h-full w-full object-cover transition hover:brightness-95"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToImage(-1);
              }}
              className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Image précédente"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <CategoryImage
            src={images[activeImage]?.url}
            alt={listing.name}
            icon={CategoryIcon}
            iconSize={56}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-2xl rounded-lg object-contain"
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToImage(1);
              }}
              className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Image suivante"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {images.length > 1 && (
            <span className="absolute bottom-4 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {activeImage + 1} / {images.length}
            </span>
          )}
        </div>
      )}
            {showReport && (
        <ReportModal
          isOpen={showReport}
          targetType="TOURISM"
          targetId={id}
          targetTitle={listing.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}