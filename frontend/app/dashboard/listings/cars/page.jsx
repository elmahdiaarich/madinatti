"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { carsService } from "@/services/carsService";
import CarListingDrawer from "@/components/cars/CarListingDrawer";
import { useToast } from "@/context/ToastContext";

const INQUIRY_STATUS_STYLES = {
  pending: { label: "Nouveau",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  read:    { label: "Lu",       cls: "bg-gray-50 text-gray-600 border-gray-200" },
  replied: { label: "Répondu",  cls: "bg-green-50 text-green-700 border-green-200" },
  closed:  { label: "Fermé",    cls: "bg-gray-100 text-gray-400 border-gray-200" },
};

const fmtPrice = (v) => Number(v).toLocaleString("fr-MA");
const fmtDate  = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "";

function StatusBadge({ status, map }) {
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ listings }) {
  const active       = listings.filter((l) => l.status === "APPROVED").length;
  const pending      = listings.filter((l) => l.status === "PENDING").length;
  const totalInq     = listings.reduce((sum, l) => sum + (l._count?.inquiries ?? 0), 0);
  const newInq       = listings.reduce((sum, l) => sum + (l._count?.newInquiries ?? 0), 0);

  const stats = [
    {
      label: "Véhicules actifs",
      value: active,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 0 0 -4 0 M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5" />
        </svg>
      ),
      color: "text-green-700 bg-green-50 border-green-100",
    },
    {
      label: "En attente",
      value: pending,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: "text-yellow-700 bg-yellow-50 border-yellow-100",
    },
    {
      label: "Demandes",
      value: totalInq,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: "text-blue-700 bg-blue-50 border-blue-100",
      badge: newInq > 0 ? `${newInq} nouvelles` : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${s.color}`}
        >
          <span className="opacity-60 shrink-0">{s.icon}</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-extrabold leading-none">{s.value}</p>
              {s.badge && (
                <span className="text-[9px] font-bold bg-white/70 border border-current/20 px-1.5 py-0.5 rounded-full opacity-80 leading-none">
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium opacity-70 mt-0.5 truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inquiries drawer ─────────────────────────────────────────────────────────
function InquiriesDrawer({ listingId, onClose, token }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await carsService.getMyListingInquiries(listingId, {}, token);
        setInquiries(res.inquiries || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId]);

  const updateStatus = async (inquiryId, status) => {
    setUpdating(inquiryId);
    try {
      await carsService.updateInquiryStatus(inquiryId, status, token);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-900">Messages reçus</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chargement...</div>
        ) : inquiries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 text-gray-400">
            <span className="text-4xl">💬</span>
            <p className="font-semibold text-gray-600">Aucun message pour l'instant</p>
            <p className="text-xs">Les messages des visiteurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {inquiries.map((inq) => (
              <div key={inq.id} className={`p-5 transition ${inq.status === "pending" ? "bg-blue-50/40" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{inq.user?.name || "Anonyme"}</p>
                    <p className="text-xs text-gray-400">{fmtDate(inq.createdAt)}</p>
                  </div>
                  <StatusBadge status={inq.status} map={INQUIRY_STATUS_STYLES} />
                </div>
                <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100 mb-3 leading-relaxed">
                  {inq.message}
                </p>
                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                  {inq.contactPhone && (
                    <a href={`tel:${inq.contactPhone}`} className="flex items-center gap-1 hover:text-green-700 transition">
                      📞 {inq.contactPhone}
                    </a>
                  )}
                  {inq.contactEmail && (
                    <a href={`mailto:${inq.contactEmail}`} className="flex items-center gap-1 hover:text-green-700 transition">
                      ✉️ {inq.contactEmail}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["read", "replied", "closed"]
                    .filter((s) => s !== inq.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(inq.id, s)}
                        disabled={updating === inq.id}
                        className="text-[11px] px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 font-semibold"
                      >
                        {updating === inq.id ? "..." : INQUIRY_STATUS_STYLES[s]?.label}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, onDelete, onViewInquiries, onViewDetails }) {
  const cover        = listing.images?.find((i) => i.isCover) || listing.images?.[0];
  const inquiryCount = listing._count?.inquiries || 0;

  const statusStyles = {
    APPROVED: { label: "Approuvée",  className: "bg-green-50 text-green-700 border border-green-200" },
    PENDING:  { label: "En attente", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    REJECTED: { label: "Rejetée",    className: "bg-red-50 text-red-700 border border-red-200" },
  };
  const statusStyle = statusStyles[listing.status] ?? statusStyles.PENDING;

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all ${
        listing.status === "REJECTED" && listing.adminNotes ? "sm:min-h-32" : "sm:h-32"
      }`}
      onClick={() => onViewDetails(listing)}
    >
      {/* Thumbnail */}
      <div className="relative h-32 sm:h-auto sm:w-44 sm:self-stretch shrink-0 bg-gray-50">
        {cover?.url ? (
          <img src={cover.url} alt="" className="w-full h-full object-cover absolute inset-0" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            🚗
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.className}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row: title + price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{listing.make} {listing.model} ({listing.year})</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>📍</span>
              {listing.city || "—"}
              <span className="opacity-30">·</span>
              {listing.category?.name || "—"}
            </p>
          </div>
          <p className="text-base font-semibold text-gray-900 leading-none shrink-0">
            {fmtPrice(listing.price)}{" "}
            <span className="text-xs font-normal text-gray-400">MAD</span>
          </p>
        </div>

        {/* Admin rejection note */}
        {listing.status === "REJECTED" && listing.adminNotes && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <span className="mt-px shrink-0">⛔</span>
            <span className="line-clamp-2">{listing.adminNotes}</span>
          </div>
        )}

        {/* Bottom row: stats + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {listing.viewsCount || 0}
            </span>

            {/* Messages button */}
            <button
              onClick={(e) => { e.stopPropagation(); onViewInquiries(listing.id); }}
              title="Voir les messages"
              className={`relative flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                inquiryCount > 0
                  ? "text-blue-700 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {inquiryCount} message{inquiryCount !== 1 ? "s" : ""}
              {inquiryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {inquiryCount}
                </span>
              )}
            </button>

            <span className="text-xs text-gray-300">{fmtDate(listing.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {listing.status === "APPROVED" && (
              <Link
                href={`/cars/${listing.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <span className="hidden sm:inline">Voir</span>
              </Link>
            )}
            <Link
              href={`/dashboard/listings/cars/edit/${listing.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="hidden sm:inline">Modifier</span>
            </Link>
            <button
              onClick={() => onDelete(listing.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline filter component ──────────────────────────────────────────────────
function ListingFilters({ onChange, showStatus = true, listings = [] }) {
  const [filters, setFilters] = useState({ status: '', listingType: '', city: '', search: '' });

  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))].sort();
  const listingTypes = [...new Set(listings.map(l => l.listingType).filter(Boolean))];

  const set = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(next);
  };

  const reset = () => {
    const empty = { status: '', listingType: '', city: '', search: '' };
    setFilters(empty);
    onChange(empty);
  };

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="Rechercher par modèle ou titre..."
          className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {showStatus && (
          <select
            value={filters.status}
            onChange={e => set('status', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvé</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        )}

        {listingTypes.length > 1 && (
          <select
            value={filters.listingType}
            onChange={e => set('listingType', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Vente & Location</option>
            {listingTypes.map(t => (
              <option key={t} value={t}>{t === 'SALE' ? 'Vente' : 'Location'}</option>
            ))}
          </select>
        )}

        {cities.length > 1 && (
          <select
            value={filters.city}
            onChange={e => set('city', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016] bg-white text-gray-700"
          >
            <option value="">Toutes les villes</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {hasActive && (
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-red-500 transition font-medium px-3 py-2 rounded-xl border border-gray-200 hover:border-red-200"
          >
            ✕ Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarsDashboard() {
  return (
    <ProtectedRoute roles={["business"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings]       = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [pagination, setPagination]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [filters, setFilters]         = useState({});
  const [page, setPage]               = useState(1);
  const [activeInquiryListingId, setActiveInquiryListingId] = useState(null);
  const [selectedListing, setSelectedListing]               = useState(null);
  const toastShown = useRef(false);

  useEffect(() => {
    if (searchParams.get("created") === "1" && !toastShown.current) {
      toastShown.current = true;
      toast.success(
        "Annonce de véhicule soumise avec succès ! Elle sera visible après validation par l'administrateur.",
        { title: "Annonce envoyée ✦", duration: 6000 }
      );
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const loadAll = async () => {
    try {
      const res = await carsService.getMyListings({ page: 1, limit: 100 }, token);
      setAllListings(res.listings || []);
    } catch (e) {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await carsService.getMyListings(
        {
          page,
          limit: 10,
          ...(filters.status      && { status: filters.status }),
          ...(filters.city        && { city: filters.city }),
          ...(filters.listingType && { listingType: filters.listingType }),
          ...(filters.search      && { search: filters.search }),
        },
        token,
      );
      setListings(res.listings || []);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette annonce de véhicule ?")) return;
    try {
      await carsService.deleteMyListing(id, token);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setAllListings((prev) => prev.filter((l) => l.id !== id));
      if (selectedListing?.id === id) setSelectedListing(null);
      toast.success("Annonce supprimée avec succès");
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || "Erreur lors de la suppression");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Stats bar */}
        {allListings.length > 0 && <StatsBar listings={allListings} />}

        {/* Filters + Publish button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ListingFilters onChange={handleFiltersChange} showStatus={true} listings={allListings} />
          </div>
          <Link
            href="/dashboard/listings/cars/create"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#2D5016] hover:bg-[#A7D129] text-white hover:text-[#2D5016] rounded-xl text-sm font-bold transition whitespace-nowrap"
          >
            <span className="hidden sm:inline">Publier un véhicule</span>
            <span className="sm:hidden">Publier</span>
          </Link>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">🚗</span>
            <p className="font-bold text-gray-700">Aucun véhicule</p>
            <p className="text-sm text-gray-400">Publiez votre première annonce de véhicule.</p>
            <Link
              href="/dashboard/listings/cars/create"
              className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
            >
              Publier un véhicule
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onDelete={handleDelete}
                onViewInquiries={(id) => setActiveInquiryListingId(id)}
                onViewDetails={(listing) => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                  page === i + 1
                    ? "bg-[#2D5016] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#2D5016]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listing detail drawer */}
      {selectedListing && (
        <CarListingDrawer
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onEdit={(id) => (window.location.href = `/dashboard/listings/cars/edit/${id}`)}
          onDelete={(id) => { handleDelete(id); setSelectedListing(null); }}
          isAdmin={false}
        />
      )}

      {/* Inquiries drawer */}
      {activeInquiryListingId && (
        <InquiriesDrawer
          listingId={activeInquiryListingId}
          token={token}
          onClose={() => setActiveInquiryListingId(null)}
        />
      )}
    </div>
  );
}
