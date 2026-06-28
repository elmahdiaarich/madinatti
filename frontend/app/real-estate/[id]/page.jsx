"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { realEstateService } from "@/services/realEstateService";
import MapFrame from "@/components/shared/MapFrame";
import InlineRegisterSection from "@/components/real-estate/InlineRegisterSection";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReportModal from '@/components/shared/ReportModal';

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

// ─── Photo Gallery ────────────────────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  if (!images?.length)
    return (
      <div className="w-full h-[380px] bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center text-orange-200">
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full h-[380px] bg-gray-100 rounded-2xl overflow-hidden">
        <img src={images[active]?.url} alt={`Photo ${active + 1}`} className="w-full h-full object-cover" />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
          {active + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                active === i ? "border-orange-500" : "border-transparent hover:border-orange-200"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inquiry Form ─────────────────────────────────────────────────────────────
function InquiryForm({ listingId, isVisitor, scrollToInscription }) {
  const [form, setForm] = useState({ message: "", contactPhone: "", contactEmail: "" });
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
    if (isVisitor) { scrollToInscription(); return; }
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
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
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-green-700 text-sm">Message envoyé !</p>
        <p className="text-xs text-green-600 mt-1">Le propriétaire vous contactera bientôt.</p>
      </div>
    );

  const inputCls = (field) =>
    `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-300 focus:ring-red-200 bg-red-50"
        : "border-gray-200 focus:ring-orange-300 focus:border-transparent"
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-orange-400 inline-block" />
        <h2 className="font-bold text-gray-900 text-base">Contacter le propriétaire</h2>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3">
        <div>
          <textarea rows={4} placeholder="Votre message..." value={form.message}
            onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); if (errors.message) setErrors((p) => ({ ...p, message: null })); }}
            className={inputCls("message") + " resize-none"}
          />
          {errors.message && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {errors.message}</p>}
        </div>
        <div>
          <input placeholder="Téléphone (ex: 0612345678)" value={form.contactPhone}
            onChange={(e) => { setForm((p) => ({ ...p, contactPhone: e.target.value })); if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null })); }}
            className={inputCls("contactPhone")}
          />
          {errors.contactPhone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span> {errors.contactPhone}</p>}
        </div>
        <div>
          <input placeholder="Email (optionnel)" value={form.contactEmail}
            onChange={(e) => { setForm((p) => ({ ...p, contactEmail: e.target.value })); if (errors.contactEmail) setErrors((p) => ({ ...p, contactEmail: null })); }}
            className={inputCls("contactEmail")}
          />
        </div>
        {status === "error" && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            ❌ Erreur lors de l'envoi. Veuillez réessayer.
          </p>
        )}
        <button onClick={handleSend} disabled={status === "sending"}
          className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-sage transition disabled:opacity-60"
        >
          {status === "sending" ? "Envoi..." : "Envoyer le message"}
        </button>
      </div>
    </div>
  );
}

// ─── Spec Row ─────────────────────────────────────────────────────────────────
function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 py-2 border-b border-gray-50 last:border-0 text-sm flex-wrap">
      <span className="text-gray-400">» {label} :</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-12 bg-white border-b border-gray-100" />
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 h-[380px]" />
          <div className="bg-white rounded-2xl border border-gray-100 h-[200px]" />
          <div className="bg-white rounded-2xl border border-gray-100 h-[300px]" />
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 h-[260px]" />
          <div className="bg-white rounded-2xl border border-gray-100 h-[200px]" />
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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await realEstateService.getListingById(id);
        const data = res.data ?? res;
        setListing(data);
        const token = localStorage.getItem("token");
        if (user && token) {
          try {
            const favRes = await realEstateService.getFavorites(token);
            const favIds = (favRes.data ?? []).map((l) => l.id);
            setIsFavorited(favIds.includes(id));
          } catch (_) {}
        }
        try {
          const rel = await realEstateService.getListings({ limit: 4, page: 1, city: data.city });
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

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;

  if (error || !listing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🏠</span>
        <h1 className="text-2xl font-bold text-gray-800">Annonce introuvable</h1>
        <p className="text-gray-500 text-sm">Cette annonce n'existe plus ou a été supprimée.</p>
        <Link href="/real-estate"
          className="mt-2 px-6 py-2.5 bg-orange-500 text-white rounded-full text-sm font-semibold hover:bg-orange-600 transition"
        >
          Voir toutes les annonces
        </Link>
      </div>
    );

  const images = Array.isArray(listing.images) ? listing.images : [];
  const features = listing.features && typeof listing.features === "object" ? listing.features : {};
  const listingType = LISTING_TYPE_LABELS[listing.listingType];
  const propertyType = PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(listing.title);
  const isVisitor = !user;

  // ─── Scroll helper ────────────────────────────────────────────────────────────
  const scrollToInscription = () => {
    const el = document.getElementById("inscription-realstate");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { scrollToInscription(); return; }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb & Header Actions */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <Link href="/" className="hover:text-orange-500 transition-colors shrink-0">Accueil</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <Link href="/real-estate" className="hover:text-orange-500 transition-colors shrink-0">Immobilier</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <span className="text-gray-800 font-medium truncate">{listing.title}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877F2] hover:scale-110 transition-all duration-150 shadow-sm" title="Partager sur Facebook">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(listing.title + ' ' + pageUrl)}`} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] hover:scale-110 transition-all duration-150 shadow-sm" title="Partager sur WhatsApp">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
            </div>
            
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z"/>
                <path d="M5 21v-7"/>
              </svg>
              <span className="text-xs font-semibold">Signaler l'annonce</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero strip */}
      <div className="bg-gradient-to-br from-primary-dark to-primary text-white py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* LEFT: title + location */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {listingType && (
                  <span className="px-3 py-1 bg-white text-primary-dark rounded-full text-xs font-extrabold">{listingType}</span>
                )}
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{propertyType}</span>
                {listing.isFeatured && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold"> ⭐ Premium</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-2">{listing.title}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}{listing.city ? `, ${listing.city}` : ""}
              </div>
            </div>

            {/* RIGHT: price + date + heart + share */}
            <div className="text-right shrink-0 flex flex-col items-end gap-3">
              <p className="text-3xl font-extrabold">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === "RENT" && (
                  <span className="text-lg font-medium opacity-80">/mois</span>
                )}
              </p>
              <p className="text-white/60 text-xs">
                Publié le {fmtDate(listing.publishedAt || listing.createdAt)}
              </p>

              {/* Cœur */}
              <div className="flex gap-2 items-center">
                {/* Bouton cœur */}
                {!isVisitor && (
                  <button
                    onClick={handleToggleFavorite}
                    title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 mt-1
                      transition-all duration-200 hover:scale-110 active:scale-95
                      ${isFavorited
                        ? "bg-orange-400 border-orange-400 text-white"
                        : "bg-white/10 border-white/40 text-white hover:bg-orange-400 hover:border-orange-400"
                      }
                      ${favLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5"
                      fill={isFavorited ? "currentColor" : "none"}
                      stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* ✅ FIN du bloc droit — plus de doublon après ici */}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Gallery images={images} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-orange-400 inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Caractéristiques</h2>
            </div>
            <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <SpecRow label="Type de bien" value={propertyType} />
                <SpecRow label="Transaction" value={listingType} />
                <SpecRow label="Ville" value={listing.city} />
                <SpecRow label="Quartier" value={listing.location} />
              </div>
              <div>
                <SpecRow label="Surface" value={listing.surface ? `${listing.surface} m²` : null} />
                <SpecRow label="Pièces" value={listing.rooms ? `${listing.rooms} pièces` : null} />
                <SpecRow label="Salle de bain" value={listing.bathrooms ? `${listing.bathrooms} sdb` : null} />
                <SpecRow label="Étage" value={listing.floor !== null ? `Étage ${listing.floor}` : null} />
              </div>
            </div>
            {Object.keys(features).length > 0 && (
              <div className="px-6 pb-5 pt-3 border-t border-gray-50">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">
                  Équipements & extras
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(features).map(([k, v]) => (
                    <span key={k} className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700">
                      {k}{v !== true ? `: ${v}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-orange-400 inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Description</h2>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </div>
          </section>

          <MapFrame
            latitude={listing.latitude}
            longitude={listing.longitude}
            location={listing.location}
            city={listing.city}
          />

         <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Conseil sécurité !</strong> Ne versez aucune somme d'argent avant d'avoir visité le bien et signé un contrat officiel.
              Méfiez-vous des annonces avec des prix anormalement bas. En cas de doute, signalez l'annonce via le formulaire de contact.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          <div className="bg-primary-sage rounded-2xl p-6 text-white shadow-lg">
            <p className="text-3xl font-extrabold mb-1">
              {fmtPrice(listing.price)} MAD
              {listing.listingType === "RENT" && (
                <span className="text-base font-medium opacity-75">/mois</span>
              )}
            </p>
            <p className="text-white/60 text-xs mb-4">{propertyType} · {listingType}</p>
            <div className="my-4 border-t border-white/10" />
            {listing.contactPhone && (
              <a href={`tel:${listing.contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-primary-dark font-extrabold rounded-xl text-sm mb-3 hover:bg-orange-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {listing.contactPhone}
              </a>
            )}
            <a
              href={`https://wa.me/${listing.contactPhone?.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je suis intéressé par votre annonce : " + listing.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-extrabold rounded-xl text-sm hover:bg-green-500 transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          <InquiryForm listingId={listing.id} isVisitor={isVisitor} scrollToInscription={scrollToInscription} />

          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5">
            <p className="text-[10px] uppercase tracking-widest text-orange-400 font-bold mb-3">Infos rapides</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {listing.viewsCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vues</span>
                  <span className="font-bold text-orange-700">{listing.viewsCount.toLocaleString("fr-MA")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Référence</span>
                <span className="font-bold text-orange-700 text-xs font-mono">{listing.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Publié le</span>
                <span className="font-bold text-orange-700">{fmtDate(listing.publishedAt || listing.createdAt)}</span>
              </div>
              {listing.category && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-bold text-orange-700">{listing.category.name}</span>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-orange-400 inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Annonces similaires</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {related.map((l) => (
                  <Link key={l.id} href={`/real-estate/${l.id}`}
                    className="flex gap-3 group hover:bg-orange-50 p-2 rounded-xl transition"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-orange-50 shrink-0">
                      {l.images?.[0]?.url ? (
                        <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-200 text-xl">🏠</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-orange-600 transition">{l.title}</p>
                      <p className="text-xs text-orange-600 font-semibold mt-0.5">{fmtPrice(l.price)} MAD</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l.city || l.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/real-estate"
                  className="block w-full text-center py-2.5 border-2 border-orange-500 text-orange-600 font-bold rounded-full text-xs hover:bg-orange-500 hover:text-white transition"
                >
                  Toutes les annonces
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INLINE REGISTER — visiteurs only, full width, centered */}
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
