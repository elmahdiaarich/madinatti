// frontend/components/explore/PlaceCard.jsx
"use client";

import Link from "next/link";
import { MapPin, Phone, Download, Play } from "lucide-react";
import { tourismService } from "@/services/tourismService";
import CategoryImage from "@/components/explore/CategoryImage";
import StarRating from "@/components/explore/StarRating";

export default function PlaceCard({
  item,
  categoryConfig,
  basePath = "/tourisme",
}) {
  if (!item || !categoryConfig) return null;

  const cover =
    item.images?.find((img) => img.isCover)?.url || item.images?.[0]?.url;
  const location = [item.neighborhood, item.city].filter(Boolean).join(" - ");

  // Document variant (Magazine / Carte touristique): cover + title + rating +
  // download count, whole card clickable to detail page, dedicated download
  // button tracked via trackDownload before opening the file.
  if (item.categoryDisplayType === "DOCUMENT") {
    const handleDownload = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const { fileUrl } = await tourismService.trackDownload(item.id);
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to track download", err);
        if (item.fileUrl) window.open(item.fileUrl, "_blank"); // fail open
      }
    };

    const downloadCount = item.downloadsCount;

    return (
      <Link
        href={`${basePath}/${item.id}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md"
      >
        <div className="relative h-44 w-full bg-[var(--color-primary-mint)]">
          <CategoryImage
            src={cover}
            alt={item.name}
            icon={categoryConfig.icon}
            iconSize={28}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
         {item.videoUrl && (
           <span className="absolute top-2.5 left-2.5 rounded-full bg-red-600/90 p-1 text-white shadow-sm hover:scale-110 transition-transform" title="Contient une vidéo">
             <Play size={10} fill="white" />
           </span>
         )}
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
            {categoryConfig.label}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="font-semibold leading-snug text-black line-clamp-1">
            {item.name}
          </p>

          {item.publishedAt && (
            <p className="text-xs text-black/50">
              {new Date(item.publishedAt).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
{item.rating != null && (
  <StarRating value={item.rating} size={13} />
)}
            <span className="flex items-center gap-1 text-xs text-black/50">
              <Download size={12} className="shrink-0" />
              {downloadCount.toLocaleString("fr-FR")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!item.fileUrl}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} /> Télécharger
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`${basePath}/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md"
    >
<div className="relative h-44 w-full bg-[var(--color-primary-mint)]">      <CategoryImage
          src={cover}
          alt={item.name}
          icon={categoryConfig.icon}
          iconSize={32}
          className="h-full w-full object-cover"
        />
        {item.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold text-white">
            Recommandé
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
          {categoryConfig.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-semibold leading-snug text-black line-clamp-1">
          {item.name}
        </p>

        {location && (
          <p className="flex items-center gap-1.5 text-sm text-black/55">
            <MapPin size={14} className="shrink-0" />
            {location}
          </p>
        )}

        {item.contactPhone && (
          <p className="flex items-center gap-1.5 text-sm text-black/55">
            <Phone size={14} className="shrink-0" />
            {item.contactPhone}
          </p>
        )}

<div className="mt-auto flex items-center justify-between gap-2 pt-1">
  {item.rating != null ? (
    <StarRating value={item.rating} size={13} />
  ) : (
    <span className="text-xs text-black/40">Nouveau</span>
  )}

  {item.prix != null && (
  <span className="text-sm font-semibold text-black">
    {Number(item.prix) === 0 ? "Gratuit" : `${item.prix} DH`}
  </span>
)}
</div>
</div>
    </Link>
  );
}
