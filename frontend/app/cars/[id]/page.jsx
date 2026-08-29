"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { carsService } from "@/services/carsService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReportModal from "@/components/shared/ReportModal";
import MediaGallery from "@/components/shared/MediaGallery";
import SingleLocationMap from "@/components/shared/maps/SingleLocationMap";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";
import { Mail, MapPin, MessageCircle, Phone, Store, Gauge, Fuel, Settings, Calendar, Eye } from "lucide-react";

const FUEL_LABELS = { PETROL: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride", LPG: "GPL", OTHER: "Autre" };
const TRANS_LABELS = { MANUAL: "Manuelle", AUTOMATIC: "Automatique", SEMI_AUTOMATIC: "Semi-automatique" };
const BODY_LABELS = { SEDAN: "Berline", SUV: "SUV", HATCHBACK: "Citadine", COUPE: "Coupé", CONVERTIBLE: "Cabriolet", WAGON: "Break", VAN: "Van", PICKUP: "Pickup", MINIVAN: "Minivan", OTHER: "Autre" };
const COND_LABELS = { NEW: "Neuf", USED: "Occasion", DAMAGED: "Accidenté" };
const TYPE_LABELS = { SALE: "Vente", RENT: "Location" };

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";

// ─── Section eyebrow — same pattern as real estate detail page ───────────────
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

// ─── Spec chip — same shape as real estate's SpecChip ────────────────────────
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

// ─── Mobile sticky action bar ─────────────────────────────────────────────────
function MobileActionBar({ listing, onScrollToInquiry }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EDEAD9] shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.12)] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[#9CA394] font-semibold truncate">
            {listing.make} {listing.model} · {TYPE_LABELS[listing.listingType]}
          </p>
          <p className="text-lg font-extrabold text-[#16250B] leading-tight">
            {fmtPrice(listing.price)} MAD
            {listing.listingType === "RENT" && (
              <span className="text-xs font-medium text-[#9CA394]"> /jour</span>
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
            <Phone className="w-4 h-4" />
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
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Inquiry Form ─────────────────────────────────────────────────────────────
function InquiryForm({ listingId }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ message: "", contactPhone: "", contactEmail: "" });
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.message.trim() || form.message.trim().length < 5)
      errs.message = "Message requis (min 5 caractères)";
    if (form.contactPhone && !/^(\+212|0)(6|7)\d{8}$/.test(form.contactPhone.replace(/\s/g, "")))
      errs.contactPhone = "Numéro invalide (ex: 0612345678)";
    return errs;
  };

  const handleSend = async () => {
    if (!user) return;
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("sending");
    try {
      const token = localStorage.getItem("token");
      await carsService.createInquiry({ ...form, listingId }, token);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  if (status === "ok")
    return (
      <div className="rounded-[28px] bg-[#EEF6DE] p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-[#2D5016] text-sm">Message envoyé !</p>
        <p className="text-xs text-[#5C7A3A] mt-1">Le vendeur vous contactera bientôt.</p>
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
        <SectionHead>Contacter le vendeur</SectionHead>
      </div>
      <div className="px-6 pb-6 flex flex-col gap-3">
        {!user && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            <Link href="/auth/login" className="font-bold underline">Connectez-vous</Link>{" "}
            pour envoyer un message.
          </p>
        )}
        <div>
          <textarea rows={4} placeholder="Votre message..." value={form.message} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); if (errors.message) setErrors((p) => ({ ...p, message: null })); }}
            className={inputCls("message") + " resize-none"}
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {errors.message}</p>
          )}
        </div>
        <div>
          <input placeholder="Téléphone (ex: 0612345678)" value={form.contactPhone} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, contactPhone: e.target.value })); if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null })); }}
            className={inputCls("contactPhone")}
          />
          {errors.contactPhone && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {errors.contactPhone}</p>
          )}
        </div>
        <input placeholder="Email (optionnel)" value={form.contactEmail} disabled={!user}
          onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
          className={inputCls("contactEmail")}
        />
        {status === "error" && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">❌ Erreur lors de l'envoi. Veuillez réessayer.</p>
        )}
        <button onClick={handleSend} disabled={!user || status === "sending"}
          className="w-full py-3 bg-[#2D5016] text-white font-bold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-50"
        >
          {status === "sending" ? "Envoi..." : "Envoyer le message"}
        </button>
      </div>
    </div>
  );
}

// ─── Seller profile card ──────────────────────────────────────────────────────
function hasProfessionalShopPlan(shop) {
  const subscription = shop?.subscriptions?.[0];
  return Boolean(shop?.status === "ACTIVE" && ["ACTIVE", "TRIAL"].includes(subscription?.status));
}

