"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, GraduationCap, Loader2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import TourismDetailMap from "@/components/explore/TourismDetailMap";
import { EDUCATION_TYPE_MAP } from "@/constants/educationConstants";
import { educationService } from "@/services/educationService";
import { educationImageFor } from "@/utils/educationImages";

function textOrFallback(value, fallback = "Non renseigne") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function metadataValue(institution, key) {
  const metadata = institution?.metadata;
  if (!metadata || typeof metadata !== "object") return "";
  const value = metadata[key];
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value);
}

function googleMapsSearchUrl(institution) {
  const query = [institution?.name, institution?.address, institution?.city, institution?.province, "Morocco"]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function InfoItem({ label, value, href, icon: Icon }) {
  const content = textOrFallback(value);
  const className = "flex min-h-[76px] gap-3 border border-black/10 bg-white p-3 text-sm text-gray-700";

  const inner = (
    <>
      {Icon && <Icon size={16} className="mt-0.5 shrink-0 text-[#2D5016]" />}
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-normal text-gray-400">{label}</span>
        <span className="mt-1 block break-words leading-5">{content}</span>
      </span>
    </>
  );

  if (href && value) {
    return (
      <a href={href} className={`${className} transition hover:border-[#2D5016] hover:text-[#2D5016]`}>
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

export default function EducationInstitutionDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      educationService
        .getInstitution(slug)
        .then((response) => {
          if (!cancelled) setInstitution(response.data);
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
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-sm text-gray-600">{error || "Etablissement introuvable."}</p>
        <Link href="/education" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2D5016]">
          <ArrowLeft size={15} /> Retour Education
        </Link>
      </div>
    );
  }

  const type = EDUCATION_TYPE_MAP[institution.institutionType];
  const Icon = type?.icon || GraduationCap;
  const hero = educationImageFor(institution);
  const sector = institution.sector === "PRIVATE" ? "Prive" : institution.sector === "SEMI_PUBLIC" ? "Semi-public" : "Public";
  const level = metadataValue(institution, "level") || type?.label || institution.institutionType;
  const contactSource = metadataValue(institution, "contactSource");
  const originalCommune = metadataValue(institution, "originalCommune") || institution.city;
  const gpsStatus = metadataValue(institution, "gpsStatus");
  const hasExactGps = institution.latitude != null && institution.longitude != null;
  const isApproximateGps = gpsStatus === "APPROXIMATE_COMMUNE";
  const description = institution.description || "Description a completer par l'administration.";
  const hasContactLinks =
    institution.phone ||
    institution.website ||
    institution.facebookUrl ||
    institution.instagramUrl ||
    institution.linkedinUrl;

  return (
    <main className="min-h-screen bg-[#F7F9F5] px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-600">
          <ArrowLeft size={15} /> Retour
        </button>

        <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm sm:h-96">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt={institution.name} className="h-full w-full object-cover" />
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5D0] px-3 py-1 text-xs font-semibold text-[#2D5016]">
                <Icon size={13} /> {type?.label || institution.institutionType}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{sector}</span>
              {institution.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5D0] px-3 py-1 text-xs font-semibold text-[#2D5016]">
                  <ShieldCheck size={13} /> Verifie
                </span>
              )}
            </div>

            <div className="mt-3 flex items-start gap-4">
              {institution.logoUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={institution.logoUrl} alt="" className="h-16 w-16 rounded-lg border border-black/10 object-cover" />
                </>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-950">{institution.name}</h1>
                <p className="mt-1 text-sm text-gray-500">{[institution.city, institution.region].filter(Boolean).join(" - ")}</p>
              </div>
            </div>

            <section className="mt-6">
              <h2 className="text-base font-bold text-gray-950">Description</h2>
              <p className="mt-2 border border-black/10 bg-white p-4 text-sm leading-6 text-gray-700">{description}</p>
            </section>

            <section className="mt-6">
              <h2 className="text-base font-bold text-gray-950">Informations principales</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoItem label="Adresse" value={institution.address} icon={MapPin} />
                <InfoItem label="Niveau" value={level} icon={GraduationCap} />
                <InfoItem label="Commune originale" value={originalCommune} icon={MapPin} />
                <InfoItem label="Source contact" value={contactSource} icon={ShieldCheck} />
                <InfoItem label="Email" value={institution.email} href={institution.email ? `mailto:${institution.email}` : ""} icon={Mail} />
                <InfoItem label="Ville / region" value={[institution.city, institution.region].filter(Boolean).join(" - ")} icon={MapPin} />
              </div>
            </section>

            {hasContactLinks && (
              <section className="mt-6">
                <h2 className="text-base font-bold text-gray-950">Contact</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {institution.phone && (
                    <a href={`tel:${institution.phone}`} className="flex gap-2 border border-black/10 p-3 text-sm font-semibold text-gray-700">
                      <Phone size={16} className="text-gray-400" /> {institution.phone}
                    </a>
                  )}
                  {institution.website && (
                    <a href={institution.website} target="_blank" rel="noopener noreferrer" className="flex gap-2 border border-black/10 p-3 text-sm font-semibold text-gray-700">
                      <Globe size={16} className="text-gray-400" /> Site web
                    </a>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {institution.facebookUrl && <a href={institution.facebookUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-black/10 p-2 text-gray-700" title="Facebook"><ExternalLink size={17} /></a>}
                  {institution.instagramUrl && <a href={institution.instagramUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-black/10 p-2 text-gray-700" title="Instagram"><ExternalLink size={17} /></a>}
                  {institution.linkedinUrl && <a href={institution.linkedinUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-black/10 p-2 text-gray-700" title="LinkedIn"><ExternalLink size={17} /></a>}
                </div>
              </section>
            )}

            {isApproximateGps && (
              <p className="mt-5 border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                Position GPS approximative: le point correspond a la commune, pas forcement a l&apos;entree exacte de l&apos;etablissement.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {hasExactGps ? (
              <div className="h-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <TourismDetailMap listing={institution} className="h-full w-full" />
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white px-6 text-center text-sm text-gray-500 shadow-sm">
                <MapPin size={24} className="text-gray-300" />
                <p>Point GPS exact a verifier.</p>
                <a
                  href={googleMapsSearchUrl(institution)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5D0] px-3 py-1.5 text-xs font-semibold text-[#2D5016] transition hover:brightness-95"
                >
                  <ExternalLink size={13} /> Rechercher sur Google Maps
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
