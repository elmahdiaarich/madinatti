// frontend/app/industrie/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Share2, Heart, Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { industrielZonesService } from "@/services/industrielZonesService";
import TourismDetailMap from "@/components/explore/TourismDetailMap";
import ReportModal from "@/components/shared/ReportModal";

export default function SpaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    industrielZonesService.getById(id)
      .then((res) => {
        setListing(res.data || res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading listing details", err);
        toast.error("Ce lieu est introuvable ou a été supprimé.");
        router.push("/industrie");
      });
  }, [id, router, toast]);

  useEffect(() => {
    if (!user || !id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    industrielZonesService.getFavorites(token)
      .then((res) => {
        const favIds = (res.data ?? res ?? []).map((l) => l.id ?? l);
        setIsFavorited(favIds.includes(id));
      })
      .catch((err) => console.error("Error loading favorite status", err));
  }, [user, id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (favLoading) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);
    try {
      const token = localStorage.getItem("token");
      await industrielZonesService.toggleFavorite(id, token);
      toast.success(prev ? "Retiré des favoris" : "Ajouté aux favoris");
    } catch (err) {
      console.error(err);
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: listing?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-[#2D5016]" />
        <span>Chargement des détails...</span>
      </div>
    );
  }

  const cover = listing.images?.find((img) => img.isCover)?.url || listing.images?.[0]?.url;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/industrie" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition">
        <ArrowLeft size={16} /> Retour
      </Link>

      <div className="h-72 w-full rounded-xl bg-gray-100 sm:h-96 overflow-hidden relative shadow-sm border border-gray-100">
        {cover ? (
          <img src={cover} alt={listing.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">Aucune photo</div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                {listing.category?.name || "Espace industriel"}
              </span>
              <h1 className="text-2xl font-bold text-black mt-1.5">{listing.name}</h1>
            </div>

            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-105 active:scale-95 ${
                isFavorited ? "border-amber-500 bg-amber-500 text-white" : "border-black/10 text-black/50 hover:border-amber-500 hover:text-amber-500"
              }`}
            >
              <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 transition">
              <Share2 size={13} /> Partager
            </button>
            <button onClick={() => setShowReport(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/20 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 transition">
              <Flag size={13} /> Signaler
            </button>
          </div>

          {listing.description && (
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-2">Description</h2>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm bg-white border border-gray-100 rounded-xl p-4 shadow-xs">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Région</p>
              <p className="mt-0.5 text-gray-800 font-medium">{listing.region || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ville</p>
              <p className="mt-0.5 text-gray-800 font-medium">{listing.city || "—"}</p>
            </div>
            {listing.neighborhood && (
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Quartier</p>
                <p className="mt-0.5 text-gray-800 font-medium">{listing.neighborhood}</p>
              </div>
            )}
          </div>

          {listing.attributes?.secteurs?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Secteurs d'activité</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.attributes.secteurs.map((s, i) => (
                  <span key={s + i} className="px-2.5 py-1 bg-[#E8F5D0] text-[#2D5016] rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {listing.attributes?.services?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Services disponibles</h3>
              <div className="flex flex-wrap gap-1.5">
                {listing.attributes.services.map((s, i) => (
                  <span key={s + i} className="px-2.5 py-1 bg-[#FF8C42]/10 text-[#FF8C42] rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-gray-100 rounded-xl p-4 shadow-xs bg-white space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b pb-1">Contact</h2>
            
            {listing.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <a href={`tel:${listing.contactPhone}`} className="text-sm font-semibold text-[#2D5016] hover:underline">
                  {listing.contactPhone}
                </a>
              </div>
            )}
            
            {listing.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <a href={`mailto:${listing.contactEmail}`} className="text-sm font-semibold text-[#2D5016] hover:underline break-all">
                  {listing.contactEmail}
                </a>
              </div>
            )}
          </div>

          {listing.latitude != null && listing.longitude != null && (
            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-xs h-64">
              <TourismDetailMap listing={listing} className="h-full w-full" />
            </div>
          )}
        </div>
      </div>
                    {/* Static Reviews section */}
          <div className="mt-8 border-t border-black/[0.06] pt-6 space-y-6 bg-white p-6 rounded-2xl border shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 font-sans">Avis de la communauté</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-800">Karim Bennani</span>
                  <span className="text-xs text-gray-400">Il y a 1 semaine</span>
                </div>
                <div className="flex text-amber-400 text-xs gap-0.5">★★★★★</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Zone industrielle propre et parfaitement aménagée. Atlantic Free Zone propose des infrastructures à la hauteur des normes mondiales.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-800">Youssef Taghi</span>
                  <span className="text-xs text-gray-400">Il y a 3 semaines</span>
                </div>
                <div className="flex text-amber-400 text-xs gap-0.5">★★★★☆</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Très bonne administration pour les démarches d'installation d'une nouvelle usine de pièces aéronautiques.
                </p>
              </div>
            </div>

            <div className="border-t border-black/[0.06] pt-6">
              <p className="mb-3 text-sm font-semibold text-black">Laisser un avis</p>
              <textarea
                placeholder="Partagez votre expérience avec cet établissement..."
                rows={3}
                disabled
                className="w-full resize-none rounded-lg border border-black/10 bg-black/[0.02] p-3 text-sm text-black/60 placeholder:text-black/30 outline-none"
              />
              <button
                type="button"
                disabled
                title="Bientôt disponible"
                className="mt-2 cursor-not-allowed rounded-lg bg-black/10 px-4 py-2 text-sm font-semibold text-black/40"
              >
                Envoyer (bientôt disponible)
              </button>
            </div>
          </div>
      {showReport && (
        <ReportModal
          isOpen={showReport}
          targetType="PROFESSIONAL_SPACE"
          targetId={id}
          targetTitle={listing.name}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}