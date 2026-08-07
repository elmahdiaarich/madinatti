"use client";

import Link from "next/link";
import { GraduationCap, MapPin, Phone, ShieldCheck } from "lucide-react";
import { EDUCATION_TYPE_MAP } from "@/constants/educationConstants";
import { educationImageFor } from "@/utils/educationImages";

function sectorLabel(value) {
  if (value === "PRIVATE") return "Prive";
  if (value === "SEMI_PUBLIC") return "Semi-public";
  return "Public";
}

export default function EducationInstitutionCard({ institution, selected, onSelect }) {
  const type = EDUCATION_TYPE_MAP[institution.institutionType];
  const Icon = type?.icon || GraduationCap;
  const image = educationImageFor(institution);
  const location = [institution.address, institution.city].filter(Boolean).join(" - ");

  return (
    <Link
      href={`/education/etablissement/${encodeURIComponent(institution.slug)}`}
      onMouseEnter={() => onSelect?.(institution)}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${
        selected
          ? "border-[#2D5016] ring-2 ring-[#A7D129]/30"
          : "border-black/[0.06] hover:-translate-y-0.5 hover:border-[#2D5016] hover:shadow-md"
      }`}
    >
      <div className="relative h-44 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={institution.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {institution.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
            Recommande
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
          {type?.label || institution.institutionType}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#E8F5D0] text-[#2D5016]">
            <Icon size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-semibold leading-snug text-black transition-colors group-hover:text-[#2D5016]">
              {institution.name}
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-500">{sectorLabel(institution.sector)}</p>
          </div>
          {institution.isVerified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F5D0] px-2 py-0.5 text-[11px] font-semibold text-[#2D5016]">
              <ShieldCheck size={12} /> Verifie
            </span>
          )}
        </div>

        {location && (
          <p className="flex items-center gap-1.5 text-xs text-black/55">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            <span className="line-clamp-1">{location}</span>
          </p>
        )}

        {institution.phone && (
          <p className="flex items-center gap-1.5 text-xs text-black/55">
            <Phone size={13} className="shrink-0 text-gray-400" />
            <span className="line-clamp-1">{institution.phone}</span>
          </p>
        )}

        {institution.metadata?.level && (
          <div className="mt-1 flex flex-wrap gap-1">
            {String(institution.metadata.level)
              .split("/")
              .map((level) => level.trim())
              .filter(Boolean)
              .slice(0, 3)
              .map((level) => (
                <span key={level} className="rounded bg-[#E8F5D0] px-2 py-0.5 text-[10px] font-medium text-[#2D5016]">
                  {level}
                </span>
              ))}
          </div>
        )}
      </div>
    </Link>
  );
}
