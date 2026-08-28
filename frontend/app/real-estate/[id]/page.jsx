"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { realEstateService } from "@/services/realEstateService";
import MapFrame from "@/components/shared/MapFrame";
import InlineRegisterSection from "@/components/real-estate/InlineRegisterSection";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReportModal from "@/components/shared/ReportModal";
import MediaGallery from "@/components/shared/MediaGallery";
import { MapPin, Ruler, BedDouble, Bath, Layers, Eye, Hash, Calendar } from "lucide-react";
import SingleLocationMap from "@/components/shared/maps/SingleLocationMap";

const LISTING_TYPE_LABELS = {
  SALE: "Vente",
  RENT: "Location",
};
const PROPERTY_TYPE_LABELS = {
  APARTMENT: "Appartement",
  VILLA: "Villa",
  HOUSE: "Maison",
  STUDIO: "Studio",
  LAND: "Terrain",
  OFFICE: "Bureau",
  SHOP: "Commerce",
};

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : "";

// // ─── Photo Gallery ────────────────────────────────────────────────────────────
// // Full-bleed hero: one large frame + a thumbnail rail, no border/shadow box —
// // the photo itself is the content, not something sitting "inside a card".
// function Gallery({ images }) {
//   console.log("Gallery images: ", images);
//   const [active, setActive] = useState(0);

//   if (!images?.length)
//     return (
//       <div className="w-full h-[320px] sm:h-[420px] md:h-[520px] rounded-[28px] bg-[#EEF6DE] flex items-center justify-center text-[#A7D129]">
//         <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={1}
//             d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
//           />
//         </svg>
//       </div>
//     );