function SellerProfile({ listing }) {
  const seller = listing.user || {};
  const shop = listing.shop || null;
  const professionalShop = hasProfessionalShopPlan(shop);
  const displayName = shop?.name || seller.companyName || seller.name || "Vendeur";
  const displayAvatar = shop?.logo || seller.companyLogo || seller.avatar;
  const phone = listing.contactPhone || shop?.professionalPhone || seller.phone;
  const email = shop?.professionalEmail || seller.email;
  const city = shop?.city || seller.city || listing.city;
  const whatsapp = phone ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce : ${listing.title}`)}` : null;

  return (
    <div className="rounded-[28px] bg-white ring-1 ring-[#EDEAD9] shadow-[0_2px_24px_-8px_rgba(45,80,22,0.12)] overflow-hidden">
      <div className="px-6 pt-5">
        <SectionHead>Profil vendeur</SectionHead>
      </div>
      <div className="px-6 pb-6">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[#EDEAD9] bg-[#EEF6DE] flex items-center justify-center">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-extrabold text-[#2D5016]">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate font-extrabold text-[#1C2B0F]">{displayName}</p>
              {professionalShop && <Store size={14} className="shrink-0 text-[#7BA428]" />}
            </div>
            {professionalShop && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EEF6DE] px-2 py-0.5 text-[11px] font-bold text-[#2D5016]">
                ✓ Boutique vérifiée
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6DE] text-[#2D5016] transition hover:bg-[#A7D129] hover:text-white" aria-label="WhatsApp">
              <MessageCircle size={18} />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6DE] text-[#2D5016] transition hover:bg-[#A7D129] hover:text-white" aria-label="Email">
              <Mail size={17} />
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#2D5016] px-4 text-sm font-bold text-white transition hover:bg-[#A7D129] hover:text-[#2D5016]">
              <Phone size={15} />
              {phone}
            </a>
          )}
        </div>

        {city && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B7364]">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#7BA428]" />
            {city}
          </div>
        )}

        {shop?.slug && (
          <Link href={`/boutiques/${shop.slug}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#2D5016] px-4 py-2.5 text-sm font-bold text-[#2D5016] hover:bg-[#2D5016] hover:text-white transition">
            <Store size={16} />
            Voir la boutique
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#FBFAF6] animate-pulse">
      <div className="h-14 bg-white border-b border-[#EDEAD9]" />
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
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
export default function CarDetailPage() {
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
        const res = await carsService.getListingById(id);
        const data = res.data ?? res;
        setListing(data);
        try {
          const rel = await carsService.getListings({ limit: 4, page: 1, make: data.make });
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
    carsService
      .getFavorites(token)
      .then((favRes) => {
        setIsFavorited((favRes.data ?? []).some((l) => l.id === id));
      })
      .catch(() => {});
  }, [id, user]);

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;

  if (error || !listing)
    return (
      <div className="min-h-screen bg-[#FBFAF6] flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🚗</span>
        <h1 className="text-2xl font-bold text-[#1C2B0F]">Annonce introuvable</h1>
        <p className="text-[#6B7364] text-sm">Cette annonce n'existe plus ou a été supprimée.</p>
        <Link href="/cars" className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition">
          Voir toutes les annonces
        </Link>
      </div>
    );

  const images = Array.isArray(listing.images) ? listing.images : [];
  const features = listing.features && typeof listing.features === "object" ? listing.features : {};
  const isVisitor = !user;

  const scrollToInscription = () => {
    const el = document.getElementById("inscription-cars");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToInquiry = () => {
    const el = document.getElementById("inquiry-form");
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
      await carsService.toggleFavorite(id, token);
    } catch {
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb & header actions */}
      <div className="bg-[#FBFAF6]/90 backdrop-blur-sm border-b border-[#EDEAD9] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#8B9280] min-w-0">
            <Link href="/" className="hover:text-[#2D5016] transition-colors shrink-0">Accueil</Link>
            <span className="text-[#D8D4C4] shrink-0">/</span>
            <Link href="/cars" className="hover:text-[#2D5016] transition-colors shrink-0">Automobile</Link>
            <span className="text-[#D8D4C4] shrink-0">/</span>
            <span className="text-[#1C2B0F] font-medium truncate">{listing.make} {listing.model}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            
            <a href={`https://wa.me/?text=${encodeURIComponent(listing.title + " " + (typeof window !== "undefined" ? window.location.href : ""))}`}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z" />
                <path d="M5 21v-7" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Signaler</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-32 lg:pb-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-x-8 gap-y-10 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-10 min-w-0">
          <div className="flex flex-col gap-5">
            <MediaGallery images={images} />

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${listing.listingType === "SALE" ? "bg-[#2D5016] text-white" : "bg-[#A7D129] text-[#2D5016]"}`}>
                  {TYPE_LABELS[listing.listingType]}
                </span>
                {listing.condition && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF6DE] text-[#2D5016]">
                    {COND_LABELS[listing.condition]}
                  </span>
                )}
                {listing.isFeatured && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                    ⭐ Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-[#16250B] mb-3 break-words">
                {listing.make} {listing.model} {listing.year}
              </h1>
              <p className="text-[#6B7364] text-sm mb-2">{listing.title}</p>

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
            <SectionHead>Fiche technique</SectionHead>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <SpecChip icon={Gauge} label="Kilométrage" value={listing.mileage != null ? `${listing.mileage.toLocaleString("fr-MA")} km` : null} />
              <SpecChip icon={Fuel} label="Carburant" value={FUEL_LABELS[listing.fuelType]} />
              <SpecChip icon={Settings} label="Boîte" value={TRANS_LABELS[listing.transmission]} />
              <SpecChip icon={Calendar} label="Année" value={listing.year?.toString()} />
              <SpecChip label="Carrosserie" value={BODY_LABELS[listing.bodyType]} />
              <SpecChip label="Couleur" value={listing.color} />
              <SpecChip label="Portes" value={listing.doors?.toString()} />
              <SpecChip label="Places" value={listing.seats?.toString()} />
              <SpecChip label="Cylindrée" value={listing.engineSize != null ? `${listing.engineSize}L` : null} />
              <SpecChip label="Puissance" value={listing.horsePower != null ? `${listing.horsePower} ch` : null} />
            </div>

            {Object.keys(features).length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-widest text-[#9CA394] font-semibold mb-2.5">
                  Options & équipements
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(features).map(([k, v]) => (
                    <span key={k} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EEF6DE] text-[#2D5016]">
                      {k}{v !== true ? `: ${v}` : ""}
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
              <strong>Conseil sécurité !</strong> Ne versez aucune somme avant d'avoir inspecté le véhicule
              en personne. Méfiez-vous des prix anormalement bas. En cas de doute, signalez l'annonce.
            </p>
          </div>
        </div>

        {/* RIGHT — sticky sidebar */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-[76px]">
          {/* Price ticket card */}
          <div className="relative rounded-[28px] bg-[#2D5016] text-white overflow-hidden shadow-[0_16px_40px_-16px_rgba(45,80,22,0.45)]">
            <div className="px-6 pt-6 pb-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#A7D129] font-bold mb-2">
                {listing.make} {listing.model} · {TYPE_LABELS[listing.listingType]}
              </p>
              <p className="text-3xl font-extrabold tracking-tight">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === "RENT" && (
                  <span className="text-base font-medium text-white/70"> /jour</span>
                )}
              </p>
              {listing.isNegotiable && (
                <p className="text-[#A7D129] text-xs font-semibold mt-1">Prix négociable</p>
              )}

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
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="relative h-0">
              <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#FBFAF6]" />
              <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#FBFAF6]" />
              <div className="absolute left-6 right-6 top-0 border-t-2 border-dashed border-white/25" />
            </div>

            <div className="px-6 pt-6 pb-6 flex flex-col gap-2.5">
              {listing.contactPhone && (
                <a href={`tel:${listing.contactPhone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#2D5016] font-extrabold rounded-xl text-sm hover:bg-[#A7D129] transition"
                >
                  <Phone className="w-4 h-4" />
                  {listing.contactPhone}
                </a>
              )}
              {listing.contactPhone && (
                <a href={`https://wa.me/${listing.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  "Bonjour, je suis intéressé par votre annonce : " + listing.title
                )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-extrabold rounded-xl text-sm hover:bg-green-500 transition"
                >
                  <MessageCircle className="w-4 h-4" />
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

          <SellerProfile listing={listing} />

          <div id="inquiry-form" className="scroll-mt-20">
            <InquiryForm listingId={listing.id} />
          </div>

          {related.length > 0 && (
            <div>
              <SectionHead>Même marque</SectionHead>
              <div className="flex flex-col gap-1">
                {related.slice(0, 3).map((l) => (
                  <Link key={l.id} href={`/cars/${l.id}`} className="flex gap-3 group hover:bg-[#EEF6DE] p-2.5 rounded-2xl transition">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EEF6DE] shrink-0">
                      {l.images?.[0]?.url ? (
                        <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A7D129] text-xl">🚗</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1C2B0F] line-clamp-2 group-hover:text-[#2D5016] transition">
                        {l.make} {l.model} {l.year}
                      </p>
                      <p className="text-xs text-[#2D5016] font-semibold mt-0.5">{fmtPrice(l.price)} MAD</p>
                      {l.mileage != null && (
                        <p className="text-xs text-[#9CA394] mt-0.5">{l.mileage.toLocaleString("fr-MA")} km</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/cars" className="mt-3 block w-full text-center py-2.5 border-2 border-[#2D5016] text-[#2D5016] font-bold rounded-full text-xs hover:bg-[#2D5016] hover:text-white transition">
                Toutes les annonces
              </Link>
            </div>
          )}
        </div>
      </div>

      <MobileActionBar listing={listing} onScrollToInquiry={scrollToInquiry} />

      {/* INLINE REGISTER — visiteurs only */}
      {isVisitor && (
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <InlineRegisterSection id="inscription-cars" />
        </div>
      )}

      {showReport && (
        <ReportModal isOpen={showReport} targetType="CAR" targetId={id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}