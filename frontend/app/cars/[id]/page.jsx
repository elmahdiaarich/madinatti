"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { carsService } from "@/services/carsService";
import MapFrame from "@/components/shared/MapFrame";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ReportModal from "@/components/shared/ReportModal";
import InlineRegisterSection from "@/components/cars/InlineRegisterSection";

const FUEL_LABELS  = { PETROL: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride", LPG: "GPL", OTHER: "Autre" };
const TRANS_LABELS = { MANUAL: "Manuelle", AUTOMATIC: "Automatique", SEMI_AUTOMATIC: "Semi-automatique" };
const BODY_LABELS  = { SEDAN: "Berline", SUV: "SUV", HATCHBACK: "Citadine", COUPE: "Coupé", CONVERTIBLE: "Cabriolet", WAGON: "Break", VAN: "Van", PICKUP: "Pickup", MINIVAN: "Minivan", OTHER: "Autre" };
const COND_LABELS  = { NEW: "Neuf", USED: "Occasion", DAMAGED: "Accidenté" };
const TYPE_LABELS  = { SALE: "Vente", RENT: "Location" };

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({ images }) {
  const [active, setActive] = useState(0);
  if (!images?.length)
    return <div className="w-full h-[380px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-200 text-7xl">🚗</div>;
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
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${active === i ? "border-[#A7D129]" : "border-transparent hover:border-[#E8F5D0]"}`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Spec Row ──────────────────────────────────────────────────────────────────

function SpecRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 py-2 border-b border-gray-50 last:border-0 text-sm flex-wrap">
      <span className="text-gray-400">» {label} :</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

// ── Inquiry Form ──────────────────────────────────────────────────────────────

function InquiryForm({ listingId }) {
  const { user } = useAuth();
  const [form, setForm]     = useState({ message: "", contactPhone: "", contactEmail: "" });
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
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-bold text-green-700 text-sm">Message envoyé !</p>
        <p className="text-xs text-green-600 mt-1">Le vendeur vous contactera bientôt.</p>
      </div>
    );

  const inp = (field) => `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
    errors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[#A7D129] focus:border-transparent"
  }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
        <h2 className="font-bold text-gray-900 text-base">Contacter le vendeur</h2>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3">
        {!user && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Link href="/auth/login" className="font-bold underline">Connectez-vous</Link> pour envoyer un message.
          </p>
        )}
        <div>
          <textarea rows={4} placeholder="Votre message..." value={form.message} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); if (errors.message) setErrors((p) => ({ ...p, message: null })); }}
            className={inp("message") + " resize-none"}
          />
          {errors.message && <p className="text-xs text-red-500 mt-1">⚠ {errors.message}</p>}
        </div>
        <div>
          <input placeholder="Téléphone (ex: 0612345678)" value={form.contactPhone} disabled={!user}
            onChange={(e) => { setForm((p) => ({ ...p, contactPhone: e.target.value })); if (errors.contactPhone) setErrors((p) => ({ ...p, contactPhone: null })); }}
            className={inp("contactPhone")}
          />
          {errors.contactPhone && <p className="text-xs text-red-500 mt-1">⚠ {errors.contactPhone}</p>}
        </div>
        <input placeholder="Email (optionnel)" value={form.contactEmail} disabled={!user}
          onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
          className={inp("contactEmail")}
        />
        {status === "error" && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">❌ Erreur lors de l'envoi.</p>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const { id }   = useParams();
  const { user } = useAuth();

  const [listing, setListing]           = useState(null);
  const [related, setRelated]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [isFavorited, setIsFavorited]   = useState(false);
  const [favLoading, setFavLoading]     = useState(false);
  const [showReport, setShowReport]     = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res  = await carsService.getListingById(id);
        const data = res.data ?? res;
        setListing(data);

        const token = localStorage.getItem("token");
        if (user && token) {
          try {
            const favRes = await carsService.getFavorites(token);
            setIsFavorited((favRes.data ?? []).some((l) => l.id === id));
          } catch (_) {}
        }
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

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;
  if (error || !listing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🚗</span>
        <h1 className="text-2xl font-bold text-gray-800">Annonce introuvable</h1>
        <p className="text-gray-500 text-sm">Cette annonce n'existe plus ou a été supprimée.</p>
        <Link href="/cars" className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition">
          Voir toutes les annonces
        </Link>
      </div>
    );

  const images   = Array.isArray(listing.images) ? listing.images : [];
  const features = listing.features && typeof listing.features === "object" ? listing.features : {};
  const pageUrl  = typeof window !== "undefined" ? window.location.href : "";

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!user || favLoading) return;
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
    <div className="min-h-screen bg-gray-50">
      {/* BREADCRUMB BAR */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <Link href="/" className="hover:text-[#A7D129] transition-colors shrink-0">Accueil</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <Link href="/cars" className="hover:text-[#A7D129] transition-colors shrink-0">Automobile</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <span className="text-gray-800 font-medium truncate">{listing.make} {listing.model}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a href={`https://wa.me/?text=${encodeURIComponent(listing.title + " " + pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] hover:scale-110 transition shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z"/>
                <path d="M5 21v-7"/>
              </svg>
              <span className="text-xs font-semibold">Signaler</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO STRIP */}
      <div className="bg-gradient-to-br from-[#2D5016] to-[#7BA428] text-white py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${listing.listingType === "SALE" ? "bg-white text-[#2D5016]" : "bg-[#A7D129] text-[#2D5016]"}`}>
                  {TYPE_LABELS[listing.listingType]}
                </span>
                {listing.condition && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">{COND_LABELS[listing.condition]}</span>
                )}
                {listing.isFeatured && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">⭐ Premium</span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-1">
                {listing.make} {listing.model} {listing.year}
              </h1>
              <p className="text-white/70 text-sm mb-2">{listing.title}</p>
              {listing.city && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.location}{listing.city ? `, ${listing.city}` : ""}
                </div>
              )}
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-3">
              <p className="text-3xl font-extrabold">
                {fmtPrice(listing.price)} MAD
                {listing.listingType === "RENT" && <span className="text-lg font-medium opacity-70">/jour</span>}
              </p>
              {listing.isNegotiable && (
                <span className="text-xs bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full font-semibold">Négociable</span>
              )}
              <p className="text-white/50 text-xs">Publié le {fmtDate(listing.publishedAt || listing.createdAt)}</p>
              {user && (
                <button onClick={handleToggleFavorite}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 ${
                    isFavorited
                      ? "bg-[#A7D129] border-[#A7D129] text-[#2D5016]"
                      : "bg-white/10 border-white/40 text-white hover:bg-[#A7D129] hover:border-[#A7D129] hover:text-[#2D5016]"
                  } ${favLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <Gallery images={images} />
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Fiche technique</h2>
            </div>
            <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <SpecRow label="Marque"      value={listing.make} />
                <SpecRow label="Modèle"      value={listing.model} />
                <SpecRow label="Année"       value={listing.year?.toString()} />
                <SpecRow label="Kilométrage" value={listing.mileage != null ? `${listing.mileage.toLocaleString("fr-MA")} km` : null} />
                <SpecRow label="Carburant"   value={FUEL_LABELS[listing.fuelType]} />
                <SpecRow label="Boîte"       value={TRANS_LABELS[listing.transmission]} />
              </div>
              <div>
                <SpecRow label="Carrosserie" value={BODY_LABELS[listing.bodyType]} />
                <SpecRow label="Couleur"     value={listing.color} />
                <SpecRow label="Portes"      value={listing.doors?.toString()} />
                <SpecRow label="Places"      value={listing.seats?.toString()} />
                <SpecRow label="Cylindrée"   value={listing.engineSize != null ? `${listing.engineSize}L` : null} />
                <SpecRow label="Puissance"   value={listing.horsePower != null ? `${listing.horsePower} ch` : null} />
              </div>
            </div>

            {Object.keys(features).length > 0 && (
              <div className="px-6 pb-5 pt-3 border-t border-gray-50">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Options & équipements</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(features).map(([k, v]) => (
                    <span key={k} className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5D0] border border-[#A7D129] text-[#2D5016]">
                      {k}{v !== true ? `: ${v}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Description</h2>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </div>
          </section>

          <MapFrame latitude={listing.latitude} longitude={listing.longitude} location={listing.location} city={listing.city} />

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Conseil sécurité !</strong> Ne versez aucune somme avant d'avoir inspecté le véhicule en personne.
              Méfiez-vous des prix anormalement bas. En cas de doute, signalez l'annonce.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">
          {/* Price card */}
          <div className="bg-[#2D5016] rounded-2xl p-6 text-white shadow-lg">
            <p className="text-3xl font-extrabold mb-1">
              {fmtPrice(listing.price)} MAD
              {listing.listingType === "RENT" && <span className="text-base font-medium opacity-70">/jour</span>}
            </p>
            {listing.isNegotiable && (
              <p className="text-[#A7D129] text-xs font-semibold mb-2">Prix négociable</p>
            )}
            <p className="text-white/50 text-xs mb-4">{listing.make} {listing.model} · {TYPE_LABELS[listing.listingType]}</p>
            <div className="my-4 border-t border-white/10" />
            {listing.contactPhone && (
              <a href={`tel:${listing.contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#2D5016] font-extrabold rounded-xl text-sm mb-3 hover:bg-[#E8F5D0] transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {listing.contactPhone}
              </a>
            )}
            <a href={`https://wa.me/${listing.contactPhone?.replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je suis intéressé par votre annonce : " + listing.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-extrabold rounded-xl text-sm hover:bg-green-500 transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          <InquiryForm listingId={listing.id} />

          {/* Quick info */}
          <div className="bg-[#E8F5D0] rounded-2xl border border-[#A7D129] p-5">
            <p className="text-[10px] uppercase tracking-widest text-[#7BA428] font-bold mb-3">Infos rapides</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {listing.viewsCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vues</span>
                  <span className="font-bold text-[#2D5016]">{listing.viewsCount.toLocaleString("fr-MA")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Référence</span>
                <span className="font-bold text-[#2D5016] text-xs font-mono">{listing.id?.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Publié le</span>
                <span className="font-bold text-[#2D5016]">{fmtDate(listing.publishedAt || listing.createdAt)}</span>
              </div>
              {listing.category && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-bold text-[#2D5016]">{listing.category.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related listings */}
          {related.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Même marque</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {related.map((l) => (
                  <Link key={l.id} href={`/cars/${l.id}`}
                    className="flex gap-3 group hover:bg-[#E8F5D0] p-2 rounded-xl transition"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#E8F5D0] shrink-0">
                      {l.images?.[0]?.url ? (
                        <img src={l.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A7D129] text-xl">🚗</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-[#2D5016] transition">
                        {l.make} {l.model} {l.year}
                      </p>
                      <p className="text-xs text-[#2D5016] font-semibold mt-0.5">{fmtPrice(l.price)} MAD</p>
                      {l.mileage != null && (
                        <p className="text-xs text-gray-400 mt-0.5">{l.mileage.toLocaleString("fr-MA")} km</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/cars"
                  className="block w-full text-center py-2.5 border-2 border-[#2D5016] text-[#2D5016] font-bold rounded-full text-xs hover:bg-[#2D5016] hover:text-white transition"
                >
                  Toutes les annonces
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INLINE REGISTER — visiteurs only, full width, centered */}
      {!user && (
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