//   return (
//     <div className="flex flex-col gap-3">
//       <div className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] bg-[#EEF6DE] rounded-[28px] overflow-hidden">
//         <img
//           src={images[active]?.url}
//           alt={`Photo ${active + 1}`}
//           className="w-full h-full object-cover"
//         />
//         {images.length > 1 && (
//           <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold tracking-wide">
//             {active + 1} / {images.length}
//           </div>
//         )}
//       </div>
//       {images.length > 1 && (
//         <div className="flex gap-2 overflow-x-auto no-scrollbar p-2">
//           {images.map((img, i) => (
//             <button
//               key={i}
//               onClick={() => setActive(i)}
//               className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition-all duration-150 ${
//                 active === i
//                   ? "ring-2 ring-[#2D5016] ring-offset-2 ring-offset-[#FBFAF6] opacity-100"
//                   : "opacity-50 hover:opacity-90"
//               }`}
//             >
//               <img src={img.url} alt="" className="w-full h-full object-cover" />
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// ─── Section eyebrow — replaces the old bordered-white-box header pattern ────
function SectionHead({ children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-[3px] rounded-full bg-[#A7D129]" />
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#2D5016]">
        {children}
      </h2>
    </div>
  );
}

// ─── Mobile sticky action bar — price + quick actions, only on small screens ──
function MobileActionBar({ listing, propertyType, listingType, onScrollToInquiry }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EDEAD9] shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.12)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[#9CA394] font-semibold truncate">
            {propertyType} · {listingType}
          </p>
          <p className="text-lg font-extrabold text-[#16250B] leading-tight">
            {fmtPrice(listing.price)} MAD
            {listing.listingType === "RENT" && (
              <span className="text-xs font-medium text-[#9CA394]"> /mois</span>
            )}
          </p>
        </div>
        <button
          onClick={onScrollToInquiry}
          className="shrink-0 px-3.5 py-2 rounded-full border-2 border-[#2D5016] text-[#2D5016] text-xs font-bold hover:bg-[#2D5016] hover:text-white transition"
        >
          Contacter
        </button>
      </div>

      <div className="flex gap-2">
        {listing.contactPhone && (

          <a href={`tel:${listing.contactPhone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2D5016] text-white font-bold rounded-xl text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Appeler
          </a>
        )}
        {listing.contactPhone && (

          <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
            "Bonjour, je suis intéressé par votre annonce : " + listing.title
          )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] text-white font-bold rounded-xl text-sm hover:bg-green-500 transition"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Inquiry Form ─────────────────────────────────────────────────────────────
function InquiryForm({ listingId, scrollToInscription }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    message: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.message.trim() || form.message.trim().length < 5)
      errs.message = "Message requis (min 5 caractères)";
    if (form.contactPhone) {
      const phoneRegex = /^(\+212|0)(6|7)\d{8}$/;
      if (!phoneRegex.test(form.contactPhone.replace(/\s/g, "")))
        errs.contactPhone = "Numéro invalide (ex: 0612345678 ou +212612345678)";
    }
    return errs;
  };

  const handleSend = async () => {
    if (!user) {
      scrollToInscription();
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const token = localStorage.getItem("token");
      await realEstateService.createInquiry({ ...form, listingId }, token);
      setStatus("ok");
    } catch (er) {
      setStatus("error");
      console.log("inquiry erreur: ", er);
    }
  };

  if (status === "ok")
    return (
      <div className="rounded-[28px] bg-[#EEF6DE] p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-[#2D5016] text-sm">Message envoyé !</p>
        <p className="text-xs text-[#5C7A3A] mt-1">
          Le propriétaire vous contactera bientôt.
        </p>
      </div>
    );

  const inputCls = (field) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 transition ${errors[field]
      ? "border-red-300 focus:ring-red-200 bg-red-50"
      : "border-[#E3E0D3] focus:ring-[#A7D129]/40 focus:border-[#A7D129]"
    }`;

  return (
    <div className="rounded-[28px] bg-white ring-1 ring-[#EDEAD9] shadow-[0_2px_24px_-8px_rgba(45,80,22,0.12)] overflow-hidden">
      <div className="px-6 pt-5">
        <SectionHead>Contacter le propriétaire</SectionHead>
      </div>
      <div className="px-6 pb-6 flex flex-col gap-3">
        {!user && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            <Link href="/auth/login" className="font-bold underline">
              Connectez-vous
            </Link>{" "}
            pour envoyer un message.
          </p>
        )}
        <div>
          <textarea
            rows={4}
            placeholder="Votre message..."
            value={form.message}
            disabled={!user}
            onChange={(e) => {
              setForm((p) => ({ ...p, message: e.target.value }));
              if (errors.message) setErrors((p) => ({ ...p, message: null }));
            }}
            className={inputCls("message") + " resize-none"}
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span>⚠</span> {errors.message}
            </p>
          )}
        </div>
        <div>
          <input
            placeholder="Téléphone (ex: 0612345678)"
            value={form.contactPhone}
            disabled={!user}
            onChange={(e) => {
              setForm((p) => ({ ...p, contactPhone: e.target.value }));
              if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null }));
            }}
            className={inputCls("contactPhone")}
          />
          {errors.contactPhone && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span>⚠</span> {errors.contactPhone}
            </p>
          )}
        </div>
        <div>
          <input
            placeholder="Email (optionnel)"
            value={form.contactEmail}
            disabled={!user}
            onChange={(e) => {
              setForm((p) => ({ ...p, contactEmail: e.target.value }));
              if (errors.contactEmail) setErrors((p) => ({ ...p, contactEmail: null }));
            }}
            className={inputCls("contactEmail")}
          />
        </div>
        {status === "error" && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
            ❌ Erreur lors de l'envoi. Veuillez réessayer.
          </p>
        )}
        <button
          onClick={handleSend}
          disabled={!user || status === "sending"}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-50"
        >
          {status === "sending" ? "Envoi..." : "Envoyer le message"}
        </button>
      </div>
    </div>
  );
}

