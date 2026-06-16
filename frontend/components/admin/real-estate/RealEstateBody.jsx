"use client";
import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Rocket,
  Camera,
  Maximize2,
  Bed,
  Bath,
  Building,
  Eye,
  User,
  Tag,
  Calendar,
  Check,
  ExternalLink,
} from "lucide-react";
import { StatusBadge, StatusPanel } from "../StatusPanel";
import MapFrame from "@/components/shared/MapFrame";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-MA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

function MetaItem({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-gray-800 pl-5">{value}</span>
    </div>
  );
}

function MiniMap({ latitude, longitude, location }) {
  if (!latitude && !longitude) return null;
  return (
    <MapFrame latitude={latitude} longitude={longitude} location={location} />
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
    if (newStatus === "DELETED") {
      onStatusChanged?.(listing.id, "DELETED");
      return;
    }
    setListing((p) => ({ ...p, status: newStatus }));
    onStatusChanged?.(listing.id, newStatus);
  };

  const images = Array.isArray(listing.images) ? listing.images : [];
  const coverImage = images.find((img) => img?.isCover) || images[0];
  const otherImages = images.filter((img) => img !== coverImage);
  const allImages = coverImage ? [coverImage, ...otherImages] : images;

  const submittedByName = listing.submittedBy || listing.company || "";
  const submittedByEmail = listing.submittedByEmail || "";
  const inquiryCount = listing.inquiriesCount ?? listing._count?.inquiries ?? 0;
  const adminNotes = listing.adminNote || listing.adminNotes;

  const mapsUrl =
    listing.latitude && listing.longitude
      ? `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
      : listing.location
        ? `https://www.google.com/maps/search/${encodeURIComponent(listing.location)}`
        : null;

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto p-1">
      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-gray-50 rounded-xl border border-gray-200 p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={listing.status} />
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              listing.isActive !== false
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-300"
            }`}
          >
            {listing.isActive !== false ? "● Actif" : "○ Inactif"}
          </span>
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-800 font-semibold px-2.5 py-1 rounded-full border border-purple-200">
              <Star className="w-3.5 h-3.5 fill-purple-800" /> Vedette
            </span>
          )}
          {listing.isSponsored && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              <Rocket className="w-3.5 h-3.5" /> Sponsorisé
            </span>
          )}
        </div>
        <StatusPanel
          listingId={listing.id}
          currentStatus={listing.status}
          onStatusChange={handleStatusChange}
          onTransitionRequest={onTransitionRequest}
          deletedByOwner={listing.deletedByOwner ?? false}
        />
      </div>

      {/* ── Images ─────────────────────────────────────────────────────── */}
      {allImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <div
            className="w-full h-64 bg-gray-100 rounded-xl overflow-hidden relative cursor-pointer group"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={coverImage?.url || coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {allImages.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> {allImages.length} photos
              </span>
            )}
          </div>
          {otherImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {otherImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i + 1)}
                  className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 hover:border-[#2D5016] flex-shrink-0 transition-colors"
                >
                  <img
                    src={img?.url || img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-7 h-7" />
          </button>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + allImages.length) % allImages.length,
                );
              }}
            >
              <ChevronLeft className="w-9 h-9" />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIndex]?.url || allImages[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % allImages.length);
              }}
            >
              <ChevronRight className="w-9 h-9" />
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIndex + 1} / {allImages.length}
          </p>
        </div>
      )}

      {/* ── Title + Price ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {listing.propertyType && (
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
            {listing.propertyType}
            {listing.category?.name ? ` · ${listing.category.name}` : ""}
          </p>
        )}
        <h2 className="text-xl font-bold text-gray-800 leading-snug">
          {listing.title || "Sans titre"}
        </h2>
        {listing.price != null && (
          <p className="text-2xl font-bold text-[#2D5016]">
            {Number(listing.price).toLocaleString("fr-MA")} MAD
            {listing.contractType === "RENT" && (
              <span className="text-sm font-normal text-gray-400"> / mois</span>
            )}
          </p>
        )}
      </div>

      {/* ── Key stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          listing.surface && {
            icon: Maximize2,
            label: "Surface",
            value: `${listing.surface} m²`,
          },
          listing.rooms && { icon: Bed, label: "Pièces", value: listing.rooms },
          listing.bathrooms && {
            icon: Bath,
            label: "SDB",
            value: listing.bathrooms,
          },
          listing.floor != null && {
            icon: Building,
            label: "Étage",
            value: listing.floor === 0 ? "RDC" : `${listing.floor}ème`,
          },
          listing.city && {
            icon: MapPin,
            label: "Ville",
            value: listing.region
              ? `${listing.city} (${listing.region})`
              : listing.city,
          },
          { icon: Eye, label: "Vues", value: listing.viewsCount ?? 0 },
        ]
          .filter(Boolean)
          .map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl px-3 py-2.5 flex flex-col gap-1 border border-gray-100"
            >
              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 stroke-[1.8]" /> {label}
              </p>
              <p className="text-sm font-bold text-gray-800 pl-5">{value}</p>
            </div>
          ))}
      </div>

      {/* ── Meta / submitter ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <MetaItem
          icon={<User className="w-4 h-4 text-gray-400" />}
          label="Soumis par"
          value={submittedByName}
        />
        <MetaItem
          icon={<MapPin className="w-4 h-4 text-gray-400" />}
          label="Ville"
          value={listing.city}
        />
        <MetaItem
          icon={<Tag className="w-4 h-4 text-gray-400" />}
          label="Transaction"
          value={
            listing.contractType === "SALE"
              ? "Vente"
              : listing.contractType === "RENT"
                ? "Location"
                : listing.contractType
          }
        />
        <MetaItem
          icon={<Calendar className="w-4 h-4 text-gray-400" />}
          label="Soumis le"
          value={formatDate(listing.createdAt)}
        />
        {submittedByEmail && (
          <div className="flex items-center gap-2 text-sm sm:col-span-2 pt-2 border-t border-gray-200/60">
            <span className="text-gray-400">Email :</span>
            <a
              href={`mailto:${submittedByEmail}`}
              className="font-medium text-[#2D5016] hover:underline truncate"
            >
              {submittedByEmail}
            </a>
          </div>
        )}
        {inquiryCount > 0 && (
          <div className="flex items-center gap-2 text-sm sm:col-span-2">
            <span className="text-gray-400">Messages reçus :</span>
            <span className="font-medium text-gray-800">
              {inquiryCount} demandes
            </span>
          </div>
        )}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      {listing.description && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
            Description
          </p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
            {listing.description}
          </p>
        </div>
      )}

      {/* ── Features ────────────────────────────────────────────────────── */}
      {listing.features && Object.keys(listing.features).length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
            Équipements
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(listing.features).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 text-xs bg-[#E8F5D0] border border-[#A7D129]/40 text-[#2D5016] px-2.5 py-1 rounded-full font-medium"
              >
                <Check className="w-3 h-3 stroke-[3]" /> {k}
                {v !== true ? `: ${v}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin notes ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
          Notes administrateur{" "}
          <span className="normal-case font-normal">(privé)</span>
        </p>
        <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl px-4 py-3 text-sm text-amber-900">
          {adminNotes ? (
            <p className="whitespace-pre-line">{adminNotes}</p>
          ) : (
            <p className="text-gray-400 italic">Aucune note interne rédigée.</p>
          )}
        </div>
      </div>

      {/* ── Location + map ──────────────────────────────────────────────── */}
      {(listing.location || listing.latitude || listing.longitude) && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">
            Localisation
          </p>
          {listing.location && (
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              {listing.location}
              {listing.city ? `, ${listing.city}` : ""}
            </p>
          )}
          <MiniMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            location={listing.location}
          />
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-sm font-medium text-blue-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir sur Google Maps
            </a>
          )}
        </div>
      )}

      {/* ── Audit ───────────────────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] text-gray-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono">
        <div>
          ID système : <span className="text-gray-600">{listing.id}</span>
        </div>
        <div>
          Module :{" "}
          <span className="text-gray-600">
            {listing.module || "immobilier"}
          </span>
        </div>
        <div>
          Modifié le :{" "}
          <span className="text-gray-600">
            {formatDate(listing.updatedAt || listing.createdAt)}
          </span>
        </div>
        {listing.submittedById && (
          <div>
            ID soumetteur :{" "}
            <span className="text-gray-600">{listing.submittedById}</span>
          </div>
        )}
      </div>
    </div>
  );
}
