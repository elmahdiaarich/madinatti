"use client";
import { useState } from "react";
import {
  X, ChevronLeft, ChevronRight, MapPin, Star, Rocket,
  Maximize2, Bed, Bath, Building, Eye, User, Tag,
  Calendar, Check, ExternalLink, Hash, Mail, Phone,
  MessageSquare, DollarSign, Camera,
} from "lucide-react";
import { StatusBadge, StatusPanel } from "../StatusPanel";
import MapFrame from "@/components/shared/MapFrame";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : null;

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 w-32 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      {href ? (
        <a href={href} className="text-sm font-medium text-[#2D5016] hover:underline truncate flex-1">
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold text-gray-800 flex-1">{value}</span>
      )}
    </div>
  );
}

function StatBadge({ icon: Icon, value, label }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-bold text-gray-800">{value}</span>
        <span className="text-[10px] text-gray-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}

export default function RealEstateBody({
  listing: initialListing,
  onTransitionRequest,
  onStatusChanged,
}) {
  const [listing, setListing] = useState(initialListing);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handleStatusChange = (newStatus) => {
    if (newStatus === "DELETED") { onStatusChanged?.(listing.id, "DELETED"); return; }
    setListing((p) => ({ ...p, status: newStatus }));
    onStatusChanged?.(listing.id, newStatus);
  };

  const images = Array.isArray(listing.images) ? listing.images : [];
  const coverImage = images.find((img) => img?.isCover) || images[0];
  const otherImages = images.filter((img) => img !== coverImage);
  const allImages = coverImage ? [coverImage, ...otherImages] : images;

  const adminNotes = listing.adminNote || listing.adminNotes;
  const inquiryCount = listing.inquiriesCount ?? listing._count?.inquiries ?? 0;

  const mapsUrl = listing.latitude && listing.longitude
    ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
    : listing.location
      ? `https://www.google.com/maps/search/${encodeURIComponent(listing.location)}`
      : null;

  const listingTypeLabel =
    listing.contractType === "SALE" ? "Vente"
    : listing.contractType === "RENT" ? "Location"
    : listing.contractType;

  return (
    <div className="flex flex-col gap-5">

      {/* ── 1. Statut + badges ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={listing.status} />
        {listing.isFeatured && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
            <Star className="w-3 h-3 fill-purple-700" /> Vedette
          </span>
        )}
        {listing.isSponsored && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
            <Rocket className="w-3 h-3" /> Sponsorisé
          </span>
        )}
        {listingTypeLabel && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#E8F5D0] text-[#2D5016] border border-[#A7D129]/30 px-2.5 py-1 rounded-full">
            {listingTypeLabel}
          </span>
        )}
      </div>

      {/* ── 2. Prix + stats rapides ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {listing.price != null && (
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium">
              {listing.propertyType}{listing.category?.name ? ` · ${listing.category.name}` : ""}
            </p>
            <p className="text-2xl font-bold text-[#2D5016] mt-0.5">
              {Number(listing.price).toLocaleString("fr-MA")} MAD
              {listing.contractType === "RENT" && (
                <span className="text-sm font-normal text-gray-400"> /mois</span>
              )}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <StatBadge icon={Maximize2}    value={listing.surface ? `${listing.surface} m²` : null} label="Surface" />
          <StatBadge icon={Bed}          value={listing.rooms}      label="Pièces" />
          <StatBadge icon={Bath}         value={listing.bathrooms}  label="SDB" />
          <StatBadge icon={Building}     value={listing.floor != null ? (listing.floor === 0 ? "RDC" : `${listing.floor}e`) : null} label="Étage" />
          <StatBadge icon={Eye}          value={listing.viewsCount ?? 0} label="Vues" />
          {inquiryCount > 0 && <StatBadge icon={MessageSquare} value={inquiryCount} label="Messages" />}
        </div>
      </div>

      {/* ── 3. Images — compact strip ───────────────────────────────────── */}
      {allImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <div
            className="relative w-full h-44 rounded-xl overflow-hidden cursor-pointer bg-gray-100 group shrink-0"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={coverImage?.url || coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {allImages.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                <Camera className="w-3 h-3" /> {allImages.length}
              </span>
            )}
          </div>

          {otherImages.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {otherImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i + 1)}
                  className="w-12 h-12 rounded-lg overflow-hidden border-2 border-transparent hover:border-[#2D5016] flex-shrink-0 transition-colors bg-gray-100"
                >
                  <img src={img?.url || img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Infos clés ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Informations</p>
        </div>
        <div className="px-4 py-0.5">
          <InfoRow icon={User}     label="Soumis par"   value={listing.submittedBy || listing.company} />
          <InfoRow icon={Mail}     label="Email"        value={listing.submittedByEmail} href={`mailto:${listing.submittedByEmail}`} />
          {listing.contactPhone && (
            <InfoRow icon={Phone}  label="Téléphone"   value={listing.contactPhone} href={`tel:${listing.contactPhone}`} />
          )}
          <InfoRow icon={Tag}      label="Transaction"  value={listingTypeLabel} />
          <InfoRow icon={MapPin}   label="Localisation" value={listing.city ? `${listing.city}${listing.region ? `, ${listing.region}` : ""}` : listing.location} />
          <InfoRow icon={Hash}     label="Catégorie"    value={listing.category?.name} />
          <InfoRow icon={Calendar} label="Soumis le"    value={formatDate(listing.createdAt)} />
          <InfoRow icon={Calendar} label="Publié le"    value={formatDate(listing.publishedAt)} />
          <InfoRow icon={Hash}     label="Réf."         value={listing.id?.slice(0, 8).toUpperCase()} />
        </div>
      </div>

      {/* ── 5. Description ──────────────────────────────────────────────── */}
      {listing.description && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Description</p>
          </div>
          <p className="px-4 py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      )}

      {/* ── 6. Équipements ──────────────────────────────────────────────── */}
      {listing.features && Object.keys(listing.features).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Équipements</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(listing.features).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium">
                <Check className="w-3 h-3 stroke-[3]" /> {k}{v !== true ? `: ${v}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Carte ────────────────────────────────────────────────────── */}
      {(listing.latitude || listing.longitude || listing.location) && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Localisation</p>
          </div>
          <div className="p-0">
            <MapFrame latitude={listing.latitude} longitude={listing.longitude} location={listing.location} />
          </div>
          {mapsUrl && (
            <div className="px-4 py-2 border-t border-gray-50">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 hover:underline">
                <ExternalLink className="w-3 h-3" /> Voir sur Google Maps
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── 8. Actions — en bas à droite ────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Actions</p>
          <StatusPanel
            listingId={listing.id}
            module={listing.module}
            currentStatus={listing.status}
            onStatusChange={handleStatusChange}
            onTransitionRequest={onTransitionRequest}
            deletedByOwner={listing.deletedByOwner ?? false}
          />
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightboxIndex(null)}>
            <X className="w-7 h-7" />
          </button>
          {allImages.length > 1 && (
            <>
              <button className="absolute left-4 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length); }}>
                <ChevronLeft className="w-9 h-9" />
              </button>
              <button className="absolute right-4 text-white/70 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % allImages.length); }}>
                <ChevronRight className="w-9 h-9" />
              </button>
            </>
          )}
          <img
            src={allImages[lightboxIndex]?.url || allImages[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/50 text-sm">{lightboxIndex + 1} / {allImages.length}</p>
        </div>
      )}
    </div>
  );
}