// ─── Spec chip — replaces the old table-row-with-hairline-divider pattern ────
function SpecChip({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 bg-white rounded-2xl ring-1 ring-[#EDEAD9] px-4 py-3">
      {Icon && <Icon className="w-4 h-4 text-[#7BA428] shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#9CA394] leading-none mb-1">
          {label}
        </p>
        <p className="text-sm font-bold text-[#1C2B0F] truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#FBFAF6] animate-pulse">
      <div className="h-14 bg-white border-b border-[#EDEAD9]" />
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-5">
          <div className="rounded-[28px] bg-[#EEF6DE] h-[420px]" />
          <div className="rounded-[28px] bg-[#EEF6DE] h-[160px]" />
          <div className="rounded-[28px] bg-[#EEF6DE] h-[240px]" />
        </div>
        <div className="space-y-5">
          <div className="rounded-[28px] bg-[#EEF6DE] h-[280px]" />
          <div className="rounded-[28px] bg-[#EEF6DE] h-[200px]" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RealEstateDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

// Fetch the listing itself only once per id — not tied to auth resolving
useEffect(() => {
  if (!id) return;
  const load = async () => {
    try {
      setLoading(true);
      const res = await realEstateService.getListingById(id);
      const data = res.data ?? res;
      setListing(data);
      try {
        const rel = await realEstateService.getListings({
          limit: 4,
          page: 1,
          city: data.city,
        });
        setRelated((rel.listings ?? []).filter((l) => l.id !== id));
      } catch (_) {}
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  load();
}, [id]);

// Favorites depend on auth resolving — separate effect, no re-fetch of the listing
useEffect(() => {
  if (!id || !user) return;
  const token = localStorage.getItem("token");
  if (!token) return;
  realEstateService
    .getFavorites(token)
    .then((favRes) => {
      const favIds = (favRes.data ?? []).map((l) => l.id);
      setIsFavorited(favIds.includes(id));
    })
    .catch(() => {});
}, [id, user]);

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;

  if (error || !listing)
    return (
      <div className="min-h-screen bg-[#FBFAF6] flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🏠</span>
        <h1 className="text-2xl font-bold text-[#1C2B0F]">Annonce introuvable</h1>
        <p className="text-[#6B7364] text-sm">
          Cette annonce n'existe plus ou a été supprimée.
        </p>
        <Link
          href="/real-estate"
          className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
        >
          Voir toutes les annonces
        </Link>
      </div>
    );

  const images = Array.isArray(listing.images) ? listing.images : [];
  const features =
    listing.features && typeof listing.features === "object" ? listing.features : {};
  const listingType = LISTING_TYPE_LABELS[listing.listingType];
  const propertyType = PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType;
  const isVisitor = !user;

  const scrollToInscription = () => {
    const el = document.getElementById("inscription-realstate");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!user) {
      scrollToInscription();
      return;
    }
    if (favLoading) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);
    try {
      const token = localStorage.getItem("token");
      await realEstateService.toggleFavorite(id, token);
    } catch {
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  const scrollToInquiry = () => {
    const el = document.getElementById("inquiry-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen ">
      {/* Breadcrumb & header actions — same ivory as the page, just a hairline, no gray/shadow box */}
      <div className="bg-[#FBFAF6]/90 backdrop-blur-sm border-b border-[#EDEAD9] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#8B9280] min-w-0">
            <Link href="/" className="hover:text-[#2D5016] transition-colors shrink-0">
              Accueil
            </Link>
            <span className="text-[#D8D4C4] shrink-0">/</span>
            <Link href="/real-estate" className="hover:text-[#2D5016] transition-colors shrink-0">
              Immobilier
            </Link>
            <span className="text-[#D8D4C4] shrink-0">/</span>
            <span className="text-[#1C2B0F] font-medium truncate">{listing.title}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(listing.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] hover:scale-110 transition-all duration-150"
              title="Partager sur WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </a>

            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-[#9CA394] hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z" />
                <path d="M5 21v-7" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Signaler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main grid — gallery + title live directly on the page, no gradient banner box */}
      <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-32 lg:pb-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-x-8 gap-y-10 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-10 min-w-0">
          <div className="flex flex-col gap-5">
            <MediaGallery images={images} />

            {/* Title block — no card, no border, just type on the page */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {listingType && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${listing.listingType === "SALE"
                      ? "bg-[#2D5016] text-white"
                      : "bg-[#A7D129] text-[#2D5016]"
                      }`}
                  >
                    {listingType}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF6DE] text-[#2D5016]">
                  {propertyType}
                </span>
                {listing.isFeatured && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    ⭐ Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-[#16250B] mb-3 break-words">
                {listing.title}
              </h1>

              <div className="flex items-center gap-1.5 text-[#6B7364] text-sm">
                <MapPin className="w-4 h-4 shrink-0 text-[#7BA428]" />
                <span className="truncate">
                  {listing.location}
                  {listing.city ? `, ${listing.city}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionHead>Caractéristiques</SectionHead>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <SpecChip icon={Ruler} label="Surface" value={listing.surface ? `${listing.surface} m²` : null} />
              <SpecChip icon={BedDouble} label="Pièces" value={listing.rooms ? `${listing.rooms} pièces` : null} />
              <SpecChip icon={Bath} label="Salle de bain" value={listing.bathrooms ? `${listing.bathrooms} sdb` : null} />
              <SpecChip icon={Layers} label="Étage" value={listing.floor !== null && listing.floor !== undefined ? `Étage ${listing.floor}` : null} />
              <SpecChip icon={Hash} label="Type de bien" value={propertyType} />
              <SpecChip icon={MapPin} label="Ville" value={listing.city} />
            </div>

            {Object.keys(features).length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest text-[#9CA394] font-semibold mb-2.5">
                  Équipements & extras
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(features).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EEF6DE] text-[#2D5016]"
                    >
                      {k}
                      {v !== true ? `: ${v}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <SectionHead>Description</SectionHead>
            <p className="text-[15px] text-[#3A4535] leading-relaxed whitespace-pre-line max-w-[65ch]">
              {listing.description}
            </p>
          </div>

          <div>
            <SectionHead>Localisation</SectionHead>
            <div className="relative h-[300px] rounded-[28px] overflow-hidden ring-1 ring-[#EDEAD9]">
              <SingleLocationMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                location={listing.location}
                city={listing.city}
              />
            </div>
          </div>

          <div className="flex gap-3 items-start bg-amber-50 rounded-2xl px-5 py-4">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Conseil sécurité !</strong> Ne versez aucune somme d'argent avant
              d'avoir visité le bien et signé un contrat officiel. Méfiez-vous des annonces
              avec des prix anormalement bas. En cas de doute, signalez l'annonce.
            </p>
          </div>
        </div>

        {/* RIGHT — sticky sidebar */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-[76px]">
          {/* Signature element: a "listing ticket" — price stub torn from the
              contact stub by a dashed perforation, echoing a real annonce ticket
              rather than a generic gradient CTA card. */}
          <div className="relative rounded-[28px] bg-[#2D5016] text-white overflow-hidden shadow-[0_16px_40px_-16px_rgba(45,80,22,0.45)]">
            {/* price stub */}
            <div className="px-6 pt-6 pb-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#A7D129] font-bold mb-2">
                {propertyType} · {listingType}
              </p>
              <p className="text-3xl font-extrabold tracking-tight">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === "RENT" && (
                  <span className="text-base font-medium text-white/70"> /mois</span>
                )}
              </p>

              {!isVisitor && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={favLoading}
                  title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                  className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${isFavorited
                    ? "bg-[#A7D129] text-[#2D5016]"
                    : "bg-white/10 text-white hover:bg-[#A7D129] hover:text-[#2D5016]"
                    } ${favLoading ? "opacity-60" : ""}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4.5 h-4.5"
                    fill={isFavorited ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* perforation seam with notches cut into the page background */}
            <div className="relative h-0">
              <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#FBFAF6]" />
              <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#FBFAF6]" />
              <div className="absolute left-6 right-6 top-0 border-t-2 border-dashed border-white/25" />
            </div>

            {/* contact stub */}
            <div className="px-6 pt-6 pb-6 flex flex-col gap-2.5">
              {listing.contactPhone && (
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#2D5016] font-extrabold rounded-xl text-sm hover:bg-[#A7D129] transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {listing.contactPhone}
                </a>
              )}
              {listing.contactPhone && (
                <a
                  href={`https://wa.me/${listing.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    "Bonjour, je suis intéressé par votre annonce : " + listing.title
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-extrabold rounded-xl text-sm hover:bg-green-500 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}

              <div className="flex items-center justify-between text-xs text-white/60 pt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {fmtDate(listing.publishedAt || listing.createdAt)}
                </span>
                {listing.viewsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {listing.viewsCount.toLocaleString("fr-MA")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div id="inquiry-form" className="scroll-mt-50">
            <InquiryForm listingId={listing.id} scrollToInscription={scrollToInscription} />
          </div>

          {related.length > 0 && (
            <div>
              <SectionHead>Annonces similaires</SectionHead>
              <div className="flex flex-col gap-1">
                {related.slice(0, 3).map((l) => (
                  <Link
                    key={l.id}
                    href={`/real-estate/${l.id}`}
                    className="flex gap-3 group hover:bg-[#EEF6DE] p-2.5 rounded-2xl transition"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EEF6DE] shrink-0">
                      {l.images?.[0]?.url ? (
                        <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A7D129] text-xl">
                          🏠
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1C2B0F] line-clamp-2 group-hover:text-[#2D5016] transition">
                        {l.title}
                      </p>
                      <p className="text-xs text-[#2D5016] font-semibold mt-0.5">
                        {fmtPrice(l.price)} MAD
                      </p>
                      <p className="text-xs text-[#9CA394] mt-0.5">{l.city || l.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/real-estate"
                className="mt-3 block w-full text-center py-2.5 border-2 border-[#2D5016] text-[#2D5016] font-bold rounded-full text-xs hover:bg-[#2D5016] hover:text-white transition"
              >
                Toutes les annonces
              </Link>
            </div>
          )}
        </div>
      </div>
      <MobileActionBar
        listing={listing}
        propertyType={propertyType}
        listingType={listingType}
        onScrollToInquiry={scrollToInquiry}
      />

      {/* INLINE REGISTER — visiteurs only */}
      {isVisitor && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inscription-realstate" />
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          targetType="REAL_ESTATE"
          targetId={id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}