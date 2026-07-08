// frontend/components/explore/PlaceCard.jsx
"use client";

import Link from "next/link";
import { MapPin, Phone, Clock, Star, FileText } from "lucide-react";
import { getListingField, formatListingField } from "@/constants/tourismCategories";

const FIELD_ICONS = {
  city: MapPin,
  neighborhood: MapPin,
  contactPhone: Phone,
  hours: Clock,
  rating: Star,
};

function CardField({ listing, field }) {
  const value = formatListingField(field, getListingField(listing, field));
  if (!value) return null;
  const Icon = FIELD_ICONS[field];
  return (
    <p className="flex items-center gap-1 text-sm text-black/60">
      {Icon && <Icon size={14} className="shrink-0" />}
      {value}
    </p>
  );
}

export default function PlaceCard({ item, categoryConfig, basePath = "/tourisme" }) {
  if (!item || !categoryConfig) return null;

  const cover = item.images?.find((img) => img.isCover)?.url || item.images?.[0]?.url;

  // Magazine / PDF variant: opens the PDF directly instead of the detail page.
  if (categoryConfig.cardVariant === "pdf") {
    const pdfUrl = getListingField(item, "pdfUrl");
    return (
      <a
        href={pdfUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 rounded-lg border-2 border-[var(--color-primary-mint)] bg-white p-4 transition hover:border-[var(--color-primary)]"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)]">
          <FileText size={22} />
        </div>
        <div>
          <p className="font-semibold text-black">{item.name}</p>
          <p className="text-sm text-black/60">Consulter le magazine</p>
        </div>
      </a>
    );
  }

  // Carte touristique variant: links straight to the interactive city map.
  if (categoryConfig.cardVariant === "map") {
    return (
      <Link
        href={`${basePath}/${item.id}`}
        className="flex items-center gap-4 rounded-lg border-2 border-[var(--color-primary-mint)] bg-white p-4 transition hover:border-[var(--color-primary)]"
      >
        <MapPin className="text-[var(--color-primary-dark)]" size={28} />
        <p className="font-semibold text-black">{item.name}</p>
      </Link>
    );
  }

  const cardFields = (categoryConfig.card || []).filter((f) => f !== "name");

  return (
    <Link
      href={`${basePath}/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border-2 border-transparent bg-white shadow-sm transition hover:border-[var(--color-primary)] hover:shadow-md"
    >
      <div className="relative h-40 w-full bg-[var(--color-primary-mint)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-primary-dark)]/40">
            {categoryConfig.icon && <categoryConfig.icon size={32} />}
          </div>
        )}
        {item.isFeatured && (
          <span className="absolute top-2 left-2 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
            Recommandé
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
          {categoryConfig.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="font-semibold text-black line-clamp-1">{item.name}</p>
        {cardFields.map((field) => (
          <CardField key={field} listing={item} field={field} />
        ))}
      </div>
    </Link>
  );
}